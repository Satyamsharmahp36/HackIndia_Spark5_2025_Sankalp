// unipile-email-service.js (FIXED FOR ACTUAL UNIPILE STRUCTURE)
import axios from 'axios';
import FormData from 'form-data';
import { config } from 'dotenv';

config();

// Enhanced Email Processing Utilities (FIXED)
class EmailUtils {
    
    /**
     * Convert HTML to plain text
     */
    static htmlToText(html) {
        if (!html || typeof html !== 'string') return '';
        
        return html
            .replace(/<script[^>]*>.*?<\/script>/gis, '')
            .replace(/<style[^>]*>.*?<\/style>/gis, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'")
            .replace(/&#x27;/g, "'")
            .replace(/&#x2F;/g, '/')
            .replace(/&#x60;/g, '`')
            .replace(/&#x3D;/g, '=')
            .replace(/\s+/g, ' ')
            .replace(/\r?\n/g, ' ')
            .trim();
    }

    /**
     * Extract sender information from Unipile attendee object
     */
    static extractSender(attendeeObj) {
        console.log('🔍 Debug: Raw attendee object:', JSON.stringify(attendeeObj, null, 2));
        
        if (!attendeeObj) return { email: 'Unknown', name: '' };
        
        // Unipile uses attendee objects with email and name properties
        if (typeof attendeeObj === 'object' && attendeeObj !== null) {
            const email = attendeeObj.email || 
                         attendeeObj.identifier || 
                         attendeeObj.address || 
                         attendeeObj.mail ||
                         'Unknown';
                         
            const name = attendeeObj.name || 
                        attendeeObj.display_name || 
                        attendeeObj.displayName ||
                        attendeeObj.personal || 
                        attendeeObj.full_name ||
                        attendeeObj.fullName ||
                        '';
            
            return {
                email: email,
                name: name
            };
        }
        
        // Handle string format (fallback)
        if (typeof attendeeObj === 'string') {
            const emailInBrackets = attendeeObj.match(/(.*?)\s*<(.+?)>/);
            if (emailInBrackets) {
                return {
                    email: emailInBrackets[2].trim(),
                    name: emailInBrackets[1].trim().replace(/"/g, '')
                };
            }
            
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (emailRegex.test(attendeeObj.trim())) {
                return { email: attendeeObj.trim(), name: '' };
            }
            
            return { email: 'Unknown', name: attendeeObj.trim() };
        }
        
        console.warn('⚠️ Unexpected attendee format:', typeof attendeeObj, attendeeObj);
        return { email: 'Unknown', name: '' };
    }

    /**
     * Extract recipients from attendee arrays
     */
    static extractRecipients(attendeesArray) {
        if (!Array.isArray(attendeesArray)) return [];
        
        return attendeesArray.map(attendee => this.extractSender(attendee));
    }

    /**
     * Generate smart preview from email content
     */
    static generatePreview(body, plainBody, maxLength = 200) {
        let content = '';
        
        // Prefer plain text body, fallback to HTML body
        if (plainBody && typeof plainBody === 'string' && plainBody.length > 10) {
            content = plainBody;
        } else if (body && typeof body === 'string') {
            content = this.htmlToText(body);
        }
        
        if (!content) return 'No content available';
        
        content = content
            .replace(/\r?\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
            
        if (content.length > maxLength) {
            return content.substring(0, maxLength) + '...';
        }
        
        return content || 'Empty message';
    }

    /**
     * Enhanced email processing - FIXED FOR UNIPILE STRUCTURE
     */
    static processEmail(email) {
        console.log('🔍 Processing email with ID:', email.id);
        console.log('🔍 Available email fields:', Object.keys(email));
        
        // FIXED: Extract sender from from_attendee (not from)
        const sender = this.extractSender(email.from_attendee);
        
        // FIXED: Extract recipients from attendee arrays
        const toRecipients = this.extractRecipients(email.to_attendees || []);
        const ccRecipients = this.extractRecipients(email.cc_attendees || []);
        const bccRecipients = this.extractRecipients(email.bcc_attendees || []);
        const replyToRecipients = this.extractRecipients(email.reply_to_attendees || []);
        
        // FIXED: Use body (HTML) and body_plain (plain text)
        const htmlContent = email.body || '';
        const plainTextBody = email.body_plain || this.htmlToText(htmlContent);
        const preview = this.generatePreview(htmlContent, plainTextBody, 200);
        
        console.log('🔍 Final sender result:', sender);
        console.log('🔍 Content preview:', preview.substring(0, 50) + '...');
        
        return {
            // Original email data with correct field mapping
            id: email.id,
            subject: email.subject || 'No Subject',
            date: email.date,
            hasAttachments: email.has_attachments || false,
            isRead: email.read_date ? true : false, // FIXED: read_date indicates if read
            messageId: email.message_id,
            threadId: email.thread_id,
            providerId: email.provider_id,
            
            // Enhanced sender info (FIXED)
            from: sender.email,
            fromName: sender.name,
            sender: sender,
            
            // Enhanced recipients info (NEW)
            to: toRecipients,
            cc: ccRecipients,
            bcc: bccRecipients,
            replyTo: replyToRecipients,
            
            // Enhanced content (FIXED)
            preview: preview,
            plainTextBody: plainTextBody,
            htmlBody: htmlContent,
            contentLength: plainTextBody.length,
            
            // Folder information
            folders: email.folders || [],
            folderIds: email.folderIds || [],
            
            // Additional metadata
            wordCount: plainTextBody.split(' ').filter(word => word.length > 0).length,
            estimatedReadTime: Math.max(1, Math.ceil(plainTextBody.split(' ').filter(word => word.length > 0).length / 200)),
            
            // Email type and origin
            emailType: email.type,
            origin: email.origin,
            role: email.role,
            
            // Attachments details
            attachments: email.attachments || [],
            
            // Debug info (for troubleshooting)
            _debug: {
                originalFromAttendee: email.from_attendee,
                availableFields: Object.keys(email),
                senderExtractionSuccess: sender.email !== 'Unknown'
            }
        };
    }
}

export class UnipileEmailService {
    constructor() {
        this.apiKey = process.env.UNIPILE_API_KEY;
        this.baseUrl = process.env.UNIPILE_BASE_URL;
        this.dsn = process.env.UNIPILE_DSN;
        this.apiVersion = '/api/v1';
        
        console.log('🔧 Unipile Email Service Initialized (Fixed for Unipile Structure)');
        console.log(`   Base URL: ${this.baseUrl}`);
        console.log(`   API Key: ${this.apiKey?.substring(0, 10)}...`);
    }

    getHeaders(contentType = 'application/json') {
        const headers = {
            'X-API-KEY': this.apiKey,
            'Accept': 'application/json'
        };
        
        if (contentType !== 'multipart/form-data') {
            headers['Content-Type'] = contentType;
        }
        
        if (this.dsn) {
            headers['X-DSN'] = this.dsn;
        }
        
        return headers;
    }

    async testConnection() {
        try {
            const response = await axios.get(`${this.baseUrl}${this.apiVersion}/accounts`, {
                headers: this.getHeaders()
            });
            
            return {
                success: true,
                accounts: response.data,
                totalAccounts: Array.isArray(response.data) ? response.data.length : 0
            };
        } catch (error) {
            console.error('❌ Connection test error details:', error.response?.data || error.message);
            throw new Error(`Connection failed: ${error.response?.data?.message || error.message}`);
        }
    }

    async getEmailAccounts() {
        try {
            const response = await axios.get(`${this.baseUrl}${this.apiVersion}/accounts`, {
                headers: this.getHeaders()
            });

            let accounts = [];
            if (Array.isArray(response.data)) {
                accounts = response.data;
            } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                accounts = response.data.data;
            } else if (response.data && response.data.accounts && Array.isArray(response.data.accounts)) {
                accounts = response.data.accounts;
            } else {
                console.warn('⚠️  Unexpected accounts response format:', response.data);
                return {
                    success: true,
                    accounts: [],
                    total: 0
                };
            }

            const emailAccounts = accounts.filter(account => {
                const provider = account.provider?.toLowerCase() || '';
                return ['gmail', 'outlook', 'yahoo', 'imap', 'microsoft', 'google', 'email'].includes(provider);
            });

            return {
                success: true,
                accounts: emailAccounts.map(account => ({
                    id: account.id,
                    provider: account.provider,
                    email: account.identifier || account.email || account.username,
                    name: account.name || account.display_name || 'Unknown',
                    status: account.status || 'unknown',
                    createdAt: account.created_at || account.createdAt || new Date().toISOString()
                })),
                total: emailAccounts.length
            };
        } catch (error) {
            console.error('❌ Get email accounts error:', error.response?.data || error.message);
            throw new Error(`Failed to fetch email accounts: ${error.response?.data?.message || error.message}`);
        }
    }

    // FIXED: getAllEmails with correct response handling
    async getAllEmails(accountId, options = {}) {
        try {
            const params = {
                account_id: accountId,
                limit: options.limit || 50,
                offset: options.offset || 0,
                ...(options.folderId && { folder_id: options.folderId }),
                ...(options.query && { q: options.query }),
                ...(options.from && { from: options.from }),
                ...(options.subject && { subject: options.subject }),
                ...(options.since && { since: options.since }),
                ...(options.until && { until: options.until }),
                ...(options.hasAttachments !== undefined && { has_attachments: options.hasAttachments }),
                ...(options.isRead !== undefined && { is_read: options.isRead })
            };

            console.log('📧 Making emails request with params:', JSON.stringify(params, null, 2));

            const response = await axios.get(`${this.baseUrl}${this.apiVersion}/emails`, {
                headers: this.getHeaders(),
                params: params
            });

            // FIXED: Handle Unipile's actual response structure
            let emails = [];
            let total = 0;
            let hasMore = false;

            // Based on your logs, emails are in response.items
            if (response.data && response.data.items && Array.isArray(response.data.items)) {
                emails = response.data.items;
                total = response.data.total || emails.length;
                hasMore = response.data.has_more || false;
                console.log(`📧 Found array in response.items: ${emails.length} items`);
            } else if (Array.isArray(response.data)) {
                emails = response.data;
                total = emails.length;
            } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
                emails = response.data.data;
                total = response.data.total || emails.length;
                hasMore = response.data.has_more || false;
            } else {
                console.warn('⚠️  Unexpected emails response format:', response.data);
                console.warn('⚠️  Response keys:', Object.keys(response.data || {}));
                
                for (const [key, value] of Object.entries(response.data || {})) {
                    if (Array.isArray(value)) {
                        console.log(`📧 Found array in response.${key}:`, value.length, 'items');
                        emails = value;
                        total = value.length;
                        break;
                    }
                }
                
                if (emails.length === 0) {
                    return {
                        success: true,
                        emails: [],
                        total: 0,
                        pagination: {
                            limit: params.limit,
                            offset: params.offset,
                            hasMore: false
                        }
                    };
                }
            }

            console.log(`📧 Processing ${emails.length} emails with enhanced decoding...`);

            // ENHANCED: Process all emails with FIXED decoding
            const processedEmails = emails.map(email => EmailUtils.processEmail(email));

            return {
                success: true,
                emails: processedEmails,
                total: total,
                pagination: {
                    limit: params.limit,
                    offset: params.offset,
                    hasMore: hasMore
                }
            };
        } catch (error) {
            console.error('❌ Get emails error details:', error.response?.data || error.message);
            throw new Error(`Failed to fetch emails: ${error.response?.data?.message || error.message}`);
        }
    }

    async getEmailById(emailId, accountId) {
        try {
            console.log(`📧 Fetching email ${emailId} for account ${accountId}`);
            
            const response = await axios.get(`${this.baseUrl}${this.apiVersion}/emails/${emailId}`, {
                headers: this.getHeaders(),
                params: { account_id: accountId }
            });

            const emailData = response.data;
            
            // ENHANCED: Process single email with FIXED decoding
            const processedEmail = EmailUtils.processEmail(emailData);

            return {
                success: true,
                email: processedEmail
            };
        } catch (error) {
            console.error('❌ Get email by ID error:', error.response?.data || error.message);
            throw new Error(`Failed to fetch email: ${error.response?.data?.message || error.message}`);
        }
    }

    async markEmailAsRead(emailId, accountId, isRead = true) {
        try {
            const response = await axios.patch(`${this.baseUrl}${this.apiVersion}/emails/${emailId}`, {
                account_id: accountId,
                is_read: isRead
            }, {
                headers: this.getHeaders()
            });

            return { success: true, isRead: response.data.is_read || isRead };
        } catch (error) {
            console.error('❌ Mark email error:', error.response?.data || error.message);
            throw new Error(`Failed to mark email: ${error.response?.data?.message || error.message}`);
        }
    }

async sendEmail(accountId, to, subject, body, options = {}) {
    try {
        // FIXED: Convert recipients to Unipile's expected format
        const formatRecipients = (recipients) => {
            if (typeof recipients === 'string') {
                // Single email string
                return [{
                    identifier: recipients,
                    display_name: ""
                }];
            }
            
            if (Array.isArray(recipients)) {
                // Array of emails
                return recipients.map(recipient => {
                    if (typeof recipient === 'string') {
                        return {
                            identifier: recipient,
                            display_name: ""
                        };
                    } else if (typeof recipient === 'object') {
                        return {
                            identifier: recipient.email || recipient.identifier,
                            display_name: recipient.name || recipient.display_name || ""
                        };
                    }
                    return { identifier: recipient, display_name: "" };
                });
            }
            
            // Fallback
            return [{ identifier: recipients, display_name: "" }];
        };

        const emailData = {
            account_id: accountId,
            to: formatRecipients(to), // FIXED: Format as array of objects
            subject: subject,
            body: body,
            ...(options.cc && { cc: formatRecipients(options.cc) }),
            ...(options.bcc && { bcc: formatRecipients(options.bcc) }),
            ...(options.replyTo && { reply_to: formatRecipients(options.replyTo) })
        };

        console.log('📧 Sending email with properly formatted data:', JSON.stringify(emailData, null, 2));

        const response = await axios.post(`${this.baseUrl}${this.apiVersion}/emails`, emailData, {
            headers: this.getHeaders()
        });

        console.log('📧 Send email response:', JSON.stringify(response.data, null, 2));

        return {
            success: true,
            messageId: response.data.id || response.data.message_id || 'sent',
            sentAt: response.data.sent_at || response.data.created_at || new Date().toISOString()
        };
    } catch (error) {
        console.error('❌ Send email error:', error.response?.data || error.message);
        throw new Error(`Failed to send email: ${error.response?.data?.detail || error.response?.data?.message || error.message}`);
    }
}

}
