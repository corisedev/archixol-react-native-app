import api from './index';
import {encryptData, decryptData} from '../utils/crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* =====================================
   🏠 CLIENT DASHBOARD
===================================== */

/**
 * Get client dashboard data
 * @returns {Promise<Object>} Dashboard data
 */
export const getClientDashboard = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/client/dashboard/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get client dashboard:', error);
    throw error;
  }
};

/* =====================================
   👤 CLIENT PROFILE MANAGEMENT
===================================== */

/**
 * Get client profile
 * @returns {Promise<Object>} Client profile data
 */
export const getClientProfile = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/client/profile/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get client profile:', error);
    throw error;
  }
};

/**
 * Update client profile
 * @param {Object} apiData - Profile data with optional profile_image
 * @returns {Promise<Object>} Updated profile data
 */
export const updateClientProfile = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const {profile_image, ...dataWithoutFiles} = apiData;
    const data = encryptData(dataWithoutFiles);

    const formData = new FormData();
    formData.append('data', data);

    // Handle profile image
    if (profile_image) {
      const file =
        Array.isArray(profile_image) && profile_image.length > 0
          ? profile_image[0]
          : profile_image;
      formData.append('profile_image', file);
    }

    const response = await api.post('/client/profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update client profile:', error);
    throw error;
  }
};

/**
 * Change password
 * @param {Object} apiData - Password change data
 * @returns {Promise<Object>} Response data
 */
export const changePassword = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/client/change_password/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to change password:', error);
    throw error;
  }
};

/**
 * Get additional settings
 * @returns {Promise<Object>} Additional settings data
 */
export const getAdditionalSettings = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/client/additional_settings/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get additional settings:', error);
    throw error;
  }
};

/**
 * Update additional settings
 * @param {Object} apiData - Settings data
 * @returns {Promise<Object>} Updated settings data
 */
export const updateAdditionalSettings = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/client/additional_settings/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update additional settings:', error);
    throw error;
  }
};

/* =====================================
   💼 JOBS & PROJECTS MANAGEMENT
===================================== */

/**
 * Get jobs and projects
 * @returns {Promise<Object>} Jobs and projects data
 */
export const getJobsAndProjects = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/client/jobs/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get jobs and projects:', error);
    throw error;
  }
};

/**
 * Create job
 * @param {Object} apiData - Job data with optional docs
 * @returns {Promise<Object>} Created job data
 */
export const createJob = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const {docs, ...dataWithoutFiles} = apiData;
    const data = encryptData(dataWithoutFiles);

    const formData = new FormData();
    formData.append('data', data);

    // Handle job documents
    if (docs && docs.length > 0) {
      const documents = Array.isArray(docs) ? docs : [docs];
      documents.forEach(doc => formData.append('docs', doc));
    }

    const response = await api.post('/client/create_jobs/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to create job:', error);
    throw error;
  }
};

/**
 * Create project
 * @param {Object} projectData - Project data with optional docs
 * @returns {Promise<Object>} Created project data
 */
export const createProject = async projectData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const {docs, ...dataWithoutFiles} = projectData;
    const data = encryptData(dataWithoutFiles);

    const formData = new FormData();
    formData.append('data', data);

    // Handle project documents
    if (docs && docs.length > 0) {
      const documents = Array.isArray(docs) ? docs : [docs];
      documents.forEach(doc => formData.append('docs', doc));
    }

    const response = await api.post('/client/create_jobs/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to create project:', error);
    throw error;
  }
};

/**
 * Get my projects
 * @returns {Promise<Object>} My projects data
 */
export const getMyProjects = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/client/my-projects/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get my projects:', error);
    throw error;
  }
};

/**
 * Get my jobs with pagination
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} My jobs data
 */
export const getMyJobs = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.status && {status: params.status}),
    }).toString();

    const response = await api.get(`/client/my_jobs/?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get my jobs:', error);
    throw error;
  }
};

/**
 * Get job proposals
 * @param {Object} apiData - Job ID data
 * @returns {Promise<Object>} Job proposals data
 */
export const getJobProposals = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/client/get_job_proposals/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get job proposals:', error);
    throw error;
  }
};

/**
 * Proposal action (accept/reject)
 * @param {Object} apiData - Proposal action data
 * @returns {Promise<Object>} Action result
 */
export const proposalAction = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/client/proposal_action/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to perform proposal action:', error);
    throw error;
  }
};

/**
 * Get projects by status
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Projects by status data
 */
export const getProjectsByStatus = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.status && {status: params.status}),
    }).toString();

    const response = await api.get(
      `/client/projects_by_status/?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get projects by status:', error);
    throw error;
  }
};

