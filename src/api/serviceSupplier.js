import api from './index';
import {encryptData, decryptData} from '../utils/crypto';
import AsyncStorage from '@react-native-async-storage/async-storage';

/* ----------------------------------
   🏪 SUPPLIER DASHBOARD & GLOBAL DATA
----------------------------------- */

// Get supplier dashboard data
export const getSupplierDashboard = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/dashboard', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get supplier dashboard:', error);
    throw error;
  }
};

// Get supplier global data
export const getSupplierGlobalData = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/global_data', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get supplier global data:', error);
    throw error;
  }
};

// Update supplier global data
export const updateSupplierGlobalData = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/update_global_data',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update supplier global data:', error);
    throw error;
  }
};

/* ----------------------------------
   📦 PRODUCT MANAGEMENT
----------------------------------- */

// Get all products
export const getAllProducts = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.status && {status: params.status}),
      ...(params.category && {category: params.category}),
      ...(params.sort_by && {sort_by: params.sort_by}),
      ...(params.sort_order && {sort_order: params.sort_order}),
    }).toString();

    const response = await api.get(
      `/supplier/get_all_products?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get all products:', error);
    throw error;
  }
};

// Get single product
export const getProduct = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/get_product',
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

// Create product
export const createProduct = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const {product_images, ...dataWithoutFiles} = apiData;
    const data = encryptData(dataWithoutFiles);

    const formData = new FormData();
    formData.append('data', data);

    if (product_images && product_images.length > 0) {
      const images = Array.isArray(product_images)
        ? product_images
        : [product_images];
      images.forEach(img => formData.append('product_images', img));
    }

    const response = await api.post('/supplier/create_product', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to create product:', error);
    throw error;
  }
};

// Update product
export const updateProduct = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const {product_images, product_images_urls, ...dataWithoutFiles} = apiData;
    const data = encryptData(dataWithoutFiles);

    const formData = new FormData();
    formData.append('data', data);

    // Handle existing image URLs
    if (product_images_urls && product_images_urls.length > 0) {
      product_images_urls.forEach(url => {
        if (typeof url === 'string') {
          let sliced = url
            .replace(/^https?:\/\/[^/]+\//, '') // Remove domain
            .replace(/^media\//, ''); // Remove "media/" prefix
          formData.append('product_images_urls', sliced);
        }
      });
    }

    // Handle new image files
    if (product_images && product_images.length > 0) {
      const images = Array.isArray(product_images)
        ? product_images
        : [product_images];
      images.forEach(file => {
        if (typeof file === 'object' && file !== null) {
          formData.append('product_images', file);
        }
      });
    }

    const response = await api.post('/supplier/update_product', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update product:', error);
    throw error;
  }
};

// Delete product
export const deleteProduct = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/delete_product',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to delete product:', error);
    throw error;
  }
};

// Search products
export const searchProducts = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const response = await api.post('/supplier/search_product', apiData, {
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

/* ----------------------------------
   📋 ORDER MANAGEMENT
----------------------------------- */

// Get all orders
export const getAllOrders = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.status && {status: params.status}),
      ...(params.sort_by && {sort_by: params.sort_by}),
      ...(params.sort_order && {sort_order: params.sort_order}),
    }).toString();

    const response = await api.get(`/supplier/get_all_orders?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get all orders:', error);
    throw error;
  }
};

// Get single order
export const getOrder = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/get_order',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get order:', error);
    throw error;
  }
};

// Create order
export const createOrder = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/create_order',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to create order:', error);
    throw error;
  }
};

// Update order
export const updateOrder = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/update_order',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update order:', error);
    throw error;
  }
};

// Update fulfillment status
export const updateFulfillmentStatus = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/fullfillment_status',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update fulfillment status:', error);
    throw error;
  }
};

// Mark as paid
export const markAsPaid = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/mark_as_paid',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to mark as paid:', error);
    throw error;
  }
};

// Mark as delivered
export const markAsDelivered = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/mark_as_delivered',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to mark as delivered:', error);
    throw error;
  }
};

