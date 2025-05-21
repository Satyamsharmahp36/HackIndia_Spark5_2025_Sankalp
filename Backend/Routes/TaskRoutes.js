const express=require('express');
const router=express.Router();
const User = require('../Schema/UserSchema');
const MeetingData = require('../Schema/MeetingDataSchema');

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

//self-task routes
router.post('/create-self-task', async (req, res) => {
    try {
      const {
        username,
        uniqueTaskId,
        taskQuestion,
        taskDescription,
        topicContext,
        isSelfTask,
        status,
        isMeeting,
        meetingRecord
      } = req.body;
  
      if (!username || !uniqueTaskId || !taskQuestion) {
        return res.status(400).json({
          success: false,
          message: 'Required fields missing: username, uniqueTaskId, and taskQuestion are required'
        });
      }
  
      // Find the user by username
      const user = await User.findOne({ username });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
  
      // Create the task object with self-task flag
      const newTask = {
        uniqueTaskId,
        taskQuestion,
        taskDescription: taskDescription || 'Self-created task',
        status: status || 'inprogress',
        topicContext: topicContext || '',
        isSelfTask: true  // Mark this as a self-created task
      };
  
      // If it's a meeting, add meeting details
      if (isMeeting) {
        newTask.isMeeting = {
          title: isMeeting.title,
          description: isMeeting.description || '',
          date: isMeeting.date,
          time: isMeeting.time,
          duration: isMeeting.duration,
          status: isMeeting.status || 'pending',
          meetingLink: isMeeting.meetingLink || '',
          topicContext: isMeeting.topicContext || '',
          meetingRawData: isMeeting.meetingRawData || '',
          botActivated: isMeeting.botActivated || false,
          restriction: isMeeting.restriction || false,
          giveAccess: [username]  // Default access to the creator
        };
      }
  
      // Add the task to user's tasks array
      user.tasks.push(newTask);
      await user.save();
  
      // If it's a meeting with a link, create a MeetingRecord
      if (meetingRecord && meetingRecord.google_meeting_link) {
        const newMeetingRecord = new MeetingData({
          taskId: uniqueTaskId,
          google_meeting_link: meetingRecord.google_meeting_link,
          start_time: meetingRecord.start_time,
          end_time: meetingRecord.end_time,
          duration: meetingRecord.duration,
          username: username
        });
        
        await newMeetingRecord.save();
      }
  
      return res.status(201).json({
        success: true,
        message: 'Task created successfully',
        taskId: uniqueTaskId,
        isMeeting: !!isMeeting
      });
      
    } catch (error) {
      console.error('Error creating self-task:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while creating task',
        error: error.message
      });
    }
  });
  // GET route to fetch all self-tasks for a user
  router.get('/user-tasks/:username', async (req, res) => {
    try {
      const { username } = req.params;
      const { selfTasksOnly } = req.query; // Optional query parameter to filter self-tasks
      
      if (!username) {
        return res.status(400).json({
          success: false,
          message: 'Username is required'
        });
      }
  
      const user = await User.findOne({ username });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
  
      let tasks;
      
      // Filter tasks based on selfTasksOnly parameter
      if (selfTasksOnly === 'true') {
        tasks = user.tasks.filter(task => task.isSelfTask === true);
      } else {
        tasks = user.tasks;
      }
  
      // Return filtered tasks for the user
      return res.status(200).json({
        success: true,
        tasks: tasks
      });
      
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while fetching tasks',
        error: error.message
      });
    }
  });

  //daily task routes
  router.get('/daily-tasks/:username', async (req, res) => {
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
  
  router.post('/update-daily-tasks', async (req, res) => {
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

  //contribution routes
  router.post('/contributions', async (req, res) => {
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
  
  router.get('/contributions/:userId', async (req, res) => {
    try {
      const user = await User.findOne({ username: req.params.userId });
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user.contributions.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      res.status(500).json({ message: "Error fetching contributions", error: error.message });
    }
  });
  
  router.patch('/contributions/:contributionId', async (req, res) => {
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
  
  router.post('/find-task-by-question', async (req, res) => {
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
  
  router.post('/create-task', async (req, res) => {
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
  
  router.get('/tasks/:userId', async (req, res) => {
    try {
      const user = await User.findOne({ username: req.params.userId });
      if (!user) return res.status(404).json({ message: "User not found" });
      
      res.json(user.tasks.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      res.status(500).json({ message: "Error fetching tasks", error: error.message });
    }
  });
  
  router.patch('/tasks', async (req, res) => {
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
  
  router.delete('/tasks/:taskId', async (req, res) => {
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

  router.post('/settaskscheduling', async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({
          success: false,
          message: 'Username is required'
        });
      }
      
      const user = await User.findOne({ username });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      user.taskSchedulingEnabled = !user.taskSchedulingEnabled;
      
      await user.save();
      
      return res.status(200).json({
        success: true,
        message: `Task scheduling ${user.taskSchedulingEnabled ? 'enabled' : 'disabled'} successfully`,
        taskSchedulingEnabled: user.taskSchedulingEnabled
      });
      
    } catch (error) {
      console.error('Error toggling task scheduling:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while updating task scheduling'
      });
    }
  });
  
  router.get('/gettaskscheduling', async (req, res) => {
    try {
      const { username } = req.query;
      
      if (!username) {
        return res.status(400).json({ 
          success: false, 
          message: 'Username is required' 
        });
      }
      
      // Find the user in your database
      const user = await User.findOne({ username });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Return the task scheduling status
      // This assumes the value is stored directly on the user object
      // Adjust according to your actual data structure
      return res.status(200).json({
        success: true,
        taskSchedulingEnabled: !!user.taskSchedulingEnabled
      });
      
    } catch (error) {
      console.error('Error getting task scheduling status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get task scheduling status'
      });
    }
  });

  module.exports=router;