/**
 * Cancel project
 * @param {Object} apiData - Project cancellation data
 * @returns {Promise<Object>} Cancellation result
 */
export const cancelProject = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/client/cancel_project/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to cancel project:', error);
    throw error;
  }
};

/**
 * Complete project
 * @param {Object} apiData - Project completion data
 * @returns {Promise<Object>} Completion result
 */
export const completeProject = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/client/complete_project/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to complete project:', error);
    throw error;
  }
};

/**
 * Get project details
 * @param {string|number} projectId - Project ID
 * @returns {Promise<Object>} Project details
 */
export const getProjectDetails = async projectId => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData({project_id: projectId});
    const response = await api.post(
      '/client/get_project_details/',
      {data},
      {
        headers: {Authorization: `Bearer ${token}`},
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get project details:', error);
    throw error;
  }
};

/**
 * Save job
 * @param {string|number} jobId - Job ID
 * @returns {Promise<Object>} Save result
 */
export const saveJob = async jobId => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData({job_id: jobId});
    const response = await api.post(
      '/client/save_job/',
      {data},
      {
        headers: {Authorization: `Bearer ${token}`},
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to save job:', error);
    throw error;
  }
};

/**
 * Unsave job
 * @param {string|number} jobId - Job ID
 * @returns {Promise<Object>} Unsave result
 */
export const unsaveJob = async jobId => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData({job_id: jobId});
    const response = await api.post(
      '/client/unsave_job/',
      {data},
      {
        headers: {Authorization: `Bearer ${token}`},
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to unsave job:', error);
    throw error;
  }
};

/**
 * Get saved jobs
 * @returns {Promise<Object>} Saved jobs data
 */
export const getSavedJobs = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/client/get_saved_jobs/', {
      headers: {Authorization: `Bearer ${token}`},
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get saved jobs:', error);
    throw error;
  }
};

/**
 * Upload client documents
 * @param {Array} docs - Documents array
 * @returns {Promise<Object>} Upload result
 */
export const uploadClientDocs = async (docs = []) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const formData = new FormData();
    const documents = Array.isArray(docs) ? docs : [docs];
    documents.forEach(doc => formData.append('docs', doc));

    const response = await api.post('/client/upload_docs/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to upload client docs:', error);
    throw error;
  }
};

/**
 * Delete job
 * @param {string|number} jobId - Job ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteJob = async jobId => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData({job_id: jobId});
    const response = await api.post(
      '/client/delete_job/',
      {data},
      {
        headers: {Authorization: `Bearer ${token}`},
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to delete job:', error);
    throw error;
  }
};

/**
 * Update job
 * @param {string|number} jobId - Job ID
 * @param {Object} updatedData - Updated job data
 * @returns {Promise<Object>} Update result
 */
export const updateJob = async (jobId, updatedData) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const {docs, ...rest} = updatedData;
    const data = encryptData({...rest, job_id: jobId});

    const formData = new FormData();
    formData.append('data', data);

    if (docs && docs.length > 0) {
      const documents = Array.isArray(docs) ? docs : [docs];
      documents.forEach(doc => formData.append('docs', doc));
    }

    const response = await api.post('/client/update_job/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update job:', error);
    throw error;
  }
};

/**
 * Get job details
 * @param {string|number} jobId - Job ID
 * @returns {Promise<Object>} Job details
 */
export const getJobDetails = async jobId => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData({job_id: jobId});
    const response = await api.post(
      '/client/job_details/',
      {data},
      {
        headers: {Authorization: `Bearer ${token}`},
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get job details:', error);
    throw error;
  }
};

/* =====================================
   🛒 ORDERS MANAGEMENT
===================================== */

/**
 * Get orders
 * @returns {Promise<Object>} Orders data
 */
export const getOrders = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/client/orders/', {
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

/**
 * Get order details
 * @param {string|number|Object} orderId - Order ID or order object
 * @returns {Promise<Object>} Order details
 */
export const getOrderDetails = async orderId => {
  try {
    console.log('🔄 getOrderDetails API called with orderId:', orderId);

    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    // Handle different orderId formats
    const orderIdToSend =
      typeof orderId === 'object'
        ? orderId.order_id || orderId.id || orderId._id
        : orderId;

    console.log('📤 Sending order_id:', orderIdToSend);

    const data = encryptData({order_id: orderIdToSend});

    const response = await api.post(
      '/client/get_order_details/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    console.log('📥 API Response:', response.data);

    if (!response.data || !response.data.data) {
      throw new Error('Invalid response format from server');
    }

    const decryptedData = decryptData(response.data.data);
    const parsedData = JSON.parse(decryptedData);

    console.log('✅ Parsed order data:', parsedData);
    return parsedData;
  } catch (error) {
    console.error('💥 getOrderDetails Error:', error);

    if (error.response) {
      console.error('API Error Response:', error.response.data);
      throw new Error(
        error.response.data?.message || 'Failed to get order details',
      );
    }

    throw error;
  }
};

/**
 * Cancel order
 * @param {Object} apiData - Order cancellation data
 * @returns {Promise<Object>} Cancellation result
 */
export const cancelOrder = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/client/cancel_order/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to cancel order:', error);
    throw error;
  }
};

