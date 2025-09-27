import React, {useState} from 'react'

const AccessControlPopup = ({ isOpen, onClose, taskId, userId, accessList, onSave }) => {
    const [emails, setEmails] = useState([...accessList]);
    const [newEmail, setNewEmail] = useState('');
    
    const handleAddEmail = () => {
      if (newEmail && !emails.includes(newEmail)) {
        setEmails([...emails, newEmail]);
        setNewEmail('');
      }
    };
    
    const handleRemoveEmail = (emailToRemove) => {
      setEmails(emails.filter(email => email !== emailToRemove));
    };
    
    const handleSave = async () => {
      try {
        // Loop through changes
        for (const email of accessList) {
          if (!emails.includes(email)) {
            // Need to remove this email
            await axios.post(`${import.meta.env.VITE_BACKEND}/update-bot-access`, {
              ownerUsername: userId,
              taskId: taskId,
              targetUsername: email,
              action: 'remove'
            });
          }
        }
        
        for (const email of emails) {
          if (!accessList.includes(email)) {
            // Need to add this email
            await axios.post(`${import.meta.env.VITE_BACKEND}/update-bot-access`, {
              ownerUsername: userId,
              taskId: taskId,
              targetUsername: email,
              action: 'add'
            });
          }
        }
        
        onSave(emails);
        toast.success('Access list updated successfully');
      } catch (error) {
        console.error("Error updating access list:", error);
        toast.error("Failed to update access list");
      }
    };
    
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md">
          <h3 className="text-xl font-semibold text-white mb-4">Manage Access Control</h3>
          <p className="text-gray-300 text-sm mb-4">Add email addresses to allow access to this meeting bot.</p>
          
          <div className="flex items-center gap-2 mb-4">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white"
              placeholder="Enter email address"
            />
            <button
              onClick={handleAddEmail}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg"
            >
              Add
            </button>
          </div>
          
          <div className="max-h-60 overflow-y-auto mb-4 border border-gray-700 rounded-lg p-2">
            {emails.length > 0 ? (
              <ul className="space-y-2">
                {emails.map((email, index) => (
                  <li key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                    <span className="text-white text-sm">{email}</span>
                    <button
                      onClick={() => handleRemoveEmail(email)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-center py-4">No access emails added yet</p>
            )}
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // This function should be added to the AdminPanel component
  const toggleBotRestriction = async (task) => {
    try {
      setLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_BACKEND}/toggle-bot-restriction`, {
        ownerUsername: userData.user.username,
        taskId: task.uniqueTaskId
      });
      
      if (response.data) {
        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.uniqueTaskId === task.uniqueTaskId 
              ? {
                  ...t,
                  isMeeting: {
                    ...t.isMeeting,
                    restriction: response.data.restriction
                  }
                } 
              : t
          )
        );
        
        toast.success(`Access restriction ${response.data.restriction ? 'enabled' : 'disabled'}`);
      }
    } catch (error) {
      console.error("Error toggling bot restriction:", error);
      toast.error("Failed to toggle access restriction");
    } finally {
      setLoading(false);
    }
  };
  
  // This is the updated meeting controls section to be added to your meeting rendering code
  // Replace the existing meeting buttons code with this
  const renderMeetingControls = (task) => {
    // For meetings without a bot yet
    if (task.isMeeting.status === 'pending') {
      return (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleScheduleMeeting(task)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
        >
          <Calendar className="w-4 h-4" />
          Schedule
        </motion.button>
      );
    }
    
    // For scheduled meetings with a link
    if (task.isMeeting.status === 'scheduled' && task.isMeeting.meetingLink) {
      return (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleOpenMeetingLink(task.isMeeting.meetingLink)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
        >
          <Link className="w-4 h-4" />
          Meeting Link
        </motion.button>
      );
    }
    
    // For completed meetings with or without a bot
    if (task.isMeeting.status === 'completed') {
      return (
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleViewMeetingDetails(task.isMeeting)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
          >
            <FileText className="w-4 h-4" />
            View Details
          </motion.button>
          
          {task.isMeeting.botActivated ? (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => window.open(`${import.meta.env.VITE_FRONTEND}/home/${task.uniqueTaskId}`, '_blank')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
              >
                <Bot className="w-4 h-4" />
                AI Bot
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedTask(task);
                  setShowAccessPopup(true);
                }}
                className={`bg-${task.isMeeting.restriction ? 'red' : 'blue'}-600 hover:bg-${task.isMeeting.restriction ? 'red' : 'blue'}-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1`}
              >
                <UserIcon className="w-4 h-4" />
                {task.isMeeting.restriction ? 'Restricted' : 'Open Access'}
              </motion.button>
            </>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleCreateBotAssistant(task)}
              disabled={creatingBot}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1"
            >
              <Bot className="w-4 h-4" />
              {creatingBot ? 'Creating...' : 'Assist Bot'}
            </motion.button>
          )}
        </div>
      );
    }
    
    return null;
  };
  
  // The modified handleCreateBotAssistant function with botActivated flag update
  const handleCreateBotAssistant = async (task) => {
    try {
      if (!task.isMeeting) {
        toast.error("Meeting data not available");
        return;
      }
      
      setCreatingBot(true);
      toast.info("Creating bot assistant for meeting...");
      
      // Prepare comprehensive meeting context for the bot
      const meetingContext = [];
      
      // Add meeting title and description
      if (task.isMeeting.title) {
        meetingContext.push(`Meeting Title: ${task.isMeeting.title}`);
      }
      
      if (task.isMeeting.description) {
        meetingContext.push(`Meeting Description: ${task.isMeeting.description}`);
      }
      
      // Add meeting scheduling details
      if (task.isMeeting.date && task.isMeeting.time) {
        meetingContext.push(`Scheduled Date: ${task.isMeeting.date}`);
        meetingContext.push(`Scheduled Time: ${task.isMeeting.time}`);
      }
      
      if (task.isMeeting.duration) {
        meetingContext.push(`Duration: ${task.isMeeting.duration}`);
      }
      
      // Add topic context if available
      if (task.topicContext) {
        meetingContext.push(`Topic Context: ${task.topicContext}`);
      }
      
      // Add task description/question
      if (task.taskDescription) {
        meetingContext.push(`Task Description: ${task.taskDescription}`);
      }
      
      if (task.taskQuestion) {
        meetingContext.push(`Original Question: ${task.taskQuestion}`);
      }
      
      // Add meeting transcript if available
      if (task.isMeeting.meetingRawData) {
        meetingContext.push(`Meeting Transcript: ${task.isMeeting.meetingRawData}`);
      }
      
      // Add meeting minutes if available
      if (task.isMeeting.meetingMinutes) {
        meetingContext.push(`Meeting Minutes: ${task.isMeeting.meetingMinutes}`);
      }
      
      // Add meeting summary if available
      if (task.isMeeting.meetingSummary) {
        meetingContext.push(`Meeting Summary: ${task.isMeeting.meetingSummary}`);
      }
      
      // Create comprehensive prompt
      const comprehensivePrompt = meetingContext.length > 0 
        ? `You are an AI assistant for the meeting: "${task.isMeeting.title || task.topicContext || 'Meeting'}". Here is the meeting context:\n\n${meetingContext.join('\n\n')}\n\nPlease help users with questions about this meeting, provide insights based on the meeting content, and assist with any follow-up tasks or discussions related to this meeting.`
        : task.taskDescription || task.taskQuestion || "Meeting Assistant";

      // Create new user/bot with meeting data
      const botData = {
        name: task.topicContext || task.isMeeting.title || "Meeting Assistant", 
        email: `${task.uniqueTaskId}@meetingbot.local`, // Use a unique email
        mobileNo: userData.user.mobileNo || "1234567890",
        username: task.uniqueTaskId, // Using task ID as username
        password: userData.user.geminiApiKey, // Using the same API key
        geminiApiKey: userData.user.geminiApiKey,
        plan: "meeting", // Set plan to meeting
        prompt: comprehensivePrompt,
        // Provide dummy Google info to pass validation
        google: {
          googleId: `bot_${task.uniqueTaskId}`,
          accessToken: "dummy_token", 
          refreshToken: "dummy_refresh_token",
          tokenExpiryDate: new Date().getTime() + 3600000 // 1 hour from now
        }
      };
      
      console.log("Creating bot with data:", botData);
      
      const response = await axios.post(`${import.meta.env.VITE_BACKEND}/register`, botData);
      
      if (response.data && response.data.userId) {
        // Update the botActivated flag in the task
        const updateResponse = await axios.patch(`${import.meta.env.VITE_BACKEND}/tasks`, {
          userId: userData.user.username,
          uniqueTaskId: task.uniqueTaskId,
          botActivated: true
        });
        
        if (updateResponse.data && updateResponse.data.success) {
          // Update the local state to reflect the bot activation
          setTasks(prevTasks => 
            prevTasks.map(t => 
              t.uniqueTaskId === task.uniqueTaskId 
                ? {
                    ...t,
                    isMeeting: {
                      ...t.isMeeting,
                      botActivated: true
                    }
                  } 
                : t
            )
          );
        }
        
        toast.success("Bot assistant created successfully!");
        
        // Open the new bot in a new tab
        window.open(`${import.meta.env.VITE_FRONTEND}/home/${task.uniqueTaskId}`, '_blank');
      } else {
        toast.error(response.data?.message || "Failed to create bot assistant");
      }
    } catch (error) {
      console.error("Error creating bot assistant:", error);
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to create bot assistant");
      }
    } finally {
      setCreatingBot(false);
    }
  };

export default AccessControlPopup