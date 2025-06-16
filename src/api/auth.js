import api from './index';
import {encryptData, decryptData} from '../utils/crypto';

/**
 * Validate if username, email, or phone already exists
 */
export const validateSignUp = async (username, email, phone_number) => {
  const response = await api.post('/account/validate/', {
    username,
    email,
    phone_number,
  });
  return response.data;
};

/**
 * Signup API with encryption
 */
export const signUp = async formData => {
  const encrypted = encryptData(formData);
  const response = await api.post('/account/signup/', {data: encrypted});

  // Optional decryption
  const decrypted = decryptData(response?.data?.data);
  return JSON.parse(decrypted);
};

/**
 * Signin and return decrypted data
 */

export const signIn = async apiData => {
  try {
    const data = encryptData(apiData);

    // ✅ Log the full URL being used
    console.log('[LOGIN] Axios Base URL:', api.defaults.baseURL);
    console.log('[LOGIN] Full URL:', `${api.defaults.baseURL}/account/login/`);

    console.log('[LOGIN] Encrypted Request:', data);

    const response = await api.post('/account/login/', { data });

    console.log('[LOGIN] Raw Response:', response?.data);

    const decrypted = decryptData(response?.data?.data);
    console.log('[LOGIN] Decrypted Response:', decrypted);

    const parsed = JSON.parse(decrypted);
    console.log('[LOGIN] Parsed Object:', parsed);

    if (!parsed?.user_data || !parsed?.token) {
      throw new Error('Invalid user data received');
    }

    return {
      message: parsed.message,
      token: parsed.token,
      user: {
        ...parsed.user_data,
        user_type: parsed.user_type,
      },
    };
  } catch (err) {
    console.error('[LOGIN] Error:', err.message);
    throw err;
  }
};


/**
 * Google OAuth
 */
export const googleAuth = async (code, redirect_uri) => {
  const response = await api.get('/account/google_auth/', {
    params: {code, redirect_uri},
  });
  return response.data;
};

/**
 * Verify email token
 */
export const emailVerify = async token => {
  const response = await api.post(
    '/account/verify_email/',
    {},
    {
      headers: {Authorization: `Bearer ${token}`},
    },
  );
  return response.data;
};

/**
 * Resend verification email
 */
export const resendVerifyEmail = async token => {
  const response = await api.post(
    '/account/resend_email/',
    {},
    {
      headers: {Authorization: `Bearer ${token}`},
    },
  );
  return response.data;
};

/**
 * Request Password Reset
 */
export const requestPasswordReset = async formData => {
  const encrypted = encryptData(formData);
  const response = await api.post('/account/forgot_password/', {
    data: encrypted,
  });

  const decrypted = decryptData(response?.data?.data);
  return JSON.parse(decrypted);
};

/**
 * Change Password
 */
export const changePassword = async (formData, token) => {
  const encrypted = encryptData(formData);
  const response = await api.post(
    '/account/update_password/',
    {data: encrypted},
    {
      headers: {Authorization: `Bearer ${token}`},
    },
  );

  const decrypted = decryptData(response?.data?.data);
  return JSON.parse(decrypted);
};

/**
 * Refresh Token
 */
export const getRefreshToken = async token => {
  const response = await api.get('/account/refresh_token/', {
    headers: {Authorization: `Bearer ${token}`},
  });
  return response.data;
};