/**
 * Request return order
 * @param {Object} apiData - Return request data
 * @returns {Promise<Object>} Return request result
 */
export const requestReturnOrder = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/client/request_return/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to request return:', error);
    throw error;
  }
};

/**
 * Get checkout details
 * @returns {Promise<Object>} Checkout details
 */
export const getCheckoutDetails = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/client/checkout_details/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get checkout details:', error);
    throw error;
  }
};

/**
 * Place order/checkout
 * @param {Object} apiData - Order data
 * @returns {Promise<Object>} Order placement result
 */
export const checkoutOrder = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/client/place_order/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to place order:', error);
    throw error;
  }
};

/* =====================================
   📦 PRODUCTS & SERVICES
===================================== */

/**
 * Get products
 * @returns {Promise<Object>} Products data
 */
/**
 * Get products with enhanced filtering and search
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Products data
 */
export const getProducts = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    // Build query parameters
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.search && {search: params.search}),
      ...(params.category && {category: params.category}),
      ...(params.brand && {brand: params.brand}),
      ...(params.price_min && {price_min: params.price_min}),
      ...(params.price_max && {price_max: params.price_max}),
      ...(params.rating && {rating: params.rating}),
      ...(params.sort_by && {sort_by: params.sort_by}),
      ...(params.featured && {featured: params.featured}),
    }).toString();

    const response = await api.get(`/client/products/?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const decryptedData = decryptData(response.data.data);
    const parsedData = JSON.parse(decryptedData);

    // Ensure proper structure
    return {
      products_list:
        parsedData.products_list || parsedData.products || parsedData,
      pagination: parsedData.pagination || {
        currentPage: params.page || 1,
        hasNextPage:
          (parsedData.products_list || parsedData.products || parsedData)
            .length === (params.limit || 20),
        totalProducts:
          parsedData.totalProducts ||
          (parsedData.products_list || parsedData.products || parsedData)
            .length,
      },
    };
  } catch (error) {
    console.error('Failed to get products:', error);
    throw error;
  }
};


/**
 * Get single product
 * @param {Object} apiData - Product ID data
 * @returns {Promise<Object>} Product data
 */
export const getProduct = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/client/product/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get product:', error);
    throw error;
  }
};

/**
 * Get services
 * @returns {Promise<Object>} Services data
 */
export const getServices = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/client/services/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get services:', error);
    throw error;
  }
};

/**
 * Get single service
 * @param {Object} apiData - Service ID data
 * @returns {Promise<Object>} Service data
 */
export const getService = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/client/service/',
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

/* =====================================
   🔍 SEARCH & FILTERING
===================================== */

/**
 * Search products
 * @param {string} searchQuery - Search query
 * @param {Object} filters - Search filters
 * @returns {Promise<Object>} Search results
 */
export const searchProducts = async (searchQuery, filters = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      q: searchQuery,
      ...(filters.category && {category: filters.category}),
      ...(filters.price_min && {price_min: filters.price_min}),
      ...(filters.price_max && {price_max: filters.price_max}),
      ...(filters.rating && {rating: filters.rating}),
      page: filters.page || 1,
      limit: filters.limit || 20,
    }).toString();

    const response = await api.get(`/client/products/?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to search products:', error);
    throw error;
  }
};

/**
 * Search services
 * @param {string} searchQuery - Search query
 * @param {Object} filters - Search filters
 * @returns {Promise<Object>} Search results
 */
export const searchServices = async (searchQuery, filters = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      q: searchQuery,
      ...(filters.category && {category: filters.category}),
      ...(filters.location && {location: filters.location}),
      ...(filters.rating && {rating: filters.rating}),
      page: filters.page || 1,
      limit: filters.limit || 20,
    }).toString();

    const response = await api.get(`/client/services/?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to search services:', error);
    throw error;
  }
};

/* =====================================
   📊 ANALYTICS & STATISTICS
===================================== */

/**
 * Get spending analytics
 * @param {string} period - Analytics period (month, year, etc.)
 * @returns {Promise<Object>} Spending analytics data
 */
export const getSpendingAnalytics = async (period = 'month') => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get(
      `/client/analytics/spending/?period=${period}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get spending analytics:', error);
    throw error;
  }
};

