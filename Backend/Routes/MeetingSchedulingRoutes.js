const express=require('express');
const router=express.Router();
const dotenv = require('dotenv');
const User = require('../Schema/UserSchema');
const { google } = require('googleapis');  
const mongoose = require('mongoose');
const MeetingData = require('../Schema/MeetingDataSchema');
dotenv.config();

router.post('/schedule-meeting', async (req, res) => {
    const { taskId, username, title, description, startTime, endTime, userEmails } = req.body;
    
    try {
      // Fetch all user details excluding meeting bots
      const users = await User.find({ 
        email: { $in: userEmails },
        plan: { $ne: 'meeting' }  // Exclude meeting bots
      });
      
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
      console.error(`Error scheduling meeting:`, error.message);
      return res.status(500).json({ error: error.message });
    }
  });
  router.post('/update-meeting-info', async (req, res) => {
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
  
  router.get('/meeting-records', async (req, res) => {
    try {
      console.log("here");
      const meetingRecords = await MeetingData.find();
      res.json(meetingRecords);
    } catch (err) {
      console.error('Error fetching meeting records:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
 router.delete('/delete-meeting-record/:taskId', async (req, res) => {
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

  
  module.exports=router;