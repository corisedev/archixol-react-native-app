import api from './index';
import {encryptData, decryptData} from '../utils/crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ----------------------------------
   🔹 User Profile
----------------------------------- */
export const getProfile = async () => {
  const token = await AsyncStorage.getItem('ACCESS_TOKEN'); // 🔐 Get saved token
  if (!token) {
    throw new Error('Access token not found');
  }

  const response = await api.get('/profile/get_data/', {
    headers: {
      Authorization: `Bearer ${token}`, // ✅ Add token here
    },
  });

  const decrypted = decryptData(response.data.data);
  return JSON.parse(decrypted);
};

export const updateProfile = async formData => {
  const {profile_img, banner_img, intro_video, ...rest} = formData;
  const data = encryptData(rest);

  const multipart = new FormData();
  multipart.append('data', data);

  if (profile_img) {
    multipart.append('profile_img', profile_img);
  }
  if (banner_img) {
    multipart.append('banner_img', banner_img);
  }
  if (intro_video) {
    multipart.append('intro_video', intro_video);
  }

  const response = await api.post('/profile/update_data/', multipart, {
    headers: {'Content-Type': 'multipart/form-data'},
  });

  const decrypted = decryptData(response.data.data);
  return JSON.parse(decrypted);
};

export const deleteIntroVideo = async apiData => {
  const response = await api.post('/profile/delete_intro_video/', {
    data: apiData,
  });
  const decrypted = decryptData(response.data.data);
  return JSON.parse(decrypted);
};

/* ----------------------------------
   📜 Certificates
----------------------------------- */
export const getCertificates = async () => {
  const response = await api.get('/profile/get_certificates/');
  const decrypted = decryptData(response.data.data);
  return JSON.parse(decrypted);
};

export const addCertificate = async formData => {
  const {certificate_img, ...rest} = formData;
  const data = encryptData(rest);

  const multipart = new FormData();
  multipart.append('data', data);
  if (certificate_img) {
    multipart.append('certificate_img', certificate_img);
  }

  const response = await api.post('/profile/upload_certificates/', multipart, {
    headers: {'Content-Type': 'multipart/form-data'},
  });

  const decrypted = decryptData(response.data.data);
  return JSON.parse(decrypted);
};

export const updateCertificate = async formData => {
  const {certificate_img, ...rest} = formData;
  const data = encryptData(rest);

  const multipart = new FormData();
  multipart.append('data', data);
  if (certificate_img) {
    multipart.append('certificate_img', certificate_img);
  }

  const response = await api.post('/profile/update_certificates/', multipart, {
    headers: {'Content-Type': 'multipart/form-data'},
  });

  const decrypted = decryptData(response.data.data);
  return JSON.parse(decrypted);
};

export const deleteCertificate = async formData => {
  const data = encryptData(formData);
  const response = await api.post('/profile/delete_certificates/', {data});

  const decrypted = decryptData(response.data.data);
  return JSON.parse(decrypted);
};

/* ----------------------------------
   🧾 Company Documents
----------------------------------- */
export const getCompanyDocs = async () => {
  const response = await api.get('/profile/get_company_documents/');
  const decrypted = decryptData(response.data.data);
  return JSON.parse(decrypted);
};

export const addCompanyDoc = async formData => {
  const {doc_image, ...rest} = formData;
  const data = encryptData(rest);

  const multipart = new FormData();
  multipart.append('data', data);
  if (doc_image) {
    multipart.append('doc_image', doc_image);
  }

  const response = await api.post(
    '/profile/upload_company_documents/',
    multipart,
    {
      headers: {'Content-Type': 'multipart/form-data'},
    },
  );

  const decrypted = decryptData(response.data.data);
  return JSON.parse(decrypted);
};

export const updateCompanyDoc = async formData => {
  const {doc_image, ...rest} = formData;
  const data = encryptData(rest);

  const multipart = new FormData();
  multipart.append('data', data);
  if (doc_image) {
    multipart.append('doc_image', doc_image);
  }

  const response = await api.post(
    '/profile/update_company_documents/',
    multipart,
    {
      headers: {'Content-Type': 'multipart/form-data'},
    },
  );

  const decrypted = decryptData(response.data.data);
  return JSON.parse(decrypted);
};

export const deleteCompanyDoc = async formData => {
  const data = encryptData(formData);
  const response = await api.post('/profile/delete_company_documents/', {data});

  const decrypted = decryptData(response.data.data);
  return JSON.parse(decrypted);
};
