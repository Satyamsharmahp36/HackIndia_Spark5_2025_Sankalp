import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [userName, setUserName] = useState(null);
  const [main, setMain] = useState(true);
  const [presentUserData, setPresentUserData] = useState(null);
  const [presentUserName, setPresentUserName] = useState(null);
  const [per, setPer] = useState(true);

  useEffect(() => {
    const userNameFinal = Cookies.get('userName');
    if (userNameFinal) {
      setUserName(userNameFinal);
    } else {
      setUserData(null);
    }
  }, [main]);

  useEffect(() => {
    const userNameFinal = Cookies.get('presentUserName');
    if (userNameFinal) {
      setPresentUserName(userNameFinal);
    } else {
      setPresentUserData(null);
    }
  }, [per]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userName) {
        setUserData(null);
        return;
      }


      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND}/verify-user/${userName}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        console.log(response)
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const userData = await response.json();
            setUserData(userData);
          } else {
            console.error("Server returned non-JSON response");
            setUserData(null);
            Cookies.remove('userName');
          }
        } else {
          console.error(`Failed to fetch user data: ${response.status} ${response.statusText}`);
          setUserData(null);
          Cookies.remove('userName');
        }
      } catch (err) {
        console.error("Failed to fetch user data", err);
        setUserData(null);
        // Clear invalid cookie
        Cookies.remove('userName');
      }
    };
    
    if (userName) {
      fetchUserData(); 
    }
  }, [userName, main]);

  useEffect(() => {
    const fetchPresentUserData = async () => {
      if (!presentUserName) {
        setPresentUserData(null);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND}/verify-user/${presentUserName}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        
        // Check if response is ok and content-type is JSON
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const userData = await response.json();
            setPresentUserData(userData);
          } else {
            console.error("Server returned non-JSON response for present user");
            setPresentUserData(null);
            Cookies.remove('presentUserName');
          }
        } else {
          console.error(`Failed to fetch present user data: ${response.status} ${response.statusText}`);
          setPresentUserData(null);
          Cookies.remove('presentUserName');
        }
      } catch (err) {
        console.error("Failed to fetch present user data", err);
        setPresentUserData(null);
        // Clear invalid cookie
        Cookies.remove('presentUserName');
      }
    };
    
    // FIX: Use presentUserName instead of userName
    if (presentUserName) {
      fetchPresentUserData(); 
    }
  }, [presentUserName, per]);

  return (
    <AppContext.Provider
      value={{
        userData,
        userName,
        main,
        setMain,
        per,
        setPer,
        presentUserData,
        presentUserName
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