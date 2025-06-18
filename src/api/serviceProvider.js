import api from './index';
import {encryptData, decryptData} from '../utils/crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ----------------------------------
   🏠 Dashboard APIs
----------------------------------- */
export const getServiceProviderDashboard = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/service/dashboard/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get service provider dashboard:', error);
    throw error;
  }
};

/* ----------------------------------
   🎨 Portfolio Templates
----------------------------------- */
export const getPortfolioTemplates = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.get('/profile/templates/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get portfolio templates:', error);
    throw error;
  }
};

export const selectPortfolioTemplate = async templateId => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.post(
      '/profile/update_template/',
      {profile_template: templateId},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Failed to select portfolio template:', error);
    throw error;
  }
};

export const getUserPublicProfile = async username => {
  try {
    const response = await api.get(`/public/user/${username}/`);
    return response.data;
  } catch (error) {
    console.error('Failed to get public profile:', error);
    throw error;
  }
};

export const getCurrentUserProfile = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.get('/profile/me/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get current user profile:', error);
    throw error;
  }
};

/* ----------------------------------
   🏢 Services Management
----------------------------------- */
export const addService = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const {service_images, ...dataWithoutFiles} = apiData;
    const data = encryptData(dataWithoutFiles);

    const formData = new FormData();
    formData.append('data', data);

    if (service_images && service_images.length > 0) {
      const images = Array.isArray(service_images)
        ? service_images
        : [service_images];
      images.forEach(img => formData.append('service_images', img));
    }

    const response = await api.post('/service/create_service/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to add service:', error);
    throw error;
  }
};

export const getAllServices = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.get('/service/get_services/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get all services:', error);
    throw error;
  }
};

export const getService = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/service/get_service/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get service:', error);
    throw error;
  }
};

export const updateService = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const {service_images, service_images_urls, ...dataWithoutFiles} = apiData;
    const data = encryptData(dataWithoutFiles);

    const formData = new FormData();
    formData.append('data', data);

    // Handle existing image URLs
    if (service_images_urls && service_images_urls.length > 0) {
      service_images_urls.forEach(url => {
        if (typeof url === 'string') {
          let sliced = url
            .replace(/^https?:\/\/[^/]+\//, '') // Remove domain
            .replace(/^media\//, ''); // Remove "media/" prefix
          formData.append('service_images_urls', sliced);
        }
      });
    }

    // Handle new image files
    if (service_images && service_images.length > 0) {
      const images = Array.isArray(service_images)
        ? service_images
        : [service_images];
      images.forEach(file => {
        if (typeof file === 'object' && file !== null) {
          formData.append('service_images', file);
        }
      });
    }

    const response = await api.post('/service/update_service/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update service:', error);
    throw error;
  }
};

export const deleteService = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/service/delete_service/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to delete service:', error);
    throw error;
  }
};

/* ----------------------------------
   👤 Profile Management
----------------------------------- */
export const getProfile = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.get('/profile/get_data/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get profile:', error);
    throw error;
  }
};

export const updateProfile = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const {profile_img, banner_img, intro_video, ...dataWithoutFiles} = apiData;
    const data = encryptData(dataWithoutFiles);

    const formData = new FormData();
    formData.append('data', data);

    // Handle profile image
    if (profile_img) {
      const file =
        Array.isArray(profile_img) && profile_img.length > 0
          ? profile_img[0]
          : profile_img;
      formData.append('profile_img', file);
    }

    // Handle banner image
    if (banner_img) {
      const file =
        Array.isArray(banner_img) && banner_img.length > 0
          ? banner_img[0]
          : banner_img;
      formData.append('banner_img', file);
    }

    // Handle intro video
    if (intro_video) {
      const file =
        Array.isArray(intro_video) && intro_video.length > 0
          ? intro_video[0]
          : intro_video;
      formData.append('intro_video', file);
    }

    const response = await api.post('/profile/update_data/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw error;
  }
};

