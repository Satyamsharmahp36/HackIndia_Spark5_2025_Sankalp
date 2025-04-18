
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const { google } = require('googleapis');
const crypto = require('crypto');
const MeetingData = require('./Schema/MeetingDataSchema');

const verificationSessions = new Map();

const { OAuth2Client } = require('google-auth-library');
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const CLIENT_URL=process.env.CLIENT_URL;

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
  socketTimeoutMS: 45000, // Socket timeout after 45 seconds
  connectTimeoutMS: 10000, // Connection timeout after 10 seconds
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  // Attempt to drop the problematic index
  try {
    await mongoose.connection.db.collection('meetingdatas').dropIndex('id_1');
    console.log('Successfully dropped the id_1 index');
  } catch (err) {
    console.log('Note about index:', err.message);
  }
}).catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  userPrompt: { type: String, default: 'You Have to give precise answers to the questions' },
  mobileNo: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  geminiApiKey: { type: String, required: true },
  plan: { type: String, enum: ['free', 'pro'], default: 'free' },
  prompt: { type: String, default: '' },
  dailyTasks: {
    content: { type: String, default: '' },
    lastUpdated: { type: Date, default: Date.now }
  },
  contributions: [{
    name: String,
    question: String,
    answer: String,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],
  tasks: [{
    uniqueTaskId: { type: String, required: true }, 
    taskQuestion: { type: String, required: true },
    taskDescription: { type: String, default: 'Task request' },
    status: { type: String, enum: ['pending', 'inprogress', 'completed', 'cancelled'], default: 'inprogress' },
    presentUserData: { type: mongoose.Schema.Types.Mixed },
    topicContext:{type :String},
    isMeeting: {
      title: String,
      description: String,
      date: String,
      time: String,
      duration: String || Number,
      status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'pending'], default: 'pending' },
      meetingLink:{type:String },
      topicContext:{type :String},
      meetingRawData: { type: String, default: '' },
      meetingMinutes: { type: String, default: '' },
      meetingSummary: { type: String, default: '' }
    },
    createdAt: { type: Date, default: Date.now }
  }],
  google: {
    id: { type: String },
    accessToken: { type: String },
    refreshToken: { type: String },
    tokenExpiryDate: { type: Date },
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);



function generateUniqueTaskId() {
  const now = new Date();
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0'); 
  const year = now.getFullYear();
  
  return `${seconds}${minutes}${hours}${day}${month}${year}`;
}

app.get('/user/verify-email', (req, res) => {
  const sessionId = crypto.randomBytes(16).toString('hex');
  
  // Store session ID for verification callback
  verificationSessions.set(sessionId, { timestamp: Date.now() });
  
  // Generate OAuth URL with state containing session ID
  const state = sessionId;
  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile', 'https://www.googleapis.com/auth/calendar'],
    prompt: 'consent',
    state
  });
  
  res.redirect(url);
});

app.get('/user/google/callback', async (req, res) => {
  const { code, state } = req.query;
  
  // Validate state to prevent CSRF
  if (!verificationSessions.has(state)) {
    return res.send(`
      <script>
        window.opener.postMessage(${JSON.stringify({
          success: false,
          message: "Invalid verification session"
        })}, "*");
        window.close();
      </script>
    `);
  }
  
  try {
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Get user info from Google
    const { data: googleUser } = await axios.get(
      `https://www.googleapis.com/oauth2/v2/userinfo`,
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      }
    );
    
    // Clean up verification session
    verificationSessions.delete(state);
    
    // Send verified user data back to client
    return res.send(`
      <script>
        window.opener.postMessage(${JSON.stringify({
          success: true,
          userData: {
            email: googleUser.email,
            googleId: googleUser.id,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            tokenExpiryDate: tokens.expiry_date || (Date.now() + tokens.expires_in * 1000)
          },
          message: 'Email verification successful'
        })}, "*");
        window.close();
      </script>
    `);
  } catch (error) {
    console.error('Google OAuth Error:', error);
    
    // Clean up verification session
    verificationSessions.delete(state);
    
    return res.send(`
      <script>
        window.opener.postMessage(${JSON.stringify({
          success: false,
          message: 'Email verification failed: ' + error.message
        })}, "*");
        window.close();
      </script>
    `);
  }
});

