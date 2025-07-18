# Slack API Documentation

## Overview

This API provides endpoints to interact with Slack workspaces, allowing you to fetch channels that a user is a member of and retrieve messages from specific channels.

**Base URL**: `http://localhost:3000` (development) or your deployed URL

---

## Authentication

All endpoints require a valid Slack Bot Token to be configured on the server side. No client-side authentication is needed.

---
asd
## Endpoints

### 1. Get User's Channels

Retrieves all public channels where a specific user is a member.

#### Request

```http
GET /channels?userId={slackUserId}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | The Slack user ID (e.g., `U1234567890`) |

#### Example Request

```javascript
const response = await fetch('/channels?userId=U1234567890');
const data = await response.json();
```

#### Success Response (200 OK)

```json
{
  "channels": [
    {
      "id": "C1234567890",
      "name": "general",
      "is_private": false,
      "is_archived": false,
      "created": 1609459200,
      "topic": {
        "value": "General discussion"
      },
      "purpose": {
        "value": "Company-wide announcements and general discussion"
      }
    },
    {
      "id": "C0987654321",
      "name": "random",
      "is_private": false,
      "is_archived": false,
      "created": 1609459200,
      "topic": {
        "value": "Random stuff"
      },
      "purpose": {
        "value": "A place for random conversations"
      }
    }
  ]
}
```

#### Error Responses

```json
// Missing userId parameter
{
  "error": "userId query parameter is required"
}
```

```json
// Slack API error
{
  "error": "invalid_auth"
}
```

```json
// Server error
{
  "error": "Failed to fetch channels"
}
```

---

### 2. Get Channel Messages

Retrieves messages from a specific Slack channel with user information.

#### Request

```http
GET /messages?channelId={channelId}&limit={limit}&cursor={cursor}
```

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channelId` | string | Yes | The Slack channel ID (e.g., `C1234567890`) |
| `limit` | number | No | Number of messages to retrieve (default: 50, max: 200) |
| `cursor` | string | No | Pagination cursor for retrieving more messages |

#### Example Request

```javascript
// Basic request
const response = await fetch('/messages?channelId=C1234567890');
const data = await response.json();

// With pagination
const response = await fetch('/messages?channelId=C1234567890&limit=20&cursor=dXNlcjpVMDYxTkZUVDI%3D');
const data = await response.json();
```

#### Success Response (200 OK)

```json
{
  "messages": [
    {
      "type": "message",
      "user": "U1234567890",
      "text": "Hello everyone! 👋",
      "ts": "1609459200.000100",
      "user_details": {
        "name": "John Doe",
        "avatar": "https://avatars.slack-edge.com/2021-01-01/1234567890_72.jpg"
      }
    },
    {
      "type": "message",
      "user": "U0987654321",
      "text": "Good morning!",
      "ts": "1609459260.000200",
      "thread_ts": "1609459200.000100",
      "user_details": {
        "name": "Jane Smith",
        "avatar": "https://avatars.slack-edge.com/2021-01-01/0987654321_72.jpg"
      }
    }
  ],
  "has_more": true,
  "next_cursor": "bmV4dF9faWQ6MTA2MDkzNDU5MjAwMDAwMTAw"
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `messages` | array | Array of message objects |
| `messages[].type` | string | Message type (usually "message") |
| `messages[].user` | string | User ID who sent the message |
| `messages[].text` | string | Message content |
| `messages[].ts` | string | Message timestamp |
| `messages[].thread_ts` | string | Thread timestamp (if message is in a thread) |
| `messages[].user_details` | object | Enhanced user information |
| `messages[].user_details.name` | string | User's display name |
| `messages[].user_details.avatar` | string | User's avatar URL |
| `has_more` | boolean | Whether there are more messages available |
| `next_cursor` | string | Cursor for next page of results |

#### Error Responses

```json
// Missing channelId parameter
{
  "error": "channelId query parameter is required"
}
```

```json
// Invalid channel or no access
{
  "error": "channel_not_found"
}
```

```json
// Server error
{
  "error": "Failed to fetch messages"
}
```

---

### 3. Health Check

Simple health check endpoint to verify API status.

#### Request

```http
GET /health
```

#### Success Response (200 OK)

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

### 4. API Information

Get basic information about available endpoints.

#### Request

```http
GET /
```

#### Success Response (200 OK)

```json
{
  "message": "Slack API Service",
  "endpoints": {
    "channels": "GET /channels?userId=<slackUserId>",
    "messages": "GET /messages?channelId=<channelId>&limit=<limit>&cursor=<cursor>",
    "health": "GET /health"
  }
}
```

---

## Frontend Implementation Examples

### React Hook for Channels

```javascript
import { useState, useEffect } from 'react';