/* ----------------------------------
   👥 CUSTOMER MANAGEMENT
----------------------------------- */

// Get all customers
export const getAllCustomers = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.sort_by && {sort_by: params.sort_by}),
      ...(params.sort_order && {sort_order: params.sort_order}),
    }).toString();

    const response = await api.get(
      `/supplier/get_all_customers?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get all customers:', error);
    throw error;
  }
};

// Get single customer
export const getCustomer = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/get_customer',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get customer:', error);
    throw error;
  }
};

// Create customer
export const createCustomer = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/create_customer',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to create customer:', error);
    throw error;
  }
};

// Update customer
export const updateCustomer = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/update_customer',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update customer:', error);
    throw error;
  }
};

// Delete customer
export const deleteCustomer = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/delete_customer',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to delete customer:', error);
    throw error;
  }
};

/* ----------------------------------
   📊 INVENTORY & REPORTS
----------------------------------- */

// Get inventory
export const getInventory = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.low_stock && {low_stock: params.low_stock}),
      ...(params.out_of_stock && {out_of_stock: params.out_of_stock}),
    }).toString();

    const response = await api.get(`/supplier/get_inventory?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get inventory:', error);
    throw error;
  }
};

// Generate report
export const generateReport = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/generate_report',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to generate report:', error);
    throw error;
  }
};

/* ----------------------------------
   📊 Profile & Settings
----------------------------------- */

// Update user profile
export const updateUserProfile = async profileData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(profileData);
    const response = await api.post(
      '/supplier/update_profile',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
};

// Get business statistics
export const getBusinessStats = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/business_stats', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Get business stats error:', error);
    throw error;
  }
};

/* ----------------------------------
   📂 COLLECTION MANAGEMENT (Missing Functions)
----------------------------------- */

// Add these to your serviceSupplier.js file
export const getAllCollections = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.sort_by && {sort_by: params.sort_by}),
      ...(params.sort_order && {sort_order: params.sort_order}),
    }).toString();

    const response = await api.get(
      `/supplier/get_all_collections?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get all collections:', error);
    throw error;
  }
};

export const deleteCollection = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/delete_collection',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to delete collection:', error);
    throw error;
  }
};

// Add these functions to your serviceSupplier.js file

/* ----------------------------------
   📂 COLLECTION MANAGEMENT (Missing Functions)
----------------------------------- */

// Create collection
export const createCollection = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const {collection_images, ...dataWithoutFiles} = apiData;
    const data = encryptData(dataWithoutFiles);

    const formData = new FormData();
    formData.append('data', data);

    if (collection_images && collection_images.length > 0) {
      const images = Array.isArray(collection_images)
        ? collection_images
        : [collection_images];
      images.forEach(img => formData.append('collection_images', img));
    }

    const response = await api.post('/supplier/create_collection/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to create collection:', error);
    throw error;
  }
};

// Get single collection
export const getCollection = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/get_collection/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get collection:', error);
    throw error;
  }
};

// Update collection
export const updateCollection = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const {collection_images, collection_images_urls, ...dataWithoutFiles} =
      apiData;
    const data = encryptData(dataWithoutFiles);

    const formData = new FormData();
    formData.append('data', data);

    // Handle existing image URLs (same as updateProduct)
    if (collection_images_urls && collection_images_urls.length > 0) {
      collection_images_urls.forEach(url => {
        if (typeof url === 'string') {
          let sliced = url
            .replace(/^https?:\/\/[^/]+\//, '')
            .replace(/^media\//, '');
          formData.append('collection_images_urls', sliced);
        }
      });
    }

    // Handle new image files
    if (collection_images && collection_images.length > 0) {
      const images = Array.isArray(collection_images)
        ? collection_images
        : [collection_images];
      images.forEach(file => {
        if (typeof file === 'object' && file !== null) {
          formData.append('collection_images', file);
        }
      });
    }

    const response = await api.post('/supplier/update_collection/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update collection:', error);
    throw error;
  }
};

// Search collections
export const searchCollections = async searchTerm => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!searchTerm) return [];

    const response = await api.post(
      '/supplier/search_collection/',
      {query: searchTerm},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to search collections:', error);
    throw error;
  }
};

/* ----------------------------------
   🛒 PURCHASE ORDER MANAGEMENT
----------------------------------- */

// Get all purchase orders
export const getAllPurchaseOrders = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.status && {status: params.status}),
      ...(params.sort_by && {sort_by: params.sort_by}),
      ...(params.sort_order && {sort_order: params.sort_order}),
    }).toString();

    const response = await api.get(
      `/supplier/get_all_purchaseorders?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get all purchase orders:', error);
    throw error;
  }
};

