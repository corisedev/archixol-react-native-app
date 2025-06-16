import React, {createContext, useState, useEffect, useContext} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {signIn} from '../api/auth';
import {BackendContext} from './BackendContext';
import {VITE_API_BASE_URL} from '@env';
import api from '../api/index'; // <-- axios instance

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
  const {backendUrl} = useContext(BackendContext);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const storedToken = await AsyncStorage.getItem('ACCESS_TOKEN');
      const userData = await AsyncStorage.getItem('USER_DATA');
      if (storedToken && userData) {
        setToken(storedToken);
        setUser(JSON.parse(userData));
      }
      setLoading(false);
    })();
  }, []);

  const login = async credentials => {
    console.log('[AuthProvider] Attempting login with:', credentials);
    // ✅ Set baseURL before calling signIn
    const resolvedUrl = backendUrl || VITE_API_BASE_URL;
    api.defaults.baseURL = resolvedUrl;
    console.log('[AuthProvider] Using Base URL:', resolvedUrl);
    const userData = await signIn(credentials);

    console.log('[AuthProvider] Received userData:', userData);
    const userToken = userData.token;
    const userObj = userData.user;

    if (!userObj || !userToken) {
      throw new Error('Invalid user data received');
    }

    await AsyncStorage.setItem('ACCESS_TOKEN', userToken);
    await AsyncStorage.setItem('USER_DATA', JSON.stringify(userData));

    setToken(userToken);
    setUser(userObj);

    return userData; // ✅ ADD THIS LINE
  };

  const logout = async () => {
    await AsyncStorage.removeItem('ACCESS_TOKEN');
    await AsyncStorage.removeItem('USER_DATA');
    setUser(null);
    setToken(null);
  };

  const getBaseURL = () => {
    return backendUrl || VITE_API_BASE_URL;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        getBaseURL,
        loading,
        isAuthenticated: !!token,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