export const deleteIntroVideo = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.post(
      '/profile/delete_intro_video/',
      {data: apiData},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to delete intro video:', error);
    throw error;
  }
};

/* ----------------------------------
   💼 Certificate Management
----------------------------------- */
export const getCertificates = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.get('/profile/get_certificates/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get certificates:', error);
    throw error;
  }
};

export const getCertificate = async () => {
  return getCertificates(); // Alias for consistency
};

export const addCertificate = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const {certificate_img, ...rest} = apiData;
    const data = encryptData(rest);

    const formData = new FormData();
    formData.append('data', data);

    if (certificate_img) {
      const file =
        Array.isArray(certificate_img) && certificate_img.length > 0
          ? certificate_img[0]
          : certificate_img;
      formData.append('certificate_img', file);
    }

    const response = await api.post('/profile/upload_certificates/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to add certificate:', error);
    throw error;
  }
};

export const updateCertificate = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const {certificate_img, ...rest} = apiData;
    const data = encryptData(rest);

    const formData = new FormData();
    formData.append('data', data);

    if (certificate_img) {
      const files = Array.isArray(certificate_img)
        ? certificate_img
        : [certificate_img];
      files.forEach(file => formData.append('certificate_img', file));
    }

    const response = await api.post('/profile/update_certificates/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update certificate:', error);
    throw error;
  }
};

export const deleteCertificate = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/profile/delete_certificates/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to delete certificate:', error);
    throw error;
  }
};

/* ----------------------------------
   📁 Project Management
----------------------------------- */
export const getProjects = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.get('/profile/get_projects/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get projects:', error);
    throw error;
  }
};

export const getProject = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/profile/get_project/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get project:', error);
    throw error;
  }
};

export const addProject = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const {project_imgs, ...dataWithoutFiles} = apiData;
    const data = encryptData(dataWithoutFiles);

    const formData = new FormData();
    formData.append('data', data);

    // Handle project images
    if (project_imgs) {
      const images = Array.isArray(project_imgs)
        ? project_imgs
        : [project_imgs];
      images.forEach(file => {
        formData.append('project_imgs', file);
      });
    }

    const response = await api.post('/profile/upload_project/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to add project:', error);
    throw error;
  }
};

export const updateProject = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const {project_imgs, project_imgs_urls, ...dataWithoutFiles} = apiData;
    const data = encryptData(dataWithoutFiles);

    const formData = new FormData();
    formData.append('data', data);

    // Handle existing image URLs
    if (project_imgs_urls && project_imgs_urls.length > 0) {
      project_imgs_urls.forEach(url => {
        if (typeof url === 'string') {
          let sliced = url
            .replace(/^https?:\/\/[^/]+\//, '') // Remove domain
            .replace(/^media\//, ''); // Remove "media/" prefix
          formData.append('project_imgs_urls', sliced);
        }
      });
    }

    // Handle new image files
    if (project_imgs) {
      const images = Array.isArray(project_imgs)
        ? project_imgs
        : [project_imgs];
      images.forEach(file => {
        if (typeof file === 'object' && file !== null) {
          formData.append('project_imgs', file);
        }
      });
    }

    const response = await api.post('/profile/update_project/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update project:', error);
    throw error;
  }
};

export const deleteProject = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/profile/delete_project/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to delete project:', error);
    throw error;
  }
};

/* ----------------------------------
   🏢 Company Management
----------------------------------- */
export const becomeCompany = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.post(
      '/account/become_company/',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to become company:', error);
    throw error;
  }
};

export const getCompany = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.get('/company/get_data/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get company data:', error);
    throw error;
  }
};