// Get single purchase order
export const getPurchaseOrder = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/get_purchaseorder',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get purchase order:', error);
    throw error;
  }
};

// Create purchase order
export const createPurchaseOrder = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/create_purchaseorder',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to create purchase order:', error);
    throw error;
  }
};

// Update purchase order
export const updatePurchaseOrder = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/update_purchaseorder',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update purchase order:', error);
    throw error;
  }
};

// Delete purchase order
export const deletePurchaseOrder = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/delete_purchaseorder',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to delete purchase order:', error);
    throw error;
  }
};

// Mark purchase order as received
export const markAsReceived = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/mark_as_recieved',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to mark as received:', error);
    throw error;
  }
};

/* ----------------------------------
   💬 CHAT MANAGEMENT - Add these to your serviceSupplier.js
----------------------------------- */

// Get all conversations
export const getAllChats = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/chat/conversations', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get all chats:', error);
    throw error;
  }
};

// Start a new conversation
export const startConversation = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/chat/conversation/start',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to start conversation:', error);
    throw error;
  }
};

// Get messages from a conversation
export const getChat = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/chat/messages',
      {data},
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

// Send a message
export const sendMessage = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/chat/send',
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
   🏢 VENDOR MANAGEMENT - Complete APIs for Mobile
----------------------------------- */

// Get single vendor
export const getVendor = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/get_vendor',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get vendor:', error);
    throw error;
  }
};

// Get all vendors
export const getAllVendors = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/get_all_vendors', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get all vendors:', error);
    throw error;
  }
};

// Create vendor
export const createVendor = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/create_vendor',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to create vendor:', error);
    throw error;
  }
};

// Update vendor
export const updateVendor = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/update_vendor',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update vendor:', error);
    throw error;
  }
};

// Delete vendor
export const deleteVendor = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/delete_vendor',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to delete vendor:', error);
    throw error;
  }
};

// Search vendors (if needed)
export const searchVendors = async searchTerm => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    if (!searchTerm) return [];

    const response = await api.post(
      '/supplier/search_vendor',
      {query: searchTerm},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to search vendors:', error);
    throw error;
  }
};

/* ----------------------------------
   🏷️ DISCOUNT MANAGEMENT - Add these to your serviceSupplier.js
----------------------------------- */

// Get all discounts
export const getAllDiscounts = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 10,
      ...(params.status && {status: params.status}),
      ...(params.discount_category && {
        discount_category: params.discount_category,
      }),
      ...(params.sort_by && {sort_by: params.sort_by}),
      ...(params.sort_order && {sort_order: params.sort_order}),
    }).toString();

    const response = await api.get(`/supplier/get_discounts?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get all discounts:', error);
    throw error;
  }
};

// Get single discount
export const getDiscount = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/get_discount',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get discount:', error);
    throw error;
  }
};

// Create discount
export const createDiscount = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/add_discount',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to create discount:', error);
    throw error;
  }
};

// Update discount
export const updateDiscount = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/update_discount',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update discount:', error);
    throw error;
  }
};

// Delete discount
export const deleteDiscount = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/delete_discount',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to delete discount:', error);
    throw error;
  }
};

// Search discounts
export const searchDiscounts = async searchTerm => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    if (!searchTerm) return [];

    const response = await api.post(
      '/supplier/search_discount',
      {query: searchTerm},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to search discounts:', error);
    throw error;
  }
};

// Apply discount to order (if needed)
export const applyDiscountToOrder = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/apply_discount',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to apply discount to order:', error);
    throw error;
  }
};

// Validate discount code (for frontend validation)
export const validateDiscountCode = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/validate_discount',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to validate discount code:', error);
    throw error;
  }
};

// Get discount analytics/stats (if available)
export const getDiscountStats = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      ...(params.start_date && {start_date: params.start_date}),
      ...(params.end_date && {end_date: params.end_date}),
      ...(params.discount_id && {discount_id: params.discount_id}),
    }).toString();

    const response = await api.get(`/supplier/discount_stats?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get discount stats:', error);
    throw error;
  }
};