app.get('/user-prompt/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.userId });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ userPrompt: user.userPrompt || "" });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user prompt", error: error.message });
  }
});

app.post('/update-user-prompt', async (req, res) => {
  try {
    const { content, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findOne({ username: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.userPrompt = content;
    await user.save();

    res.json({ message: "User prompt updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating user prompt", error: error.message });
  }
});

app.post('/register', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      mobileNo, 
      username, 
      password, 
      geminiApiKey,
      google 
    } = req.body;
    
    // Check if Google info is provided
    if (!google || !google.accessToken) {
      return res.status(400).json({ message: "Email verification required" });
    }
    
    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: "Username already exists" });
    }
    
    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with Google info
    const newUser = new User({ 
      name, 
      email, 
      mobileNo, 
      username, 
      password: hashedPassword, 
      geminiApiKey,
      google: {
        id: google.googleId,
        accessToken: google.accessToken,
        refreshToken: google.refreshToken,
        tokenExpiryDate: google.tokenExpiryDate ? new Date(google.tokenExpiryDate) : null
      }
    });
    
    await newUser.save();

    res.status(201).json({ 
      message: "User registered successfully", 
      userId: newUser._id,
      username: newUser.username
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: "Error registering user", error: error.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: "Invalid username or password" });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid username or password" });
    
    res.json({ message: "Login successful", userId: user._id, plan: user.plan });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

app.post('/verify-password', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    
    let isMatch = false;

    if(password==user.password){
      isMatch= true;
    }
    
    if (isMatch) {
      return res.status(200).json({ verified: true });
    } else {
      return res.status(400).json({ verified: false, message: "Incorrect password" });
    }
  } catch (error) {
    console.error('Error verifying password:', error);
    res.status(500).json({ message: "Error verifying password", error: error.message });
  }
});

app.get('/prompt/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.userId });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ prompt: user.prompt || "" });
  } catch (error) {
    res.status(500).json({ message: "Error fetching prompt", error: error.message });
  }
});

app.post('/update-prompt', async (req, res) => {
  try {
    const { content, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const user = await User.findOne({ username: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.prompt = content;
    await user.save();

    res.json({ message: "Prompt updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating prompt", error: error.message });
  }
});

app.get('/daily-tasks/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json({ 
      content: user.dailyTasks.content || "",
      lastUpdated: user.dailyTasks.lastUpdated 
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching daily tasks", error: error.message });
  }
});

app.post('/update-daily-tasks', async (req, res) => {
  try {
    const { content, username } = req.body;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.dailyTasks = {
      content,
      lastUpdated: new Date()
    };
    
    await user.save();

    res.json({ 
      message: "Daily tasks updated successfully",
      dailyTasks: user.dailyTasks
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating daily tasks", error: error.message });
  }
});

app.post('/contributions', async (req, res) => {
  try {
    const { name, question, answer, username } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });
    const contribution = { name, question, answer, status: 'pending', createdAt: new Date() };
    user.contributions.push(contribution);
    await user.save();
    res.status(201).json({ message: "Contribution submitted successfully", contribution });
  } catch (error) {
    res.status(500).json({ message: "Error submitting contribution", error: error.message });
  }
});

app.get('/contributions/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.userId });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.contributions.sort((a, b) => b.createdAt - a.createdAt));
  } catch (error) {
    res.status(500).json({ message: "Error fetching contributions", error: error.message });
  }
});

app.patch('/contributions/:contributionId', async (req, res) => {
  try {
    const { status, username } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const contribution = user.contributions.id(req.params.contributionId);
    if (!contribution) return res.status(404).json({ message: "Contribution not found" });

    contribution.status = status;
    await user.save();
    res.json({ message: "Contribution status updated successfully", contribution });
  } catch (error) {
    res.status(500).json({ message: "Error updating contribution status", error: error.message });
  }
});

app.post('/find-task-by-question', async (req, res) => {
  try {
    const { userId, taskQuestion, uniqueTaskId } = req.body;
    
    if (!userId || (!taskQuestion && !uniqueTaskId)) {
      return res.status(400).json({ message: "User ID and either task question or uniqueTaskId are required" });
    }
    
    const user = await User.findOne({ username: userId });
    if (!user) return res.status(404).json({ message: "User not found" });
        let task;
    if (uniqueTaskId) {
      task = user.tasks.find(task => task.uniqueTaskId === uniqueTaskId);
    } else {
      task = user.tasks.find(task => task.taskQuestion === taskQuestion);
    }
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    res.json({ 
      message: "Task found", 
      task 
    });
  } catch (error) {
    res.status(500).json({ message: "Error finding task", error: error.message });
  }
});

