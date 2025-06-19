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
   🛠️ SERVICES API - Enhanced Mobile Implementation
----------------------------------- */

// Get all services with enhanced error handling and filtering
export const getAllServices = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log('🔍 Fetching all services...');

    const response = await api.get('/service/get_services/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 15000,
    });

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Services fetched successfully:', {
      servicesCount: decryptedData.services_list?.length || 0,
      totalServices:
        decryptedData.total_services ||
        decryptedData.services_list?.length ||
        0,
    });

    return {
      services_list: decryptedData.services_list || [],
      total_services:
        decryptedData.total_services ||
        decryptedData.services_list?.length ||
        0,
      active_services:
        decryptedData.services_list?.filter(s => s.service_status === true)
          .length || 0,
      inactive_services:
        decryptedData.services_list?.filter(s => s.service_status === false)
          .length || 0,
      ...decryptedData,
    };
  } catch (error) {
    console.error('❌ Failed to get services:', error);

    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Please check your permissions.');
    } else if (error.response?.status === 429) {
      throw new Error('Too many requests. Please try again later.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network error. Please check your internet connection.');
    }

    throw error;
  }
};

// Get single service details
export const getService = async serviceId => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log('🔍 Fetching service details for:', serviceId);

    const apiData = {
      service_id: serviceId,
    };

    const data = encryptData(apiData);
    const response = await api.post(
      '/service/get_service/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      },
    );

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Service details fetched successfully');

    return {
      service: decryptedData.service || decryptedData,
      ...decryptedData,
    };
  } catch (error) {
    console.error('❌ Failed to get service details:', error);

    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Service not found or no permission.');
    } else if (error.response?.status === 404) {
      throw new Error('Service not found.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network error. Please check your internet connection.');
    }

    throw error;
  }
};

// Create new service
export const addService = async serviceData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log('➕ Creating new service:', serviceData);

    // Separate images from other data
    const {service_images, ...dataWithoutFiles} = serviceData;
    const data = encryptData(dataWithoutFiles);

    const formData = new FormData();
    formData.append('data', data);

    // Handle service images
    if (service_images) {
      if (Array.isArray(service_images)) {
        service_images.forEach((file, index) => {
          formData.append('service_images', {
            uri: file.uri,
            type: file.type || 'image/jpeg',
            name: file.name || `service_image_${index}.jpg`,
          });
        });
      } else {
        formData.append('service_images', {
          uri: service_images.uri,
          type: service_images.type || 'image/jpeg',
          name: service_images.name || 'service_image.jpg',
        });
      }
    }

    const response = await api.post('/service/create_service/', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // Longer timeout for file uploads
    });

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Service created successfully:', decryptedData);

    return {
      success: true,
      message: decryptedData.message || 'Service created successfully',
      service: decryptedData.service || null,
      ...decryptedData,
    };
  } catch (error) {
    console.error('❌ Failed to create service:', error);

    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Cannot create service.');
    } else if (error.response?.status === 400) {
      throw new Error(
        error.response?.data?.message ||
          'Invalid service data. Please check all fields.',
      );
    } else if (error.response?.status === 413) {
      throw new Error('Files too large. Please reduce image sizes.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network error. Please check your internet connection.');
    }

    throw error;
  }
};

// Update existing service
export const updateService = async serviceData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log('🔄 Updating service:', serviceData);

    // Separate images from other data
    const {service_images, ...dataWithoutFiles} = serviceData;
    const data = encryptData(dataWithoutFiles);

    const formData = new FormData();
    formData.append('data', data);

    // Handle service images (both new uploads and existing URLs)
    if (service_images) {
      if (Array.isArray(service_images)) {
        service_images.forEach((file, index) => {
          if (typeof file === 'string') {
            // Existing image URL - clean the path
            let slicedPath = file.replace(/^https?:\/\/[^/]+\//, '');
            slicedPath = slicedPath.replace(/^media\//, '');
            formData.append('service_images_urls', slicedPath);
          } else {
            // New image file
            formData.append('service_images', {
              uri: file.uri,
              type: file.type || 'image/jpeg',
              name: file.name || `service_image_${index}.jpg`,
            });
          }
        });
      } else {
        if (typeof service_images === 'string') {
          // Single existing image URL
          let slicedPath = service_images.replace(/^https?:\/\/[^/]+\//, '');
          slicedPath = slicedPath.replace(/^media\//, '');
          formData.append('service_images_urls', slicedPath);
        } else {
          // Single new image file
          formData.append('service_images', {
            uri: service_images.uri,
            type: service_images.type || 'image/jpeg',
            name: service_images.name || 'service_image.jpg',
          });
        }
      }
    }

    const response = await api.post('/service/update_service/', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Service updated successfully:', decryptedData);

    return {
      success: true,
      message: decryptedData.message || 'Service updated successfully',
      service: decryptedData.service || null,
      ...decryptedData,
    };
  } catch (error) {
    console.error('❌ Failed to update service:', error);

    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Cannot update this service.');
    } else if (error.response?.status === 404) {
      throw new Error('Service not found.');
    } else if (error.response?.status === 400) {
      throw new Error(
        error.response?.data?.message ||
          'Invalid service data. Please check all fields.',
      );
    } else if (error.response?.status === 413) {
      throw new Error('Files too large. Please reduce image sizes.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network error. Please check your internet connection.');
    }

    throw error;
  }
};

// Delete service
export const deleteService = async serviceData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log('🗑️ Deleting service:', serviceData);

    // Validate required data
    if (!serviceData.service_id) {
      throw new Error('Service ID is required');
    }

    const data = encryptData(serviceData);
    const response = await api.post(
      '/service/delete_service/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      },
    );

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Service deleted successfully:', decryptedData);

    return {
      success: true,
      message: decryptedData.message || 'Service deleted successfully',
      ...decryptedData,
    };
  } catch (error) {
    console.error('❌ Failed to delete service:', error);

    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Cannot delete this service.');
    } else if (error.response?.status === 404) {
      throw new Error('Service not found.');
    } else if (error.response?.status === 400) {
      throw new Error(
        error.response?.data?.message ||
          'Cannot delete service. It may have active orders.',
      );
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network error. Please check your internet connection.');
    }

    throw error;
  }
};

