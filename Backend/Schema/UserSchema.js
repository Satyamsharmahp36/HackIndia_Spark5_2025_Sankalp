const mongoose =require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },  // Removed unique constraint
    userPrompt: { type: String, default: 'You Have to give precise answers to the questions' },
    mobileNo: { type: String, required: true },  // Removed unique constraint
    username: { type: String, required: true, unique: true },  // Username remains unique
    password: { type: String, required: true },
    geminiApiKey: { type: String, required: true },
    plan: { type: String, enum: ['free', 'pro','meeting','chat_slack'], default: 'free' },
    prompt: { type: String, default: '' },
    accessList: { type: [String], default: [] }, 
    groups: [{ 
      groupName: { type: String, required: true },
      users: { type: [String], default: [] }
    }],
    groupsWithAccess: {
      type: [String],
      default: []
    },
    integration: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      platform: { type: String, required: true },
      workspacelink: { type: String, required: true },
      workspaceBackendLink: { type: String, required: true },
      workspaceName: { type: String, required: true },
      userid: { type: String, required: true },
      isOwner: {type:Boolean , required :true},
    }],
    accessRestricted: { type: Boolean, default: false },
    dailyTasks: {
      content: { type: String, default: '' },
      lastUpdated: { type: Date, default: Date.now }
    },
    isChatbot: {
      workspaceLink: { type: String },
      baseLink: { type: String }
    },
    contributions: [{
      name: String,
      question: String,
      answer: String,
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      createdAt: { type: Date, default: Date.now }
    }],
    taskSchedulingEnabled: {
      type: Boolean,
      default: true 
    },
    tasks: [{
      uniqueTaskId: { type: String, required: true }, 
      taskQuestion: { type: String, required: true },
      taskDescription: { type: String, default: 'Task request' },
      status: { type: String, enum: ['pending', 'inprogress', 'completed', 'cancelled'], default: 'inprogress' },
      presentUserData: { type: mongoose.Schema.Types.Mixed },
      topicContext:{type :String},
      isSelfTask: { type: Boolean, default: false },
      isMeeting: {
        title: String,
        description: String,
        date: String,
        time: String,
        duration: String || Number,
        status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'pending'], default: 'pending' },
        meetingLink: {type: String},
        topicContext: {type: String},
        meetingRawData: { type: String, default: '' },
        meetingMinutes: { type: String, default: '' },
        meetingSummary: { type: String, default: '' },
        botActivated: { type: Boolean, default: false },
        giveAccess: { type: [String], default: function() { return [this.parent().parent().username]; } },
        restriction: { type: Boolean, default: false }
      },
      createdAt: { type: Date, default: Date.now }
    }],
    visitors: [{
      username: { type: String, required: true },
      name: { type: String, default: 'Guest' },
      isVerified: { type: Boolean, default: false },
      visitCount: { type: Number, default: 1 },
      lastVisit: { type: Date, default: Date.now },
      firstVisit: { type: Date, default: Date.now }
    }],
    visitorAnalytics: {
      totalVisits: { type: Number, default: 0 },
      uniqueVisitors: { type: Number, default: 0 },
      verifiedVisitors: { type: Number, default: 0 },
      unverifiedVisitors: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now }
    },
    google: {
      id: { type: String },
      accessToken: { type: String },
      refreshToken: { type: String },
      tokenExpiryDate: { type: Date },
    },
    createdAt: { type: Date, default: Date.now }
  });
  
  const User = mongoose.model('User', userSchema);

  module.exports = User;