const apiService = {
  getPrompt: async (userId) => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND}/prompt/${userId}`);
    const data = await response.json();
    return data.prompt;
  },
  
  getUserPrompt: async (userId) => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND}/user-prompt/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return data.prompt;
  },
    
  updateUserPrompt: async (content, userId) => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND}/update-user-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, userId }),
    });
    return await response.json();
  },
    
  clearUserPrompt: async (userId) => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND}/update-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: '', userId }),
    });
    return await response.json();
  },
    
  updatePrompt: async (content, userId) => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND}/update-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, userId }),
    });
    return await response.json();
  },
    
  submitContribution: async (name, question, answer, username) => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND}/contributions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, question, answer, username }),
    });
    return await response.json();
  },
    
  getContributions: async (userId, status = null) => {
    let url = `${import.meta.env.VITE_BACKEND}/contributions/${userId}`;
    if (status) {
      url += `?status=${status}`;
    }
    const response = await fetch(url);
    return await response.json();
  },
    
  updateContributionStatus: async (contributionId, status, username) => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND}/contributions/${contributionId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        username
      }),
    });
    return await response.json();
  },

  clearPrompt: async (userId) => {
    const response = await fetch(`${import.meta.env.VITE_BACKEND}/update-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: '', userId }),
    });
    return await response.json();
  },
  
  getUserData: async (name) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/verify-user/${name}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );
      
      const data = await response.json();
      return {
        success: response.ok,
        data: response.ok ? data : null
      };
    } catch (error) {
      console.error('Error fetching user data:', error);
      return {
        success: false,
        data: null,
        error
      };
    }
  }
};

export default apiService;