// Toggle discount status (activate/deactivate)
export const toggleDiscountStatus = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/toggle_discount_status',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to toggle discount status:', error);
    throw error;
  }
};

// Duplicate discount (create copy)
export const duplicateDiscount = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/duplicate_discount',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to duplicate discount:', error);
    throw error;
  }
};

/* ----------------------------------
   📁 CONTENT FILES MANAGEMENT - Add these to your serviceSupplier.js
----------------------------------- */

// Get all files/media content
export const getAllFiles = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 50,
      ...(params.file_type && {file_type: params.file_type}),
      ...(params.parent_type && {parent_type: params.parent_type}),
      ...(params.sort_by && {sort_by: params.sort_by}),
      ...(params.sort_order && {sort_order: params.sort_order}),
    }).toString();

    const response = await api.get(`/supplier/get_files?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get all files:', error);
    throw error;
  }
};

// Get single file details
export const getFile = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/get_file',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get file:', error);
    throw error;
  }
};

// Upload single file
export const uploadFile = async fileData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const formData = new FormData();

    // Add file to form data
    if (fileData.file) {
      formData.append('file', {
        uri: fileData.file.uri,
        type: fileData.file.type,
        name: fileData.file.name || 'file',
      });
    }

    // Add metadata if provided
    if (fileData.metadata) {
      const encryptedMetadata = encryptData(fileData.metadata);
      formData.append('metadata', encryptedMetadata);
    }

    const response = await api.post('/supplier/upload_file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to upload file:', error);
    throw error;
  }
};

// Upload multiple files
export const uploadMultipleFiles = async filesData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const formData = new FormData();

    // Add files to form data
    if (filesData.files && filesData.files.length > 0) {
      filesData.files.forEach((file, index) => {
        formData.append('files', {
          uri: file.uri,
          type: file.type,
          name: file.name || `file_${index}`,
        });
      });
    }

    // Add metadata if provided
    if (filesData.metadata) {
      const encryptedMetadata = encryptData(filesData.metadata);
      formData.append('metadata', encryptedMetadata);
    }

    const response = await api.post(
      '/supplier/upload_multiple_files',
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
    console.error('Failed to upload multiple files:', error);
    throw error;
  }
};

// Delete single file
export const deleteFile = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/delete_file',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to delete file:', error);
    throw error;
  }
};

// Delete multiple files
export const deleteMultipleFiles = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/delete_multiple_files',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to delete multiple files:', error);
    throw error;
  }
};

// Search files
export const searchFiles = async searchTerm => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    if (!searchTerm) return [];

    const response = await api.post(
      '/supplier/search_files',
      {query: searchTerm},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to search files:', error);
    throw error;
  }
};

// Get file statistics (if available)
export const getFileStats = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/file_stats', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get file stats:', error);
    throw error;
  }
};

// Update file metadata
export const updateFileMetadata = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/update_file_metadata',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update file metadata:', error);
    throw error;
  }
};

// Get files by type (images, documents, videos, etc.)
export const getFilesByType = async (fileType, params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      file_type: fileType,
      page: params.page || 1,
      limit: params.limit || 50,
      ...(params.sort_by && {sort_by: params.sort_by}),
      ...(params.sort_order && {sort_order: params.sort_order}),
    }).toString();

    const response = await api.get(
      `/supplier/get_files_by_type?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get files by type:', error);
    throw error;
  }
};