/**
 * Get project analytics
 * @returns {Promise<Object>} Project analytics data
 */
export const getProjectAnalytics = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/client/analytics/projects/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get project analytics:', error);
    throw error;
  }
};

/* =====================================
   💳 PAYMENTS & BILLING
===================================== */

/**
 * Get payment history
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Payment history data
 */
export const getPaymentHistory = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.status && {status: params.status}),
      ...(params.type && {type: params.type}),
    }).toString();

    const response = await api.get(`/client/payments/history/?${queryParams}`, {
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

/**
 * Process payment
 * @param {Object} apiData - Payment data
 * @returns {Promise<Object>} Payment result
 */
export const processPayment = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/client/payments/process/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to process payment:', error);
    throw error;
  }
};

/* =====================================
   🔔 NOTIFICATIONS
===================================== */

/**
 * Get notifications with proper error handling
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Notifications data
 */
export const getNotifications = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    // Prepare query parameters
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.type && {type: params.type}),
      ...(params.read !== undefined && {read: params.read}),
    }).toString();

    let response;

    // Try multiple endpoint variations
    const endpoints = [
      `/account/get_notifications/?${queryParams}`, // Web version endpoint
      `/client/notifications/?${queryParams}`, // Current mobile endpoint
      `/client/notifications?${queryParams}`, // Without trailing slash
    ];

    let lastError;

    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Trying endpoint: ${endpoint}`);
        response = await api.get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log(`✅ Success with endpoint: ${endpoint}`);
        break; // Success, exit loop
      } catch (error) {
        console.log(
          `❌ Failed with endpoint: ${endpoint}`,
          error.response?.status,
        );
        lastError = error;
        continue; // Try next endpoint
      }
    }

    if (!response) {
      throw lastError || new Error('All notification endpoints failed');
    }

    const decryptedData = decryptData(response.data.data);
    return JSON.parse(decryptedData);
  } catch (error) {
    console.error('Failed to get notifications:', error);
    throw error;
  }
};
/**
 * Mark notification as read - Updated version
 * @param {string|number} notificationId - Notification ID
 * @returns {Promise<Object>} Mark read result
 */
export const markNotificationAsRead = async notificationId => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData({notification_id: notificationId});

    let response;

    // Try multiple endpoints
    const endpoints = [
      '/client/notifications/mark_read/',
      '/account/mark_notification_read/',
    ];

    let lastError;

    for (const endpoint of endpoints) {
      try {
        response = await api.post(
          endpoint,
          {data},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        break;
      } catch (error) {
        lastError = error;
        continue;
      }
    }

    if (!response) {
      throw lastError || new Error('All mark read endpoints failed');
    }

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read - Updated version
 * @param {Object} apiData - Mark all read data
 * @returns {Promise<Object>} Mark all read result
 */
export const markNotificationsRead = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);

    // Use the working endpoint from web version
    const response = await api.post(
      '/account/mark_all_read/',
      {data},
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

/* =====================================
   💬 MESSAGING
===================================== */

/**
 * Get conversations
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Conversations data
 */
export const getConversations = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
    }).toString();

    const response = await api.get(`/client/conversations/?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get conversations:', error);
    throw error;
  }
};

/**
 * Get conversation messages
 * @param {string|number} conversationId - Conversation ID
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Conversation messages data
 */
export const getConversationMessages = async (conversationId, params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 50,
    }).toString();

    const response = await api.get(
      `/client/conversations/${conversationId}/messages/?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get conversation messages:', error);
    throw error;
  }
};

/**
 * Send message
 * @param {Object} apiData - Message data
 * @returns {Promise<Object>} Send message result
 */
export const sendMessage = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/client/conversations/send_message/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
};

/* =====================================
   ⭐ REVIEWS & RATINGS
===================================== */

/**
 * Get reviews
 * @param {Object} params - Query parameters
 * @returns {Promise<Object>} Reviews data
 */
export const getReviews = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.type && {type: params.type}), // 'given' or 'received'
    }).toString();

    const response = await api.get(`/client/reviews/?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get reviews:', error);
    throw error;
  }
};

/**
 * Submit review
 * @param {Object} apiData - Review data
 * @returns {Promise<Object>} Submit review result
 */
export const submitReview = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/client/reviews/submit/',
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

/* =====================================
   📋 FAVORITES & WISHLISTS
===================================== */

/**
 * Get favorites
 * @param {string} type - Favorites type ('all', 'products', 'services', etc.)
 * @returns {Promise<Object>} Favorites data
 */
