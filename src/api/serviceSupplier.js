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



export const getUserProfile = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await api.get('/supplier/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return JSON.parse(decryptData(response.data.data));
  } catch (error) {
    console.error('Get user profile error:', error);
    throw error;
  }
};

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

// Upload profile image
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
      name: imageData.fileName || 'profile.jpg',
    });

    const response = await api.post(
      '/supplier/upload_profile_image',
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
    console.error('Upload profile image error:', error);
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
