import axios from 'axios';
import {VITE_API_BASE_URL} from '@env';
import {getToken, logoutUser} from '../utils/authStorage'; // You’ll create this
import {Alert} from 'react-native';

// Create Axios instance
const api = axios.create({
  baseURL: VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor – Add token & remove multipart headers for FormData
api.interceptors.request.use(
  async config => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']; // Let browser auto set it
    }

    return config;
  },
  error => Promise.reject(error),
);

// Response Interceptor – Handle 401 unauthorized
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response && error.response.status === 401) {
      Alert.alert('Session Expired', 'Please log in again.');
      await logoutUser(); // Remove token from local storage
    }
    return Promise.reject(error);
  },
);

export default api;