export const updateCompany = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const {logo, banner, license_img, ...dataWithoutFiles} = apiData;
    const data = encryptData(dataWithoutFiles);

    const formData = new FormData();
    formData.append('data', data);

    // Handle logo
    if (logo) {
      const file = Array.isArray(logo) && logo.length > 0 ? logo[0] : logo;
      formData.append('logo', file);
    }

    // Handle banner
    if (banner) {
      const file =
        Array.isArray(banner) && banner.length > 0 ? banner[0] : banner;
      formData.append('banner', file);
    }

    // Handle license image
    if (license_img) {
      const file =
        Array.isArray(license_img) && license_img.length > 0
          ? license_img[0]
          : license_img;
      formData.append('license_img', file);
    }

    const response = await api.post('/company/update_data/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update company:', error);
    throw error;
  }
};

/* ----------------------------------
   📄 Company Documents Management
----------------------------------- */
export const getCompanyDocs = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.get('/profile/get_company_documents/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get company documents:', error);
    throw error;
  }
};

export const addCompanyDoc = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const {doc_image, ...dataWithoutFiles} = apiData;
    const data = encryptData(dataWithoutFiles);

    const formData = new FormData();
    formData.append('data', data);

    if (doc_image) {
      const file =
        Array.isArray(doc_image) && doc_image.length > 0
          ? doc_image[0]
          : doc_image;
      formData.append('doc_image', file);
    }

    const response = await api.post(
      '/profile/upload_company_documents/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to add company document:', error);
    throw error;
  }
};

export const updateCompanyDoc = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const {doc_image, ...dataWithoutFiles} = apiData;
    const data = encryptData(dataWithoutFiles);

    const formData = new FormData();
    formData.append('data', data);

    if (doc_image) {
      const files = Array.isArray(doc_image) ? doc_image : [doc_image];
      files.forEach(file => formData.append('doc_image', file));
    }

    const response = await api.post(
      '/profile/update_company_documents/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update company document:', error);
    throw error;
  }
};

export const deleteCompanyDoc = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/profile/delete_company_documents/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to delete company document:', error);
    throw error;
  }
};

/* ----------------------------------
   🔧 Job Creation & Management (For Companies)
----------------------------------- */
export const addJob = async data => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const {images, ...apiData} = data;

    const formData = new FormData();
    formData.append('apiData', JSON.stringify(apiData));

    // Handle job images
    if (images) {
      const file =
        Array.isArray(images) && images.length > 0 ? images[0] : images;
      formData.append('images', file);
    }

    const response = await api.post('/service/addJobs/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to add job:', error);
    throw error;
  }
};

/* ----------------------------------
   📋 Orders & Projects Management
----------------------------------- */
export const getOrders = async (statusParams = 'ongoing') => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.get('/service/ongoing_projects/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get orders:', error);
    throw error;
  }
};

export const getOrderProjectDetail = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/service/get_project_details/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get order project detail:', error);
    throw error;
  }
};

// Project Status Update
export const completeProjectOrder = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/service/complete_project/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to complete project order:', error);
    throw error;
  }
};

/* ----------------------------------
   🎨 Portfolio Profile Management
----------------------------------- */
export const selectProfile = async data => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.post(
      '/profile/update_template/',
      {profile_template: data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Failed to select profile template:', error);
    throw error;
  }
};

export const getPublicProfile = async username => {
  try {
    const response = await api.get(`/public/user/${username}/`);
    return response.data;
  } catch (error) {
    console.error('Failed to get public profile:', error);
    throw error;
  }
};

/* ----------------------------------
   📊 Analytics & Reports
----------------------------------- */
export const getAnalytics = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      period: params.period || 'month',
      start_date: params.start_date || '',
      end_date: params.end_date || '',
    }).toString();

    const response = await api.get(`/service/analytics?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get analytics:', error);
    throw error;
  }
};

export const getEarningsReport = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      period: params.period || 'month',
      year: params.year || new Date().getFullYear(),
    }).toString();

    const response = await api.get(`/service/earnings_report?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get earnings report:', error);
    throw error;
  }
};

