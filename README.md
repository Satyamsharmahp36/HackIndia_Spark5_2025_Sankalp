# ChatMATE - Your Personalized AI Assistant

## 🚀 Introduction

Welcome to **ChatMATE**, our submission for **HackIndia 2025** — a personalized AI assistant that acts as your digital twin when you're unavailable. Whether you're a busy professional, a college student, or someone who needs a virtual presence, ChatMATE has got you covered!

## 🎯 Problem We're Solving

In today's fast-paced world, people often struggle to manage multiple tasks simultaneously. Professionals miss meetings, students forget important deadlines, and important information gets lost in the shuffle. ChatMATE addresses this by creating a personalized AI assistant that represents you, handles queries, manages your schedule, and even joins meetings on your behalf.

## 💡 What is ChatMATE?

ChatMATE is a comprehensive AI-powered assistant built using Retrieval-Augmented Generation (RAG) that:

- **Acts as your digital twin** - Answers questions based on data you've fed into it
- **Manages your schedule** - Sets up meetings and sends reminders
- **Attends meetings for you** - Records, transcribes, and summarizes meetings
- **Multilingual support** - Communicates in multiple languages
- **Context-aware** - Understands your preferences, schedule, and responsibilities

## 🤖 Core Features

### 1. Personalized AI Training
Feed ChatMATE with your personal data, professional information, or academic details to create a virtual representation of yourself.

### 2. Meeting Management
Schedule, record, transcribe, and summarize meetings with intelligent follow-up capabilities.

### 3. Task & Reminder System
Never miss a deadline or important event with smart, context-aware reminders.

### 4. Contextual Question Answering
Visitors can ask your AI about you, your work, availability, and more.

## 💬 Sample Interactions

Here are some examples of how you can interact with ChatMATE:

### Scheduling Meetings
```
User: "Schedule a meeting with Sarah about the marketing proposal at 2 PM today"
ChatMATE: "I've scheduled a meeting with Sarah at 2 PM today about the marketing proposal. The Google Calendar invite has been sent to both of you."
```

### Training Your Assistant
```
User: "Save this information: I'm working on Project Phoenix which is due on May 15th"
ChatMATE: "Information saved. I now know you're working on Project Phoenix with a May 15th deadline."

User: "Add to my profile that I prefer morning meetings between 9-11 AM"
ChatMATE: "Added to your profile. I'll prioritize scheduling meetings between 9-11 AM when possible."
```

### For Visitors Interacting with Your Assistant
```
Visitor: "What projects is [Your Name] currently working on?"
ChatMATE: "[Your Name] is currently working on Project Phoenix, which has a deadline of May 15th."

Visitor: "When is [Your Name] available for a meeting this week?"
ChatMATE: "[Your Name] prefers morning meetings between 9-11 AM. They have availability on Tuesday and Thursday mornings this week."
```

### Meeting Companion Features
```
User: "Summarize my meeting with the design team from yesterday"
ChatMATE: "In your meeting with the design team yesterday, you discussed the new UI mockups. Action items include: 1) Sarah to refine the homepage design by Friday, 2) You to provide feedback on color schemes by Wednesday, 3) Next review scheduled for Monday at 10 AM."
```

### College/Academic Use Case
```
User: "What are my upcoming assignment deadlines?"
ChatMATE: "You have a Data Structures assignment due tomorrow at midnight and a Physics lab report due on Friday at 5 PM."

User: "Remind me about important topics from yesterday's Machine Learning lecture"
ChatMATE: "From yesterday's Machine Learning lecture, the important topics were: Gradient Descent optimization, Overfitting prevention techniques, and Cross-validation methods."
```

## 🛠️ Technical Stack

- **Frontend**: React + TailwindCSS + Shadcn/UI
- **Backend**: Flask/FastAPI with LangChain
- **AI Models**: Whisper (for transcription), GPT/Claude (for conversation)
- **Vector Database**: Pinecone/Chroma for RAG implementation
- **Meeting Integration**: Zoom/Google Meet APIs
- **Calendar Integration**: Google Calendar/Outlook APIs
- **Persistent Storage**: MongoDB/PostgreSQL

## 📋 Flow Architecture

1. **User Registration & Profile Creation**
   - Create account
   - Define use case (Professional/Student/Custom)
   - Configure preferences
   
2. **Data Ingestion & Training**
   - Upload personal information
   - Connect calendars
   - Add projects/courses/responsibilities
   - All data securely embedded and stored
   
3. **Assistant Deployment**
   - Unique URL for visitors to interact with your assistant
   - Integration with calendar and communication tools
   
4. **Meeting Companion Bot**
   - Joins meetings 5 minutes before start time
   - Records video and audio
   - Transcribes conversations using Whisper
   - Generates summaries using LangChain
   - Extracts action items and key points
   
5. **Intelligent Reminders**
   - Context-aware notifications
   - Deadline alerts
   - Meeting preparations

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB/PostgreSQL
- API keys for LLM services

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/chatmate.git
cd chatmate

# Backend setup
cd backend
pip install -r requirements.txt
python app.py

# Frontend setup
cd ../frontend
npm install
npm start
```

## 🔒 Privacy & Security

ChatMATE takes your privacy seriously:
- All data is encrypted at rest and in transit
- Fine-grained control over what information your assistant can share
- Option to set expiration dates for sensitive information
- Clear data deletion policies

## 👥 About Us

We are a team of three passionate developers from [Your University]:
- Anshul Kashyap
- Satyam Sharma
- Swasti Mohanty

We're excited to bring ChatMATE to HackIndia 2025 and revolutionize how people manage their digital presence!

## 📄 License

MIT License - Feel free to use, modify, and distribute as per the license terms.