// Toggle service status (activate/deactivate)
export const toggleServiceStatus = async (serviceId, status) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log('🔄 Toggling service status:', serviceId, status);

    const apiData = {
      service_id: serviceId,
      service_status: status,
    };

    const data = encryptData(apiData);
    const response = await api.post(
      '/service/toggle_service_status/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      },
    );

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Service status updated successfully:', decryptedData);

    return {
      success: true,
      message: decryptedData.message || 'Service status updated successfully',
      service: decryptedData.service || null,
      ...decryptedData,
    };
  } catch (error) {
    console.error('❌ Failed to toggle service status:', error);

    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Cannot update this service.');
    } else if (error.response?.status === 404) {
      throw new Error('Service not found.');
    } else if (error.response?.status === 400) {
      throw new Error(
        error.response?.data?.message ||
          'Invalid request. Cannot update service status.',
      );
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network error. Please check your internet connection.');
    }

    throw error;
  }
};

// Get services by status with pagination
export const getServicesByStatus = async (status = 'all', params = {}) => {
  try {
    // Get all services first
    const allServicesResponse = await getAllServices();

    let filteredServices = allServicesResponse.services_list || [];

    // Filter by status
    if (status === 'active') {
      filteredServices = filteredServices.filter(
        service => service.service_status === true,
      );
    } else if (status === 'inactive') {
      filteredServices = filteredServices.filter(
        service => service.service_status === false,
      );
    }

    // Apply search filter if provided
    if (params.search && params.search.trim()) {
      const searchQuery = params.search.toLowerCase();
      filteredServices = filteredServices.filter(
        service =>
          service.service_title?.toLowerCase().includes(searchQuery) ||
          service.service_description?.toLowerCase().includes(searchQuery) ||
          service.service_location?.toLowerCase().includes(searchQuery) ||
          service.service_tags?.some(tag =>
            tag.toLowerCase().includes(searchQuery),
          ),
      );
    }

    // Apply pagination if needed
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(5, params.limit || 10));
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedServices = filteredServices.slice(startIndex, endIndex);

    console.log('✅ Services filtered by status:', {
      status,
      totalFiltered: filteredServices.length,
      currentPage: page,
      returnedCount: paginatedServices.length,
    });

    return {
      services_list: paginatedServices,
      total_services: filteredServices.length,
      active_services:
        allServicesResponse.services_list?.filter(
          s => s.service_status === true,
        ).length || 0,
      inactive_services:
        allServicesResponse.services_list?.filter(
          s => s.service_status === false,
        ).length || 0,
      pagination: {
        current_page: page,
        per_page: limit,
        total_pages: Math.ceil(filteredServices.length / limit),
        has_more: endIndex < filteredServices.length,
        total_items: filteredServices.length,
      },
    };
  } catch (error) {
    console.error('❌ Failed to get services by status:', error);
    throw error;
  }
};

// Get service statistics
export const getServiceStatistics = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log('📊 Fetching service statistics...');

    // Try to get from dedicated endpoint first, fallback to getting from all services
    try {
      const response = await api.get('/service/statistics/', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      const decryptedData = JSON.parse(decryptData(response.data.data));
      console.log('✅ Service statistics fetched from dedicated endpoint');

      return {
        total_services: decryptedData.total_services || 0,
        active_services: decryptedData.active_services || 0,
        inactive_services: decryptedData.inactive_services || 0,
        total_views: decryptedData.total_views || 0,
        total_orders: decryptedData.total_orders || 0,
        average_rating: decryptedData.average_rating || 0,
        ...decryptedData,
      };
    } catch (endpointError) {
      console.log(
        '📊 Dedicated statistics endpoint failed, calculating from services...',
      );

      // Fallback: calculate from all services
      const servicesResponse = await getAllServices();
      const services = servicesResponse.services_list || [];

      const stats = {
        total_services: services.length,
        active_services: services.filter(s => s.service_status === true).length,
        inactive_services: services.filter(s => s.service_status === false)
          .length,
        total_views: services.reduce(
          (sum, service) => sum + (service.views || 0),
          0,
        ),
        total_orders: services.reduce(
          (sum, service) => sum + (service.total_orders || 0),
          0,
        ),
        average_rating:
          services.length > 0
            ? services.reduce(
                (sum, service) => sum + (service.rating || 0),
                0,
              ) / services.length
            : 0,
      };

      console.log('✅ Service statistics calculated from services list');
      return stats;
    }
  } catch (error) {
    console.error('❌ Failed to get service statistics:', error);

    // Return fallback data
    return {
      total_services: 0,
      active_services: 0,
      inactive_services: 0,
      total_views: 0,
      total_orders: 0,
      average_rating: 0,
    };
  }
};