/* ----------------------------------
   🔔 Notifications Management
----------------------------------- */
export const getNotifications = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      unread_only: params.unread_only || false,
    }).toString();

    const response = await api.get(`/notifications?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get notifications:', error);
    throw error;
  }
};

export const markNotificationAsRead = async notificationId => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData({notification_id: notificationId});
    const response = await api.post(
      '/notifications/mark_read/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.post(
      '/notifications/mark_all_read/',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    throw error;
  }
};

/* ----------------------------------
   💬 Chat & Messaging
----------------------------------- */
export const getChatConversations = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
    }).toString();

    const response = await api.get(`/chat/conversations?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get chat conversations:', error);
    throw error;
  }
};

export const getChatMessages = async (conversationId, params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 50,
    }).toString();

    const response = await api.get(
      `/chat/conversations/${conversationId}/messages?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get chat messages:', error);
    throw error;
  }
};

export const sendChatMessage = async (conversationId, messageData) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData({
      conversation_id: conversationId,
      ...messageData,
    });
    const response = await api.post(
      '/chat/send_message/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to send chat message:', error);
    throw error;
  }
};

/* ----------------------------------
   ⚙️ Settings & Preferences
----------------------------------- */
export const getSettings = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.get('/settings/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get settings:', error);
    throw error;
  }
};

export const updateSettings = async settingsData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(settingsData);
    const response = await api.post(
      '/settings/update/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update settings:', error);
    throw error;
  }
};

/* ----------------------------------
   📋 Reviews & Ratings
----------------------------------- */
export const getMyReviews = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
    }).toString();

    const response = await api.get(`/reviews/my_reviews?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get my reviews:', error);
    throw error;
  }
};

export const submitReview = async reviewData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(reviewData);
    const response = await api.post(
      '/reviews/submit/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to submit review:', error);
    throw error;
  }
};

/* ----------------------------------
   💰 Payments & Billing
----------------------------------- */
export const getPaymentHistory = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      status: params.status || '',
    }).toString();

    const response = await api.get(`/payments/history?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get payment history:', error);
    throw error;
  }
};

export const getWalletBalance = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.get('/wallet/balance/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get wallet balance:', error);
    throw error;
  }
};

export const requestWithdrawal = async withdrawalData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(withdrawalData);
    const response = await api.post(
      '/wallet/withdraw/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to request withdrawal:', error);
    throw error;
  }
};

/* ----------------------------------
   🎯 Skills & Categories Management
----------------------------------- */
export const getMySkills = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.get('/profile/skills/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get my skills:', error);
    throw error;
  }
};

export const updateSkills = async skillsData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(skillsData);
    const response = await api.post(
      '/profile/update_skills/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update skills:', error);
    throw error;
  }
};

export const getAvailableSkills = async () => {
  try {
    const response = await api.get('/skills/available/');
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get available skills:', error);
    throw error;
  }
};

/* ----------------------------------
   🔄 Data Sync & Cache Management
----------------------------------- */
export const syncOfflineData = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.post(
      '/sync/offline_data/',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to sync offline data:', error);
    throw error;
  }
};

export const clearCache = async () => {
  try {
    await AsyncStorage.multiRemove([
      'dashboard_cache',
      'jobs_cache',
      'profile_cache',
      'services_cache',
    ]);
    return {success: true, message: 'Cache cleared successfully'};
  } catch (error) {
    console.error('Failed to clear cache:', error);
    throw error;
  }
};

/* ----------------------------------
   🛡️ Security & Authentication Helpers
----------------------------------- */
export const verifyToken = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.post(
      '/auth/verify_token/',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return response.data;
  } catch (error) {
    console.error('Failed to verify token:', error);
    throw error;
  }
};

export const refreshAuthToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem('REFRESH_TOKEN');
    if (!refreshToken) {
      throw new Error('No refresh token found');
    }

    const response = await api.post('/auth/refresh/', {
      refresh: refreshToken,
    });

    if (response.data.access) {
      await AsyncStorage.setItem('ACCESS_TOKEN', response.data.access);
    }

    return response.data;
  } catch (error) {
    console.error('Failed to refresh auth token:', error);
    throw error;
  }
};

/* ----------------------------------
   💼 JOBS API - Complete Mobile Integration
----------------------------------- */

// Get available jobs with comprehensive filtering and pagination
export const getAvailableJobs = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      sort_by: params.sort_by || 'created_date',
      sort_order: params.sort_order || 'desc',
      ...(params.category && {category: params.category}),
      ...(params.budget_min && {budget_min: params.budget_min}),
      ...(params.budget_max && {budget_max: params.budget_max}),
      ...(params.location && {location: params.location}),
      ...(params.city && {city: params.city}),
      ...(params.urgent !== undefined && {urgent: params.urgent}),
      ...(params.experience_level && {
        experience_level: params.experience_level,
      }),
      ...(params.job_type && {job_type: params.job_type}),
      ...(params.search_query && {search: params.search_query}),
    }).toString();

    const response = await api.get(
      `/service/get_available_jobs?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const decryptedData = JSON.parse(decryptData(response.data.data));

    // Transform the response to match mobile expectations
    return {
      jobs: decryptedData.jobs || [],
      statistics: decryptedData.statistics || {
        available_jobs: 0,
        applied_jobs: 0,
        success_rate: 0,
        saved_jobs: 0,
        ratio_available_jobs: 0,
        ratio_applied_jobs: 0,
        ratio_success_rate: 0,
        ratio_saved_jobs: 0,
      },
      pagination: decryptedData.pagination || {
        total_jobs: 0,
        total_pages: 1,
        current_page: 1,
        has_more: false,
      },
      filters: decryptedData.filters || {
        matching_categories: [],
        available_categories: [],
        available_locations: [],
      },
    };
  } catch (error) {
    console.error('Failed to get available jobs:', error);
    throw error;
  }
};

