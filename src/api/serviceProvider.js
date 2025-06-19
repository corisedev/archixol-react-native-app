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
   👤 PROFILE API - Get user profile data
----------------------------------- */
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
      profile_img: decryptedData.profile_img || null,
      banner_img: decryptedData.banner_img || null,
      bio: decryptedData.bio || '',
      location: decryptedData.location || '',
      skills: decryptedData.skills || [],
      experience_level: decryptedData.experience_level || '',
      rating: decryptedData.rating || 0,
      total_reviews: decryptedData.total_reviews || 0,
      ...decryptedData,
    };
  } catch (error) {
    console.error('❌ Failed to get profile:', error);
    throw error;
  }
};

/* ----------------------------------
   🛠️ SERVICES API - Get user's services
----------------------------------- */
export const getAllServices = async () => {
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
      timeout: 10000,
    });

    const decryptedData = JSON.parse(decryptData(response.data.data));

    console.log('✅ Services fetched successfully:', {
      servicesCount: decryptedData.services?.length || 0,
    });

    return {
      services: decryptedData.services || [],
      total_services:
        decryptedData.total_services || decryptedData.services?.length || 0,
      ...decryptedData,
    };
  } catch (error) {
    console.error('❌ Failed to get services:', error);
    throw error;
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