// Get files by parent (product, collection, etc.)
export const getFilesByParent = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/get_files_by_parent',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get files by parent:', error);
    throw error;
  }
};

/* ----------------------------------
   📊 REPORTS & ANALYTICS - Add these to your serviceSupplier.js
----------------------------------- */

// Get all available reports
export const getAllReports = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/get_reports', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get all reports:', error);
    throw error;
  }
};

// Get sales overview report
export const getSalesOverviewReport = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData({
      table_name: 'sales_overview',
      start_date: params.start_date,
      end_date: params.end_date,
      period: params.period || 'month', // day, week, month, year
      ...params,
    });

    const response = await api.post(
      '/supplier/generate_report',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get sales overview report:', error);
    throw error;
  }
};

// Get sales by product report
export const getSalesByProductReport = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData({
      table_name: 'sales_by_product',
      start_date: params.start_date,
      end_date: params.end_date,
      product_ids: params.product_ids,
      limit: params.limit || 50,
      ...params,
    });

    const response = await api.post(
      '/supplier/generate_report',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get sales by product report:', error);
    throw error;
  }
};

// Get sales by customer report
export const getSalesByCustomerReport = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData({
      table_name: 'sales_by_customer',
      start_date: params.start_date,
      end_date: params.end_date,
      customer_ids: params.customer_ids,
      limit: params.limit || 50,
      ...params,
    });

    const response = await api.post(
      '/supplier/generate_report',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get sales by customer report:', error);
    throw error;
  }
};

// Get inventory levels report
export const getInventoryLevelsReport = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData({
      table_name: 'inventory_levels',
      low_stock_threshold: params.low_stock_threshold || 10,
      include_out_of_stock: params.include_out_of_stock || false,
      category_ids: params.category_ids,
      ...params,
    });

    const response = await api.post(
      '/supplier/generate_report',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get inventory levels report:', error);
    throw error;
  }
};

// Get financial reports
export const getFinancialReport = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData({
      table_name: 'financial_reports',
      start_date: params.start_date,
      end_date: params.end_date,
      report_type: params.report_type || 'profit_loss', // profit_loss, revenue, expenses
      ...params,
    });

    const response = await api.post(
      '/supplier/generate_report',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get financial report:', error);
    throw error;
  }
};

// Get dashboard analytics
export const getDashboardAnalytics = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      period: params.period || 'month', // today, week, month, year
      ...(params.start_date && {start_date: params.start_date}),
      ...(params.end_date && {end_date: params.end_date}),
    }).toString();

    const response = await api.get(
      `/supplier/dashboard_analytics?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get dashboard analytics:', error);
    throw error;
  }
};

// Export report to PDF/Excel
export const exportReport = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/export_report',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob', // For file download
      },
    );

    return response.data;
  } catch (error) {
    console.error('Failed to export report:', error);
    throw error;
  }
};

// Get report history
export const getReportHistory = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      ...(params.report_type && {report_type: params.report_type}),
      ...(params.start_date && {start_date: params.start_date}),
      ...(params.end_date && {end_date: params.end_date}),
    }).toString();

    const response = await api.get(`/supplier/report_history?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get report history:', error);
    throw error;
  }
};

// Schedule report generation
export const scheduleReport = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/schedule_report',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to schedule report:', error);
    throw error;
  }
};