// Get job details by job ID
export const getJobDetail = async jobData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(jobData);
    const response = await api.post(
      '/service/get_job_details/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const decryptedData = JSON.parse(decryptData(response.data.data));

    return {
      job: decryptedData.job || null,
      user_services: decryptedData.user_services || [],
      matching_services_count: decryptedData.matching_services_count || 0,
      can_apply: decryptedData.can_apply || false,
      application_status: decryptedData.application_status || null,
    };
  } catch (error) {
    console.error('Failed to get job details:', error);
    throw error;
  }
};

// Alternative function name for consistency
export const getJobDetails = async jobId => {
  return getJobDetail({job_id: jobId});
};

// Apply for a job
export const applyForJob = async applicationData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(applicationData);
    const response = await api.post(
      '/service/apply_job/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to apply for job:', error);
    throw error;
  }
};

// Get user's job applications with pagination and status filtering
export const getMyApplications = async (page = 1, limit = 10, status = '') => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(status && {status}),
    }).toString();

    const response = await api.get(
      `/service/get_my_applications?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const decryptedData = JSON.parse(decryptData(response.data.data));

    return {
      applications: decryptedData.applications || [],
      statistics: decryptedData.statistics || {
        total_applications: 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
        in_progress: 0,
        completed: 0,
      },
      pagination: decryptedData.pagination || {
        total_applications: 0,
        total_pages: 1,
        current_page: page,
        has_more: false,
      },
    };
  } catch (error) {
    console.error('Failed to get applications:', error);
    throw error;
  }
};

// Save a job to favorites
export const saveJob = async jobData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    // Handle both object and direct job_id
    const data = encryptData(
      typeof jobData === 'object' ? jobData : {job_id: jobData},
    );

    const response = await api.post(
      '/service/save_job/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to save job:', error);
    throw error;
  }
};

// Remove job from favorites
export const unsaveJob = async jobData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    // Handle both object and direct job_id
    const data = encryptData(
      typeof jobData === 'object' ? jobData : {job_id: jobData},
    );

    const response = await api.post(
      '/service/unsave_job/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to unsave job:', error);
    throw error;
  }
};

// Get saved jobs with pagination
export const getSavedJobs = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      page: params.page || params.pageParam || 1,
      limit: params.limit || 10,
    }).toString();

    const response = await api.get(`/service/get_saved_jobs?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const decryptedData = JSON.parse(decryptData(response.data.data));

    return {
      saved_jobs: decryptedData.saved_jobs || [],
      pagination: decryptedData.pagination || {
        total_saved_jobs: 0,
        total_pages: 1,
        current_page: 1,
        has_more: false,
      },
    };
  } catch (error) {
    console.error('Failed to get saved jobs:', error);
    throw error;
  }
};

