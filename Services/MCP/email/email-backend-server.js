// email-backend-server.js (COMPLETE SERVER FILE)
import express from 'express';
import cors from 'cors';
import axios from 'axios';
import { config } from 'dotenv';
import { UnipileEmailService } from './unipile-email-service.js';

config();

const app = express();
const emailService = new UnipileEmailService();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============= ROOT ENDPOINTS =============

/**
 * GET / - Main API documentation and health check
 */
app.get('/', (req, res) => {
    res.json({
        success: true,
        service: 'Unipile Email Backend API (Enhanced)',
        version: '2.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        baseUrl: `http://localhost:${process.env.PORT || 3000}`,
        features: [
            'HTML to Plain Text Decoding',
            'Smart Sender Extraction', 
            'Content Preview Generation',
            'Enhanced Email Processing'
        ],
        documentation: {
            healthCheck: 'GET /',
            testConnection: 'GET /api/test/connection',
            getAllAccounts: 'GET /api/emails/accounts',
            getAllEmails: 'GET /api/emails/:accountId',
            getSpecificEmail: 'GET /api/emails/:accountId/:emailId',
            getRecentEmails: 'GET /api/emails/:accountId/recent',
            getUnreadEmails: 'GET /api/emails/:accountId/unread',
            searchEmails: 'POST /api/emails/:accountId/search',
            debugEmail: 'GET /debug/email/:accountId/:emailId'
        },
        quickStart: {
            step1: `GET http://localhost:${process.env.PORT || 3000}/api/test/connection`,
            step2: `GET http://localhost:${process.env.PORT || 3000}/api/emails/accounts`,
            step3: `GET http://localhost:${process.env.PORT || 3000}/api/emails/Uikx_tZVTQywUxzAxhrc6g?limit=5`
        }
    });
});

/**
 * GET /health - Simple health check
 */