// Get business metrics summary
export const getBusinessMetrics = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      period: params.period || 'month',
      compare_previous: params.compare_previous || false,
      ...(params.start_date && {start_date: params.start_date}),
      ...(params.end_date && {end_date: params.end_date}),
    }).toString();

    const response = await api.get(
      `/supplier/business_metrics?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get business metrics:', error);
    throw error;
  }
};

// Add these Settings APIs to your existing serviceSupplier.js file

/* ----------------------------------
   ⚙️ SETTINGS MANAGEMENT - Mobile APIs
----------------------------------- */

// Get store details
export const getStoreDetails = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/store_details', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get store details:', error);
    throw error;
  }
};

// Update store details
export const updateStoreDetails = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const {logo, ...dataWithoutFiles} = apiData;
    const data = encryptData(dataWithoutFiles);

    const formData = new FormData();
    formData.append('data', data);

    if (logo) {
      if (Array.isArray(logo)) {
        logo.forEach(file => formData.append('logo', file));
      } else {
        formData.append('logo', logo);
      }
    }

    const response = await api.post('/supplier/store_details', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update store details:', error);
    throw error;
  }
};

// Get tax details
export const getTaxDetails = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/tax_details', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get tax details:', error);
    throw error;
  }
};

// Update tax details
export const updateTaxDetails = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/tax_details',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update tax details:', error);
    throw error;
  }
};

// Get checkout settings
export const getCheckoutSettings = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/checkout_settings', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get checkout settings:', error);
    throw error;
  }
};

// Update checkout settings
export const updateCheckoutSettings = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/checkout_settings',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update checkout settings:', error);
    throw error;
  }
};

// Get all policies
export const getAllPolicies = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/policies', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get policies:', error);
    throw error;
  }
};

// Get return and refund policy
export const getReturnRefundPolicy = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/return_and_refund', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get return refund policy:', error);
    throw error;
  }
};

// Update return and refund policy
export const updateReturnRefundPolicy = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/return_and_refund',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update return refund policy:', error);
    throw error;
  }
};

// Get privacy policy
export const getPrivacyPolicy = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/privacy_policy', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get privacy policy:', error);
    throw error;
  }
};

// Update privacy policy
export const updatePrivacyPolicy = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/privacy_policy',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update privacy policy:', error);
    throw error;
  }
};

// Get terms of service
export const getTermsOfService = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/terms_of_services', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get terms of service:', error);
    throw error;
  }
};

// Update terms of service
export const updateTermsOfService = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/terms_of_services',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update terms of service:', error);
    throw error;
  }
};

// Get shipping policy
export const getShippingPolicy = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/shipping_policy', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get shipping policy:', error);
    throw error;
  }
};

// Update shipping policy
export const updateShippingPolicy = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/shipping_policy',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update shipping policy:', error);
    throw error;
  }
};

// Get contact information
export const getContactInformation = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/contact_info', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get contact information:', error);
    throw error;
  }
};

// Update contact information
export const updateContactInformation = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/contact_info',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update contact information:', error);
    throw error;
  }
};

// Get recovery email
export const getRecoveryEmail = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/get_recovery_email', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get recovery email:', error);
    throw error;
  }
};

// Add recovery email
export const addRecoveryEmail = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/add_recovery_email',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to add recovery email:', error);
    throw error;
  }
};

// Add recovery phone
export const addRecoveryPhone = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/add_recovery_phone',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to add recovery phone:', error);
    throw error;
  }
};

// Get all cards
export const getAllPaymentCards = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/get_all_card', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get payment cards:', error);
    throw error;
  }
};

// Add payment card
export const addPaymentCard = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/add_card',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to add payment card:', error);
    throw error;
  }
};

// Update payment card
export const updatePaymentCard = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/update_card',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update payment card:', error);
    throw error;
  }
};

// Delete payment card
export const deletePaymentCard = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/delete_card',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to delete payment card:', error);
    throw error;
  }
};

// Add return rules
export const addReturnRules = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/return_rules',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to add return rules:', error);
    throw error;
  }
};

// Toggle return rules status
export const toggleReturnRulesStatus = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/return_rules_status',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to toggle return rules status:', error);
    throw error;
  }
};

// Verify recovery email
export const verifyRecoveryEmail = async token => {
  try {
    const response = await api.post(
      '/account/verify_recovery_email',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error('Failed to verify recovery email:', error);
    throw error;
  }
};

// Resend recovery verification email
export const resendRecoveryVerificationEmail = async (
  token,
  recovery_email,
) => {
  try {
    const response = await api.post(
      '/supplier/resend_recovery_email',
      {recovery_email},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to resend recovery verification email:', error);
    throw error;
  }
};

// Add store details
export const addSupplierStoreDetails = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const {logo, ...dataWithoutFiles} = apiData;
    const data = encryptData(dataWithoutFiles);

    const formData = new FormData();
    formData.append('data', data);

    if (logo) {
      if (Array.isArray(logo)) {
        logo.forEach(file => {
          formData.append('logo', file);
        });
      } else {
        formData.append('logo', logo);
      }
    }

    const response = await api.post('/supplier/store_details/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to add supplier store details:', error);
    throw error;
  }
};

// Get store details
export const getSupplierStoreDetails = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/store_details/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get supplier store details:', error);
    throw error;
  }
};

/* ----------------------------------
   🛒 CHECKOUT SETTINGS MANAGEMENT - Add these to your serviceSupplier.js file
----------------------------------- */

// Alternative function name for consistency (if you prefer addCheckoutSettings)
export const addCheckoutSettings = async apiData => {
  return await updateCheckoutSettings(apiData);
};

// Get checkout configuration (if you have separate endpoint for basic config)
export const getCheckoutConfiguration = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/checkout_configuration/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get checkout configuration:', error);
    throw error;
  }
};

// Reset checkout settings to default
export const resetCheckoutSettings = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.post(
      '/supplier/reset_checkout_settings/',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to reset checkout settings:', error);
    throw error;
  }
};

// Validate tip settings (if you have validation endpoint)
export const validateTipSettings = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/validate_tip_settings/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to validate tip settings:', error);
    throw error;
  }
};

// Get tip presets (if you have dynamic presets from backend)
export const getTipPresets = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/tip_presets/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get tip presets:', error);
    throw error;
  }
};

// Update tip presets
export const updateTipPresets = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/tip_presets/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update tip presets:', error);
    throw error;
  }
};

// Get checkout fields configuration
export const getCheckoutFields = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/checkout_fields/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get checkout fields:', error);
    throw error;
  }
};

// Update checkout fields
export const updateCheckoutFields = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/checkout_fields/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update checkout fields:', error);
    throw error;
  }
};

// Test checkout configuration (for testing purposes)
export const testCheckoutConfiguration = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/test_checkout/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to test checkout configuration:', error);
    throw error;
  }
};

/* ----------------------------------
   💰 TAX & DUTIES MANAGEMENT - Add these to your serviceSupplier.js file
----------------------------------- */

// Alternative function name for consistency (if you prefer addTaxDetails)
export const addTaxDetails = async apiData => {
  return await updateTaxDetails(apiData);
};

// Apply custom tax to specific product
export const applyCustomTax = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/apply_custom_tax/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to apply custom tax:', error);
    throw error;
  }
};

// Get tax configuration (if you have separate endpoint for basic config)
export const getTaxConfiguration = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/tax_configuration/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get tax configuration:', error);
    throw error;
  }
};

// Reset tax settings to default
export const resetTaxSettings = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.post(
      '/supplier/reset_tax_settings/',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to reset tax settings:', error);
    throw error;
  }
};

// Remove custom tax from product (revert to default)
export const removeCustomTax = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/remove_custom_tax/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to remove custom tax:', error);
    throw error;
  }
};

// Get tax summary/statistics
export const getTaxSummary = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      ...(params.start_date && {start_date: params.start_date}),
      ...(params.end_date && {end_date: params.end_date}),
      ...(params.period && {period: params.period}),
    }).toString();

    const response = await api.get(`/supplier/tax_summary?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get tax summary:', error);
    throw error;
  }
};

