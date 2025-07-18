const express=require('express');
const router=express.Router();
const User = require('../Schema/UserSchema');
const bcrypt =require('bcryptjs');

router.post('/register', async (req, res) => {
    try {
      const { 
        name, 
        email, 
        mobileNo, 
        username, 
        password,
        prompt, 
        geminiApiKey,
        google,
        plan
      } = req.body;
      
      // Input validation
      if (!name || !username || !password || !geminiApiKey) {
        return res.status(400).json({ 
          message: "Missing required fields",
          missing: {
            name: !name,
            username: !username, 
            password: !password,
            geminiApiKey: !geminiApiKey
          }
        });
      }
      
      // Check if username already exists (for all users regardless of plan)
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Email verification and uniqueness check only for non-meeting plans
      if (plan !== "meeting") {
        // Email verification required for non-meeting plans
        if (!google || !google.accessToken) {
          return res.status(400).json({ message: "Email verification required" });
        }
        
        // Check if email already exists (only for non-meeting plans)
        const existingEmail = await User.findOne({ 
          email, 
          plan: { $ne: "meeting" } 
        });
        
        if (existingEmail) {
          return res.status(400).json({ message: "Email already registered" });
        }
      }
      // For meeting plans, we skip both email verification and uniqueness checks
      
      // Hash password
      let hashedPassword;
      try {
        const salt = await bcrypt.genSalt(10);
        hashedPassword = await bcrypt.hash(password, salt);
      } catch (hashError) {
        console.error('Password hashing error:', hashError);
        return res.status(500).json({ message: "Error processing password" });
      }
  
      // Prepare Google data safely
      const googleData = google ? {
        accessToken: google.accessToken || null,
        refreshToken: google.refreshToken || null,
        tokenExpiryDate: google.tokenExpiryDate ? new Date(google.tokenExpiryDate) : null
      } : null;
  
      // Create new user
      const newUser = new User({ 
        name, 
        email: email || `meeting-${username}@example.com`, // Fallback for email
        mobileNo: mobileNo || "0000000000", // Fallback for mobile
        username, 
        password,
        geminiApiKey,
        prompt: prompt || '',
        plan: plan || 'free',
        google: googleData
      });
      
      try {
        await newUser.save();
      } catch (saveError) {
        console.error('User save error:', saveError);
        return res.status(500).json({ 
          message: "Error saving user", 
          details: saveError.message 
        });
      }
  
      // If this is a meeting bot, update the task's botActivated status
      if (plan === "meeting") {
        const taskId = username; // For meeting bots, username is set to the task ID
        
        try {
          // Find any user who has this task ID
          const taskOwner = await User.findOne({ 
            "tasks.uniqueTaskId": taskId 
          });
          
          if (taskOwner) {
            await User.findOneAndUpdate(
              { "tasks.uniqueTaskId": taskId },
              { $set: { "tasks.$.isMeeting.botActivated": true } }
            );
          }
        } catch (updateError) {
          console.error('Task update error:', updateError);
          // Continue anyway since the user was created
        }
      }
  
      res.status(201).json({ 
        message: "User registered successfully", 
        userId: newUser._id,
        username: newUser.username
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ 
        message: "Error registering user", 
        error: error.message 
      });
    }
  });

