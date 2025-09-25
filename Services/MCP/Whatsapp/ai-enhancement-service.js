// ai-enhancement-service.js - Google Gemini powered content generation for WhatsApp
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from 'dotenv';

config();

export class WhatsAppAIService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is required in environment variables');
        }
        
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ 
            model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
            generationConfig: {
                temperature: parseFloat(process.env.GENERATION_TEMPERATURE || '0.7'),
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 512,
            }
        });
        
        console.log('🤖 WhatsApp AI Enhancement Service Initialized with Google Gemini');
        console.log(`   Model: ${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}`);
    }

    // Generate WhatsApp message for specific recipient and intent
    async generateWhatsAppMessage(recipient, intent, context = {}) {
        try {
            const contextString = Object.entries(context)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n');

            const prompt = `Generate a WhatsApp message for ${recipient} with intent: ${intent}

CONTEXT:
${contextString}

REQUIREMENTS:
- Casual, friendly WhatsApp tone
- Keep it concise (under 200 characters for better mobile readability)
- Use appropriate emojis (2-3 max)
- Make it personal and engaging
- Sound natural, not robotic
- Appropriate for WhatsApp messaging

INTENT GUIDELINES:
- "catch up": Warm, nostalgic, interested in their life
- "follow up": Professional but friendly, checking on progress
- "share news": Excited, wanting to celebrate or inform
- "ask favor": Polite, respectful, not demanding
- "invite": Enthusiastic, clear about what you're inviting to
- "thank": Grateful, specific about what you're thanking for
- "apologize": Sincere, taking responsibility
- "birthday": Celebratory, warm, personal

CRITICAL INSTRUCTION:
Return ONLY the WhatsApp message content. No explanations, analysis, or meta-commentary.

WhatsApp Message:`;

            const result = await this.model.generateContent(prompt);
            let generatedContent = result.response.text().trim();

            // Clean up any accidental formatting
            generatedContent = this.cleanUpGeneratedContent(generatedContent);

            return {
                success: true,
                content: generatedContent,
                recipient: recipient,
                intent: intent,
                context: context,
                characterCount: generatedContent.length,
                wordCount: this.countWords(generatedContent),
                estimatedReadTime: Math.ceil(this.countWords(generatedContent) / 200),
                model: 'gemini-2.0-flash'
            };
        } catch (error) {
            throw new Error(`WhatsApp message generation failed: ${error.message}`);
        }
    }

    // Generate WhatsApp status/story content
    async generateWhatsAppStatus(topic, mood = 'positive') {
        try {
            const prompt = `Create a WhatsApp status update about "${topic}" with ${mood} mood.

REQUIREMENTS:
- Short and catchy (under 150 characters)
- Include 2-3 relevant emojis
- Engaging and shareable
- Appropriate for WhatsApp status
- Match the mood: ${mood}
- Make it relatable and authentic

MOOD GUIDELINES:
- positive: Upbeat, optimistic, celebratory
- excited: High energy, enthusiastic, using exclamation marks
- grateful: Thankful, appreciative, humble
- motivated: Inspiring, determined, goal-oriented
- relaxed: Chill, peaceful, content
- accomplished: Proud, satisfied, achieved something
- funny: Humorous, witty, light-hearted
- inspiring: Motivational, uplifting, encouraging others

CRITICAL INSTRUCTION:
Return ONLY the status content. No explanations or meta-commentary.

Status Update:`;

            const result = await this.model.generateContent(prompt);
            let generatedContent = result.response.text().trim();

            // Clean up any accidental formatting
            generatedContent = this.cleanUpGeneratedContent(generatedContent);

            return {
                success: true,
                content: generatedContent,
                topic: topic,
                mood: mood,
                characterCount: generatedContent.length,
                emojis: this.extractEmojis(generatedContent),
                hashtags: this.extractHashtags(generatedContent),
                model: 'gemini-2.0-flash'
            };
        } catch (error) {
            throw new Error(`WhatsApp status generation failed: ${error.message}`);
        }
    }

    // Generate reply to a WhatsApp message
    async generateWhatsAppReply(originalMessage, sender, replyType = 'casual') {
        try {
            const prompt = `Generate a WhatsApp reply to this message from ${sender}:

Original Message: "${originalMessage}"

REPLY REQUIREMENTS:
- Type: ${replyType}
- Casual WhatsApp tone
- Keep it brief and natural
- Respond appropriately to the content
- Use relevant emojis sparingly
- Show engagement and interest

REPLY TYPE GUIDELINES:
- casual: Friendly, relaxed, everyday conversation
- supportive: Encouraging, understanding, empathetic
- excited: Enthusiastic, high energy, celebratory
- professional: Polite but friendly, business appropriate
- funny: Light-hearted, humorous, playful
- grateful: Appreciative, thankful, warm

CRITICAL INSTRUCTION:
Return ONLY the reply message content. No explanations.

Reply:`;

            const result = await this.model.generateContent(prompt);
            let generatedContent = result.response.text().trim();

            // Clean up any accidental formatting
            generatedContent = this.cleanUpGeneratedContent(generatedContent);

            return {
                success: true,
                content: generatedContent,
                originalMessage: originalMessage,
                sender: sender,
                replyType: replyType,
                characterCount: generatedContent.length,
                model: 'gemini-2.0-flash'
            };
        } catch (error) {
            throw new Error(`WhatsApp reply generation failed: ${error.message}`);
        }
    }

    // Analyze WhatsApp group messages for insights
    async analyzeGroupMessages(messages, groupName) {
        try {
            const messageTexts = messages.map(msg => 
                `${msg.senderName}: ${msg.content}`
            ).slice(0, 20); // Analyze last 20 messages

            const prompt = `Analyze these WhatsApp group messages from "${groupName}":

MESSAGES:
${messageTexts.join('\n')}

Provide analysis on:
1. MAIN TOPICS: What are people discussing?
2. GROUP MOOD: Overall sentiment and energy
3. ACTIVE PARTICIPANTS: Who's most engaged?
4. KEY THEMES: Common subjects or interests
5. ENGAGEMENT LEVEL: How active is the group?
6. SUGGESTED RESPONSES: What kind of messages would fit well?

Keep the analysis concise and actionable.

Group Analysis:`;

            const result = await this.model.generateContent(prompt);
            const analysis = result.response.text().trim();

            return {
                success: true,
                groupName: groupName,
                messagesAnalyzed: messageTexts.length,
                analysis: analysis,
                timestamp: new Date().toISOString(),
                model: 'gemini-2.0-flash'
            };
        } catch (error) {
            throw new Error(`Group message analysis failed: ${error.message}`);
        }
    }

    // Generate group message based on ongoing conversation
    async generateGroupMessage(groupContext, messageIntent, userPersonality = 'friendly') {
        try {
            const prompt = `Generate a WhatsApp group message based on this context:

GROUP CONTEXT: ${groupContext}
MESSAGE INTENT: ${messageIntent}
YOUR PERSONALITY: ${userPersonality}

REQUIREMENTS:
- Fit naturally into the group conversation
- Match the group's tone and energy
- Be engaging but not attention-seeking
- Use appropriate emojis
- Keep it concise for group chat
- Sound authentic and personal

PERSONALITY TYPES:
- friendly: Warm, approachable, supportive
- funny: Humorous, witty, entertaining
- helpful: Informative, solution-oriented
- enthusiastic: High energy, positive, excited
- chill: Relaxed, laid-back, casual

CRITICAL INSTRUCTION:
Return ONLY the group message content. No explanations.

Group Message:`;

            const result = await this.model.generateContent(prompt);
            let generatedContent = result.response.text().trim();

            // Clean up any accidental formatting
            generatedContent = this.cleanUpGeneratedContent(generatedContent);

            return {
                success: true,
                content: generatedContent,
                groupContext: groupContext,
                messageIntent: messageIntent,
                userPersonality: userPersonality,
                characterCount: generatedContent.length,
                model: 'gemini-2.0-flash'
            };
        } catch (error) {
            throw new Error(`Group message generation failed: ${error.message}`);
        }
    }

    // Generate business/professional WhatsApp message
    async generateBusinessMessage(recipient, businessIntent, companyContext = {}) {
        try {
            const contextString = Object.entries(companyContext)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n');

            const prompt = `Generate a professional WhatsApp business message for ${recipient}:

BUSINESS INTENT: ${businessIntent}
COMPANY CONTEXT:
${contextString}

REQUIREMENTS:
- Professional but friendly tone
- Appropriate for WhatsApp business communication
- Clear and concise
- Include appropriate call-to-action if needed
- Use minimal emojis (1-2 max)
- Maintain business etiquette
- Keep under 250 characters

BUSINESS INTENT TYPES:
- "follow_up": Following up on previous conversation/meeting
- "introduction": Introducing services or company
- "appointment": Scheduling or confirming meetings
- "update": Providing project or service updates
- "inquiry": Asking about requirements or feedback
- "proposal": Presenting an offer or solution
- "support": Providing customer service assistance

CRITICAL INSTRUCTION:
Return ONLY the business message content. No explanations.

Business Message:`;

            const result = await this.model.generateContent(prompt);
            let generatedContent = result.response.text().trim();

            // Clean up any accidental formatting
            generatedContent = this.cleanUpGeneratedContent(generatedContent);

            return {
                success: true,
                content: generatedContent,
                recipient: recipient,
                businessIntent: businessIntent,
                companyContext: companyContext,
                characterCount: generatedContent.length,
                isProfessional: true,
                model: 'gemini-2.0-flash'
            };
        } catch (error) {
            throw new Error(`Business message generation failed: ${error.message}`);
        }
    }

    // Enhance existing WhatsApp message
    async enhanceWhatsAppMessage(originalMessage, enhancement = 'improve') {
        try {
            let prompt;
            
            switch (enhancement) {
                case 'improve':
                    prompt = `Improve this WhatsApp message to make it more engaging and natural:
Original: "${originalMessage}"
Make it more conversational, add appropriate emojis, and improve the tone while keeping it concise.`;
                    break;
                    
                case 'add_emojis':
                    prompt = `Add appropriate emojis to this WhatsApp message:
Original: "${originalMessage}"
Add 2-3 relevant emojis that enhance the message without overdoing it.`;
                    break;
                    
                case 'make_casual':
                    prompt = `Make this WhatsApp message more casual and friendly:
Original: "${originalMessage}"
Use a relaxed, conversational tone appropriate for WhatsApp.`;
                    break;
                    
                case 'make_professional':
                    prompt = `Make this WhatsApp message more professional while keeping it WhatsApp-appropriate:
Original: "${originalMessage}"
Maintain friendliness but add professionalism.`;
                    break;
                    
                case 'make_shorter':
                    prompt = `Make this WhatsApp message more concise:
Original: "${originalMessage}"
Keep the key message but make it shorter and punchier.`;
                    break;
                    
                default:
                    prompt = `Enhance this WhatsApp message:
Original: "${originalMessage}"
Make general improvements for WhatsApp communication.`;
            }

            prompt += `\n\nCRITICAL INSTRUCTION:\nReturn ONLY the enhanced message content. No explanations.\n\nEnhanced Message:`;

            const result = await this.model.generateContent(prompt);
            let enhancedContent = result.response.text().trim();

            // Clean up any accidental formatting
            enhancedContent = this.cleanUpGeneratedContent(enhancedContent);

            return {
                success: true,
                originalContent: originalMessage,
                enhancedContent: enhancedContent,
                enhancement: enhancement,
                characterChange: enhancedContent.length - originalMessage.length,
                improvements: this.analyzeImprovements(originalMessage, enhancedContent),
                model: 'gemini-2.0-flash'
            };
        } catch (error) {
            throw new Error(`WhatsApp message enhancement failed: ${error.message}`);
        }
    }

    // Helper Methods

    // Clean up generated content
    cleanUpGeneratedContent(content) {
        let cleanContent = content
            // Remove common AI meta-commentary patterns
            .replace(/^.*?WhatsApp Message:\s*/i, '')
            .replace(/^.*?Status Update:\s*/i, '')
            .replace(/^.*?Reply:\s*/i, '')
            .replace(/^.*?Enhanced Message:\s*/i, '')
            .replace(/^.*?Business Message:\s*/i, '')
            .replace(/^.*?Group Message:\s*/i, '')
            
            // Remove instructional prefixes
            .replace(/^Here's.*?:/i, '')
            .replace(/^.*?generated.*?:/i, '')
            
            // Remove quotes if the entire content is wrapped in quotes
            .replace(/^"(.*)"$/s, '$1')
            .replace(/^'(.*)'$/s, '$1')
            
            // Clean up extra whitespace
            .replace(/\n{2,}/g, '\n')
            .trim();
        
        // If content is empty after cleanup, return original (safety fallback)
        if (!cleanContent || cleanContent.length < 5) {
            console.warn('Content became too short after cleanup, using original');
            return content.trim();
        }
        
        return cleanContent;
    }

    // Count words in text
    countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    // Extract emojis from content
    extractEmojis(content) {
        try {
            const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
            return content.match(emojiRegex) || [];
        } catch (error) {
            console.warn('Emoji extraction failed:', error.message);
            return [];
        }
    }

    // Extract hashtags from content
    extractHashtags(content) {
        const hashtagRegex = /#[\w\d]+/g;
        return content.match(hashtagRegex) || [];
    }

    // Analyze improvements made to content
    analyzeImprovements(original, enhanced) {
        const improvements = [];
        
        const originalWords = this.countWords(original);
        const enhancedWords = this.countWords(enhanced);
        
        if (enhancedWords > originalWords * 1.2) improvements.push('Expanded content with more details');
        if (enhancedWords < originalWords * 0.8) improvements.push('Made more concise and focused');
        
        const originalEmojis = this.extractEmojis(original).length;
        const enhancedEmojis = this.extractEmojis(enhanced).length;
        if (enhancedEmojis > originalEmojis) improvements.push('Added emojis for better expression');
        
        const originalHashtags = this.extractHashtags(original).length;
        const enhancedHashtags = this.extractHashtags(enhanced).length;
        if (enhancedHashtags > originalHashtags) improvements.push('Added relevant hashtags');
        
        if (enhanced.includes('?') && !original.includes('?')) improvements.push('Added engaging question');
        
        if (improvements.length === 0) improvements.push('General tone and readability improvements');
        
        return improvements;
    }

    // Test Gemini connection
    async testConnection() {
        try {
            const result = await this.model.generateContent("Say 'Hello from Gemini!' and confirm you're working properly for WhatsApp content generation.");
            return {
                success: true,
                message: 'Gemini AI service is working properly for WhatsApp',
                response: result.response.text(),
                model: process.env.GEMINI_MODEL || 'gemini-2.0-flash'
            };
        } catch (error) {
            throw new Error(`Gemini connection test failed: ${error.message}`);
        }
    }

    // Analyze message sentiment and intent
    async analyzeMessage(messageContent, sender = 'Unknown') {
        try {
            const prompt = `Analyze this WhatsApp message from ${sender}:

Message: "${messageContent}"

Provide analysis on:
1. SENTIMENT: (positive/neutral/negative/mixed)
2. INTENT: (casual chat/asking favor/sharing news/seeking help/business/etc.)
3. URGENCY: (low/medium/high)
4. EMOTION: (happy/sad/excited/frustrated/neutral/etc.)
5. RESPONSE_NEEDED: (yes/no/maybe)
6. SUGGESTED_REPLY_TONE: (casual/supportive/professional/funny/etc.)
7. KEY_TOPICS: Main subjects mentioned

Keep analysis concise and practical for response planning.`;

            const result = await this.model.generateContent(prompt);
            const analysis = result.response.text().trim();

            return {
                success: true,
                originalMessage: messageContent,
                sender: sender,
                analysis: analysis,
                timestamp: new Date().toISOString(),
                model: 'gemini-2.0-flash'
            };
        } catch (error) {
            throw new Error(`Message analysis failed: ${error.message}`);
        }
    }
}
