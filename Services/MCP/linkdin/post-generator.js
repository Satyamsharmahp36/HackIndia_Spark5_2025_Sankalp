// post-generator.js - Smart LinkedIn post generation (FIXED)
import { AIEnhancementService } from './ai-enhancement-service.js';
import moment from 'moment';

export class PostGenerator {
    constructor() {
        this.aiService = new AIEnhancementService();
        this.postTemplates = this.initializeTemplates();
        
        console.log('📝 Post Generator Service Initialized');
    }

    initializeTemplates() {
        return {
            achievement: {
                structure: ['hook', 'story', 'lesson', 'gratitude', 'cta'],
                tone: 'professional-humble',
                hashtags: ['achievement', 'growth', 'grateful']
            },
            insight: {
                structure: ['observation', 'analysis', 'implications', 'cta'],
                tone: 'thought-leadership',
                hashtags: ['insights', 'industry', 'leadership']
            },
            update: {
                structure: ['news', 'context', 'impact', 'next-steps'],
                tone: 'informative',
                hashtags: ['update', 'news', 'progress']
            },
            question: {
                structure: ['context', 'question', 'discussion-points'],
                tone: 'engaging',
                hashtags: ['discussion', 'question', 'community']
            }
        };
    }

    // Generate achievement post (like HackIndia)
    async generateAchievementPost(achievement, details = {}) {
        try {
            const context = {
                achievement: achievement,
                team: details.team || 'our team',
                competition: details.competition || 'competition',
                impact: details.impact || 'significant milestone',
                nextSteps: details.nextSteps || 'continue the journey',
                ...details
            };

            const aiPost = await this.aiService.generateAchievementPost(achievement, context);
            
            return {
                success: true,
                content: aiPost.content,
                type: 'achievement',
                metadata: {
                    wordCount: this.countWords(aiPost.content),
                    hashtags: this.extractHashtags(aiPost.content),
                    emojis: this.extractEmojis(aiPost.content),
                    estimatedEngagement: this.estimateEngagement(aiPost.content, 'achievement'),
                    bestTimeToPost: this.suggestPostTime(),
                    context: context
                }
            };
        } catch (error) {
            throw new Error(`Achievement post generation failed: ${error.message}`);
        }
    }

    // Generate tech/industry insight post
    async generateInsightPost(topic, insight, context = {}) {
        try {
            const postContent = await this.aiService.generateLinkedInPost(
                `${topic}: ${insight}`,
                {
                    tone: 'thought-leadership',
                    length: 'medium',
                    includeHashtags: true,
                    targetAudience: 'tech professionals',
                    callToAction: true
                }
            );

            return {
                success: true,
                content: postContent.content,
                type: 'insight',
                metadata: {
                    topic: topic,
                    insight: insight,
                    wordCount: postContent.wordCount,
                    hashtags: postContent.hashtags,
                    estimatedEngagement: this.estimateEngagement(postContent.content, 'insight'),
                    bestTimeToPost: this.suggestPostTime()
                }
            };
        } catch (error) {
            throw new Error(`Insight post generation failed: ${error.message}`);
        }
    }

    // Generate project update post
    async generateProjectUpdatePost(projectName, updates, milestones = []) {
        try {
            const updateText = `Project Update: ${projectName}. Recent progress: ${updates.join(', ')}. Key milestones: ${milestones.join(', ')}.`;
            
            const postContent = await this.aiService.generateLinkedInPost(
                updateText,
                {
                    tone: 'professional',
                    length: 'medium',
                    includeHashtags: true,
                    targetAudience: 'professionals and developers',
                    callToAction: false
                }
            );

            return {
                success: true,
                content: postContent.content,
                type: 'project_update',
                metadata: {
                    projectName: projectName,
                    updates: updates,
                    milestones: milestones,
                    wordCount: postContent.wordCount,
                    hashtags: postContent.hashtags,
                    estimatedEngagement: this.estimateEngagement(postContent.content, 'project_update')
                }
            };
        } catch (error) {
            throw new Error(`Project update post generation failed: ${error.message}`);
        }
    }

    // Generate engagement/question post
    async generateEngagementPost(question, context = '') {
        try {
            const fullPrompt = `${context} ${question}`;
            
            const postContent = await this.aiService.generateLinkedInPost(
                fullPrompt,
                {
                    tone: 'engaging',
                    length: 'short',
                    includeHashtags: true,
                    targetAudience: 'professional community',
                    callToAction: true
                }
            );

            return {
                success: true,
                content: postContent.content,
                type: 'engagement',
                metadata: {
                    question: question,
                    context: context,
                    wordCount: postContent.wordCount,
                    hashtags: postContent.hashtags,
                    estimatedEngagement: this.estimateEngagement(postContent.content, 'engagement'),
                    expectedResponses: 'high' // Questions typically get more comments
                }
            };
        } catch (error) {
            throw new Error(`Engagement post generation failed: ${error.message}`);
        }
    }