/* ----------------------------------
   📊 ANALYTICS API - Get detailed analytics
----------------------------------- */
export const getAnalytics = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      period: params.period || 'month', // week, month, quarter, year
      start_date: params.start_date || '',
      end_date: params.end_date || '',
    }).toString();

    console.log('🔍 Fetching analytics with params:', queryParams);

    const response = await api.get(`/service/analytics?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    });

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Analytics data fetched successfully');

    return {
      earnings_trend: decryptedData.earnings_trend || [],
      jobs_trend: decryptedData.jobs_trend || [],
      performance_metrics: decryptedData.performance_metrics || {},
      top_services: decryptedData.top_services || [],
      client_feedback: decryptedData.client_feedback || {},
      ...decryptedData,
    };
  } catch (error) {
    console.error('❌ Failed to get analytics:', error);
    // Return fallback data for analytics
    return {
      earnings_trend: [],
      jobs_trend: [],
      performance_metrics: {},
      top_services: [],
      client_feedback: {},
    };
  }
};

/* ----------------------------------
   🏢 COMPANY API - Get company data (if applicable)
----------------------------------- */
export const getCompany = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log('🔍 Fetching company data...');

    const response = await api.get('/company/get_data/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    });

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Company data fetched successfully');

    return {
      company_name: decryptedData.company_name || '',
      logo: decryptedData.logo || null,
      banner: decryptedData.banner || null,
      description: decryptedData.description || '',
      website: decryptedData.website || '',
      employees_count: decryptedData.employees_count || 0,
      established_year: decryptedData.established_year || null,
      ...decryptedData,
    };
  } catch (error) {
    console.error('❌ Failed to get company data:', error);
    // Return null if no company data (individual service provider)
    return null;
  }
};

/* ----------------------------------
   🔔 NOTIFICATIONS API - Get recent notifications
----------------------------------- */
export const getNotifications = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      page: Math.max(1, params.page || 1),
      limit: Math.min(20, Math.max(5, params.limit || 10)),
      unread_only: params.unread_only || false,
    }).toString();

    console.log('🔍 Fetching notifications...');

    const response = await api.get(`/notifications?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    });

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Notifications fetched successfully');

    return {
      notifications: decryptedData.notifications || [],
      unread_count: decryptedData.unread_count || 0,
      pagination: decryptedData.pagination || {},
    };
  } catch (error) {
    console.error('❌ Failed to get notifications:', error);
    return {
      notifications: [],
      unread_count: 0,
      pagination: {},
    };
  }
};

/* ----------------------------------
   📋 ENHANCED JOBS API SERVICES
----------------------------------- */