app.post('/create-task', async (req, res) => {
  try {
    const { 
      userId, 
      taskQuestion, 
      taskDescription, 
      status, 
      presentUserData, 
      uniqueTaskId,
      isMeeting,
      topicContext
    } = req.body;
    
    if (!userId || !taskQuestion) {
      return res.status(400).json({ message: "User ID and task question are required" });
    }

    const user = await User.findOne({ username: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const taskId = uniqueTaskId || generateUniqueTaskId();
    
    const newTask = {
      uniqueTaskId: taskId,
      taskQuestion,
      taskDescription: taskDescription || 'Task request',
      status: status || 'inprogress',
      presentUserData,
      topicContext,
      createdAt: new Date()
    };
    
    if (isMeeting) {
      newTask.isMeeting = {
        title: isMeeting.title || topicContext || "Meeting",
        description: isMeeting.description || taskDescription,
        date: isMeeting.date,
        time: isMeeting.time, 
        duration: isMeeting.duration,
        status: 'pending'
      };
    }
    
    user.tasks.push(newTask);
    await user.save();
    
    res.status(201).json({ 
      message: "Task created successfully", 
      task: {
        id: user.tasks[user.tasks.length - 1]._id,
        uniqueTaskId: taskId,
        ...newTask
      } 
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: "Error creating task", error: error.message });
  }
});

app.get('/tasks/:userId', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.userId });
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.json(user.tasks.sort((a, b) => b.createdAt - a.createdAt));
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks", error: error.message });
  }
});