// Alternative function name for React Query compatibility
export const getSavedjobs = async ({pageParam = 1}) => {
  return getSavedJobs({pageParam});
};

// Withdraw job application
export const withDrawApplication = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/service/update_application/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to withdraw application:', error);
    throw error;
  }
};

// Update job application
export const updateApplication = async apiData => {
  return withDrawApplication(apiData); // Same endpoint, different action
};

// Get job statistics and counts
export const getJobsCount = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.post(
      '/service/getJobsCount/',
      {}, // Empty object as per your backend
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const decryptedData = JSON.parse(decryptData(response.data.data));

    return {
      total_jobs: decryptedData.total_jobs || 0,
      available_jobs: decryptedData.available_jobs || 0,
      applied_jobs: decryptedData.applied_jobs || 0,
      saved_jobs: decryptedData.saved_jobs || 0,
      success_rate: decryptedData.success_rate || 0,
      statistics: decryptedData.statistics || {},
    };
  } catch (error) {
    console.error('Failed to get jobs count:', error);
    throw error;
  }
};

// Search jobs with advanced filters
export const searchJobs = async (searchParams = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      q: searchParams.query || searchParams.search_query || '',
      category: searchParams.category || '',
      location: searchParams.location || '',
      city: searchParams.city || '',
      budget_min: searchParams.budget_min || '',
      budget_max: searchParams.budget_max || '',
      urgent: searchParams.urgent || false,
      experience_level: searchParams.experience_level || '',
      job_type: searchParams.job_type || '',
      page: searchParams.page || 1,
      limit: searchParams.limit || 10,
      sort_by: searchParams.sort_by || 'created_date',
      sort_order: searchParams.sort_order || 'desc',
    }).toString();

    const response = await api.get(`/service/search_jobs?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to search jobs:', error);
    throw error;
  }
};

// Get job categories for filtering
export const getJobCategories = async () => {
  try {
    const response = await api.get('/service/job_categories/');
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get job categories:', error);
    throw error;
  }
};

// Get urgent jobs specifically
export const getUrgentJobs = async (params = {}) => {
  return getAvailableJobs({
    ...params,
    urgent: true,
  });
};

// Get jobs by category
export const getJobsByCategory = async (category, params = {}) => {
  return getAvailableJobs({
    ...params,
    category,
  });
};

// Get recommended jobs based on user profile
export const getRecommendedJobs = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      recommended: true,
    }).toString();

    const response = await api.get(
      `/service/get_available_jobs?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get recommended jobs:', error);
    throw error;
  }
};

// Check if user has applied to a specific job
export const checkJobApplicationStatus = async jobId => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData({job_id: jobId});
    const response = await api.post(
      '/service/check_application_status/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to check application status:', error);
    return {has_applied: false, application_status: null};
  }
};

// Get job application details
export const getApplicationDetails = async applicationId => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData({application_id: applicationId});
    const response = await api.post(
      '/service/get_application_details/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get application details:', error);
    throw error;
  }
};
