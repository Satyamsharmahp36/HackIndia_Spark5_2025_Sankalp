const express=require('express');
const router=express.Router();
const User = require('../Schema/UserSchema');

router.post('/access-management',  async (req, res) => {
    const { userId } = req.body;
    try {
      const user = await User.findById(userId).select('accessList groups');
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  
  // Add user to access list
  router.post('/access-management/individual', async (req, res) => {
    try {
      const { username, userId } = req.body;
      
      // Validate required fields
      if (!username || !userId) {
        return res.status(400).json({ msg: 'Username and userId are required' });
      }
  
      // Check if user to add exists
      const userToAdd = await User.findOne({ username });
      if (!userToAdd) {
        return res.status(404).json({ msg: 'User not found' });
      }
  
      // Get current user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ msg: 'Current user not found' });
      }
  
      // Initialize accessList if it doesn't exist
      if (!user.accessList) {
        user.accessList = [];
      }
  
      // Check if user is already in access list
      if (user.accessList.includes(username)) {
        return res.status(400).json({ msg: 'User already in access list' });
      }
  
      // Add user to access list
      user.accessList.push(username);
      await user.save();
  
      res.json(user.accessList);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  
  // Remove user from access list
  router.delete('/access-management/individual/:username', async (req, res) => {
    try {
      const { username } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ msg: 'userId is required' });
      }
      
      // Get current user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      
      // Check if user is in access list
      if (!user.accessList || !user.accessList.includes(username)) {
        return res.status(400).json({ msg: 'User not in access list' });
      }
  
      // Remove user from access list
      user.accessList = user.accessList.filter(name => name !== username);
      await user.save();
  
      res.json(user.accessList);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  
  // Create a new group
  router.post('/access-management/groups', async (req, res) => {
    try {
      const { groupName, userId } = req.body;
      
      if (!userId || !groupName) {
        return res.status(400).json({ msg: 'userId and groupName are required' });
      }
      
      // Get current user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      
      // Initialize groups if it doesn't exist
      if (!user.groups) {
        user.groups = [];
      }
      
      // Check if group already exists
      if (user.groups.some(group => group.groupName === groupName)) {
        return res.status(400).json({ msg: 'Group already exists' });
      }
  
      // Add new group
      user.groups.push({ groupName, users: [] });
      await user.save();
  
      res.json(user.groups);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  
  // Delete a group
  router.delete('/access-management/groups/:groupName', async (req, res) => {
    try {
      const { groupName } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ msg: 'userId is required' });
      }
      
      // Get current user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      
      // Check if group exists
      if (!user.groups || !user.groups.some(group => group.groupName === groupName)) {
        return res.status(404).json({ msg: 'Group not found' });
      }
  
      // Remove group
      user.groups = user.groups.filter(group => group.groupName !== groupName);
      await user.save();
  
      res.json(user.groups);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  
  // Add user to group
  router.post('/access-management/groups/:groupName/users', async (req, res) => {
    try {
      const { groupName } = req.params;
      const { username, userId } = req.body;
      
      if (!userId || !username) {
        return res.status(400).json({ msg: 'userId and username are required' });
      }
      
      // Check if user exists
      const userToAdd = await User.findOne({ username });
      if (!userToAdd) {
        return res.status(404).json({ msg: 'User not found' });
      }
  
      // Get current user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      
      // Find the group
      const groupIndex = user.groups.findIndex(group => group.groupName === groupName);
      if (groupIndex === -1) {
        return res.status(404).json({ msg: 'Group not found' });
      }
  
      // Check if user is already in group
      if (user.groups[groupIndex].users.includes(username)) {
        return res.status(400).json({ msg: 'User already in group' });
      }
  
      // Add user to group
      user.groups[groupIndex].users.push(username);
      await user.save();
  
      res.json(user.groups[groupIndex]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  
  // Remove user from group
  router.delete('/access-management/groups/:groupName/users/:username', async (req, res) => {
    try {
      const { groupName, username } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ msg: 'userId is required' });
      }
      
      // Get current user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      
      // Find the group
      const groupIndex = user.groups.findIndex(group => group.groupName === groupName);
      if (groupIndex === -1) {
        return res.status(404).json({ msg: 'Group not found' });
      }
  
      // Check if user is in group
      if (!user.groups[groupIndex].users.includes(username)) {
        return res.status(400).json({ msg: 'User not in group' });
      }
  
      // Remove user from group
      user.groups[groupIndex].users = user.groups[groupIndex].users.filter(name => name !== username);
      await user.save();
  
      res.json(user.groups[groupIndex]);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  
  // Get users who have granted access to the current user
  router.post('/access-management/granted-access', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ msg: 'userId is required' });
      }
      
      const currentUser = await User.findById(userId).select('username');
      if (!currentUser) {
        return res.status(404).json({ msg: 'User not found' });
      }
      
      // Find all users who have this user in their accessList
      const usersGrantedAccess = await User.find({ 
        accessList: currentUser.username 
      }).select('username name email');
      
      res.json(usersGrantedAccess);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  
  
  //group access
  
  // Get groups with access
  router.post('/access-management/groups-with-access', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ msg: 'userId is required' });
      }
      
      // Get current user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      
      res.json({ groupsWithAccess: user.groupsWithAccess || [] });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  
  // Add group access - grants access to all users in a group
  router.post('/access-management/group-access', async (req, res) => {
    try {
      const { groupName, userId } = req.body;
      
      if (!groupName || !userId) {
        return res.status(400).json({ msg: 'Group name and userId are required' });
      }
      
      // Get current user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      
      // Check if the group exists
      const group = user.groups.find(g => g.groupName === groupName);
      if (!group) {
        return res.status(404).json({ msg: 'Group not found' });
      }
      
      // Check if group already has access
      if (user.groupsWithAccess && user.groupsWithAccess.includes(groupName)) {
        return res.status(400).json({ msg: 'Group already has access' });
      }
      
      // Initialize arrays if they don't exist
      if (!user.accessList) user.accessList = [];
      if (!user.groupsWithAccess) user.groupsWithAccess = [];
      
      // Add group to groups with access
      user.groupsWithAccess.push(groupName);
      
      // Add all users from the group to the access list (avoiding duplicates)
      for (const username of group.users) {
        if (!user.accessList.includes(username)) {
          user.accessList.push(username);
        }
      }
      
      await user.save();
      
      res.json({ 
        accessList: user.accessList, 
        groupsWithAccess: user.groupsWithAccess 
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  
  // Remove group access - removes group from access but doesn't affect individual user access
  router.delete('/access-management/group-access/:groupName', async (req, res) => {
    try {
      const { groupName } = req.params;
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ msg: 'userId is required' });
      }
      
      // Get current user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      
      // Check if group has access
      if (!user.groupsWithAccess || !user.groupsWithAccess.includes(groupName)) {
        return res.status(400).json({ msg: 'Group does not have access' });
      }
      
      // Find the group to get its users
      const group = user.groups.find(g => g.groupName === groupName);
      if (!group) {
        // If group doesn't exist but somehow has access, just remove it from groupsWithAccess
        user.groupsWithAccess = user.groupsWithAccess.filter(g => g !== groupName);
        await user.save();
        return res.json({ 
          accessList: user.accessList, 
          groupsWithAccess: user.groupsWithAccess 
        });
      }
      
      // Remove group from groups with access
      user.groupsWithAccess = user.groupsWithAccess.filter(g => g !== groupName);
      
      // Calculate which users to remove from accessList
      // We need to check if each user is part of any other group with access
      // and only remove if they're not
      for (const username of group.users) {
        // Check if user is part of any other group with access
        let keepUser = false;
        
        for (const otherGroupName of user.groupsWithAccess) {
          const otherGroup = user.groups.find(g => g.groupName === otherGroupName);
          if (otherGroup && otherGroup.users.includes(username)) {
            keepUser = true;
            break;
          }
        }
        
        if (!keepUser) {
          user.accessList = user.accessList.filter(u => u !== username);
        }
      }
      
      await user.save();
      
      res.json({ 
        accessList: user.accessList, 
        groupsWithAccess: user.groupsWithAccess 
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  
  // Update access list when a group member is added or removed
  router.post('/access-management/update-access-from-group', async (req, res) => {
    try {
      const { groupName, userId } = req.body;
      if (!groupName || !userId) {
        return res.status(400).json({ msg: 'Group name and userId are required' });
      }
  
      // Get current user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
  
      // Check if the group exists
      const group = user.groups.find(g => g.groupName === groupName);
      if (!group) {
        return res.status(404).json({ msg: 'Group not found' });
      }
  
      // Check if group has access
      if (!user.groupsWithAccess || !user.groupsWithAccess.includes(groupName)) {
        return res.status(400).json({ msg: 'Group does not have access' });
      }
  
      // Initialize accessList if it doesn't exist
      if (!user.accessList) user.accessList = [];
      
      // Track which users are in the accessList because of groups
      const usersFromGroups = new Set();
      
      // Gather all users who should have access via any group with access
      for (const accessGroupName of user.groupsWithAccess) {
        const accessGroup = user.groups.find(g => g.groupName === accessGroupName);
        if (accessGroup) {
          accessGroup.users.forEach(username => usersFromGroups.add(username));
        }
      }
      
      // Create a new accessList that preserves directly added users
      // and includes all group-based users
      const newAccessList = [];
      
      // First add all users from groups
      usersFromGroups.forEach(username => {
        if (!newAccessList.includes(username)) {
          newAccessList.push(username);
        }
      });
      
      // Then add any direct users that aren't already included
      // This assumes you have a way to track which users were added directly
      // If you don't have this, you'll need to add a separate field to track direct users
      if (user.accessList) {
        user.accessList.forEach(username => {
          if (!newAccessList.includes(username)) {
            newAccessList.push(username);
          }
        });
      }
      
      user.accessList = newAccessList;
      await user.save();
      
      res.json({ accessList: user.accessList });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  
  router.post('/access-management/toggle-restriction', async (req, res) => {
    try {
      const { userId, isRestricted } = req.body;
      
      if (!userId) {
        return res.status(400).json({ success: false, msg: 'User ID is required' });
      }
      
      // Find user and update the restriction setting
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ success: false, msg: 'User not found' });
      }
      
      // Update the access restriction setting
      user.accessRestricted = isRestricted;
      await user.save();
      
      // Return the updated setting
      return res.status(200).json({ 
        success: true, 
        accessRestricted: user.accessRestricted 
      });
      
    } catch (error) {
      console.error('Error toggling access restriction:', error);
      return res.status(500).json({ success: false, msg: 'Server error' });
    }
  });
  
  router.get('/access-management/restriction-status', async (req, res) => {
    try {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ success: false, msg: 'User ID is required' });
      }
      
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ success: false, msg: 'User not found' });
      }
      
      return res.status(200).json({ 
        success: true, 
        accessRestricted: user.accessRestricted 
      });
      
    } catch (error) {
      console.error('Error getting restriction status:', error);
      return res.status(500).json({ success: false, msg: 'Server error' });
    }
  });

  module.exports=router;