app.get('/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// ============= API ENDPOINTS =============

/**
 * GET /api/test/connection - Test Unipile connection
 */
app.get('/api/test/connection', async (req, res) => {
    try {
        console.log('🧪 Testing Unipile connection...');
        const result = await emailService.testConnection();
        
        res.json({
            success: true,
            message: '✅ Unipile connection successful!',
            data: {
                totalAccounts: result.totalAccounts,
                connectionStatus: 'active',
                apiEndpoint: emailService.baseUrl,
                accounts: result.accounts.map(acc => ({
                    id: acc.id,
                    provider: acc.provider,
                    email: acc.identifier || acc.email,
                    status: acc.status
                }))
            },
            nextSteps: [
                'Use GET /api/emails/accounts to see all email accounts',
                'Use GET /api/emails/{accountId} to fetch emails with enhanced processing'
            ],
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        res.status(500).json({
            success: false,
            message: '❌ Unipile connection failed',
            error: error.message,
            troubleshooting: {
                step1: 'Check UNIPILE_API_KEY in .env file',
                step2: 'Verify UNIPILE_BASE_URL is correct',
                step3: 'Ensure network connectivity to Unipile API',
                step4: 'Check if DSN is properly configured'
            },
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/emails/accounts - Get all connected email accounts
 */
app.get('/api/emails/accounts', async (req, res) => {
    try {
        console.log('📧 Fetching email accounts...');
        const result = await emailService.getEmailAccounts();
        
        res.json({
            success: true,
            message: `📧 Found ${result.total} email account${result.total !== 1 ? 's' : ''}`,
            data: result.accounts,
            total: result.total,
            usage: result.accounts.map(account => ({
                accountId: account.id,
                getEmails: `GET /api/emails/${account.id}?limit=10`,
                getRecent: `GET /api/emails/${account.id}/recent?hours=24`,
                getUnread: `GET /api/emails/${account.id}/unread?limit=20`
            })),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Get accounts failed:', error.message);
        res.status(500).json({
            success: false,
            message: '❌ Failed to fetch email accounts',
            error: error.message,
            suggestion: 'Try GET /api/test/connection first to verify connectivity',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/emails/:accountId - Get emails with FULL enhanced processing
 */
app.get('/api/emails/:accountId', async (req, res) => {
    try {
        const { accountId } = req.params;
        const {
            limit = 10,
            offset = 0,
            folder,
            query,
            from,
            subject,
            since,
            until,
            unread_only,
            has_attachments
        } = req.query;

        console.log(`📧 Fetching emails for account: ${accountId.substring(0, 10)}... with enhanced processing`);

        const options = {
            limit: parseInt(limit),
            offset: parseInt(offset),
            ...(folder && { folderId: folder }),
            ...(query && { query }),
            ...(from && { from }),
            ...(subject && { subject }),
            ...(since && { since }),
            ...(until && { until }),
            ...(unread_only === 'true' && { isRead: false }),
            ...(has_attachments !== undefined && { hasAttachments: has_attachments === 'true' })
        };

        // Get emails with enhanced processing from service
        const result = await emailService.getAllEmails(accountId, options);
        let emails = result.emails || [];
        
        if (!Array.isArray(emails)) {
            return res.status(500).json({
                success: false,
                message: '❌ Invalid email data format received from API',
                error: 'Expected array of emails but got: ' + typeof emails,
                timestamp: new Date().toISOString()
            });
        }

        console.log(`📧 Processed ${emails.length} emails with enhanced data`);
        
        // ENHANCED RESPONSE with all decoded data
        res.json({
            success: true,
            message: `📧 Retrieved ${emails.length} email${emails.length !== 1 ? 's' : ''} with enhanced processing`,
            data: emails.map(email => ({
                // Basic info
                id: email.id,
                subject: email.subject,
                from: email.from,
                fromName: email.fromName,
                date: email.date,
                isRead: email.isRead,
                hasAttachments: email.hasAttachments,
                
                // ENHANCED CONTENT (DECODED!)
                preview: email.preview,
                plainTextBody: email.plainTextBody,
                htmlBody: email.htmlBody,
                contentLength: email.contentLength,
                
                // ADDITIONAL METADATA
                wordCount: email.wordCount,
                estimatedReadTime: email.estimatedReadTime,
                
                // SENDER DETAILS
                sender: email.sender
            })),
            
            summary: {
                total: emails.length,
                unread: emails.filter(e => !e.isRead).length,
                totalWordCount: emails.reduce((sum, e) => sum + e.wordCount, 0),
                averageReadTime: Math.ceil(emails.reduce((sum, e) => sum + e.estimatedReadTime, 0) / emails.length) || 0
            },
            
            pagination: {
                current: result.pagination,
                next: result.pagination && result.pagination.hasMore ? 
                    `GET /api/emails/${accountId}?limit=${options.limit}&offset=${options.offset + options.limit}` : null
            },
            appliedFilters: options,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Get emails failed:', error.message);
        console.error('❌ Full error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: '❌ Failed to fetch emails',
            error: error.message,
            accountId: req.params.accountId,
            suggestion: 'Check server logs for detailed error information',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/emails/:accountId/:emailId - Get specific email by ID with full decoding
 */
app.get('/api/emails/:accountId/:emailId', async (req, res) => {
    try {
        const { accountId, emailId } = req.params;
        
        console.log(`📧 Fetching email ${emailId.substring(0, 10)}... for account ${accountId.substring(0, 10)}...`);
        
        const result = await emailService.getEmailById(emailId, accountId);
        
        res.json({
            success: true,
            message: '📧 Email retrieved with enhanced processing',
            data: {
                ...result.email,
                actions: {
                    markAsRead: `PATCH /api/emails/${accountId}/${emailId}/read`,
                    reply: `POST /api/emails/${accountId}/send (with in_reply_to)`
                }
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Get email by ID failed:', error.message);
        res.status(500).json({
            success: false,
            message: '❌ Failed to fetch email',
            error: error.message,
            emailId: req.params.emailId,
            accountId: req.params.accountId,
            timestamp: new Date().toISOString()
        });
    }
});

// ============= EMAIL SENDING ENDPOINTS =============

/**
 * POST /api/emails/:accountId/send - Send basic email
 */
app.post('/api/emails/:accountId/send', async (req, res) => {
    try {
        const { accountId } = req.params;
        const { to, subject, body, cc, bcc, isHtml = true } = req.body;
        
        // Validation
        if (!to) {
            return res.status(400).json({
                success: false,
                message: '❌ Missing required field: to',
                requiredFields: ['to', 'subject', 'body'],
                examples: {
                    singleRecipient: {
                        to: "recipient@example.com",
                        subject: "Test Email",
                        body: "Hello, this is a test email!"
                    },
                    multipleRecipients: {
                        to: ["user1@example.com", "user2@example.com"],
                        subject: "Test Email",
                        body: "Hello, this is a test email!"
                    },
                    recipientsWithNames: {
                        to: [
                            { email: "john@example.com", name: "John Doe" },
                            { email: "jane@example.com", name: "Jane Smith" }
                        ],
                        subject: "Test Email",
                        body: "Hello, this is a test email!"
                    }
                },
                timestamp: new Date().toISOString()
            });
        }
        
        if (!subject || !body) {
            return res.status(400).json({
                success: false,
                message: '❌ Missing required fields: subject and/or body',
                timestamp: new Date().toISOString()
            });
        }

        console.log(`📧 Sending email from account: ${accountId.substring(0, 10)}...`);
        console.log(`📧 To: ${Array.isArray(to) ? to.join(', ') : to}`);
        console.log(`📧 Subject: ${subject}`);

        const result = await emailService.sendEmail(accountId, to, subject, body, {
            cc, bcc, isHtml
        });
        
        res.json({
            success: true,
            message: '✅ Email sent successfully!',
            data: {
                messageId: result.messageId,
                to: to,
                cc: cc || null,
                bcc: bcc || null,
                subject: subject,
                bodyLength: body.length,
                isHtml: isHtml,
                sentAt: result.sentAt,
                fromAccount: accountId
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Send email failed:', error.message);
        res.status(500).json({
            success: false,
            message: '❌ Failed to send email',
            error: error.message,
            accountId: req.params.accountId,
            troubleshooting: [
                'Check if the account ID is valid',
                'Verify recipient email address format',
                'Ensure account has sending permissions',
                'Check Unipile API quotas and limits'
            ],
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/emails/:accountId/send/html - Send rich HTML email with templates
 */
app.post('/api/emails/:accountId/send/html', async (req, res) => {
    try {
        const { accountId } = req.params;
        const { to, subject, htmlContent, plainTextFallback, cc, bcc, template } = req.body;
        
        if (!to || !subject || !htmlContent) {
            return res.status(400).json({
                success: false,
                message: '❌ Missing required fields: to, subject, htmlContent',
                example: {
                    to: "recipient@example.com",
                    subject: "Rich HTML Email",
                    htmlContent: "<h1>Hello!</h1><p>This is a <strong>rich HTML</strong> email.</p>",
                    plainTextFallback: "Hello! This is a rich HTML email.",
                    template: "professional"
                },
                timestamp: new Date().toISOString()
            });
        }

        let finalHtmlContent = htmlContent;
        
        // Apply template if specified
        if (template) {
            finalHtmlContent = applyEmailTemplate(htmlContent, template, subject);
        }

        console.log(`📧 Sending HTML email from account: ${accountId.substring(0, 10)}...`);

        const result = await emailService.sendEmail(accountId, to, subject, finalHtmlContent, {
            cc, bcc, isHtml: true
        });
        
        res.json({
            success: true,
            message: '✅ HTML Email sent successfully!',
            data: {
                messageId: result.messageId,
                to: to,
                subject: subject,
                template: template || 'none',
                htmlLength: finalHtmlContent.length,
                sentAt: result.sentAt
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Send HTML email failed:', error.message);
        res.status(500).json({
            success: false,
            message: '❌ Failed to send HTML email',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/emails/:accountId/send/professional - Send professional email with preset template
 */
app.post('/api/emails/:accountId/send/professional', async (req, res) => {
    try {
        const { accountId } = req.params;
        const { 
            to, 
            subject, 
            content, 
            senderName = "Professional Team",
            company = "Your Company",
            footer = "",
            priority = "normal",
            cc,
            bcc
        } = req.body;
        
        if (!to || !subject || !content) {
            return res.status(400).json({
                success: false,
                message: '❌ Missing required fields: to, subject, content',
                example: {
                    to: "client@company.com",
                    subject: "Project Update - HackIndia Finals",
                    content: "We're excited to share that our team has reached the finals!",
                    senderName: "Satyam Sharma",
                    company: "Tech Innovations",
                    priority: "high"
                },
                timestamp: new Date().toISOString()
            });
        }

        // Create professional HTML template
        const professionalHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${subject}</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .priority-high { border-left: 4px solid #e74c3c; padding-left: 15px; }
                .priority-medium { border-left: 4px solid #f39c12; padding-left: 15px; }
                .priority-normal { border-left: 4px solid #3498db; padding-left: 15px; }
                .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 0.9em; }
                .cta-button { display: inline-block; background: #667eea; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 15px 0; }
                .highlight { background: #fff3cd; padding: 10px; border-radius: 5px; border-left: 4px solid #ffc107; margin: 15px 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${subject}</h1>
                <p>From ${senderName} at ${company}</p>
            </div>
            <div class="content">
                <div class="priority-${priority}">
                    ${content.split('\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
                </div>
                
                ${priority === 'high' ? '<div class="highlight"><strong>⚡ High Priority:</strong> This message requires your immediate attention.</div>' : ''}
                
                <div class="footer">
                    <p><strong>${senderName}</strong><br>
                    ${company}<br>
                    ${footer}</p>
                    <p><small>Sent via Professional Email API • ${new Date().toLocaleDateString()}</small></p>
                </div>
            </div>
        </body>
        </html>`;

        console.log(`📧 Sending professional email from account: ${accountId.substring(0, 10)}...`);

        const result = await emailService.sendEmail(accountId, to, subject, professionalHtml, {
            cc, bcc, isHtml: true
        });
        
        res.json({
            success: true,
            message: '✅ Professional email sent successfully!',
            data: {
                messageId: result.messageId,
                to: to,
                subject: subject,
                template: 'professional',
                priority: priority,
                senderName: senderName,
                company: company,
                sentAt: result.sentAt
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Send professional email failed:', error.message);
        res.status(500).json({
            success: false,
            message: '❌ Failed to send professional email',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/emails/:accountId/send/bulk - Send bulk emails to multiple recipients
 */
app.post('/api/emails/:accountId/send/bulk', async (req, res) => {
    try {
        const { accountId } = req.params;
        const { recipients, subject, body, isHtml = true, delayBetweenEmails = 1000 } = req.body;
        
        if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
            return res.status(400).json({
                success: false,
                message: '❌ Missing or invalid recipients array',
                example: {
                    recipients: [
                        "user1@example.com",
                        "user2@example.com",
                        { email: "user3@example.com", name: "User Three" }
                    ],
                    subject: "Bulk Email Subject",
                    body: "This is a bulk email message",
                    delayBetweenEmails: 2000
                },
                timestamp: new Date().toISOString()
            });
        }

        if (!subject || !body) {
            return res.status(400).json({
                success: false,
                message: '❌ Missing required fields: subject, body',
                timestamp: new Date().toISOString()
            });
        }

        console.log(`📧 Sending bulk email to ${recipients.length} recipients...`);

        const results = [];
        const errors = [];

        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            const recipientEmail = typeof recipient === 'string' ? recipient : recipient.email;
            const recipientName = typeof recipient === 'object' ? recipient.name : '';

            try {
                // Personalize body if name is available
                const personalizedBody = recipientName ? 
                    body.replace(/\{name\}/g, recipientName) : body;

                const result = await emailService.sendEmail(accountId, recipientEmail, subject, personalizedBody, {
                    isHtml
                });

                results.push({
                    email: recipientEmail,
                    name: recipientName,
                    status: 'sent',
                    messageId: result.messageId,
                    sentAt: result.sentAt
                });

                console.log(`✅ Sent to ${recipientEmail} (${i + 1}/${recipients.length})`);

                // Add delay between emails to avoid rate limiting
                if (i < recipients.length - 1 && delayBetweenEmails > 0) {
                    await new Promise(resolve => setTimeout(resolve, delayBetweenEmails));
                }

            } catch (error) {
                console.error(`❌ Failed to send to ${recipientEmail}:`, error.message);
                errors.push({
                    email: recipientEmail,
                    name: recipientName,
                    status: 'failed',
                    error: error.message
                });
            }
        }

        const successCount = results.length;
        const failureCount = errors.length;

        res.json({
            success: true,
            message: `📧 Bulk email completed: ${successCount} sent, ${failureCount} failed`,
            data: {
                summary: {
                    totalRecipients: recipients.length,
                    successful: successCount,
                    failed: failureCount,
                    subject: subject,
                    delayUsed: delayBetweenEmails
                },
                results: results,
                errors: errors
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Bulk email failed:', error.message);
        res.status(500).json({
            success: false,
            message: '❌ Failed to send bulk emails',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * POST /api/emails/:accountId/reply/:emailId - Reply to specific email
 */
app.post('/api/emails/:accountId/reply/:emailId', async (req, res) => {
    try {
        const { accountId, emailId } = req.params;
        const { body, includeOriginal = true, isHtml = true } = req.body;
        
        if (!body) {
            return res.status(400).json({
                success: false,
                message: '❌ Missing required field: body',
                example: {
                    body: "Thank you for your email. I'll get back to you soon!",
                    includeOriginal: true,
                    isHtml: true
                },
                timestamp: new Date().toISOString()
            });
        }

        // Get the original email first
        const originalEmailResult = await emailService.getEmailById(emailId, accountId);
        const originalEmail = originalEmailResult.email;

        // Create reply subject
        const replySubject = originalEmail.subject.startsWith('Re: ') ? 
            originalEmail.subject : `Re: ${originalEmail.subject}`;

        // Get original sender as reply recipient
        const replyTo = originalEmail.from;

        let replyBody = body;

        // Include original email if requested
        if (includeOriginal) {
            const originalContent = isHtml ? 
                `<br><br>--- Original Message ---<br>
                <strong>From:</strong> ${originalEmail.fromName} &lt;${originalEmail.from}&gt;<br>
                <strong>Date:</strong> ${new Date(originalEmail.date).toLocaleString()}<br>
                <strong>Subject:</strong> ${originalEmail.subject}<br><br>
                ${originalEmail.htmlBody || originalEmail.plainTextBody}` :
                `\n\n--- Original Message ---\n
                From: ${originalEmail.fromName} <${originalEmail.from}>\n
                Date: ${new Date(originalEmail.date).toLocaleString()}\n
                Subject: ${originalEmail.subject}\n\n
                ${originalEmail.plainTextBody}`;

            replyBody += originalContent;
        }

        console.log(`📧 Replying to email ${emailId} from account: ${accountId.substring(0, 10)}...`);

        const result = await emailService.sendEmail(accountId, replyTo, replySubject, replyBody, {
            isHtml,
            inReplyTo: originalEmail.messageId
        });
        
        res.json({
            success: true,
            message: '✅ Reply sent successfully!',
            data: {
                messageId: result.messageId,
                replyTo: replyTo,
                subject: replySubject,
                originalEmailId: emailId,
                includeOriginal: includeOriginal,
                sentAt: result.sentAt
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Reply email failed:', error.message);
        res.status(500).json({
            success: false,
            message: '❌ Failed to send reply',
            error: error.message,
            emailId: req.params.emailId,
            timestamp: new Date().toISOString()
        });
    }
});

// Helper function for email templates
function applyEmailTemplate(content, template, subject) {
    const templates = {
        professional: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #f4f4f4; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .footer { background: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h2>${subject}</h2></div>
                <div class="content">${content}</div>
                <div class="footer">Best regards<br>Professional Team</div>
            </div>
        </body>
        </html>`,
        
        simple: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>body { font-family: Arial, sans-serif; padding: 20px; }</style>
        </head>
        <body>${content}</body>
        </html>`,
        
        newsletter: `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Georgia, serif; line-height: 1.8; }
                .newsletter { max-width: 700px; margin: 0 auto; }
                .header { background: #2c3e50; color: white; padding: 30px; text-align: center; }
                .content { padding: 30px; background: #ecf0f1; }
            </style>
        </head>
        <body>
            <div class="newsletter">
                <div class="header"><h1>${subject}</h1></div>
                <div class="content">${content}</div>
            </div>
        </body>
        </html>`
    };
    
    return templates[template] || content;
}


/**
 * GET /debug/email/:accountId/:emailId - Debug specific email processing
 */
app.get('/debug/email/:accountId/:emailId', async (req, res) => {
    try {
        const { accountId, emailId } = req.params;
        
        console.log(`🔍 Debug: Fetching email ${emailId} for account ${accountId}`);
        
        // Make direct API call
        const response = await axios.get(`${process.env.UNIPILE_BASE_URL}/api/v1/emails/${emailId}`, {
            headers: {
                'X-API-KEY': process.env.UNIPILE_API_KEY,
                'X-DSN': process.env.UNIPILE_DSN,
                'Accept': 'application/json'
            },
            params: { account_id: accountId }
        });
        
        console.log('🔍 Raw email data:', JSON.stringify(response.data, null, 2));
        
        res.json({
            success: true,
            message: 'Raw email data from Unipile API',
            rawData: response.data,
            dataKeys: Object.keys(response.data || {}),
            fromField: response.data.from,
            bodyField: response.data.body,
            htmlBodyField: response.data.html_body,
            textBodyField: response.data.text_body,
            contentField: response.data.content,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response?.data,
            timestamp: new Date().toISOString()
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Unhandled server error:', error);
    res.status(500).json({
        success: false,
        message: '❌ Internal server error',
        error: error.message,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: '❌ Endpoint not found',
        requestedPath: req.originalUrl,
        method: req.method,
        availableEndpoints: [
            'GET /',
            'GET /health',
            'GET /api/test/connection',
            'GET /api/emails/accounts',
            'GET /api/emails/:accountId',
            'GET /api/emails/:accountId/:emailId',
            'GET /debug/email/:accountId/:emailId'
        ],
        suggestion: 'Visit GET / for full API documentation',
        timestamp: new Date().toISOString()
    });
});



// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('🚀 =====================================');
    console.log('🚀 ENHANCED EMAIL BACKEND SERVER STARTED');
    console.log('🚀 =====================================');
    console.log(`📡 Server URL: http://localhost:${PORT}`);
    console.log(`📋 API Documentation: http://localhost:${PORT}/`);
    console.log(`🧪 Test Connection: http://localhost:${PORT}/api/test/connection`);
    console.log(`📧 Sample Request: http://localhost:${PORT}/api/emails/Uikx_tZVTQywUxzAxhrc6g?limit=5`);
    console.log(`🔍 Debug Email: http://localhost:${PORT}/debug/email/Uikx_tZVTQywUxzAxhrc6g/qZS_yA8_VyuMMIc2hINuYg`);
    console.log('🚀 =====================================');
    console.log('🔥 Enhanced processing enabled - HTML decoding, sender extraction, smart previews!');
});

export default app;