export const getFavorites = async (type = 'all') => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get(`/client/favorites/?type=${type}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get favorites:', error);
    throw error;
  }
};

/**
 * Add to favorites
 * @param {Object} apiData - Favorite item data
 * @returns {Promise<Object>} Add to favorites result
 */
export const addToFavorites = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/client/favorites/add/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to add to favorites:', error);
    throw error;
  }
};

/**
 * Remove from favorites
 * @param {Object} apiData - Favorite item data
 * @returns {Promise<Object>} Remove from favorites result
 */
export const removeFromFavorites = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/client/favorites/remove/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to remove from favorites:', error);
    throw error;
  }
};

/* =====================================
   🎫 SUPPORT & TICKETS
===================================== */

/**
 * Submit support ticket
 * @param {string} subject - Ticket subject
 * @param {string} message - Ticket message
 * @returns {Promise<Object>} Submit ticket result
 */
export const submitSupportTicket = async (subject, message) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData({subject, message});

    const response = await api.post(
      '/client/submit_support_ticket/',
      {data},
      {
        headers: {Authorization: `Bearer ${token}`},
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to submit support ticket:', error);
    throw error;
  }
};

/**
 * Get my support tickets
 * @returns {Promise<Object>} Support tickets data
 */
export const getMySupportTickets = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/client/my_support_tickets/', {
      headers: {Authorization: `Bearer ${token}`},
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get support tickets:', error);
    throw error;
  }
};

/**
 * Get invoice list
 * @returns {Promise<Object>} Invoice list data
 */
export const getInvoiceList = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/client/get_invoice_list/', {
      headers: {Authorization: `Bearer ${token}`},
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get invoice list:', error);
    throw error;
  }
};

/**
 * Download invoice
 * @param {string|number} invoiceId - Invoice ID
 * @returns {Promise<Blob>} Invoice file data
 */
export const downloadInvoice = async invoiceId => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get(`/client/invoice/${invoiceId}/`, {
      headers: {Authorization: `Bearer ${token}`},
      responseType: 'blob', // for file download
    });

    return response.data; // You can download or preview
  } catch (error) {
    console.error('Failed to download invoice:', error);
    throw error;
  }
};

/* =====================================
   🔧 UTILITY FUNCTIONS
===================================== */

/**
 * Get authentication token from AsyncStorage
 * @returns {Promise<string|null>} Access token
 */
export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('ACCESS_TOKEN');
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} Authentication status
 */
export const isAuthenticated = async () => {
  try {
    const token = await getAuthToken();
    return !!token;
  } catch (error) {
    console.error('Failed to check authentication:', error);
    return false;
  }
};

/**
 * Clear authentication token
 * @returns {Promise<void>}
 */
export const clearAuthToken = async () => {
  try {
    await AsyncStorage.removeItem('ACCESS_TOKEN');
  } catch (error) {
    console.error('Failed to clear auth token:', error);
  }
};

/* =====================================
   📤 EXPORTS
===================================== */

// Export all functions as named exports
export default {
  // Dashboard
  getClientDashboard,

  // Profile Management
  getClientProfile,
  updateClientProfile,
  changePassword,
  getAdditionalSettings,
  updateAdditionalSettings,

  // Jobs & Projects
  getJobsAndProjects,
  createJob,
  createProject,
  getMyProjects,
  getMyJobs,
  getJobProposals,
  proposalAction,
  getProjectsByStatus,
  cancelProject,
  completeProject,
  getProjectDetails,
  saveJob,
  unsaveJob,
  getSavedJobs,
  uploadClientDocs,
  deleteJob,
  updateJob,
  getJobDetails,

  // Orders
  getOrders,
  getOrderDetails,
  cancelOrder,
  requestReturnOrder,
  getCheckoutDetails,
  checkoutOrder,

  // Products & Services
  getProducts,
  getProduct,
  getServices,
  getService,

  // Search & Filtering
  searchProducts,
  searchServices,

  // Analytics
  getSpendingAnalytics,
  getProjectAnalytics,

  // Payments
  getPaymentHistory,
  processPayment,

  // Notifications
  getNotifications,
  markNotificationAsRead,
  markNotificationsRead,

  // Messaging
  getConversations,
  getConversationMessages,
  sendMessage,

  // Reviews
  getReviews,
  submitReview,

  // Favorites
  getFavorites,
  addToFavorites,
  removeFromFavorites,

  // Support
  submitSupportTicket,
  getMySupportTickets,
  getInvoiceList,
  downloadInvoice,

  // Utilities
  getAuthToken,
  isAuthenticated,
  clearAuthToken,
};