// Enhanced getAvailableJobs (same as before)
export const getAvailableJobs = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      page: Math.max(1, params.page || 1),
      limit: Math.min(50, Math.max(5, params.limit || 10)),
      sort_by: params.sort_by || 'created_date',
      sort_order: params.sort_order || 'desc',
      ...(params.category &&
        params.category !== 'All Jobs' && {category: params.category}),
      ...(params.budget_min &&
        !isNaN(params.budget_min) && {budget_min: params.budget_min}),
      ...(params.budget_max &&
        !isNaN(params.budget_max) && {budget_max: params.budget_max}),
      ...(params.location && {location: params.location.trim()}),
      ...(params.search_query && {search: params.search_query.trim()}),
      ...(params.urgent !== undefined && {urgent: params.urgent}),
      ...(params.experience_level && {
        experience_level: params.experience_level,
      }),
      ...(params.job_type && {job_type: params.job_type}),
    }).toString();

    console.log('🔍 Fetching jobs with params:', queryParams);

    const response = await api.get(
      `/service/get_available_jobs?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      },
    );

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Jobs fetched successfully:', {
      jobsCount: decryptedData.jobs?.length || 0,
      totalJobs: decryptedData.pagination?.total_jobs || 0,
      currentPage: decryptedData.pagination?.current_page || 1,
    });

    return {
      jobs: decryptedData.jobs || [],
      statistics: {
        available_jobs: decryptedData.statistics?.available_jobs || 0,
        applied_jobs: decryptedData.statistics?.applied_jobs || 0,
        success_rate: decryptedData.statistics?.success_rate || 0,
        saved_jobs: decryptedData.statistics?.saved_jobs || 0,
        ratio_available_jobs:
          decryptedData.statistics?.ratio_available_jobs || 0,
        ratio_applied_jobs: decryptedData.statistics?.ratio_applied_jobs || 0,
        ratio_success_rate: decryptedData.statistics?.ratio_success_rate || 0,
        ratio_saved_jobs: decryptedData.statistics?.ratio_saved_jobs || 0,
        ...decryptedData.statistics,
      },
      pagination: {
        total_jobs: decryptedData.pagination?.total_jobs || 0,
        total_pages: decryptedData.pagination?.total_pages || 1,
        current_page: decryptedData.pagination?.current_page || 1,
        has_more: decryptedData.pagination?.has_more || false,
        per_page: decryptedData.pagination?.per_page || 10,
        ...decryptedData.pagination,
      },
      filters: decryptedData.filters || {},
    };
  } catch (error) {
    console.error('❌ Failed to get available jobs:', error);

    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Please check your permissions.');
    } else if (error.response?.status === 429) {
      throw new Error('Too many requests. Please try again later.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network error. Please check your internet connection.');
    }

    throw error;
  }
};

// FIXED: Enhanced getJobsCount with multiple endpoint fallbacks
export const getJobsCount = async (retries = 2) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const token = await AsyncStorage.getItem('ACCESS_TOKEN');
      if (!token) {
        throw new Error('No access token found');
      }

      console.log(`🔍 Fetching jobs count (attempt ${attempt + 1})`);

      // Try different possible endpoints
      const possibleEndpoints = [
        '/service/get_jobs_count/', // Most likely correct
        '/service/jobs_count/', // Alternative 1
        '/service/dashboard/', // Get from dashboard instead
      ];

      let response;
      let endpointUsed;

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔍 Trying endpoint: ${endpoint}`);
          response = await api.get(endpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 10000,
          });
          endpointUsed = endpoint;
          break;
        } catch (endpointError) {
          console.log(
            `❌ Endpoint ${endpoint} failed:`,
            endpointError.response?.status,
          );
          continue;
        }
      }

      if (!response) {
        // If all endpoints fail, try getting stats from jobs API
        console.log(
          '📊 All count endpoints failed, getting stats from jobs API...',
        );
        const jobsResponse = await getAvailableJobs({page: 1, limit: 1});

        if (jobsResponse && jobsResponse.statistics) {
          console.log('✅ Stats extracted from jobs API');
          return {
            total_jobs: jobsResponse.pagination?.total_jobs || 0,
            available_jobs: jobsResponse.statistics.available_jobs || 0,
            applied_jobs: jobsResponse.statistics.applied_jobs || 0,
            saved_jobs: jobsResponse.statistics.saved_jobs || 0,
            success_rate: jobsResponse.statistics.success_rate || 0,
            ratio_available_jobs:
              jobsResponse.statistics.ratio_available_jobs || 0,
            ratio_applied_jobs: jobsResponse.statistics.ratio_applied_jobs || 0,
            ratio_success_rate: jobsResponse.statistics.ratio_success_rate || 0,
            ratio_saved_jobs: jobsResponse.statistics.ratio_saved_jobs || 0,
            statistics: jobsResponse.statistics,
          };
        }

        throw new Error('No statistics available from any source');
      }

      const decryptedData = JSON.parse(decryptData(response.data.data));
      console.log(
        `✅ Jobs count fetched successfully from ${endpointUsed}:`,
        decryptedData,
      );

      // Handle different response structures
      let jobsStats;
      if (endpointUsed === '/service/dashboard/') {
        jobsStats = {
          total_jobs:
            decryptedData.total_jobs ||
            decryptedData.statistics?.total_jobs ||
            0,
          available_jobs:
            decryptedData.available_jobs ||
            decryptedData.statistics?.available_jobs ||
            0,
          applied_jobs:
            decryptedData.applied_jobs ||
            decryptedData.statistics?.applied_jobs ||
            0,
          saved_jobs:
            decryptedData.saved_jobs ||
            decryptedData.statistics?.saved_jobs ||
            0,
          success_rate:
            decryptedData.success_rate ||
            decryptedData.statistics?.success_rate ||
            0,
          statistics: decryptedData.statistics || {},
          ...decryptedData,
        };
      } else {
        jobsStats = {
          total_jobs: decryptedData.total_jobs || 0,
          available_jobs: decryptedData.available_jobs || 0,
          applied_jobs: decryptedData.applied_jobs || 0,
          saved_jobs: decryptedData.saved_jobs || 0,
          success_rate: decryptedData.success_rate || 0,
          statistics: decryptedData.statistics || {},
          ...decryptedData,
        };
      }

      return jobsStats;
    } catch (error) {
      console.error(`❌ Jobs count attempt ${attempt + 1} failed:`, error);

      if (attempt === retries) {
        console.warn('🚧 Using fallback data for getJobsCount');
        return {
          total_jobs: 0,
          available_jobs: 0,
          applied_jobs: 0,
          saved_jobs: 0,
          success_rate: 0,
          statistics: {},
        };
      }

      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
};

/* ----------------------------------
   📝 MY APPLICATIONS API SERVICES
----------------------------------- */

