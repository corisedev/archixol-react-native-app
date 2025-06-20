import api from './index';
import {encryptData, decryptData} from '../utils/crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ----------------------------------
   🏠 CLIENT DASHBOARD
----------------------------------- */

// Get client dashboard data
export const getClientDashboard = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/client/dashboard', {
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

/* ----------------------------------
   👤 CLIENT PROFILE MANAGEMENT
----------------------------------- */

// Get client profile
export const getClientProfile = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/client/profile', {
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

// Update client profile
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

    const response = await api.post('/client/profile', formData, {
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

// Change password
export const changePassword = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/client/change_password',
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

// Get additional settings
export const getAdditionalSettings = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.get('/client/additional_settings', {
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

// Update additional settings
export const updateAdditionalSettings = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/client/additional_settings',
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

/* ----------------------------------
   💼 JOBS & PROJECTS MANAGEMENT
----------------------------------- */

// Get jobs and projects
export const getJobsAndProjects = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.get('/client/jobs', {
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

// Create job
export const createJob = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const {docs, ...dataWithoutFiles} = apiData;
    const data = encryptData(dataWithoutFiles);

    const formData = new FormData();
    formData.append('data', data);

    // Handle job documents
    if (docs && docs.length > 0) {
      const documents = Array.isArray(docs) ? docs : [docs];
      documents.forEach(doc => formData.append('docs', doc));
    }

    const response = await api.post('/client/create_jobs', formData, {
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

    const response = await api.post('/client/create_jobs', formData, {
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

// Get my projects
export const getMyProjects = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.get('/client/my-projects', {
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

// Get my jobs
export const getMyJobs = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.status && {status: params.status}),
    }).toString();

    const response = await api.get(`/client/my_jobs?${queryParams}`, {
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

// Get job proposals
export const getJobProposals = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/client/get_job_proposals',
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

// Proposal action (accept/reject)
export const proposalAction = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/client/proposal_action',
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

// Get projects by status
export const getProjectsByStatus = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.status && {status: params.status}),
    }).toString();

    const response = await api.get(
      `/client/projects_by_status?${queryParams}`,
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

// Cancel project
export const cancelProject = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/client/cancel_project',
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

// Complete project
export const completeProject = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/client/complete_project',
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

export const getProjectDetails = async projectId => {
  const token = await AsyncStorage.getItem('ACCESS_TOKEN');
  const data = encryptData({project_id: projectId});
  const response = await api.post(
    '/client/get_project_details',
    {data},
    {
      headers: {Authorization: `Bearer ${token}`},
    },
  );
  return JSON.parse(decryptData(response.data.data));
};

export const saveJob = async jobId => {
  const token = await AsyncStorage.getItem('ACCESS_TOKEN');
  const data = encryptData({job_id: jobId});
  const response = await api.post(
    '/client/save_job',
    {data},
    {
      headers: {Authorization: `Bearer ${token}`},
    },
  );
  return JSON.parse(decryptData(response.data.data));
};

export const unsaveJob = async jobId => {
  const token = await AsyncStorage.getItem('ACCESS_TOKEN');
  const data = encryptData({job_id: jobId});
  const response = await api.post(
    '/client/unsave_job',
    {data},
    {
      headers: {Authorization: `Bearer ${token}`},
    },
  );
  return JSON.parse(decryptData(response.data.data));
};

export const getSavedJobs = async () => {
  const token = await AsyncStorage.getItem('ACCESS_TOKEN');
  const response = await api.get('/client/get_saved_jobs', {
    headers: {Authorization: `Bearer ${token}`},
  });
  return JSON.parse(decryptData(response.data.data));
};

export const uploadClientDocs = async (docs = []) => {
  const token = await AsyncStorage.getItem('ACCESS_TOKEN');
  const formData = new FormData();

  const documents = Array.isArray(docs) ? docs : [docs];
  documents.forEach(doc => formData.append('docs', doc));

  const response = await api.post('/client/upload_docs', formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return JSON.parse(decryptData(response.data.data));
};

// Example for delete job
export const deleteJob = async jobId => {
  const token = await AsyncStorage.getItem('ACCESS_TOKEN');
  const data = encryptData({job_id: jobId});
  const response = await api.post(
    '/client/delete_job',
    {data},
    {
      headers: {Authorization: `Bearer ${token}`},
    },
  );
  return JSON.parse(decryptData(response.data.data));
};

export const updateJob = async (jobId, updatedData) => {
  const token = await AsyncStorage.getItem('ACCESS_TOKEN');
  const {docs, ...rest} = updatedData;
  const data = encryptData({...rest, job_id: jobId});

  const formData = new FormData();
  formData.append('data', data);

  if (docs && docs.length > 0) {
    const documents = Array.isArray(docs) ? docs : [docs];
    documents.forEach(doc => formData.append('docs', doc));
  }

  const response = await api.post('/client/update_job', formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return JSON.parse(decryptData(response.data.data));
};

export const getJobDetails = async jobId => {
  const token = await AsyncStorage.getItem('ACCESS_TOKEN');
  const data = encryptData({job_id: jobId});
  const response = await api.post(
    '/client/job_details',
    {data},
    {
      headers: {Authorization: `Bearer ${token}`},
    },
  );
  return JSON.parse(decryptData(response.data.data));
};

/* ----------------------------------
   🛒 ORDERS MANAGEMENT
----------------------------------- */

// Get orders
export const getOrders = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.get('/client/orders', {
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

/* ----------------------------------
   📦 PRODUCTS & SERVICES
----------------------------------- */

// Get products
export const getProducts = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.get('/client/products', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get products:', error);
    throw error;
  }
};

// Get single product
export const getProduct = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/client/product',
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

// Get services
export const getServices = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.get('/client/services', {
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

// Get single service
export const getService = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/client/service',
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

/* ----------------------------------
   🔍 SEARCH & FILTERING
----------------------------------- */

// Search products
export const searchProducts = async (searchQuery, filters = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      q: searchQuery,
      ...(filters.category && {category: filters.category}),
      ...(filters.price_min && {price_min: filters.price_min}),
      ...(filters.price_max && {price_max: filters.price_max}),
      ...(filters.rating && {rating: filters.rating}),
      page: filters.page || 1,
      limit: filters.limit || 20,
    }).toString();

    const response = await api.get(`/client/products?${queryParams}`, {
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

// Search services
export const searchServices = async (searchQuery, filters = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      q: searchQuery,
      ...(filters.category && {category: filters.category}),
      ...(filters.location && {location: filters.location}),
      ...(filters.rating && {rating: filters.rating}),
      page: filters.page || 1,
      limit: filters.limit || 20,
    }).toString();

    const response = await api.get(`/client/services?${queryParams}`, {
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

/* ----------------------------------
   📊 ANALYTICS & STATISTICS
----------------------------------- */

// Get spending analytics
export const getSpendingAnalytics = async (period = 'month') => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.get(
      `/client/analytics/spending?period=${period}`,
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

// Get project analytics
export const getProjectAnalytics = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.get('/client/analytics/projects', {
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

/* ----------------------------------
   💳 PAYMENTS & BILLING
----------------------------------- */

// Get payment history
export const getPaymentHistory = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.status && {status: params.status}),
      ...(params.type && {type: params.type}),
    }).toString();

    const response = await api.get(`/client/payments/history?${queryParams}`, {
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

// Process payment
export const processPayment = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/client/payments/process',
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

/* ----------------------------------
   🔔 NOTIFICATIONS
----------------------------------- */

// Get notifications
export const getNotifications = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.type && {type: params.type}),
      ...(params.read && {read: params.read}),
    }).toString();

    const response = await api.get(`/client/notifications?${queryParams}`, {
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

// Mark notification as read
export const markNotificationAsRead = async notificationId => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData({notification_id: notificationId});
    const response = await api.post(
      '/client/notifications/mark_read',
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

/* ----------------------------------
   💬 MESSAGING
----------------------------------- */

// Get conversations
export const getConversations = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
    }).toString();

    const response = await api.get(`/client/conversations?${queryParams}`, {
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

// Get conversation messages
export const getConversationMessages = async (conversationId, params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 50,
    }).toString();

    const response = await api.get(
      `/client/conversations/${conversationId}/messages?${queryParams}`,
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

// Send message
export const sendMessage = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/client/conversations/send_message',
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

/* ----------------------------------
   ⭐ REVIEWS & RATINGS
----------------------------------- */

// Get reviews
export const getReviews = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.type && {type: params.type}), // 'given' or 'received'
    }).toString();

    const response = await api.get(`/client/reviews?${queryParams}`, {
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

// Submit review
export const submitReview = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/client/reviews/submit',
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
   📋 FAVORITES & WISHLISTS
----------------------------------- */

// Get favorites
export const getFavorites = async (type = 'all') => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.get(`/client/favorites?type=${type}`, {
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

// Add to favorites
export const addToFavorites = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/client/favorites/add',
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

// Remove from favorites
export const removeFromFavorites = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/client/favorites/remove',
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

/* ----------------------------------
   📋 Support & Tickets
----------------------------------- */

export const submitSupportTicket = async (subject, message) => {
  const token = await AsyncStorage.getItem('ACCESS_TOKEN');
  const data = encryptData({subject, message});

  const response = await api.post(
    '/client/submit_support_ticket',
    {data},
    {
      headers: {Authorization: `Bearer ${token}`},
    },
  );

  return JSON.parse(decryptData(response.data.data));
};

export const getMySupportTickets = async () => {
  const token = await AsyncStorage.getItem('ACCESS_TOKEN');
  const response = await api.get('/client/my_support_tickets', {
    headers: {Authorization: `Bearer ${token}`},
  });

  return JSON.parse(decryptData(response.data.data));
};

export const getInvoiceList = async () => {
  const token = await AsyncStorage.getItem('ACCESS_TOKEN');
  const response = await api.get('/client/get_invoice_list', {
    headers: {Authorization: `Bearer ${token}`},
  });

  return JSON.parse(decryptData(response.data.data));
};

export const downloadInvoice = async invoiceId => {
  const token = await AsyncStorage.getItem('ACCESS_TOKEN');
  const response = await api.get(`/client/invoice/${invoiceId}`, {
    headers: {Authorization: `Bearer ${token}`},
    responseType: 'blob', // if you want to download as a file
  });

  return response.data; // You can download or preview
};

// Add these functions to your existing client.js API file

/* ----------------------------------
   🛒 ORDER DETAILS & ACTIONS (Missing Functions)
----------------------------------- */

// Get order details
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

// Cancel order
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

// Request return order
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

// Get checkout details (if missing)
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

// Place order/checkout (if missing)
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
