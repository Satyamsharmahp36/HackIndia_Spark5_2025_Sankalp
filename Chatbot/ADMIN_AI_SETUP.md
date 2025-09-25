# Admin AI Setup with MCP Integrations

## Overview
This setup creates a separate AI service for admin users that includes additional features and integrations with the MCP (Model Context Protocol) services, while keeping the regular AI service for regular users.

## Files Created/Modified

### 1. `src/services/adminai.jsx` (NEW)
- **Purpose**: Enhanced AI service with MCP integrations for admin users
- **Features**:
  - Email management (send emails, check accounts, get recent emails)
  - LinkedIn integration (send messages, generate posts, manage content)
  - WhatsApp integration (send messages, post status, manage groups)
  - Service status monitoring
  - All regular AI features (tasks, meetings, etc.)

### 2. `src/components/ChatBot.jsx` (MODIFIED)
- **Changes**:
  - Added import for `getAdminAnswer` from adminai.jsx
  - Added `isAdminUser()` helper function to detect admin users
  - Modified the AI service call to conditionally use admin AI for admin users

## Admin Detection
The system detects admin users based on:
- `userData.role === 'admin'`
- `userData.user.role === 'admin'`
- `userData.isAdmin === true`
- `userData.admin === true`
- `userData.username === 'admin'`
- `userData.user.username === 'admin'`

## MCP Service Integration

### Email Service (Port 3000)
**Commands:**
- "Send email to [email] about [subject]"
- "Check my emails"
- "Get recent emails"

**Features:**
- Send emails with AI-generated content
- Check email accounts
- Retrieve recent emails with previews

### LinkedIn Service (Port 4000)
**Commands:**
- "Create LinkedIn post about [topic]"
- "Send LinkedIn message to [person]"
- "Check LinkedIn messages"

**Features:**
- Generate professional LinkedIn posts
- Send LinkedIn messages
- Retrieve recent LinkedIn messages

### WhatsApp Service (Port 5000)
**Commands:**
- "Send WhatsApp message to [number/group] saying [message]"
- "Post WhatsApp status about [topic]"
- "Check WhatsApp messages"
- "List WhatsApp groups"

**Features:**
- Send messages to phone numbers or groups
- Post WhatsApp status updates
- Retrieve recent WhatsApp messages
- List available WhatsApp groups

## System Commands
- "MCP status" - Check all service statuses
- "Recent messages" - Get messages from all platforms

## Usage Examples

### For Admin Users:
```
User: "Send email to john@example.com about project update"
AI: ✅ Email sent successfully to john@example.com about "project update". The email body was generated using AI and sent via the MCP email service.

User: "Create LinkedIn post about HackIndia finals"
AI: ✅ LinkedIn post generated successfully!
📝 Enhanced Content: [Generated post content]
💡 Improvements: [List of improvements]
📊 Character count: [Word count]

User: "Send WhatsApp message to +919876543210 saying Hello from admin"
AI: ✅ WhatsApp message sent successfully to +919876543210!
📱 Message: Hello from admin
📊 Message ID: [Message ID]

User: "MCP status"
AI: 🔧 MCP Service Status:
✅ Email Service: Online
✅ LinkedIn Service: Online
✅ WhatsApp Service: Online
```

### For Regular Users:
Regular users will continue to use the standard AI service with all existing features (tasks, meetings, etc.) but without MCP integrations.

## Setup Requirements

1. **MCP Services Running**:
   - Email Service: `http://localhost:3000`
   - LinkedIn Service: `http://localhost:4000`
   - WhatsApp Service: `http://localhost:5000`

2. **Environment Variables**:
   - `VITE_GOOGLE_GENAI_API_KEY` - For Gemini AI
   - MCP service configurations in respective service directories

3. **Admin User Setup**:
   - Set user role to 'admin' in your user management system
   - Or set username to 'admin'
   - Or add admin flags to user data

## Benefits

1. **Separation of Concerns**: Admin features are isolated from regular user features
2. **Enhanced Capabilities**: Admins get access to multi-platform communication tools
3. **Backward Compatibility**: Regular users continue to have the same experience
4. **Scalable**: Easy to add more MCP integrations in the future
5. **Secure**: Admin features are only available to authorized users

## Future Enhancements

- Add more MCP service integrations
- Implement admin-specific UI components
- Add admin dashboard for service management
- Implement service health monitoring
- Add bulk operations across platforms
