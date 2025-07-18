import { Hono } from 'hono';
import { WebClient } from '@slack/web-api';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import 'dotenv/config'
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { startSlackSocketHandler } from './socketHandler';

// Define global verification codes type
declare global {
  var verificationCodes: {
    [slackUserId: string]: {
      code: string;
      timestamp: number;
      workspaceLink: string;
      workspaceName: string;
      slackUserName: string;
    };
  };
}

// Types
interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_archived: boolean;
  is_member?: boolean;
  created: number;
  topic?: {
    value: string;
  };
  purpose?: {
    value: string;
  };
}

interface SlackMessage {
  type: string;
  user?: string;
  text: string;
  ts: string;
  thread_ts?: string;
  user_details?: {
    name: string;
    avatar: string;
  };
}

interface ChannelsResponse {
  channels: SlackChannel[];
}

interface MessagesResponse {
  messages: SlackMessage[];
}

// Initialize Hono app
const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger());

// Initialize Slack Web API client
const getSlackClient = () => {
  const token = process.env.SLACK_BOT_TOKEN || process.env.SLACK_BOT_ACCESS;
  if (!token) {
    throw new Error('SLACK_BOT_TOKEN environment variable is required');
  }
  return new WebClient(token);
};

// Utility function to handle Slack API errors
const handleSlackError = (error: any) => {
  console.error('Slack API Error:', error);
  if (error.code === 'slack_webapi_platform_error') {
    return {
      error: error.data?.error || 'Slack API error',
      status: 400
    };
  }
  return {
    error: 'Internal server error',
    status: 500
  };
};

