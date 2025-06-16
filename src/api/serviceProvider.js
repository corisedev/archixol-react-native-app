import api from './index';
import {encryptData, decryptData} from '../utils/crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ----------------------------------
   🔹 Dashboard
----------------------------------- */
export const getServiceProviderDashboard = async () => {
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
};

/* ----------------------------------
   💼 Certificates
----------------------------------- */
export const getCertificates = async () => {
  const response = await api.get('/profile/get_certificates/');
  return JSON.parse(decryptData(response.data.data));
};



// Add these functions to your existing serviceProvider.js file

/* ----------------------------------
   🎨 Portfolio Templates
----------------------------------- */

export const getPortfolioTemplates = async () => {
  try {
    const response = await api.get('/profile/templates/');
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
   🏢 Services - Updated with proper backend integration
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
   💼 Certificate Management (Fixed function name)
----------------------------------- */

export const getCertificate = async () => {
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

// Add these functions to your serviceProvider.js file

/* ----------------------------------
   💼 JOB MANAGEMENT - New Functions
----------------------------------- */

export const getJobsCount = async () => {
  const token = await AsyncStorage.getItem('ACCESS_TOKEN');
  const response = await api.post(
    '/service/getJobsCount/',
    {}, // send empty object, not { apiData: {} }
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return JSON.parse(decryptData(response.data.data));
};


// Get available jobs with filters and pagination
export const getAvailableJobs = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      sort_by: params.sort_by || 'created_date',
      sort_order: params.sort_order || 'desc',
      ...(params.category && {category: params.category}),
      ...(params.budget_min && {budget_min: params.budget_min}),
      ...(params.budget_max && {budget_max: params.budget_max}),
      ...(params.location && {location: params.location}),
      ...(params.urgent !== undefined && {urgent: params.urgent}),
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
    console.error('Failed to get available jobs:', error);
    throw error;
  }
};

// Get job details
export const getJobDetails = async jobId => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData({job_id: jobId});
    const response = await api.post(
      '/service/get_job_details/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get job details:', error);
    throw error;
  }
};

// Apply for a job
export const applyForJob = async applicationData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
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

// Get user's applications
export const getMyApplications = async (params = {}) => {
  const token = await AsyncStorage.getItem('ACCESS_TOKEN');
  console.log('🧪 getMyApplications token:', token);

  const queryParams = new URLSearchParams({
    page: params.page || 1,
    limit: params.limit || 10,
    ...(params.status && {status: params.status}),
  }).toString();

  console.log('📦 getMyApplications queryParams:', queryParams);

  try {
    const response = await api.get(
      `/service/get_my_applications?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error(
      '❌ Failed to get applications:',
      error.response?.data || error.message,
    );
    throw error;
  }
};

// Save a job
export const saveJob = async jobId => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData({job_id: jobId});
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

// Unsave a job
export const unsaveJob = async jobId => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData({job_id: jobId});
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

// Get saved jobs
export const getSavedJobs = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
    }).toString();

    const response = await api.get(`/service/get_saved_jobs?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get saved jobs:', error);
    throw error;
  }
};