function useUserChannels(userId) {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchChannels = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/channels?userId=${userId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch channels');
        }
        
        const data = await response.json();
        setChannels(data.channels);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, [userId]);

  return { channels, loading, error };
}

// Usage
function ChannelsList({ userId }) {
  const { channels, loading, error } = useUserChannels(userId);

  if (loading) return <div>Loading channels...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {channels.map(channel => (
        <li key={channel.id}>
          #{channel.name}
          {channel.topic?.value && <p>{channel.topic.value}</p>}
        </li>
      ))}
    </ul>
  );
}
```

### React Hook for Messages with Pagination

```javascript
import { useState, useEffect, useCallback } from 'react';

function useChannelMessages(channelId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState(null);

  const fetchMessages = useCallback(async (loadMore = false) => {
    if (!channelId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        channelId,
        limit: '50'
      });
      
      if (loadMore && cursor) {
        params.append('cursor', cursor);
      }

      const response = await fetch(`/api/messages?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch messages');
      }
      
      const data = await response.json();
      
      if (loadMore) {
        setMessages(prev => [...prev, ...data.messages]);
      } else {
        setMessages(data.messages);
      }
      
      setHasMore(!!data.has_more);
      setCursor(data.next_cursor || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [channelId, cursor]);

  useEffect(() => {
    fetchMessages();
  }, [channelId]);

  const loadMore = () => {
    if (hasMore && !loading) {
      fetchMessages(true);
    }
  };

  return { messages, loading, error, hasMore, loadMore };
}

// Usage
function MessagesList({ channelId }) {
  const { messages, loading, error, hasMore, loadMore } = useChannelMessages(channelId);

  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {messages.map(message => (
        <div key={message.ts} className="message">
          {message.user_details && (
            <div className="user-info">
              <img src={message.user_details.avatar} alt="" width="32" height="32" />
              <strong>{message.user_details.name}</strong>
            </div>
          )}
          <p>{message.text}</p>
          <small>{new Date(parseFloat(message.ts) * 1000).toLocaleString()}</small>
        </div>
      ))}
      
      {hasMore && (
        <button onClick={loadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More Messages'}
        </button>
      )}
    </div>
  );
}
```

### Vanilla JavaScript Example

```javascript
class SlackAPI {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
  }

  async getUserChannels(userId) {
    try {
      const response = await fetch(`${this.baseURL}/channels?userId=${userId}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch channels');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching channels:', error);
      throw error;
    }
  }

  async getChannelMessages(channelId, options = {}) {
    try {
      const params = new URLSearchParams({
        channelId,
        ...options
      });
      
      const response = await fetch(`${this.baseURL}/messages?${params}`);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch messages');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }
}

// Usage
const slackAPI = new SlackAPI('/api');

// Get user's channels
slackAPI.getUserChannels('U1234567890')
  .then(data => console.log('Channels:', data.channels))
  .catch(error => console.error('Error:', error));

// Get channel messages
slackAPI.getChannelMessages('C1234567890', { limit: 20 })
  .then(data => console.log('Messages:', data.messages))
  .catch(error => console.error('Error:', error));
```

---

## Error Handling

### Common HTTP Status Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request (missing parameters, invalid input) |
| 401 | Unauthorized (invalid Slack token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found (channel not found) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

### Error Response Format

All error responses follow this format:

```json
{
  "error": "Error description"
}
```

### Recommended Error Handling

```javascript
async function handleSlackAPICall(apiCall) {
  try {
    const response = await apiCall();
    return response;
  } catch (error) {
    // Handle specific error types
    if (error.message.includes('channel_not_found')) {
      console.error('Channel not found or no access');
      // Show user-friendly message
    } else if (error.message.includes('rate_limited')) {
      console.error('Rate limited, please try again later');
      // Implement retry logic
    } else {
      console.error('Unexpected error:', error.message);
      // Show generic error message
    }
    
    throw error;
  }
}
```

---

## Rate Limits

Slack API has rate limits. The server handles most rate limiting internally, but you should implement proper error handling and consider:

- Implementing exponential backoff for failed requests
- Avoiding too many concurrent requests
- Caching responses when appropriate

---

## Best Practices

1. **Always handle errors gracefully** - Show user-friendly error messages
2. **Implement loading states** - Provide feedback during API calls
3. **Use pagination** - Don't try to load all messages at once
4. **Cache responses** - Consider caching channel lists and recent messages
5. **Validate parameters** - Check required parameters before making requests
6. **Handle edge cases** - Empty channels, deleted users, etc.

---

## Testing

You can test the API endpoints using curl:

```bash
# Test channels endpoint
curl "http://localhost:3000/channels?userId=U1234567890"

# Test messages endpoint
curl "http://localhost:3000/messages?channelId=C1234567890&limit=10"

# Test health endpoint
curl "http://localhost:3000/health"
```