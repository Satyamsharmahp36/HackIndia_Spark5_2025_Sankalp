// email-utils.js - Email processing utilities
export class EmailUtils {
    
    /**
     * Convert HTML to plain text
     */
    static htmlToText(html) {
        if (!html || typeof html !== 'string') return '';
        
        return html
            // Remove script and style elements
            .replace(/<script[^>]*>.*?<\/script>/gis, '')
            .replace(/<style[^>]*>.*?<\/style>/gis, '')
            // Remove HTML tags
            .replace(/<[^>]+>/g, ' ')
            // Decode HTML entities
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&apos;/g, "'")
            // Clean up whitespace
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Extract sender information from email object
     */
    static extractSender(fromField) {
        if (!fromField) return { email: 'Unknown', name: '' };
        
        // Handle different sender format possibilities
        if (typeof fromField === 'string') {
            // Parse "Name <email@domain.com>" format
            const match = fromField.match(/(.*?)\s*<(.+?)>/);
            if (match) {
                return {
                    email: match[2].trim(),
                    name: match[1].trim().replace(/"/g, '')
                };
            }
            // Just email address
            return { email: fromField.trim(), name: '' };
        }
        
        if (typeof fromField === 'object') {
            return {
                email: fromField.email || fromField.identifier || fromField.address || 'Unknown',
                name: fromField.name || fromField.display_name || fromField.personal || ''
            };
        }
        
        return { email: 'Unknown', name: '' };
    }

    /**
     * Generate smart preview from email content
     */
    static generatePreview(body, htmlBody, maxLength = 200) {
        let content = '';
        
        // Prefer plain text, fallback to HTML
        if (body && typeof body === 'string') {
            content = body;
        } else if (htmlBody && typeof htmlBody === 'string') {
            content = this.htmlToText(htmlBody);
        }
        
        if (!content) return 'No content available';
        
        // Clean and truncate
        content = content
            .replace(/\r?\n/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
            
        if (content.length > maxLength) {
            return content.substring(0, maxLength) + '...';
        }
        
        return content;
    }

    /**
     * Detect email category/type
     */
    static categorizeEmail(subject, sender, body) {
        const subjectLower = (subject || '').toLowerCase();
        const senderLower = (sender || '').toLowerCase();
        const bodyLower = (body || '').toLowerCase();
        
        // Security/verification emails
        if (subjectLower.includes('security') || 
            subjectLower.includes('verification') || 
            subjectLower.includes('verify') ||
            subjectLower.includes('code') ||
            /\d{6}/.test(subject)) {
            return 'security';
        }
        
        // Social media notifications
        if (senderLower.includes('instagram') || 
            senderLower.includes('facebook') ||
            senderLower.includes('linkedin') ||
            senderLower.includes('twitter')) {
            return 'social';
        }
        
        // Professional/work emails
        if (senderLower.includes('kalvium') || 
            subjectLower.includes('employee') ||
            subjectLower.includes('work') ||
            subjectLower.includes('project')) {
            return 'work';
        }
        
        // Marketing/promotional
        if (subjectLower.includes('update') || 
            subjectLower.includes('launch') ||
            subjectLower.includes('new') ||
            subjectLower.includes('deal')) {
            return 'marketing';
        }
        
        return 'general';
    }

    /**
     * Extract important information from email
     */
    static extractKeyInfo(subject, body) {
        const info = {
            codes: [],
            links: [],
            dates: [],
            actions: []
        };
        
        const fullText = `${subject} ${body}`.toLowerCase();
        
        // Extract verification codes
        const codeMatches = fullText.match(/\b\d{4,8}\b/g);
        if (codeMatches) {
            info.codes = [...new Set(codeMatches)];
        }
        
        // Extract URLs
        const urlMatches = body.match(/https?:\/\/[^\s<>"]+/g);
        if (urlMatches) {
            info.links = [...new Set(urlMatches.slice(0, 3))]; // Limit to 3 links
        }
        
        // Extract action words
        const actionWords = ['verify', 'confirm', 'activate', 'login', 'reset', 'update'];
        for (const action of actionWords) {
            if (fullText.includes(action)) {
                info.actions.push(action);
            }
        }
        
        return info;
    }
}
