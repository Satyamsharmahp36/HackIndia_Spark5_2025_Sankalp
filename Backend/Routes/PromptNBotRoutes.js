const express=require('express');
const router=express.Router();
const User = require('../Schema/UserSchema');
const ConnectedWorkspace = require('../Schema/ConnectedWorkspaceSchema');
const bcrypt = require('bcryptjs');

//prompt
router.get('/user-prompt/:userId', async (req, res) => {
    try {
      const user = await User.findOne({ username: req.params.userId });
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ userPrompt: user.userPrompt || "" });
    } catch (error) {
      res.status(500).json({ message: "Error fetching user prompt", error: error.message });
    }
  });
  
  router.post('/update-user-prompt', async (req, res) => {
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

  router.get('/prompt/:userId', async (req, res) => {
    try {
      const user = await User.findOne({ username: req.params.userId });
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ prompt: user.prompt || "" });
    } catch (error) {
      res.status(500).json({ message: "Error fetching prompt", error: error.message });
    }
  });
  
  router.post('/update-prompt', async (req, res) => {
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
  
  //bot
  router.post('/register-bot', async (req, res) => {
    try {
      const {
        name,
        email,
        mobileNo,
        username,
        password,
        geminiApiKey,
        plan,
        prompt,
        ownerUsername,
        google
      } = req.body;
  
      // Generate a unique bot username
      const botUsername = `meeting/${username}`;
  
      // Check if username already exists in the User collection
      const existingBot = await User.findOne({ username: botUsername });
      if (existingBot) {
        return res.status(400).json({
          success: false,
          message: 'Bot with this username already exists'
        });
      }
  
      // Validate required fields
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }
  
      // Check if owner username exists in the user collection
      const owner = await User.findOne({ username: ownerUsername });
      if (!owner) {
        return res.status(400).json({
          success: false,
          message: 'Owner user not found'
        });
      }
  
      // Create a new bot user document
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const newBot = new User({
        name: name || 'Meeting Assistant',
        email,
        mobileNo,
        username: botUsername, // Using the meeting/username format
        password: hashedPassword,
        geminiApiKey,
        plan: plan || 'meeting',
        prompt,
        ownerUsername, // Store the owner's username
        isBot: true,   // Flag this as a bot account
        google,
        createdAt: new Date(),
        updatedAt: new Date()
      });
  
      // Save the bot to the database (same User collection)
      await newBot.save();
  
      return res.status(201).json({
        success: true,
        message: 'Bot assistant created successfully',
        botId: newBot._id,
        botUsername: botUsername
      });
    } catch (error) {
      console.error('Error creating bot assistant:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error when creating bot assistant'
      });
    }
  });

  router.post('/update-bot-access', async (req, res) => {
    try {
      const { ownerUsername, taskId, targetUsername, action } = req.body;
      
      if (!ownerUsername || !taskId || !targetUsername || !action) {
        return res.status(400).json({ message: "Missing required parameters" });
      }
      
      const user = await User.findOne({ username: ownerUsername });
      if (!user) return res.status(404).json({ message: "User not found" });
      
      const taskIndex = user.tasks.findIndex(task => task.uniqueTaskId === taskId);
      if (taskIndex === -1) return res.status(404).json({ message: "Task not found" });
      
      // Add or remove username from access list
      if (action === 'add') {
        if (!user.tasks[taskIndex].isMeeting.giveAccess.includes(targetUsername)) {
          user.tasks[taskIndex].isMeeting.giveAccess.push(targetUsername);
        }
      } else if (action === 'remove') {
        user.tasks[taskIndex].isMeeting.giveAccess = 
          user.tasks[taskIndex].isMeeting.giveAccess.filter(username => username !== targetUsername);
      }
      
      await user.save();
      
      res.json({ 
        message: `Access ${action === 'add' ? 'granted to' : 'removed from'} ${targetUsername}`,
        accessList: user.tasks[taskIndex].isMeeting.giveAccess
      });
    } catch (error) {
      res.status(500).json({ message: "Error updating bot access", error: error.message });
    }
  });
  
  // 5. New endpoint to toggle restriction status
  router.post('/toggle-bot-restriction', async (req, res) => {
    try {
      const { ownerUsername, taskId } = req.body;
      
      if (!ownerUsername || !taskId) {
        return res.status(400).json({ message: "Owner username and task ID are required" });
      }
      
      const user = await User.findOne({ username: ownerUsername });
      if (!user) return res.status(404).json({ message: "User not found" });
      
      const taskIndex = user.tasks.findIndex(task => task.uniqueTaskId === taskId);
      if (taskIndex === -1) return res.status(404).json({ message: "Task not found" });
      
      // Toggle restriction status
      user.tasks[taskIndex].isMeeting.restriction = !user.tasks[taskIndex].isMeeting.restriction;
      
      await user.save();
      
      res.json({ 
        message: `Restriction ${user.tasks[taskIndex].isMeeting.restriction ? 'enabled' : 'disabled'}`,
        restriction: user.tasks[taskIndex].isMeeting.restriction
      });
    } catch (error) {
      res.status(500).json({ message: "Error toggling bot restriction", error: error.message });
    }
  });
  

  // Create bot for channel with three-tier checking system
  router.post('/create-channel-bot', async (req, res) => {
    try {
      const { channelId, workspaceLink, ownerId } = req.body;
      
      if (!channelId || !workspaceLink || !ownerId) {
        return res.status(400).json({
          success: false,
          message: 'Channel ID, workspace link, and owner ID are required'
        });
      }
      
      // Check 1: If bot for this channel already exists
      const existingBot = await User.findOne({ 
        username: channelId, 
        plan: 'chat_slack' 
      });
      
      if (existingBot) {
        return res.status(200).json({
          success: true,
          message: 'Bot already exists for this channel',
          botUsername: existingBot.username,
          botId: existingBot._id
        });
      }
      
      // Check 2: Find user with matching integration (userid and workspaceLink)
      let sourceUser = null;
      const users = await User.find({ 
        plan: 'free',
        integration: { $exists: true, $ne: [] }
      });
      
      for (const user of users) {
        const matchingIntegration = user.integration.find(integration => 
          integration.userid === ownerId && 
          integration.workspacelink === workspaceLink
        );
        
        if (matchingIntegration) {
          sourceUser = user;
          break;
        }
      }
      
      if (sourceUser) {
        // Create bot using source user's data
        const newBot = new User({
          name: `Chat Bot - ${channelId}`,
          email: sourceUser.email,
          mobileNo: sourceUser.mobileNo,
          username: channelId,
          password: sourceUser.password, // No hashing as requested
          geminiApiKey: sourceUser.geminiApiKey,
          plan: 'chat_slack',
          prompt: '',
          google: sourceUser.google,
          isChatbot: {
            workspaceLink: workspaceLink,
            baseLink: sourceUser.integration[0].workspaceBackendLink
          },
          isBot: true,
          botActivated: true,
          createdAt: new Date()
        });
        
        await newBot.save();
        
        return res.status(201).json({
          success: true,
          message: 'Bot created successfully using integration data',
          botUsername: newBot.username,
          botId: newBot._id
        });
      }
      
      // Check 3: Check ConnectedWorkspace collection
      const connectedWorkspace = await ConnectedWorkspace.findOne({ 
        workspaceLink: workspaceLink 
      });
      
      if (!connectedWorkspace) {
        return res.status(404).json({
          success: false,
          message: 'Workspace not found in connected workspaces'
        });
      }
      
      // Use the chatMateUsername from ConnectedWorkspace to get user data
      const chatMateUser = await User.findOne({ 
        username: connectedWorkspace.chatMateUsername 
      });
      
      if (!chatMateUser) {
        return res.status(404).json({
          success: false,
          message: 'Chat mate user not found'
        });
      }
      
      // Create bot using chat mate user's data
      const newBot = new User({
        name: `Chat Bot - ${channelId}`,
        email: chatMateUser.email,
        mobileNo: chatMateUser.mobileNo,
        username: channelId,
        password: chatMateUser.password, // No hashing as requested
        geminiApiKey: chatMateUser.geminiApiKey,
        plan: 'chat_slack', 
        prompt: '',
        google: chatMateUser.google,
        isChatbot: {
          workspaceLink: workspaceLink,
          baseLink: chatMateUser.integration[0].workspaceBackendLink
        },
        isBot: true,
        botActivated: true,
        createdAt: new Date()
      });
      
      await newBot.save();
      
      return res.status(201).json({
        success: true,
        message: 'Bot created successfully using connected workspace data',
        botUsername: newBot.username,
        botId: newBot._id
      });
      
    } catch (error) {
      console.error('Error creating channel bot:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error when creating channel bot',
        error: error.message
      });
    }
  });

  module.exports=router;