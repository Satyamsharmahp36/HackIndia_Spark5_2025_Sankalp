import Bolt from '@slack/bolt';
const { App, LogLevel, subtype } = Bolt;
import { WebClient } from '@slack/web-api';
import axios from 'axios';
// @ts-ignore: Quick fix for missing type declaration for 'nodemailer'
// If you want proper types, run: npm i --save-dev @types/nodemailer
import nodemailer from 'nodemailer';

// --- Types ---
interface OTPMetadata {
  otp: string;
  email: string;
  username: string;
  workspaceLink: string;
  workspaceName: string;
  expiresAt: number;
  thread_ts: string;
}

// --- OTP Store ---
const otpStore = new Map<string, OTPMetadata>(); // key: slackUserId
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// --- Slack App Initialization ---
export function startSlackSocketHandler() {
  const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN, // xapp- token
    socketMode: true,
    logLevel: LogLevel.INFO,
  });

  // --- Helper: Get Slack Team Info ---
  async function getTeamInfo(client: WebClient) {
    const info = await client.team.info();
    const team = info.team as any;
    return {
      workspaceLink: team?.domain ? `https://${team.domain}.slack.com` : '',
      workspaceName: team?.name || '',
    };
  }

  // --- Helper: Send Email (Nodemailer) ---
  async function sendOtpEmail(email: string, otp: string) {
    // Configure your transporter here
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@chatmate.com',
      to: email,
      subject: 'Your Chatmate OTP',
      text: `Your Chatmate OTP is: ${otp}`,
    });
  }

  // --- Helper: Generate OTP ---
  function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // --- Helper: Clean up expired OTPs ---
  function cleanupOtps() {
    const now = Date.now();
    for (const [userId, meta] of otpStore.entries()) {
      if (meta.expiresAt < now) {
        otpStore.delete(userId);
      }
    }
  }
  setInterval(cleanupOtps, 60 * 1000); // Clean up every minute

  // --- Main DM Handler ---
  app.message(async ({ message, say, client, event, context }) => {
    // Ignore bot messages
    if ((message as any).subtype === 'bot_message') return;
    // Only handle direct messages
    const msg = message as { user?: string; text?: string; channel_type?: string; thread_ts?: string; ts?: string };
    if (msg.channel_type !== 'im' || !msg.user || !msg.text) return;
    const slackUserId = msg.user!;
    const text = msg.text.trim();
    const thread_ts = (msg.thread_ts || msg.ts)!;
    console.log(`[SlackBot] Received message from user ${slackUserId}: '${text}' (thread_ts: ${thread_ts})`);

    // Step 1: Start onboarding
    if (text.toLowerCase() === 'auth') {
      console.log(`[SlackBot] Starting onboarding for user ${slackUserId}`);
      otpStore.delete(slackUserId); // Reset any previous state
      await say({
        text: 'Please provide your Chatmate username to continue integration.',
        thread_ts,
      });
      otpStore.set(slackUserId, {
        otp: '',
        email: '',
        username: '',
        workspaceLink: '',
        workspaceName: '',
        expiresAt: 0,
        thread_ts,
      });
      return;
    }

    // Step 2: Username provided
    const userOtpMeta = otpStore.get(slackUserId);
    if (userOtpMeta && !userOtpMeta.otp && !userOtpMeta.email && userOtpMeta.thread_ts === thread_ts) {
      // Assume this is the username reply
      const username = text;
      console.log(`[SlackBot] Received username '${username}' from user ${slackUserId}`);
      // Get workspace info
      let workspaceLink = '', workspaceName = '';
      try {
        const info = await getTeamInfo(client);
        workspaceLink = info.workspaceLink;
        workspaceName = info.workspaceName;
        console.log(`[SlackBot] Workspace info: link=${workspaceLink}, name=${workspaceName}`);
      } catch (err) {
        console.error('[SlackBot] Failed to get workspace info:', err);
        await say({ text: 'Failed to get workspace info. Please try again later.', thread_ts });
        otpStore.delete(slackUserId);
        return;
      }
      // Call external API to verify user
      try {
        console.log(`[SlackBot] Verifying user '${username}' with API...`);
        const resp = await axios.post('http://localhost:5000/exists', {
          username,
          workspaceLink,
        });
        console.log('[SlackBot] API /exists response:', resp.data);
        if (resp.data.exists && !resp.data.alreadyIntegrated) {
          // then continue with it 
        }
        else if (!resp.data.exists) {
          await say({ text: `No Chatmate account found for username ${username}. Please try again.`, thread_ts });
          otpStore.delete(slackUserId);
          return;
        }
        else if (resp.data.alreadyIntegrated) {
          await say({ text: `This workspace is already integrated with your Chatmate account.`, thread_ts });
          otpStore.delete(slackUserId);
          return;
        }
        // Step 3: Send OTP
        const otp = generateOtp();
        await sendOtpEmail(resp.data.email, otp);
        console.log(`[SlackBot] Sent OTP to ${resp.data.email} for user ${username}`);
        otpStore.set(slackUserId, {
          otp,
          email: resp.data.email,
          username,
          workspaceLink,
          workspaceName,
          expiresAt: Date.now() + OTP_EXPIRY_MS,
          thread_ts,
        });
        await say({ text: `We’ve sent an OTP to your Chatmate email. Please enter it here to verify.`, thread_ts });
        return;
      } catch (err) {
        console.error('[SlackBot] Error verifying Chatmate user:', err);
        await say({ text: 'Error verifying Chatmate user. Please try again later.', thread_ts });
        otpStore.delete(slackUserId);
        return;
      }
    }

    // Step 4: OTP validation
    if (userOtpMeta && userOtpMeta.otp && userOtpMeta.email && userOtpMeta.thread_ts === thread_ts) {
      // Check expiry
      if (Date.now() > userOtpMeta.expiresAt) {
        console.log(`[SlackBot] OTP expired for user ${slackUserId}`);
        await say({ text: 'OTP expired. Please start over by sending "auth".', thread_ts });
        otpStore.delete(slackUserId);
        return;
      }
      if (text === userOtpMeta.otp) {
        // Step 5: Trigger integration
        try {
          console.log(`[SlackBot] OTP validated for user ${userOtpMeta.username}. Triggering integration...`);
          const resp = await axios.post('http://localhost:5000/add-integration', {
            username: userOtpMeta.username,
            password: userOtpMeta.otp,
            platform: 'Slack',
            workspacelink: userOtpMeta.workspaceLink,
            workspaceName: userOtpMeta.workspaceName,
            userid: slackUserId,
          });
          console.log('[SlackBot] API /add-integration response:', resp.data);
          if (resp.data.success) {
            await say({ text: `Integration successful! You're now connected to Chatmate.`, thread_ts });
            otpStore.delete(slackUserId);
          } else {
            await say({ text: `Integration failed: ${resp.data.error || 'Unknown error.'}`, thread_ts });
            otpStore.delete(slackUserId);
          }
        } catch (err: any) {
          console.error('[SlackBot] Integration failed:', err);
          await say({ text: `Integration failed: ${err.response?.data?.error || err.message || 'Unknown error.'}`, thread_ts });
          otpStore.delete(slackUserId);
        }
        return;
      } else {
        console.log(`[SlackBot] Incorrect OTP entered by user ${slackUserId}`);
        await say({ text: 'Incorrect OTP. Please try again.', thread_ts });
        return;
      }
    }
  });

  // --- Start the Socket Mode app ---
  (async () => {
    await app.start();
    console.log('⚡️ Slack Socket Mode app is running!');
  })();
} 