    // Create HackIndia specific post
    async createHackIndiaPost(status = 'finalist') {
        try {
            const hackIndiaContext = {
                achievement: `Team Sankalp - HackIndia ${status}`,
                team: 'Team Sankalp',
                competition: 'HackIndia 2025 - India\'s biggest AI & Web3 hackathon',
                impact: 'recognition among top innovators in India',
                technology: 'AI and Web3 innovations',
                nextSteps: 'preparing for the final presentation',
                gratitude: 'mentors, team members, and the tech community'
            };

            const post = await this.generateAchievementPost(
                `Reached ${status} in HackIndia 2025`,
                hackIndiaContext
            );

            return {
                ...post,
                hackIndiaSpecific: true,
                suggestedMedia: [
                    'Team photo',
                    'HackIndia logo',
                    'Project demo screenshot'
                ],
                suggestedTags: [
                    '@HackIndia',
                    'teammates if they have LinkedIn'
                ]
            };
        } catch (error) {
            throw new Error(`HackIndia post generation failed: ${error.message}`);
        }
    }

    // FIXED: Estimate engagement potential with corrected emoji regex
    estimateEngagement(content, type) {
        let score = 0;
        
        // Content analysis
        if (content.includes('?')) score += 15; // Questions drive engagement
        if (this.hasEmojis(content)) score += 10; // Emojis increase engagement
        if (content.includes('#')) score += 10; // Hashtags improve visibility
        if (content.length > 100 && content.length < 500) score += 15; // Optimal length
        
        // Type-based scoring
        const typeScores = {
            achievement: 25,
            insight: 20,
            engagement: 30,
            project_update: 15,
            question: 35
        };
        
        score += typeScores[type] || 10;
        
        return {
            score: Math.min(score, 100),
            level: score > 70 ? 'high' : score > 40 ? 'medium' : 'low',
            factors: this.getEngagementFactors(content)
        };
    }

    // FIXED: Helper method to detect emojis without regex issues
    hasEmojis(text) {
        // Use a more reliable emoji detection
        const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
        return emojiRegex.test(text);
    }

    // FIXED: Extract emojis with proper regex
    extractEmojis(content) {
        try {
            const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
            return content.match(emojiRegex) || [];
        } catch (error) {
            console.warn('Emoji extraction failed:', error.message);
            return [];
        }
    }

    // Extract hashtags
    extractHashtags(content) {
        const hashtagRegex = /#[\w]+/g;
        return content.match(hashtagRegex) || [];
    }

    // Count words
    countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    // Suggest optimal posting time
    suggestPostTime() {
        const now = moment();
        const suggestions = [];
        
        // LinkedIn optimal times (general)
        const optimalTimes = [
            { day: 'Tuesday', time: '10:00 AM' },
            { day: 'Wednesday', time: '11:00 AM' },
            { day: 'Thursday', time: '1:00 PM' },
            { day: 'Tuesday', time: '3:00 PM' },
            { day: 'Wednesday', time: '5:00 PM' }
        ];
        
        return {
            immediate: now.format('YYYY-MM-DD HH:mm'),
            optimalToday: this.getNextOptimalTime(now),
            weeklyOptimal: optimalTimes,
            timezone: 'IST (Indian Standard Time)'
        };
    }

    getNextOptimalTime(now) {
        const optimalHours = [10, 11, 13, 15, 17]; // 10 AM, 11 AM, 1 PM, 3 PM, 5 PM
        
        for (const hour of optimalHours) {
            const optimalTime = now.clone().hour(hour).minute(0);
            if (optimalTime.isAfter(now)) {
                return optimalTime.format('YYYY-MM-DD HH:mm');
            }
        }
        
        // If no optimal time today, suggest tomorrow at 10 AM
        return now.clone().add(1, 'day').hour(10).minute(0).format('YYYY-MM-DD HH:mm');
    }

    getEngagementFactors(content) {
        const factors = [];
        
        if (content.includes('?')) factors.push('Contains question - encourages comments');
        if (this.hasEmojis(content)) factors.push('Uses emojis - increases visual appeal');
        if (content.includes('#')) factors.push('Has hashtags - improves discoverability');
        if (this.countWords(content) > 50) factors.push('Substantial content - provides value');
        if (content.toLowerCase().includes('team') || content.toLowerCase().includes('collaboration')) {
            factors.push('Mentions teamwork - resonates with professionals');
        }
        
        return factors;
    }
}
