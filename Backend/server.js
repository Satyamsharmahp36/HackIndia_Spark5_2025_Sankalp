
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();
const app = express();


app.use(cors());
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/',require('./Routes/OAuthRoutes'));
app.use('/',require('./Routes/MeetingSchedulingRoutes'));
app.use('/',require('./Routes/UserAccessRoutes'));
app.use('/',require('./Routes/UserRoutes'));
app.use('/',require('./Routes/TaskRoutes'));
app.use('/',require('./Routes/PromptNBotRoutes'));

//mongodb connection
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
  socketTimeoutMS: 45000, // Socket timeout after 45 seconds
  connectTimeoutMS: 10000, // Connection timeout after 10 seconds
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  // Attempt to drop problematic indexes
  try {
    await mongoose.connection.db.collection('users').dropIndex('id_1');
    console.log('Successfully dropped the id_1 index');
  } catch (err) {
    console.log('Note about index id_1:', err.message);
  }
  
  // Drop the email uniqueness index
  try {
    await mongoose.connection.db.collection('users').dropIndex('email_1');
    console.log('Successfully dropped the email_1 index');
  } catch (err) {
    console.log('Note about email index:', err.message);
  }
  
}).catch(err => console.error('MongoDB connection error:', err));


//health-check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
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

