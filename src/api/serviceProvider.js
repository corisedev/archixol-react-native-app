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