// GET /bot-channels - Get all channels the bot is a member of
app.get('/bot-channels', async (c) => {
  try {
    const slack = getSlackClient();
    const botChannels: SlackChannel[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    // Paginate through all channels (both public and private)
    while (hasMore) {
      try {
        const channelsResponse = await slack.conversations.list({
          types: 'public_channel,private_channel',
          exclude_archived: false, // Include archived channels to show full membership
          limit: 200,
          cursor
        });

        if (!channelsResponse.ok || !channelsResponse.channels) {
          throw new Error(channelsResponse.error || 'Failed to fetch channels');
        }

        const channels = channelsResponse.channels as SlackChannel[];

        // Add all channels that the bot can see (which means it's a member of)
        // The bot can only see channels it's a member of when using conversations.list
        for (const channel of channels) {
          if(channel.is_member){
            botChannels.push({
              id: channel.id,
              name: channel.name,
              is_private: channel.is_private,
              is_archived: channel.is_archived,
              created: channel.created,
              topic: channel.topic,
              purpose: channel.purpose
            });
          }
        }

        cursor = channelsResponse.response_metadata?.next_cursor;
        hasMore = !!cursor;
      } catch (apiError) {
        const errorResponse = handleSlackError(apiError);
        return c.json({ error: errorResponse.error }, errorResponse.status as ContentfulStatusCode);
      }
    }

    const response: ChannelsResponse = {
      channels: botChannels
    };

    return c.json(response);
  } catch (error) {
    console.error('Error in /bot-channels endpoint:', error);
    
    if (error instanceof Error && error.message.includes('SLACK_BOT_TOKEN')) {
      return c.json({ error: 'Slack bot token not configured' }, 500);
    }
    
    return c.json({ error: 'Failed to fetch bot channels' }, 500);
  }
});

// GET /channels?userId=<slackUserId>
app.get('/channels', async (c) => {
  try {
    const userId = c.req.query('userId');
    
    if (!userId) {
      return c.json({ error: 'userId query parameter is required' }, 400);
    }

    const slack = getSlackClient();
    const userChannels: SlackChannel[] = [];
    let cursor: string | undefined;
    let hasMore = true;

    // Paginate through all channels
    while (hasMore) {
      try {
        const channelsResponse = await slack.conversations.list({
          types: 'public_channel',
          exclude_archived: true,
          limit: 200,
          cursor
        });

        if (!channelsResponse.ok || !channelsResponse.channels) {
          throw new Error(channelsResponse.error || 'Failed to fetch channels');
        }

        const channels = channelsResponse.channels as SlackChannel[];

        // Check membership for each channel
        for (const channel of channels) {
          try {
            const membersResponse = await slack.conversations.members({
              channel: channel.id,
              limit: 1000
            });

            if (membersResponse.ok && membersResponse.members) {
              // Check if the user is a member of this channel
              if (membersResponse.members.includes(userId)) {
                userChannels.push({
                  id: channel.id,
                  name: channel.name,
                  is_private: channel.is_private,
                  is_archived: channel.is_archived,
                  created: channel.created,
                  topic: channel.topic,
                  purpose: channel.purpose
                });
              }
            }
          } catch (memberError) {
            // Skip channels where we can't get members (e.g., no permission)
            console.warn(`Could not get members for channel ${channel.id}:`, memberError);
            continue;
          }
        }

        cursor = channelsResponse.response_metadata?.next_cursor;
        hasMore = !!cursor;
      } catch (apiError) {
        const errorResponse = handleSlackError(apiError);
        return c.json({ error: errorResponse.error }, errorResponse.status as ContentfulStatusCode);
      }
    }

    const response: ChannelsResponse = {
      channels: userChannels
    };

    return c.json(response);
  } catch (error) {
    console.error('Error in /channels endpoint:', error);
    
    if (error instanceof Error && error.message.includes('SLACK_BOT_TOKEN')) {
      return c.json({ error: 'Slack bot token not configured' }, 500);
    }
    
    return c.json({ error: 'Failed to fetch channels' }, 500);
  }
});

// GET /messages?channelId=<channelId>
app.get('/messages', async (c) => {
  try {
    const channelId = c.req.query('channelId');
    const limit = parseInt(c.req.query('limit') || '50');
    const cursor = c.req.query('cursor');
    
    if (!channelId) {
      return c.json({ error: 'channelId query parameter is required' }, 400);
    }

    const slack = getSlackClient();

    try {
      // Fetch messages from the channel
      const messagesResponse = await slack.conversations.history({
        channel: channelId,
        limit: Math.min(limit, 200), // Slack API limit is 200
        cursor
      });

      if (!messagesResponse.ok || !messagesResponse.messages) {
        throw new Error(messagesResponse.error || 'Failed to fetch messages');
      }

      const messages = messagesResponse.messages as SlackMessage[];

      // Get unique user IDs from messages
      const userIds = new Set<string>();
      messages.forEach((message) => {
        if (message.user) {
          userIds.add(message.user);
        }
      });

      // Fetch user profiles for all users in the messages
      const userProfiles: Record<string, { name: string; avatar: string }> = {};
      
      if (userIds.size > 0) {
        const userPromises = Array.from(userIds).map(async (userId) => {
          try {
            const userResponse = await slack.users.info({ user: userId });
            
            if (userResponse.ok && userResponse.user) {
              const user = userResponse.user as any;
              userProfiles[userId] = {
                name: user.real_name || user.name || 'Unknown User',
                avatar: user.profile?.image_72 || user.profile?.image_48 || ''
              };
            }
          } catch (userError) {
            console.warn(`Could not fetch user info for ${userId}:`, userError);
            // Provide fallback user info
            userProfiles[userId] = {
              name: 'Unknown User',
              avatar: ''
            };
          }
        });

        await Promise.all(userPromises);
      }

      // Enhance messages with user details
      const enhancedMessages = messages.map((message) => {
        let userDetails = null;
        let username = null;
        if (message.user && userProfiles[message.user]) {
          userDetails = {
            name: userProfiles[message.user].name || "Unknown User",
            avatar: userProfiles[message.user].avatar || "",
          };
          username = userProfiles[message.user].name || "Unknown User";
        }
        return {
          ...message,
          user_details: userDetails,
          username,
        };
      });

      const response: MessagesResponse & { has_more?: boolean; next_cursor?: string } = {
        messages: enhancedMessages.map(msg => ({
          ...msg,
          user_details: msg.user_details === null ? undefined : msg.user_details,
          username: msg.username === null ? undefined : msg.username,
        }))
      };

      // Add pagination info if available
      if (messagesResponse.has_more) {
        response.has_more = messagesResponse.has_more;
      }
      if (messagesResponse.response_metadata?.next_cursor) {
        response.next_cursor = messagesResponse.response_metadata.next_cursor;
      }

      return c.json(response);
    } catch (apiError) {
      const errorResponse = handleSlackError(apiError);
      return c.json({ error: errorResponse.error }, errorResponse.status as ContentfulStatusCode);
    }
  } catch (error) {
    console.error('Error in /messages endpoint:', error);
    
    if (error instanceof Error && error.message.includes('SLACK_BOT_TOKEN')) {
      return c.json({ error: 'Slack bot token not configured' }, 500);
    }
    
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});


// For Node.js server
//@ts-ignore
if (typeof Bun === 'undefined') {
  const port = parseInt(process.env.PORT || '3000');
  
  console.log(`Server is running on port ${port}`);
  serve({
    fetch: app.fetch,
    port
  });
}

startSlackSocketHandler();