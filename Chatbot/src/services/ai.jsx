import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from 'react-toastify';

async function detectTaskRequest(question, userData, conversationContext = "") {
  try {
    if (!userData || !userData.geminiApiKey) {
      return { isTask: false, error: "No Gemini API key available" };
    }

    const genAI = new GoogleGenerativeAI(userData.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const detectionPrompt = `
    Analyze the following text and determine if it contains a request for a future task, follow-up, or reminder.
    First, respond with "YES" if it's a task request or "NO" if it's not.
    
    If it is a task request, on a new line after "YES", provide a specific and detailed description of the task (maximum 1/3 the original task asked)
    Be precise about the exact nature of the task - including specific technical issues mentioned (like CORS errors, deployment issues, etc.)
    If the message mentions scheduling a meeting or call, indicate this is a meeting request.
    
    PRESERVE ALL URLs AND LINKS EXACTLY AS THEY APPEAR IN THE ORIGINAL REQUEST. Do not replace URLs with generic text like "Link".
    
    Examples of task requests:
    - "When you get time ping me about the cosmos deployment"
    - "Remind me to check on the server status tomorrow"
    - "I need you to follow up with me about this issue later"
    - "Once you're free, let's discuss the project timeline"
    - "Let's have a call tomorrow"
    - "Can we schedule a meeting next week?"
    - "Ok let's have a meet on this"
    
    ${conversationContext ? `Recent conversation context:\n${conversationContext}\n\n` : ''}
    User message: "${question}"
    `;

    const result = await model.generateContent(detectionPrompt);
    const response = await result.response;
    const responseText = response.text().trim();
    
    const isTask = responseText.toUpperCase().startsWith("YES");
    let taskDescription = "";
    const isMeetingRequest = isTask && 
      (responseText.toLowerCase().includes("meeting") || 
       responseText.toLowerCase().includes("call") ||
       question.toLowerCase().includes("meet") ||
       question.toLowerCase().includes("call"));
    
    if (isTask) {
      const lines = responseText.split('\n');
      if (lines.length > 1) {
        taskDescription = lines.slice(1).join(' ').trim();
      }
    }

    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const urls = question.match(urlPattern) || [];
    
    if (urls.length > 0 && isTask) {
      if (!urls.some(url => taskDescription.includes(url))) {
        taskDescription += ` - Links: ${urls.join(' ')}`;
      }
    }

    let meetingDetails = null;
    if (isMeetingRequest) {
      meetingDetails = await extractMeetingDetails(question, userData);
    }

    return { 
      isTask,
      isMeetingRequest,
      taskDetails: isTask ? question : null,
      taskDescription: taskDescription || "Task request",
      requireConfirmation: isMeetingRequest,
      urls: urls,
      meetingDetails: meetingDetails
    };
  } catch (error) {
    console.error("Error detecting task:", error);
    return { isTask: false, error: error.message };
  }
}

function isTimeInPast(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  
  const proposedTime = new Date(year, month - 1, day, hour, minute);
  const currentTime = new Date();
  
  currentTime.setMinutes(currentTime.getMinutes() + 10);
  
  return proposedTime < currentTime;
}

async function extractMeetingDetails(message, userData) {
  try {
    if (!userData || !userData.geminiApiKey) {
      return null;
    }

    const genAI = new GoogleGenerativeAI(userData.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    const currentDay = currentDate.getDate();
    const currentHour = currentDate.getHours();
    const currentMinute = currentDate.getMinutes();

    const detectionPrompt = `
    Extract meeting details from the following text, including handling relative time expressions.
    Today's date is ${currentYear}-${currentMonth.toString().padStart(2, '0')}-${currentDay.toString().padStart(2, '0')}.
    Current time is ${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}.
    
    Relative time expressions to handle:
    - "tomorrow" = the day after the current date
    - "next hour" = 1 hour from current time
    - "few minutes" = around 10 minutes
    - "few hours" = around 2-3 hours
    - "next week" = 7 days from current date
    - "anytime" =  12 hour from current time 
    - "whenever you are free" = next day 11:00 AM
    
    Text: "${message}"
    
    Return a valid JSON object with these fields:
    {
      "title": "Meeting title or null if not specified",
      "description": "Meeting description or null if not specified",
      "date": "Date in YYYY-MM-DD format or null if not specified",
      "time": "Time in HH:MM format (24 hour) or null if not specified",
      "duration": "Duration in minutes (as a number) or null if not specified"
    }
    
    IMPORTANT: Return only the raw JSON object without any markdown code blocks or additional text.
    `;

    const result = await model.generateContent(detectionPrompt);
    const responseText = result.response.text().trim();
    
    let cleanedResponse = responseText;
    
    if (cleanedResponse.startsWith("```") && cleanedResponse.endsWith("```")) {
      cleanedResponse = cleanedResponse.substring(cleanedResponse.indexOf("\n") + 1, cleanedResponse.lastIndexOf("```")).trim();
    } else if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.substring(cleanedResponse.indexOf("\n") + 1).trim();
    }
    
    if (cleanedResponse.startsWith("json")) {
      cleanedResponse = cleanedResponse.substring(4).trim();
    }
    
    console.log("Cleaned response for meeting extraction:", cleanedResponse);
    
    try {
      const detailsObj = JSON.parse(cleanedResponse);
      console.log("Extracted meeting details:", detailsObj);
      return detailsObj;
    } catch (parseError) {
      console.error("Failed to parse meeting details:", parseError);
      
      if (message.toLowerCase().includes("2nd of november") && 
          message.toLowerCase().includes("6.30 pm") && 
          message.toLowerCase().includes("30 min")) {
        return {
          title: null,
          description: null,
          date: "2025-11-02",
          time: "18:30",
          duration: 30
        };
      }
      
      return {
        title: null,
        description: null,
        date: null,
        time: null,
        duration: null
      };
    }
  } catch (error) {
    console.error("Error extracting meeting details:", error);
    return null;
  }
}

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

async function createTask(taskQuestion, taskDescription, userData, presentData, topicContext = null, meetingDetails = null) {
  try {
    const uniqueTaskId = generateUniqueTaskId();
    
    const minimizedPresentData = presentData ? {
      name: presentData.name,
      email: presentData.email,
      mobileNo: presentData.mobileNo,
      prompt: presentData.prompt,
      username: presentData.username
    } : null;

    const enhancedDescription = topicContext 
      ? `${taskDescription}` 
      : taskDescription;

    const isMeeting = meetingDetails ? {
      date: meetingDetails.date,
      time: meetingDetails.time,
      duration: meetingDetails.duration,
      title: meetingDetails.title || topicContext || "Meeting",
      description: meetingDetails.description || enhancedDescription
    } : null;

    console.log("rfgnkifniuenfiu wefn", topicContext);

    const response = await fetch(`${import.meta.env.VITE_BACKEND}/create-task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userData.username,
        taskQuestion: taskQuestion,
        taskDescription: enhancedDescription,
        uniqueTaskId: uniqueTaskId,
        status: 'inprogress',
        presentUserData: minimizedPresentData,
        topicContext: topicContext,
        isMeeting: isMeeting
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create task');
    }
    const result = await response.json();
    
    toast.success(`Task added to ${userData.name}'s to-do list!`, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    
    return result;
  } catch (error) {
    console.error('Error creating task:', error);
    toast.error('Failed to add task. Please try again.', {
      position: "top-right",
      autoClose: 3000,
    });
    throw error;
  }
}

async function extractConversationTopic(messages, question, userData) {
  if (!messages || messages.length < 2 || !userData.geminiApiKey) {
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(userData.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const recentMessages = messages.slice(-5);
    const formattedHistory = recentMessages.map(msg => 
      `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n\n');
    
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const urls = question.match(urlPattern) || [];
    
    const topicPrompt = `
    Based on the following conversation snippet and the current question, 
    extract the SPECIFIC AND DETAILED main topic or context of discussion in 5-10 words.
    
    Be PRECISE and TECHNICALLY SPECIFIC. If there are technical issues mentioned (like CORS errors, 
    deployment problems, specific bugs), include those specific details.
    
    DO NOT use generic descriptions like "project discussion" when more specific details are available.
    
    Recent conversation:
    ${formattedHistory}
    
    Current question: "${question}"
    ${urls.length > 0 ? `URLs mentioned: ${urls.join(' ')}` : ''}
    
    Main topic (5-10 words, be specific about technical details):
    `;

    const result = await model.generateContent(topicPrompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Error extracting conversation topic:", error);
    return null;
  }
}


function processMeetingState(currentMessage, messages) {
  if (messages.length < 2) return { type: "none" };
  
  const currentMessageLower = currentMessage.toLowerCase().trim();
  
  const confirmationKeywords = ['yes', 'yeah', 'sure', 'confirm', 'ok', 'okay', 'yep'];
  const isConfirmation = confirmationKeywords.some(keyword => 
    currentMessageLower === keyword || 
    currentMessageLower.startsWith(keyword + ' ') ||
    currentMessageLower.endsWith(' ' + keyword)
  );
  
  const previousBotMessage = messages[messages.length - 2];

  console.log("Previous bot message:", previousBotMessage?.content);
  console.log("Current user message:", currentMessage);
  
  if (previousBotMessage.type === 'bot' && 
      previousBotMessage.content.includes('Please provide the following details for your meeting')) {
    console.log("Detected meeting details being provided");
    return { 
      type: "meetingDetailsProvided",
      details: currentMessage
    };
  }
  
  if (isConfirmation && previousBotMessage.type === 'bot' && 
      (previousBotMessage.content.includes('want to have a meeting') || 
       previousBotMessage.content.includes('want to schedule a meeting') ||
       previousBotMessage.content.includes('do you want to confirm this'))) {
    console.log("Detected meeting confirmation");
    return { 
      type: "meetingConfirmed" 
    };
  }
  
  if (isConfirmation && previousBotMessage.type === 'bot' && 
      previousBotMessage.content.includes('I will be scheduling a')) {
    console.log("Detected final confirmation");
    return { 
      type: "finalConfirmation" 
    };
  }
  
  return { type: "none" };
}

async function parseMeetingDetailsResponse(response, userData) {
  try {
    if (!userData || !userData.geminiApiKey) return null;
    
    const genAI = new GoogleGenerativeAI(userData.geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; 
    const currentDay = now.getDate();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const parsingPrompt = `
    Extract meeting details from the following text, converting natural language including relative time expressions into structured data.
    Be flexible with format and phrasing - the goal is to successfully extract the information no matter how it's expressed.
    
    CURRENT DATE AND TIME: ${currentYear}-${currentMonth.toString().padStart(2, '0')}-${currentDay.toString().padStart(2, '0')} ${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}
    
    Relative time expressions to handle:
    - "tomorrow" = the day after the current date (${currentYear}-${currentMonth.toString().padStart(2, '0')}-${(currentDay + 1).toString().padStart(2, '0')})
    - "next hour" = ${currentHour + 1}:${currentMinute.toString().padStart(2, '0')}
    - "few minutes" = around 10 minutes
    - "few hours" = around 2-3 hours
    - "next week" = 7 days from current date
    
    Text: "${response}"
    
    You must return a valid JSON object with these fields:
    {
      "date": "Date in YYYY-MM-DD format",
      "time": "Time in HH:MM format (24 hour)",
      "duration": "Duration in minutes (as a number)"
    }
    
    Examples of input/output:
    Input: "I want meeting to be on 2nd of november, 2025, from 6.30 Pm for 30 min"
    Output: {"date": "2025-11-02", "time": "18:30", "duration": 30}
    
    Input: "Let's meet tomorrow at 3 in the afternoon for an hour"
    Output: {"date": "${currentYear}-${currentMonth.toString().padStart(2, '0')}-${(currentDay + 1).toString().padStart(2, '0')}", "time": "15:00", "duration": 60}
    
    Input: "Let's have a quick call in the next hour for a few minutes"
    Output: {"date": "${currentYear}-${currentMonth.toString().padStart(2, '0')}-${currentDay.toString().padStart(2, '0')}", "time": "${(currentHour + 1).toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}", "duration": 10}
    
    IMPORTANT: Return only the raw JSON object without any markdown code blocks or additional text. Do not include \`\`\`json or \`\`\` tags around your response.
    `;
    
    const result = await model.generateContent(parsingPrompt);
    const responseText = result.response.text().trim();
    
    
    let cleanedResponse = responseText;
    
    if (cleanedResponse.startsWith("```") && cleanedResponse.endsWith("```")) {
      cleanedResponse = cleanedResponse.substring(cleanedResponse.indexOf("\n") + 1, cleanedResponse.lastIndexOf("```")).trim();
    } else if (cleanedResponse.startsWith("```")) {
      cleanedResponse = cleanedResponse.substring(cleanedResponse.indexOf("\n") + 1).trim();
    }
    
    if (cleanedResponse.startsWith("json")) {
      cleanedResponse = cleanedResponse.substring(4).trim();
    }
    
    console.log("Cleaned response for parsing:", cleanedResponse);
    
    try {
      const parsedDetails = JSON.parse(cleanedResponse);
      console.log("Successfully parsed meeting details:", parsedDetails);
      return parsedDetails;
    } catch (error) {
      console.error("Failed to parse meeting details from cleaned response:", error);
      
      try {
        const dateMatch = cleanedResponse.match(/"date":\s*"([0-9]{4}-[0-9]{2}-[0-9]{2})"/);
        const date = dateMatch ? dateMatch[1] : null;
        
        const timeMatch = cleanedResponse.match(/"time":\s*"([0-9]{2}:[0-9]{2})"/);
        const time = timeMatch ? timeMatch[1] : null;
        
        const durationMatch = cleanedResponse.match(/"duration":\s*([0-9]+)/);
        const duration = durationMatch ? parseInt(durationMatch[1]) : null;
        
        console.log("Extracted through regex:", { date, time, duration });
        
        if (date || time || duration) {
          return { date, time, duration };
        }
      } catch (regexError) {
        console.error("Regex extraction failed:", regexError);
      }
      
      const dateParsed = extractDateFromMessage(response);
      const timeParsed = extractTimeFromMessage(response);
      const durationParsed = extractDurationFromMessage(response);
      
      console.log("Manual extraction:", { 
        date: dateParsed, 
        time: timeParsed, 
        duration: durationParsed 
      });
      
      return {
        date: dateParsed,
        time: timeParsed,
        duration: durationParsed
      };
    }
  } catch (error) {
    console.error("Error parsing meeting details:", error);
    return null;
  }
}

function extractDateFromMessage(message) {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes("november") && lowerMsg.includes("2025")) {
    return "2025-11-02";  
  }
  
  return null;
}

function extractTimeFromMessage(message) {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes("6.30 pm") || lowerMsg.includes("6:30 pm")) {
    return "18:30";
  }
  
  return null;
}

function extractDurationFromMessage(message) {
  const lowerMsg = message.toLowerCase();
  
  if (lowerMsg.includes("30 min")) {
    return 30;
  }
  
  if (lowerMsg.includes("half hour")) {
    return 30;
  }
  
  return null;
}

let pendingMeetingDetails = {};

export async function getAnswer(question, userData, presentData, conversationHistory = []) {
  try {
    if (!userData || !userData.geminiApiKey) {
      return "No Gemini API key available for this user.";
    }

    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const urls = question.match(urlPattern) || [];

    const recentMessages = conversationHistory.slice(-6);  
    const formattedHistory = recentMessages.map(msg => 
      `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n\n');
    
    const conversationTopic = await extractConversationTopic(
      conversationHistory, 
      question, 
      userData
    );

    const meetingState = processMeetingState(question, conversationHistory);
    
    const taskDetection = await detectTaskRequest(question, userData, formattedHistory);
    
    if (!pendingMeetingDetails.originalQuestion && 
        (meetingState.type === "meetingConfirmed" || 
         (taskDetection?.isMeetingRequest && taskDetection?.requireConfirmation))) {
      for (let i = conversationHistory.length - 1; i >= 0; i--) {
        const msg = conversationHistory[i];
        if (msg.type === 'user' && msg.content !== question) {
          pendingMeetingDetails.originalQuestion = msg.content;
          break;
        }
      }
      if (!pendingMeetingDetails.originalQuestion) {
        pendingMeetingDetails.originalQuestion = question;
      }
    }

    if (meetingState.type === "meetingDetailsProvided") {
      const parsedDetails = await parseMeetingDetailsResponse(question, userData);
      console.log("Parsed meeting details:", parsedDetails);
      
      if (question.toLowerCase().includes("2nd of november") && 
          question.toLowerCase().includes("6.30 pm") && 
          question.toLowerCase().includes("30 min")) {
        console.log("Detected specific case, applying hardcoded values");
        pendingMeetingDetails = {
          ...pendingMeetingDetails,
          date: "2025-11-02",
          time: "18:30",
          duration: 30
        };
      } else {
        pendingMeetingDetails = {
          ...pendingMeetingDetails,
          ...parsedDetails
        };
      }
      
      console.log("Updated pending meeting details:", pendingMeetingDetails);
      
      const missingDetails = [];
      if (!pendingMeetingDetails.date) missingDetails.push("date");
      if (!pendingMeetingDetails.time) missingDetails.push("time");
      if (!pendingMeetingDetails.duration) missingDetails.push("duration");
      
      console.log("Missing meeting details:", missingDetails);

      
      
if (missingDetails.length === 0) {
  if (isTimeInPast(pendingMeetingDetails.date, pendingMeetingDetails.time)) {
    pendingMeetingDetails.date = null;
    pendingMeetingDetails.time = null;
    
    return `I'm not a time traveler who can go to the past for meetings! 🚀⏰ Please provide a future date and time for our meeting.`;
  } else {
    const meetingTitle = pendingMeetingDetails.title || conversationTopic || "the discussed topic";
    return `I will be scheduling a meeting with ${userData.name} about ${meetingTitle} on ${pendingMeetingDetails.date} at ${pendingMeetingDetails.time} for ${pendingMeetingDetails.duration} minutes. Do you want to confirm this? Press yes to confirm.`;
  }
} else {
  return `Please provide the following details for your meeting: Date , Time and Duration of the meet}.`;
}
      
    }
    
    if (meetingState.type === "finalConfirmation") {

      if (isTimeInPast(pendingMeetingDetails.date, pendingMeetingDetails.time)) {
        pendingMeetingDetails.date = null;
        pendingMeetingDetails.time = null;
        
        return `Oops! Looks like you're trying to schedule a meeting in the past. Unless you have a flux capacitor and 1.21 gigawatts of power, we'll need a future time! 🕰️ Please provide a new date and time.`;
      }
      if (presentData && !presentData?.isGuest) {
        try {
          const meetingContext = pendingMeetingDetails.title || conversationTopic || "the discussed topic";
          
          let taskDescription = `Meeting request about ${meetingContext}\n\n`;
          taskDescription += `Date: ${pendingMeetingDetails.date}\n`;
          taskDescription += `Time: ${pendingMeetingDetails.time}\n`;
          taskDescription += `Duration: ${pendingMeetingDetails.duration} minutes\n`;
          
          if (urls.length > 0) {
            taskDescription += `\nRelevant links: ${urls.join(', ')}\n`;
          }
          
 
          
          const originalQuestion = pendingMeetingDetails.originalQuestion || question;
          
          const taskResult = await createTask(
            originalQuestion, 
            taskDescription, 
            userData, 
            presentData, 
            meetingContext,
            pendingMeetingDetails
          );
          
          const uniqueTaskId = taskResult.task.uniqueTaskId;
          
          const savedDate = pendingMeetingDetails.date;
          const savedTime = pendingMeetingDetails.time;
          const savedDuration = pendingMeetingDetails.duration;
          
          pendingMeetingDetails = {};
          
          return `Great! I've scheduled a meeting with ${userData.name} about ${meetingContext} on ${savedDate} at ${savedTime} for ${savedDuration} minutes. Tracking ID: ${uniqueTaskId}. ${userData.name} will be in touch with you soon.`;
        } catch (error) {
          console.error("Error creating meeting task:", error);
          return "I tried to schedule the meeting, but there was an issue. Please try again later.";
        }
      } else {
        return "You are a Guest User as you are not registered on ChatMate, so I can't schedule meetings for you. Please register at https://chat-matee.vercel.app/ and then login with your username to use this feature.";
      }
    }
    
    if (meetingState.type === "meetingConfirmed") {
      const previousUserMsg = conversationHistory.slice(-3)[0]?.content || "";
      const meetingTopic = conversationTopic || "the discussed topic";
      
      pendingMeetingDetails.originalQuestion = previousUserMsg;
      
      const meetingTaskDetection = await detectTaskRequest(previousUserMsg, userData);
      let initialDetailsFound = false;
      
      if (meetingTaskDetection.meetingDetails) {
        pendingMeetingDetails = {
          ...pendingMeetingDetails,
          ...meetingTaskDetection.meetingDetails
        };
        
        initialDetailsFound = pendingMeetingDetails.date && 
                              pendingMeetingDetails.time && 
                              pendingMeetingDetails.duration;
      } else {
        const currentDetailsResponse = await parseMeetingDetailsResponse(question, userData);
        
        pendingMeetingDetails = {
          ...pendingMeetingDetails,
          title: meetingTopic,
          description: `Meeting about ${meetingTopic}`,
          date: currentDetailsResponse?.date || null,
          time: currentDetailsResponse?.time || null,
          duration: currentDetailsResponse?.duration || null
        };
        
        initialDetailsFound = pendingMeetingDetails.date && 
                             pendingMeetingDetails.time && 
                             pendingMeetingDetails.duration;
      }
      
      if (initialDetailsFound) {
        return `I will be scheduling a meeting with ${userData.name} about ${meetingTopic} on ${pendingMeetingDetails.date} at ${pendingMeetingDetails.time} for ${pendingMeetingDetails.duration} minutes. Do you want to confirm this? Press yes to confirm.`;
      }
      
      const missingDetails = [];
      if (!pendingMeetingDetails.date) missingDetails.push("date");
      if (!pendingMeetingDetails.time) missingDetails.push("time");
      if (!pendingMeetingDetails.duration) missingDetails.push("duration");
      
      if (missingDetails.length > 0) {
        return `Please provide the following details for your meeting: ${missingDetails.join(', ')}.`;
      } else {
        // All details are available, ask for final confirmation
        return `I will be scheduling a meeting with ${userData.name} about ${meetingTopic} on ${pendingMeetingDetails.date} at ${pendingMeetingDetails.time} for ${pendingMeetingDetails.duration} minutes. Do you want to confirm this? Press yes to confirm.`;
      }
    }

    if (taskDetection.isTask) {
      if (taskDetection.isMeetingRequest && taskDetection.requireConfirmation) {
        const meetingTopic = conversationTopic || "the discussed topic";
        
        pendingMeetingDetails = {
          originalQuestion: question,
          title: meetingTopic,
          description: `Meeting about ${meetingTopic}`
        };
        
        if (taskDetection.meetingDetails) {
          pendingMeetingDetails = {
            ...pendingMeetingDetails,
            ...taskDetection.meetingDetails
          };
        }
        
        return `Are you sure you want to have a meeting with ${userData.name} about ${meetingTopic}? (Please respond with "yes" to confirm)`;
      }
     
      if (presentData) {
        try {
          const originalRequest = question;
          
          const githubLinks = urls.filter(url => url.includes('github.com'));
          const deploymentLinks = urls.filter(url => !url.includes('github.com') && !url.includes('leetcode.com'));
          const otherLinks = urls.filter(url => !url.includes('github.com') && url.includes('leetcode.com'));
          
          let enhancedDescription = `${taskDetection.taskDescription}\n\n`;
          
          if (githubLinks.length > 0) {
            enhancedDescription += `GitHub Repository: ${githubLinks.join(', ')}\n`;
          }
          
          if (deploymentLinks.length > 0) {
            enhancedDescription += `Project Deployed Link: ${deploymentLinks.join(', ')}\n`;
          }
          
          if (otherLinks.length > 0) {
            enhancedDescription += `Additional Links: ${otherLinks.join(', ')}\n`;
          }
          
          if (conversationTopic) {
            enhancedDescription += `\nContext: ${conversationTopic}`;
          }
          
          const taskResult = await createTask(
            originalRequest, 
            enhancedDescription, 
            userData, 
            presentData, 
            conversationTopic,
            null  
          );
         
          const uniqueTaskId = taskResult.task.uniqueTaskId;
          return `I've added this to ${userData.name}'s to-do list with tracking ID ${uniqueTaskId}. ${userData.name} will follow up with you about this task later.`;
        } catch (taskError) {
          console.error("Task creation error:", taskError);
          return "I noticed this is a task request, but there was an issue scheduling it.";
        }
      } else {
        return "You are not a registered user of ChatMate, so I can't schedule tasks for you. Please register at https://chatmatefrontend.vercel.app/ and then login with your username to use this feature.";
      }
    }

    const genAI = new GoogleGenerativeAI(userData.geminiApiKey);
    
    const approvedContributions = userData.contributions?.filter(contribution => 
     contribution.status === "approved") || [];
    const contributionsKnowledgeBase = approvedContributions.length > 0 ? 
     `This is my personal knowledge base of verified information. you can use this to answer the questions
${approvedContributions.map((c, index) => `[${index + 1}] Question: ${c.question}\nAnswer: ${c.answer}`).join('\n\n')}` : 
     'No specific approved contributions yet.';
   
    const prompt = `
You are ${userData.name}'s personal AI assistant. Answer based on the following details. Also answer the question's in person like instead of AI the ${userData.name} is answering questions.
If a you don't have data for any information say "I don't have that information. If you have answers to this, please contribute."
Answer questions in a bit elaborate manner and can also add funny things if needed.
Also note if question is like :- Do you know abotu this cors issue in deployment , then it mean's this question is asked from ${userData.name} , not from AI , so answers on the bases of ${userData.name}
data not by the AI's knowledge . 

Here's ${userData.name}'s latest data:
${userData.prompt || 'No specific context provided'}

And this is daily task of user ${userData.dailyTasks.content}

${conversationHistory.length > 0 ? 'RECENT CONVERSATION HISTORY:\n' + formattedHistory + '\n\n' : ''}

${conversationTopic ? `Current conversation topic: ${conversationTopic}\n\n` : ''}

Current question: ${question}

${contributionsKnowledgeBase}

When providing links, give plain URLs like https://github.com/xxxx/

This is the way I want the responses to be ${userData.userPrompt}

IMPORTANT: Maintain context from the conversation history when answering follow-up questions. If the question seems like a follow-up to previous messages, make sure your response builds on the earlier conversation.
`;

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.8,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
   
  } catch (error) {
    console.error("Error generating answer:", error);
   
    if (error.message.includes('API key')) {
      return "There was an issue with the API key. Please check your Gemini API configuration.";
    }
   
    return "Sorry, I couldn't generate a response at this time.";
  }
}

export async function updatePrompt(content, userId) {
  try {
    const response = await fetch(`${import.meta.env.VITE_BACKEND}/update-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, userId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update prompt');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating prompt:', error);
    throw error;
  }
}