router.post('/login', async (req, res) => {
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
  
  router.post('/verify-password', async (req, res) => {
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


  router.get('/verify-user/:identifier', async (req, res) => {
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
          accessList: user.accessList,
          accessRestricted :user.accessRestricted,
          groups:user.groups,
          groupsWithAccess:user.groupsWithAccess,
          dailyTasks: user.dailyTasks, 
          contributions: user.contributions,
          tasks: user.tasks,
          password: user.password,
          userPrompt:user.userPrompt,
          taskSchedulingEnabled:user.taskSchedulingEnabled,
          visitors:user.visitors,
          visitorAnalytics:user.visitorAnalytics,
          google:user.google
        } 
      });
    } catch (error) {
      res.status(500).json({ message: "Error verifying user", error: error.message });
    }
  });

  router.get('/users/count', async (req, res) => {
    try {
      // Count users excluding those with plan type "meeting"
      const count = await User.countDocuments({ plan: { $ne: "meeting" } });
      res.json({ count });
    } catch (error) {
      console.error('Error counting users:', error);
      res.status(500).json({ 
        message: "Error counting users", 
        error: error.message 
      });
    }
  });

  // Search users for adding to access list or groups
  router.get('/users/search', async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query) {
        return res.status(400).json({ msg: 'Search query is required' });
      }
  
      const users = await User.find({
        username: { $regex: query, $options: 'i' }
      }).select('username name email');
  
      res.json(users);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  

  //visitors-feature

  router.post('/track-visitor', async (req, res) => {
    try {
      const { profileOwnerUsername, visitorUsername, isVerified, visitorName } = req.body;
      
      // Find the profile owner
      const profileOwner = await User.findOne({ username: profileOwnerUsername });
      if (!profileOwner) {
        return res.status(404).json({ message: 'Profile owner not found' });
      }
      
      // Check if visitor already exists
      const existingVisitor = profileOwner.visitors.find(v => v.username === visitorUsername);
      
      if (existingVisitor) {
        // Update existing visitor
        existingVisitor.visitCount += 1;
        existingVisitor.lastVisit = Date.now();
        existingVisitor.isVerified = isVerified; // Update verification status
        if (visitorName) existingVisitor.name = visitorName;
      } else {
        // Add new visitor
        profileOwner.visitors.push({
          username: visitorUsername,
          name: visitorName || 'Guest',
          isVerified: isVerified,
          visitCount: 1,
          lastVisit: Date.now(),
          firstVisit: Date.now()
        });
        
        // Increment unique visitors count
        profileOwner.visitorAnalytics.uniqueVisitors += 1;
        if (isVerified) {
          profileOwner.visitorAnalytics.verifiedVisitors += 1;
        } else {
          profileOwner.visitorAnalytics.unverifiedVisitors += 1;
        }
      }
      
      // Increment total visits
      profileOwner.visitorAnalytics.totalVisits += 1;
      profileOwner.visitorAnalytics.lastUpdated = Date.now();
      
      await profileOwner.save();
      
      return res.status(200).json({ message: 'Visitor tracked successfully' });
    } catch (error) {
      console.error('Error tracking visitor:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get visitors data
  router.get('/visitors/:username', async (req, res) => {
    try {
      const { username } = req.params;
      
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      return res.status(200).json({
        visitors: user.visitors,
        analytics: user.visitorAnalytics
      });
    } catch (error) {
      console.error('Error fetching visitors:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Check if user exists by username and if workspace is integrated (POST, body: { username, workspaceName })
  router.post('/exists', async (req, res) => {
    try {
      const { username, workspaceLink } = req.body;
      if (!username) {
        return res.status(400).json({ message: 'username is required' });
      }
      const user = await User.findOne({ username });
      if (!user) {
        return res.json({ exists: false });
      }
      if (!workspaceLink) {
        // If no workspaceName provided, just return user existence
        return res.json({ exists: true });
      }
      // Check if the workspace is already integrated
      const alreadyIntegrated = user.integration.some(
        (integration) => integration.workspacelink === workspaceLink
      );
      if (alreadyIntegrated) {
        return res. json({ exists: true, alreadyIntegrated: true, message: 'already there' });
      } else {
        return res.json({ exists: true, alreadyIntegrated: false, message: 'workspace to be registered',email:user.email });
      }
    } catch (error) {
      return res.status(500).json({ message: "Server error", error: error.message });
    }
  });

  // Add integration after verifying password
  router.post('/add-integration', async (req, res) => {
    try {
      const { username, platform, workspacelink, workspaceName, userid } = req.body;
      if (!username || !platform || !workspacelink || !workspaceName || !userid) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      // if (user.password !== password) {
      //   return res.status(401).json({ success: false, message: 'Password invalid or incorrect' });
      // }
      // Check if this integration already exists (by workspacelink)
      const alreadyIntegrated = user.integration.some(
        (integration) => integration.workspacelink === workspacelink
      );
      if (alreadyIntegrated) {
        return res.status(409).json({ success: false, message: 'Integration already exists for this workspace' });
      }
      // Add the integration
      user.integration.push({ platform, workspacelink, workspaceName, userid });
      await user.save();
      return res.status(200).json({ success: true, message: 'Integration added successfully', integration: user.integration });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  });

  
  module.exports=router;