// Get my job applications with pagination and filtering
export const getMyApplications = async (page = 1, limit = 10, status = '') => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      page: Math.max(1, page),
      limit: Math.min(50, Math.max(5, limit)),
      ...(status && status.trim() && {status: status.trim()}),
    }).toString();

    console.log('🔍 Fetching my applications with params:', queryParams);

    const response = await api.get(
      `/service/get_my_applications?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      },
    );

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Applications fetched successfully:', {
      applicationsCount: decryptedData.applications?.length || 0,
      totalApplications: decryptedData.pagination?.total_applications || 0,
      currentPage: decryptedData.pagination?.current_page || 1,
    });

    return {
      applications: decryptedData.applications || [],
      statistics: {
        total_applications: decryptedData.statistics?.total_applications || 0,
        pending: decryptedData.statistics?.pending || 0,
        accepted: decryptedData.statistics?.accepted || 0,
        rejected: decryptedData.statistics?.rejected || 0,
        in_progress: decryptedData.statistics?.in_progress || 0,
        completed: decryptedData.statistics?.completed || 0,
        cancelled: decryptedData.statistics?.cancelled || 0,
        ...decryptedData.statistics,
      },
      pagination: {
        total_applications: decryptedData.pagination?.total_applications || 0,
        total_pages: decryptedData.pagination?.total_pages || 1,
        current_page: decryptedData.pagination?.current_page || 1,
        has_more: decryptedData.pagination?.has_more || false,
        per_page: decryptedData.pagination?.per_page || 10,
        ...decryptedData.pagination,
      },
    };
  } catch (error) {
    console.error('❌ Failed to get my applications:', error);

    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Please check your permissions.');
    } else if (error.response?.status === 404) {
      throw new Error('Applications not found.');
    } else if (error.response?.status === 429) {
      throw new Error('Too many requests. Please try again later.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network error. Please check your internet connection.');
    }

    throw error;
  }
};

// Withdraw job application
export const withDrawApplication = async apiData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log('🔄 Withdrawing application:', apiData);

    // Validate required data
    if (!apiData.application_id) {
      throw new Error('Application ID is required');
    }

    const data = encryptData(apiData);
    const response = await api.post(
      '/service/update_application',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      },
    );

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Application withdrawn successfully:', decryptedData);

    return {
      success: true,
      message: decryptedData.message || 'Application withdrawn successfully',
      application: decryptedData.application || null,
      ...decryptedData,
    };
  } catch (error) {
    console.error('❌ Failed to withdraw application:', error);

    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. You cannot withdraw this application.');
    } else if (error.response?.status === 404) {
      throw new Error('Application not found.');
    } else if (error.response?.status === 400) {
      throw new Error(
        error.response?.data?.message ||
          'Invalid request. Application may already be processed.',
      );
    } else if (error.response?.status === 429) {
      throw new Error('Too many requests. Please try again later.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network error. Please check your internet connection.');
    }

    throw error;
  }
};

/* ----------------------------------
   💾 SAVED JOBS API SERVICES
----------------------------------- */

export const saveJob = async jobId => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log('💾 Saving job:', jobId);

    const data = encryptData({job_id: jobId});
    const response = await api.post(
      '/service/save_job/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      },
    );

    const result = JSON.parse(decryptData(response.data.data));
    console.log('✅ Job saved successfully:', result);

    return result;
  } catch (error) {
    console.error('❌ Failed to save job:', error);
    throw error;
  }
};

export const unsaveJob = async jobId => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log('🗑️ Unsaving job:', jobId);

    const data = encryptData({job_id: jobId});
    const response = await api.post(
      '/service/unsave_job/',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      },
    );

    const result = JSON.parse(decryptData(response.data.data));
    console.log('✅ Job unsaved successfully:', result);

    return result;
  } catch (error) {
    console.error('❌ Failed to unsave job:', error);
    throw error;
  }
};

export const getSavedJobs = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      page: Math.max(1, params.page || params.pageParam || 1),
      limit: Math.min(50, Math.max(5, params.limit || 10)),
    }).toString();

    console.log('🔍 Fetching saved jobs:', queryParams);

    const response = await api.get(`/service/get_saved_jobs?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 15000,
    });

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Saved jobs fetched:', {
      count: decryptedData.saved_jobs?.length || 0,
      totalPages: decryptedData.pagination?.total_pages || 1,
    });

    return {
      saved_jobs: decryptedData.saved_jobs || [],
      pagination: {
        total_saved_jobs: decryptedData.pagination?.total_saved_jobs || 0,
        total_pages: decryptedData.pagination?.total_pages || 1,
        current_page: decryptedData.pagination?.current_page || 1,
        has_more: decryptedData.pagination?.has_more || false,
        ...decryptedData.pagination,
      },
    };
  } catch (error) {
    console.error('❌ Failed to get saved jobs:', error);
    throw error;
  }
};

/* ----------------------------------
   📦 ORDERS & PROJECTS API SERVICES
----------------------------------- */

