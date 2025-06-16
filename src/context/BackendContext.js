import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BackendContext = createContext();

const BackendProvider = ({ children }) => {
  const [backendUrl, setBackendUrl] = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('BACKEND_URL').then(url => {
      if (url) {
        setBackendUrl(url);
      }
    });
  }, []);

  const saveBackendUrl = async (url) => {
    await AsyncStorage.setItem('BACKEND_URL', url);
    setBackendUrl(url);
  };

  return (
    <BackendContext.Provider value={{ backendUrl, saveBackendUrl }}>
      {children}
    </BackendContext.Provider>
  );
};

export { BackendProvider, BackendContext };
