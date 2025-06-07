import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [userName, setUserName] = useState(() => Cookies.get('userName') || null);
  const [main, setMain] = useState(true);
  const [presentUserData, setPresentUserData] = useState(null);
  const [presentUserName, setPresentUserName] = useState(() => Cookies.get('presentUserName') || null);
  const [per, setPer] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Helper function to refresh user data
  const refreshUserData = async () => {
    try {
      if (!userName) return null;
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND}/verify-user/${userName}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        return data;
      } else {
        console.error(`Failed to refresh user data: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
      return null;
    }
  };

  // Helper function to refresh present user data
  const refreshPresentUserData = async () => {
    try {
      if (!presentUserName) return null;
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND}/verify-user/${presentUserName}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPresentUserData(data);
        return data;
      } else {
        console.error(`Failed to refresh present user data: ${response.status}`);
        return null;
      }
    } catch (error) {
      console.error("Error refreshing present user data:", error);
      return null;
    }
  };

  // Initial data fetch on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Fetch both user data and present user data in parallel
        await Promise.all([
          userName && refreshUserData(),
          presentUserName && refreshPresentUserData()
        ]);
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing data:", error);
        setIsInitialized(true); // Set initialized even on error to prevent infinite loading
      }
    };

    initializeData();
  }, []); // Run only on mount

  // Watch for userName changes
  useEffect(() => {
    if (userName) {
      Cookies.set('userName', userName, { expires: 7 }); // Set cookie to expire in 7 days
      refreshUserData();
    } else {
      Cookies.remove('userName');
      setUserData(null);
    }
  }, [userName]);

  // Watch for presentUserName changes
  useEffect(() => {
    if (presentUserName) {
      Cookies.set('presentUserName', presentUserName, { expires: 7 }); // Set cookie to expire in 7 days
      refreshPresentUserData();
    } else {
      Cookies.remove('presentUserName');
      setPresentUserData(null);
    }
  }, [presentUserName]);

  return (
    <AppContext.Provider
      value={{
        userData,
        userName,
        setUserName, // Add setter for userName
        presentUserData,
        presentUserName,
        setPresentUserName, // Add setter for presentUserName
        refreshUserData,
        refreshPresentUserData,
        isInitialized
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};