// Get all orders/projects with filtering
export const getOrders = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      status: params.status || 'ongoing', // ongoing, completed, cancelled, all
      page: Math.max(1, params.page || 1),
      limit: Math.min(50, Math.max(5, params.limit || 10)),
      sort_by: params.sort_by || 'created_date',
      sort_order: params.sort_order || 'desc',
      ...(params.search && {search: params.search.trim()}),
    }).toString();

    console.log('🔍 Fetching orders with params:', queryParams);

    const response = await api.get(`/service/ongoing_projects?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 15000,
    });

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Orders fetched successfully:', {
      projectsCount: decryptedData.projects?.length || 0,
      totalProjects: decryptedData.summary?.total_projects || 0,
    });

    return {
      projects: decryptedData.projects || [],
      summary: {
        total_projects: decryptedData.summary?.total_projects || 0,
        total_earnings: decryptedData.summary?.total_earnings || 0,
        completed_projects: decryptedData.summary?.completed_projects || 0,
        ongoing_projects: decryptedData.summary?.ongoing_projects || 0,
        cancelled_projects: decryptedData.summary?.cancelled_projects || 0,
        average_rating: decryptedData.summary?.average_rating || 0,
        ...decryptedData.summary,
      },
      pagination: {
        total_projects: decryptedData.pagination?.total_projects || 0,
        total_pages: decryptedData.pagination?.total_pages || 1,
        current_page: decryptedData.pagination?.current_page || 1,
        has_more: decryptedData.pagination?.has_more || false,
        per_page: decryptedData.pagination?.per_page || 10,
        ...decryptedData.pagination,
      },
    };
  } catch (error) {
    console.error('❌ Failed to get orders:', error);

    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Please check your permissions.');
    } else if (error.response?.status === 404) {
      throw new Error('Orders not found.');
    } else if (error.response?.status === 429) {
      throw new Error('Too many requests. Please try again later.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network error. Please check your internet connection.');
    }

    throw error;
  }
};

// Get detailed project/order information
export const getOrderProjectDetail = async projectId => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log('🔍 Fetching project details for:', projectId);

    const data = encryptData({project_id: projectId});
    const response = await api.post(
      '/service/get_project_details',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      },
    );

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Project details fetched successfully');

    return {
      project: decryptedData.project || decryptedData,
      client: decryptedData.client || {},
      timeline: decryptedData.timeline || [],
      payments: decryptedData.payments || [],
      deliverables: decryptedData.deliverables || [],
      ...decryptedData,
    };
  } catch (error) {
    console.error('❌ Failed to get project details:', error);

    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Project not found or no permission.');
    } else if (error.response?.status === 404) {
      throw new Error('Project not found.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network error. Please check your internet connection.');
    }

    throw error;
  }
};

// Complete a project/order
export const completeProjectOrder = async (projectId, completionData = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log('🏁 Completing project:', projectId);

    const apiData = {
      project_id: projectId,
      completion_notes: completionData.notes || '',
      deliverables: completionData.deliverables || [],
      ...completionData,
    };

    const data = encryptData(apiData);
    const response = await api.post(
      '/service/complete_project',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      },
    );

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Project completed successfully:', decryptedData);

    return {
      success: true,
      message: decryptedData.message || 'Project completed successfully',
      project: decryptedData.project || null,
      ...decryptedData,
    };
  } catch (error) {
    console.error('❌ Failed to complete project:', error);

    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Cannot complete this project.');
    } else if (error.response?.status === 404) {
      throw new Error('Project not found.');
    } else if (error.response?.status === 400) {
      throw new Error(
        error.response?.data?.message ||
          'Invalid request. Project may already be completed.',
      );
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network error. Please check your internet connection.');
    }

    throw error;
  }
};

// Update project status
export const updateProjectStatus = async (
  projectId,
  status,
  updateData = {},
) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log('🔄 Updating project status:', projectId, status);

    const apiData = {
      project_id: projectId,
      status: status, // ongoing, completed, cancelled, paused
      update_notes: updateData.notes || '',
      ...updateData,
    };

    const data = encryptData(apiData);
    const response = await api.post(
      '/service/update_project_status',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      },
    );

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Project status updated successfully:', decryptedData);

    return {
      success: true,
      message: decryptedData.message || 'Project status updated successfully',
      project: decryptedData.project || null,
      ...decryptedData,
    };
  } catch (error) {
    console.error('❌ Failed to update project status:', error);

    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Cannot update this project.');
    } else if (error.response?.status === 404) {
      throw new Error('Project not found.');
    } else if (error.response?.status === 400) {
      throw new Error(
        error.response?.data?.message ||
          'Invalid request. Check project status and data.',
      );
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network error. Please check your internet connection.');
    }

    throw error;
  }
};

// Get orders by different statuses
export const getOrdersByStatus = async (status = 'ongoing') => {
  return await getOrders({status});
};

// Get order statistics
export const getOrderStatistics = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log('📊 Fetching order statistics...');

    const response = await api.get('/service/order_statistics', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    });

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Order statistics fetched successfully');

    return {
      total_projects: decryptedData.total_projects || 0,
      total_earnings: decryptedData.total_earnings || 0,
      completed_projects: decryptedData.completed_projects || 0,
      ongoing_projects: decryptedData.ongoing_projects || 0,
      cancelled_projects: decryptedData.cancelled_projects || 0,
      average_rating: decryptedData.average_rating || 0,
      this_month_earnings: decryptedData.this_month_earnings || 0,
      last_month_earnings: decryptedData.last_month_earnings || 0,
      earnings_growth: decryptedData.earnings_growth || 0,
      ...decryptedData,
    };
  } catch (error) {
    console.error('❌ Failed to get order statistics:', error);

    // Return fallback data
    return {
      total_projects: 0,
      total_earnings: 0,
      completed_projects: 0,
      ongoing_projects: 0,
      cancelled_projects: 0,
      average_rating: 0,
      this_month_earnings: 0,
      last_month_earnings: 0,
      earnings_growth: 0,
    };
  }
};

/* ----------------------------------
   💰 EARNINGS & ANALYTICS API SERVICES
----------------------------------- */

// Get earnings analytics with detailed breakdown
export const getEarningsAnalytics = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      period: params.period || 'month', // day, week, month, quarter, year
      start_date: params.start_date || '',
      end_date: params.end_date || '',
      include_pending: params.include_pending || true,
      include_withdrawn: params.include_withdrawn || true,
    }).toString();

    console.log('🔍 Fetching earnings analytics with params:', queryParams);

    const response = await api.get(
      `/service/earnings/analytics?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      },
    );

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Earnings analytics fetched successfully');

    return {
      total_earnings: decryptedData.total_earnings || 0,
      available_balance: decryptedData.available_balance || 0,
      pending_earnings: decryptedData.pending_earnings || 0,
      withdrawn_amount: decryptedData.withdrawn_amount || 0,
      this_month_earnings: decryptedData.this_month_earnings || 0,
      last_month_earnings: decryptedData.last_month_earnings || 0,
      earnings_growth: decryptedData.earnings_growth || 0,
      earnings_trend: decryptedData.earnings_trend || [],
      top_earning_services: decryptedData.top_earning_services || [],
      monthly_breakdown: decryptedData.monthly_breakdown || [],
      ...decryptedData,
    };
  } catch (error) {
    console.error('❌ Failed to get earnings analytics:', error);

    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Please check your permissions.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network error. Please check your internet connection.');
    }

    // Return fallback data
    return {
      total_earnings: 0,
      available_balance: 0,
      pending_earnings: 0,
      withdrawn_amount: 0,
      this_month_earnings: 0,
      last_month_earnings: 0,
      earnings_growth: 0,
      earnings_trend: [],
      top_earning_services: [],
      monthly_breakdown: [],
    };
  }
};

