// ✅ NEW
import CryptoJS from 'react-native-crypto-js';
import {VITE_ENCRYPT_KEY} from '@env';

const AES_SECRET_KEY = VITE_ENCRYPT_KEY;

export const encryptData = data => {
  try {
    const ciphertext = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      AES_SECRET_KEY,
    ).toString();

    return ciphertext;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
};

export const decryptData = ciphertext => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, AES_SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
};