// Validate tax settings
export const validateTaxSettings = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/validate_tax_settings/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to validate tax settings:', error);
    throw error;
  }
};

// Bulk apply tax to multiple products
export const bulkApplyTax = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/bulk_apply_tax/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to bulk apply tax:', error);
    throw error;
  }
};

// Get tax rates by location (if you support location-based taxes)
export const getTaxRatesByLocation = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/tax_rates_by_location/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get tax rates by location:', error);
    throw error;
  }
};

// Calculate tax for order (preview calculation)
export const calculateOrderTax = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/supplier/calculate_order_tax/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to calculate order tax:', error);
    throw error;
  }
};

/* ----------------------------------
   📋 USAGE EXAMPLES AND DATA STRUCTURES
----------------------------------- */

// Example usage in your React Native component:

// 1. Get current tax settings and products
const fetchTaxData = async () => {
  try {
    const taxData = await getTaxDetails();
    console.log('Tax data:', taxData);
    // taxData.tax_data will contain your tax settings
    // taxData.tax_products will contain products with tax info
  } catch (error) {
    console.error('Error fetching tax data:', error);
  }
};

// 2. Update tax settings
const updateTaxSettings = async () => {
  try {
    const newSettings = {
      is_auto_apply_tax: true,
      default_tax_rate: '10.5',
      reg_number: 'TX123456789',
    };

    const response = await updateTaxDetails(newSettings);
    console.log('Tax settings updated:', response);
  } catch (error) {
    console.error('Error updating tax settings:', error);
  }
};