// Get earnings summary (quick overview)
export const getEarningsSummary = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log('🔍 Fetching earnings summary...');

    const response = await api.get('/service/earnings/summary', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    });

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Earnings summary fetched successfully');

    return {
      available_balance: decryptedData.available_balance || 0,
      pending_earnings: decryptedData.pending_earnings || 0,
      total_lifetime_earnings: decryptedData.total_lifetime_earnings || 0,
      this_month_earnings: decryptedData.this_month_earnings || 0,
      average_order_value: decryptedData.average_order_value || 0,
      conversion_rate: decryptedData.conversion_rate || 0,
      total_orders: decryptedData.total_orders || 0,
      completed_orders: decryptedData.completed_orders || 0,
      ...decryptedData,
    };
  } catch (error) {
    console.error('❌ Failed to get earnings summary:', error);

    // Return fallback data
    return {
      available_balance: 0,
      pending_earnings: 0,
      total_lifetime_earnings: 0,
      this_month_earnings: 0,
      average_order_value: 0,
      conversion_rate: 0,
      total_orders: 0,
      completed_orders: 0,
    };
  }
};

// Get withdrawal history
export const getWithdrawalHistory = async (params = {}) => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    const queryParams = new URLSearchParams({
      page: Math.max(1, params.page || 1),
      limit: Math.min(50, Math.max(5, params.limit || 10)),
      status: params.status || '', // pending, completed, failed, cancelled
      start_date: params.start_date || '',
      end_date: params.end_date || '',
    }).toString();

    console.log('🔍 Fetching withdrawal history with params:', queryParams);

    const response = await api.get(
      `/service/earnings/withdrawals?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      },
    );

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Withdrawal history fetched successfully:', {
      withdrawalsCount: decryptedData.withdrawals?.length || 0,
    });

    return {
      withdrawals: decryptedData.withdrawals || [],
      total_withdrawn: decryptedData.total_withdrawn || 0,
      pending_withdrawals: decryptedData.pending_withdrawals || 0,
      pagination: {
        total_withdrawals: decryptedData.pagination?.total_withdrawals || 0,
        total_pages: decryptedData.pagination?.total_pages || 1,
        current_page: decryptedData.pagination?.current_page || 1,
        has_more: decryptedData.pagination?.has_more || false,
        per_page: decryptedData.pagination?.per_page || 10,
        ...decryptedData.pagination,
      },
    };
  } catch (error) {
    console.error('❌ Failed to get withdrawal history:', error);

    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network error. Please check your internet connection.');
    }

    return {
      withdrawals: [],
      total_withdrawn: 0,
      pending_withdrawals: 0,
      pagination: {
        total_withdrawals: 0,
        total_pages: 1,
        current_page: 1,
        has_more: false,
        per_page: 10,
      },
    };
  }
};

// Request withdrawal
export const requestWithdrawal = async withdrawalData => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log('💸 Requesting withdrawal:', withdrawalData);

    // Validate required data
    if (!withdrawalData.amount || withdrawalData.amount <= 0) {
      throw new Error('Valid withdrawal amount is required');
    }

    if (!withdrawalData.payment_method) {
      throw new Error('Payment method is required');
    }

    const data = encryptData(withdrawalData);
    const response = await api.post(
      '/service/earnings/withdraw',
      {data},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 15000,
      },
    );

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Withdrawal requested successfully:', decryptedData);

    return {
      success: true,
      message:
        decryptedData.message || 'Withdrawal request submitted successfully',
      withdrawal_id: decryptedData.withdrawal_id || null,
      estimated_processing_time:
        decryptedData.estimated_processing_time || '3-5 business days',
      ...decryptedData,
    };
  } catch (error) {
    console.error('❌ Failed to request withdrawal:', error);

    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Cannot process withdrawal.');
    } else if (error.response?.status === 400) {
      throw new Error(
        error.response?.data?.message ||
          'Invalid withdrawal request. Please check your details.',
      );
    } else if (error.response?.status === 422) {
      throw new Error('Insufficient balance or withdrawal limits exceeded.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network error. Please check your internet connection.');
    }

    throw error;
  }
};

/* ----------------------------------
   👤 PROFILE API - For Mobile ProfileViewScreen
----------------------------------- */

// Get user profile data
export const getProfile = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log('🔍 Fetching user profile...');

    const response = await api.get('/profile/get_data/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    });

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Profile data fetched successfully');

    return {
      fullname: decryptedData.fullname || decryptedData.name || '',
      username: decryptedData.username || '',
      email: decryptedData.email || '',
      phone: decryptedData.phone || '',
      phone_number: decryptedData.phone_number || '',
      address: decryptedData.address || '',
      cnic: decryptedData.cnic || '',
      website: decryptedData.website || '',
      profile_img: decryptedData.profile_img || null,
      banner_img: decryptedData.banner_img || null,
      intro_video: decryptedData.intro_video || null,
      bio: decryptedData.bio || '',
      introduction: decryptedData.introduction || decryptedData.bio || '',
      location: decryptedData.location || '',
      skills: decryptedData.skills || [],
      services_tags: decryptedData.services_tags || [],
      experience_level: decryptedData.experience_level || '',
      experience: decryptedData.experience || '',
      rating: decryptedData.rating || 0,
      total_reviews: decryptedData.total_reviews || 0,
      ...decryptedData,
    };
  } catch (error) {
    console.error('❌ Failed to get profile:', error);

    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Please check your permissions.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network error. Please check your internet connection.');
    }

    throw error;
  }
};

/* ----------------------------------
   📁 PROJECTS API - For Projects Section
----------------------------------- */

// Get all projects
export const getProjects = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log('🔍 Fetching user projects...');

    const response = await api.get('/profile/get_projects/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    });

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Projects fetched successfully:', {
      projectsCount: decryptedData.projects?.length || 0,
    });

    return {
      projects: decryptedData.projects || [],
      total_projects:
        decryptedData.total_projects || decryptedData.projects?.length || 0,
      ...decryptedData,
    };
  } catch (error) {
    console.error('❌ Failed to get projects:', error);

    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network error. Please check your internet connection.');
    }

    return {
      projects: [],
      total_projects: 0,
    };
  }
};

/* ----------------------------------
   🏆 CERTIFICATES API - For Certificates Section
----------------------------------- */

// Get all certificates
export const getCertificate = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log('🔍 Fetching certificates...');

    const response = await api.get('/profile/get_certificates/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    });

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Certificates fetched successfully:', {
      certificatesCount: decryptedData.certificates?.length || 0,
    });

    return {
      certificates: decryptedData.certificates || [],
      total_certificates:
        decryptedData.total_certificates ||
        decryptedData.certificates?.length ||
        0,
      ...decryptedData,
    };
  } catch (error) {
    console.error('❌ Failed to get certificates:', error);

    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network error. Please check your internet connection.');
    }

    return {
      certificates: [],
      total_certificates: 0,
    };
  }
};

/* ----------------------------------
   📄 COMPANY DOCUMENTS API - For Company Documents Section
----------------------------------- */

// Get all company documents
export const getCompanyDocs = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    if (!token) {
      throw new Error('No access token found');
    }

    console.log('🔍 Fetching company documents...');

    const response = await api.get('/profile/get_company_documents/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    });

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Company documents fetched successfully:', {
      documentsCount: decryptedData.documents?.length || 0,
    });

    return {
      documents: decryptedData.documents || [],
      total_documents:
        decryptedData.total_documents || decryptedData.documents?.length || 0,
      ...decryptedData,
    };
  } catch (error) {
    console.error('❌ Failed to get company documents:', error);

    if (error.response?.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.code === 'NETWORK_ERROR' || !error.response) {
      throw new Error('Network error. Please check your internet connection.');
    }

    return {
      documents: [],
      total_documents: 0,
    };
  }
};

/* ----------------------------------
   🔧 HELPER FUNCTIONS - For ProfileViewScreen
----------------------------------- */

// Build image URL helper (for profile images)
export const buildImgUrl = (imagePath, fallbackText = '') => {
  if (!imagePath) {
    return `https://via.placeholder.com/400x300/22c55e/FFFFFF?text=${encodeURIComponent(
      fallbackText || 'Image',
    )}`;
  }

  if (imagePath.startsWith('http')) {
    return imagePath;
  }

  // Assuming you have VITE_API_BASE_URL or similar
  const baseUrl = 'https://your-api-base-url.com'; // Replace with your actual base URL
  const cleanPath = imagePath.startsWith('/')
    ? imagePath.substring(1)
    : imagePath;

  return `${baseUrl}/${cleanPath}`;
};

// Format date helper (for certificate dates)
export const formatDate = dateString => {
  if (!dateString) return 'No date';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return dateString;
  }
};

// Calculate project duration helper
export const calculateProjectDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch (error) {
    return 0;
  }
};
  