app.patch('/tasks', async (req, res) => {
  try {
    const { status, userId, uniqueTaskId } = req.body;
    
    if (!status || !userId) {
      return res.status(400).json({ message: "Task status and User ID are required" });
    }
    
    const user = await User.findOne({ username: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    let taskIndex = -1;
    
    if (uniqueTaskId) {
      taskIndex = user.tasks.findIndex(task => task.uniqueTaskId === uniqueTaskId);
    }
    
    if (taskIndex === -1) {
      const taskId = req.params.taskId;
      taskIndex = user.tasks.findIndex(task => task._id.toString() === taskId);
    }
    
    if (taskIndex === -1) {
      const taskFromRequest = req.body.taskQuestion;
      if (taskFromRequest) {
        taskIndex = user.tasks.findIndex(task => task.taskQuestion === taskFromRequest);
      }
    }
    
    if (taskIndex === -1) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    user.tasks[taskIndex].status = status;
    await user.save();
    
    res.json({ 
      message: "Task status updated successfully", 
      task: user.tasks[taskIndex] 
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ message: "Error updating task status", error: error.message });
  }
});

app.delete('/tasks/:taskId', async (req, res) => {
  try {
    const { userId, uniqueTaskId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    
    const user = await User.findOne({ username: userId });
    if (!user) return res.status(404).json({ message: "User not found" });

    let taskIndex = -1;
    
    if (uniqueTaskId) {
      taskIndex = user.tasks.findIndex(task => task.uniqueTaskId === uniqueTaskId);
    }
    
    if (taskIndex === -1) {
      taskIndex = user.tasks.findIndex(task => task._id.toString() === req.params.taskId);
    }
    
    if (taskIndex === -1) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    user.tasks.splice(taskIndex, 1);
    await user.save();
    
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting task", error: error.message });
  }
});

app.get('/verify-user/:identifier', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.identifier });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ 
      user: { 
        _id: user._id, 
        name: user.name, 
        username: user.username,
        email: user.email,
        mobileNo: user.mobileNo,
        geminiApiKey: user.geminiApiKey, 
        plan: user.plan, 
        prompt: user.prompt,
        dailyTasks: user.dailyTasks, 
        contributions: user.contributions,
        tasks: user.tasks,
        password: user.password,
        userPrompt:user.userPrompt
      } 
    });
  } catch (error) {
    res.status(500).json({ message: "Error verifying user", error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/users/count', async (req, res) => {
  try {
    const count = await User.countDocuments();
        res.json({ count });
  } catch (error) {
    console.error('Error counting users:', error);
    res.status(500).json({ 
      message: "Error counting users", 
      error: error.message 
    });
  }
});

// app.post('/schedule-meeting', async (req, res) => {
//   const { taskId,username,title, description, startTime, endTime, userEmails } = req.body;
//   console.log(taskId);


//   // Fetch all user details
//   const users = await User.find({ email: { $in: userEmails } });

//   // Identify the organizer (first email)
//   const organizerEmail = userEmails[0];
  
//   const organizer = users.find(u => u.email === organizerEmail && u.google && u.google.refreshToken);

//   if (!organizer) {
//     return res.status(400).json({ error: 'Organizer has not linked Google Calendar.' });
//   }

//   const oAuth2Client = new google.auth.OAuth2(
//     process.env.GOOGLE_CLIENT_ID,
//     process.env.GOOGLE_CLIENT_SECRET,
//     process.env.GOOGLE_REDIRECT_URI
//   );

//   oAuth2Client.setCredentials({
//     refresh_token: organizer.google.refreshToken
//   });

//   try {
//     const { credentials } = await oAuth2Client.refreshAccessToken();
//     oAuth2Client.setCredentials(credentials);

//     const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

//     const event = {
//       summary: title,
//       description,
//       start: {
//         dateTime: new Date(startTime).toISOString(),
//         timeZone: 'Asia/Kolkata',
//       },
//       end: {
//         dateTime: new Date(endTime).toISOString(),
//         timeZone: 'Asia/Kolkata',
//       },
//       attendees: users.map(u => ({ email: u.email })),
//       conferenceData: {
//         createRequest: {
//           requestId: `meet-${Date.now()}`,
//           conferenceSolutionKey: { type: 'hangoutsMeet' },
//         }
//       },
//     };

//     const response = await calendar.events.insert({
//       calendarId: 'primary',
//       resource: event,
//       sendUpdates: 'all',
//       conferenceDataVersion: 1,
//     });

//     // Calculate duration
//     const start = new Date(startTime);
//     const end = new Date(endTime);
//     const durationMs = end - start;
//     const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
//     const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
//     const duration = durationHours > 0 ? 
//         `${durationHours}h${durationMinutes > 0 ? ` ${durationMinutes}m` : ''}` : 
//         `${durationMinutes}m`;
    
//     // Create new meeting document
//     const newMeeting = new MeetingData({
//         google_meeting_link: response.data.hangoutLink,
//         start_time: startTime,
//         end_time: endTime,
//         duration,
//         username
//     });
    
//     // Save meeting to database
//     await newMeeting.save();

//     return res.json({
//       success: true,
//       organizer: organizer.email,
//       meetLink: response.data.hangoutLink,
//       eventLink: response.data.htmlLink,
//       meeting: newMeeting
//     });

//   } catch (error) {
//     console.error(`Error scheduling meeting:`, error.message);
//     return res.status(500).json({ error: error.message });
//   }
// });
app.post('/schedule-meeting', async (req, res) => {
  const { taskId, username, title, description, startTime, endTime, userEmails } = req.body;
  
  try {
    // Fetch all user details
    const users = await User.find({ email: { $in: userEmails } });
    
    // Identify the organizer (first email)
    const organizerEmail = userEmails[0];
    const organizer = users.find(u => u.email === organizerEmail && u.google && u.google.refreshToken);
    
    if (!organizer) {
      return res.status(400).json({ error: 'Organizer has not linked Google Calendar.' });
    }
    
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    oAuth2Client.setCredentials({
      refresh_token: organizer.google.refreshToken
    });
    
    const { credentials } = await oAuth2Client.refreshAccessToken();
    oAuth2Client.setCredentials(credentials);
    
    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
    
    const event = {
      summary: title,
      description,
      start: {
        dateTime: new Date(startTime).toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      end: {
        dateTime: new Date(endTime).toISOString(),
        timeZone: 'Asia/Kolkata',
      },
      attendees: users.map(u => ({ email: u.email })),
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        }
      },
    };
    
    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all',
      conferenceDataVersion: 1,
    });
    
    // Calculate duration
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end - start;
    const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
    const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const duration = durationHours > 0 ? 
      `${durationHours}h${durationMinutes > 0 ? ` ${durationMinutes}m` : ''}` : 
      `${durationMinutes}m`;
    
    // Generate a unique ID explicitly
    const uniqueId = new mongoose.Types.ObjectId().toString();
    
    // Create new meeting document with explicit id
    const newMeeting = new MeetingData({
      id: uniqueId, // Set the id explicitly
      taskId: taskId,
      google_meeting_link: response.data.hangoutLink,
      start_time: startTime,
      end_time: endTime,
      duration,
      username
    });
    
    // Save meeting to database
    const savedMeeting = await newMeeting.save();
    
    // Update the user's task with the meeting status
    const updateResult = await User.findOneAndUpdate(
      { 
        username: username,
        "tasks.uniqueTaskId": taskId 
      },
      { 
        $set: { 
          "tasks.$.isMeeting.status": "scheduled",
          "tasks.$.isMeeting.title": title,
          "tasks.$.isMeeting.description": description,
          "tasks.$.isMeeting.meetingLink" :response.data.hangoutLink,
          "tasks.$.isMeeting.date": new Date(startTime).toISOString().split('T')[0],
          "tasks.$.isMeeting.time": new Date(startTime).toTimeString().split(' ')[0],
          "tasks.$.isMeeting.duration": duration
        } 
      },
      { new: true }
    );
    
    if (!updateResult) {
      console.warn(`User or task not found: username=${username}, taskId=${taskId}`);
    }
    
    return res.json({
      success: true,
      organizer: organizer.email,
      meetLink: response.data.hangoutLink,
      eventLink: response.data.htmlLink,
      meeting: savedMeeting,
      userTaskUpdated: !!updateResult
    });
    
  } catch (error) {
    console.error(`Error scheduling meeting:`, error);
    return res.status(500).json({ error: error.message });
  }
});
app.post('/update-meeting-info', async (req, res) => {
  try {
    const { username, task_id, raw_transcript, adjusted_transcript, meeting_minutes_and_tasks } = req.body;
    
    // Validate required fields
    if (!username || !task_id) {
      return res.status(400).json({ error: 'Username and task_id are required' });
    }
    
    // Find the user by username and update the specific task
    const updatedUser = await User.findOneAndUpdate(
      { 
        username: username, 
        "tasks.uniqueTaskId": task_id 
      },
      { 
        $set: { 
          "tasks.$.isMeeting.status": "completed",
          "tasks.$.isMeeting.meetingRawData": raw_transcript,
          "tasks.$.isMeeting.meetingMinutes": meeting_minutes_and_tasks,
          "tasks.$.isMeeting.meetingSummary": adjusted_transcript
        } 
      },
      { new: true } // Return the updated document
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User or task not found' });
    }
    
    // Find the specific task that was updated
    const updatedTask = updatedUser.tasks.find(task => task.uniqueTaskId === task_id);
    
    res.status(200).json({ 
      message: 'Meeting information updated successfully',
      updatedTask
    });
    
  } catch (error) {
    console.error('Error updating meeting info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/meeting-records', async (req, res) => {
  try {
    const meetingRecords = await MeetingData.find();
    res.json(meetingRecords);
  } catch (err) {
    console.error('Error fetching meeting records:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/delete-meeting-record/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Find and delete the record with the given taskId
    const deletedRecord = await MeetingData.findOneAndDelete({ taskId });
    
    if (!deletedRecord) {
      return res.status(404).json({ message: 'Meeting record not found with this taskId' });
    }
    
    res.json({ 
      message: 'Meeting record deleted successfully',
      deletedRecord
    });
  } catch (err) {
    console.error('Error deleting meeting record:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});
// const PING_SERVICE_URL = process.env.PING_SERVICE_URL;

// const pingSecondaryService = async () => {
//   try {
//     const response = await axios.get(PING_SERVICE_URL);
//     console.log(`Pinged secondary service at ${new Date().toISOString()} - Response: ${response.status}`);
//   } catch (error) {
//     console.error(`Error pinging secondary service: ${error.message}`);
//   }
// };

app.listen(5000, () => {
  console.log('Server running on port 5000');
  
  // setInterval(pingSecondaryService, 10 * 60 * 1000);
});