// 3. Apply custom tax to a product
const applyProductTax = async () => {
  try {
    const response = await applyCustomTax({
      product_id: 123,
      custom_tax: '15.5',
    });
    console.log('Custom tax applied:', response);
  } catch (error) {
    console.error('Error applying custom tax:', error);
  }
};

/* ----------------------------------
   👤 PERSONAL PROFILE MANAGEMENT - Add these to your serviceSupplier.js file
----------------------------------- */

// Get supplier profile
export const getSupplierProfile = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/supplier_profile/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get supplier profile:', error);
    throw error;
  }
};

// Update/Add supplier profile
export const updateSupplierProfile = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const {profile_image, ...dataWithoutFiles} = apiData;
    const data = encryptData(dataWithoutFiles);

    const formData = new FormData();
    formData.append('data', data);

    if (profile_image) {
      if (typeof profile_image === 'object' && profile_image.uri) {
        // New image file
        formData.append('profile_image', {
          uri: profile_image.uri,
          type: profile_image.type,
          name: profile_image.name || 'profile.jpg',
        });
      } else if (typeof profile_image === 'string') {
        // Existing image URL - handle if needed
        // You might not need to append anything for existing images
      }
    }

    const response = await api.post('/supplier/supplier_profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to update supplier profile:', error);
    throw error;
  }
};

// Alternative function name for consistency (if you prefer addSupplierProfile)
export const addSupplierProfile = async apiData => {
  return await updateSupplierProfile(apiData);
};

// Get user basic profile info (alternative endpoint if available)
export const getUserProfile = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/profile/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get user profile:', error);
    throw error;
  }
};

// Upload profile image only
export const uploadProfileImage = async imageData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const formData = new FormData();
    formData.append('profile_image', {
      uri: imageData.uri,
      type: imageData.type,
      name: imageData.name || 'profile.jpg',
    });

    const response = await api.post(
      '/supplier/upload_profile_image/',
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
    console.error('Failed to upload profile image:', error);
    throw error;
  }
};

// Delete profile image
export const deleteProfileImage = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.post(
      '/supplier/delete_profile_image/',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to delete profile image:', error);
    throw error;
  }
};

// Verify email address
export const verifyEmail = async verificationData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(verificationData);
    const response = await api.post(
      '/supplier/verify_email/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to verify email:', error);
    throw error;
  }
};

// Send verification email
export const sendVerificationEmail = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.post(
      '/supplier/send_verification_email/',
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
};

// Verify phone number
export const verifyPhoneNumber = async verificationData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(verificationData);
    const response = await api.post(
      '/supplier/verify_phone/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to verify phone number:', error);
    throw error;
  }
};

// Send phone verification code
export const sendPhoneVerificationCode = async phoneData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const data = encryptData(phoneData);
    const response = await api.post(
      '/supplier/send_phone_verification/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to send phone verification code:', error);
    throw error;
  }
};

// Get profile completion status
export const getProfileCompletionStatus = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/profile_completion/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Failed to get profile completion status:', error);
    throw error;
  }
};
