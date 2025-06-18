import React, {useEffect, useState, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  RefreshControl,
  Alert,
  ActivityIndicator,
  ScrollView,
  InteractionManager,
  BackHandler,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {
  getAvailableJobs,
  getSavedJobs,
  saveJob,
  unsaveJob,
  getJobsCount,
} from '../../../api/serviceProvider';

// Enhanced Lucide React Native Icons
import {
  Search,
  Filter,
  Briefcase,
  Clock,
  CheckCircle,
  Bookmark,
  TrendingUp,
  MapPin,
  DollarSign,
  Users,
  Heart,
  ArrowUpRight,
  BarChart3,
  AlertCircle,
  WifiOff,
  RefreshCw,
  Settings,
  Bell,
  Star,
  Calendar,
  Tag,
  Zap,
} from 'lucide-react-native';

const JobsScreen = () => {
  const navigation = useNavigation();

  // Enhanced Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState('All Jobs');
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortBy, setSortBy] = useState('recent');

  // Enhanced Data States
  const [jobsData, setJobsData] = useState([]);
  const [savedJobsData, setSavedJobsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreJobs, setHasMoreJobs] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Enhanced Error States
  const [error, setError] = useState(null);
  const [networkError, setNetworkError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Performance States
  const [isInteractionComplete, setIsInteractionComplete] = useState(false);

  // Enhanced Stats state with better structure
  const [jobsStats, setJobsStats] = useState({
    available_jobs: 0,
    applied_jobs: 0,
    success_rate: 0,
    saved_jobs: 0,
    ratio_available_jobs: 0,
    ratio_applied_jobs: 0,
    ratio_success_rate: 0,
    ratio_saved_jobs: 0,
    last_updated: null,
  });

  // Enhanced Filter Options
  const filterOptions = [
    'All Jobs',
    'Web Development',
    'Mobile Development',
    'Design',
    'Content Writing',
    'Digital Marketing',
    'Data Entry',
    'Translation',
    'Photography',
    'Video Editing',
  ];

  // Debounced search implementation
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Performance optimization - delay heavy operations
  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setIsInteractionComplete(true);
    });
  }, []);

  // Enhanced helper functions with memoization
  const getSortByBackendValue = useCallback(sortType => {
    const sortMap = {
      recent: 'created_date',
      priceLowToHigh: 'budget',
      priceHighToLow: 'budget',
      mostApplicants: 'proposal_count',
      deadline: 'deadline',
      alphabetical: 'title',
    };
    return sortMap[sortType] || 'created_date';
  }, []);

  const getSortOrderBackendValue = useCallback(sortType => {
    const orderMap = {
      recent: 'desc',
      priceLowToHigh: 'asc',
      priceHighToLow: 'desc',
      mostApplicants: 'desc',
      deadline: 'asc',
      alphabetical: 'asc',
    };
    return orderMap[sortType] || 'desc';
  }, []);

  // Enhanced format currency with better handling
  const formatCurrency = useCallback(amount => {
    if (!amount || isNaN(amount)) {
      return 'Budget not set';
    }

    const numAmount = Number(amount);
    if (numAmount >= 1000000) {
      return `PKR ${(numAmount / 1000000).toFixed(1)}M`;
    } else if (numAmount >= 1000) {
      return `PKR ${(numAmount / 1000).toFixed(1)}K`;
    }
    return `PKR ${numAmount.toLocaleString()}`;
  }, []);

  // Enhanced greeting with user context
  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    const greetings = {
      morning: 'Good Morning',
      afternoon: 'Good Afternoon',
      evening: 'Good Evening',
    };

    if (hour < 12) {
      return greetings.morning;
    }
    if (hour < 17) {
      return greetings.afternoon;
    }
    return greetings.evening;
  }, []);

  // Enhanced formatJobsData with better error handling
  const formatJobsData = useCallback(
    jobs => {
      if (!Array.isArray(jobs)) {
        return [];
      }

      return jobs
        .map((job, index) => {
          try {
            const createdDate =
              job.createdAt || job.created_date || job.created_at;
            const daysAgo = createdDate
              ? Math.max(
                  0,
                  Math.floor(
                    (new Date() - new Date(createdDate)) /
                      (1000 * 60 * 60 * 24),
                  ),
                )
              : 0;

            return {
              id: job.id || job._id || `job_${Date.now()}_${index}`,
              title: job.title || 'Untitled Job',
              location: job.city || job.location || 'Location not specified',
              description: job.description || 'No description provided',
              price: formatCurrency(job.budget),
              budget: Number(job.budget) || 0,
              postedTime:
                daysAgo === 0
                  ? 'Today'
                  : daysAgo === 1
                  ? '1 day ago'
                  : `${daysAgo} days ago`,
              applicants: Number(job.proposal_count) || 0,
              skills: Array.isArray(job.required_skills)
                ? job.required_skills
                : [],
              tag: job.urgent ? 'Urgent' : daysAgo <= 1 ? 'New' : '',
              tagColor: job.urgent ? '#F44336' : colors.splashGreen,
              tagBgColor: job.urgent ? '#FFEBEE' : '#E8F5E9',
              category: job.category || 'General',
              daysAgo: daysAgo,
              status: job.status || 'open',
              client_id: job.client_id,
              created_at: createdDate,
              deadline: job.deadline,
              experience_level: job.experience_level || 'Any',
              job_type: job.job_type || 'One-time',
              has_applied: Boolean(job.has_applied),
              is_saved: Boolean(job.is_saved),
              proposal_count: Number(job.proposal_count) || 0,
              urgent: Boolean(job.urgent),
              timeline: job.timeline,
              starting_date: job.starting_date,
              client_rating: job.client_rating || 0,
              budget_type: job.budget_type || 'fixed',
              hourly_rate: job.hourly_rate,
              estimated_hours: job.estimated_hours,
            };
          } catch (formatError) {
            console.error('Error formatting job data:', formatError, job);
            return null;
          }
        })
        .filter(Boolean);
    },
    [formatCurrency],
  );

  // Enhanced fetchJobsStats with better error handling
  const fetchJobsStats = useCallback(
    async (showError = true) => {
      try {
        console.log('📊 Fetching jobs statistics...');
        const statsResponse = await getJobsCount();

        setJobsStats(prev => ({
          ...prev,
          ...statsResponse,
          last_updated: new Date().toISOString(),
        }));

        setNetworkError(false);
        setRetryCount(0);

        console.log('✅ Stats updated successfully');
      } catch (statsError) {
        console.error('📊 Failed to load jobs stats:', statsError);
        setNetworkError(true);

        if (showError && retryCount < 3) {
          setRetryCount(prev => prev + 1);
        }
      }
    },
    [retryCount],
  );

  // Enhanced fetchJobs with better performance and error handling
  const fetchJobs = useCallback(
    async (showLoader = true, page = 1, append = false) => {
      try {
        if (showLoader && page === 1) {
          setLoading(true);
          setError(null);
        }
        if (page > 1) {
          setLoadingMore(true);
        }

        const params = {
          page: page,
          limit: 10,
          sort_by: getSortByBackendValue(sortBy),
          sort_order: getSortOrderBackendValue(sortBy),
        };

        // Apply filters
        if (selectedFilter !== 'All Jobs') {
          params.category = selectedFilter.toLowerCase().replace(' ', '_');
        }

        if (selectedTab === 'urgent') {
          params.urgent = true;
        }

        if (debouncedSearchQuery.trim()) {
          params.search_query = debouncedSearchQuery.trim();
        }

        console.log('🔍 Fetching jobs with params:', params);

        const result = await getAvailableJobs(params);

        if (result && Array.isArray(result.jobs)) {
          const formattedJobs = formatJobsData(result.jobs);

          if (append && page > 1) {
            setJobsData(prev => {
              const existingIds = new Set(prev.map(job => job.id));
              const newJobs = formattedJobs.filter(
                job => !existingIds.has(job.id),
              );
              return [...prev, ...newJobs];
            });
          } else {
            setJobsData(formattedJobs);
          }

          const totalPages = result.pagination?.total_pages || 1;
          setHasMoreJobs(page < totalPages);
          setCurrentPage(page);

          // Update stats if available
          if (result.statistics) {
            setJobsStats(prev => ({
              ...prev,
              ...result.statistics,
              last_updated: new Date().toISOString(),
            }));
          }

          setNetworkError(false);
          setRetryCount(0);

          console.log(`✅ Loaded ${formattedJobs.length} jobs (page ${page})`);
        }
      } catch (fetchError) {
        console.error('❌ Failed to load jobs:', fetchError);
        setNetworkError(true);

        if (page === 1) {
          setJobsData([]);
          setError(fetchError.message || 'Failed to load jobs');
        }

        if (
          fetchError.message?.includes('Network') ||
          fetchError.message?.includes('timeout')
        ) {
          setNetworkError(true);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setIsInitialLoad(false);
      }
    },
    [
      sortBy,
      selectedFilter,
      selectedTab,
      debouncedSearchQuery,
      getSortByBackendValue,
      getSortOrderBackendValue,
      formatJobsData,
    ],
  );

  // Enhanced fetchSavedJobs with error handling
  const fetchSavedJobs = useCallback(async () => {
    try {
      console.log('🔖 Fetching saved jobs...');
      const result = await getSavedJobs({page: 1, limit: 50});

      if (result && Array.isArray(result.saved_jobs)) {
        const formattedSavedJobs = result.saved_jobs
          .map(item => {
            const job = item.job || item;
            return {
              ...formatJobsData([job])[0],
              is_saved: true,
            };
          })
          .filter(Boolean);

        setSavedJobsData(formattedSavedJobs);
        console.log(`✅ Loaded ${formattedSavedJobs.length} saved jobs`);
      }
    } catch (err) {
      console.error('❌ Failed to load saved jobs:', err);
      setSavedJobsData([]);
    }
  }, [formatJobsData]);

  // Enhanced initial data load with better performance
  useEffect(() => {
    if (!isInteractionComplete) {
      return;
    }

    const loadInitialData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Load critical data first
        await Promise.all([fetchJobs(false, 1, false), fetchJobsStats(false)]);

        // Load non-critical data after
        setTimeout(() => {
          fetchSavedJobs();
        }, 1000);
      } catch (err) {
        console.error('Failed to load initial data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [isInteractionComplete, fetchJobs, fetchJobsStats, fetchSavedJobs]);

  // Enhanced effect for filter changes with debouncing
  useEffect(() => {
    if (!isInteractionComplete || isInitialLoad) {
      return;
    }

    const timer = setTimeout(() => {
      if (jobsData.length > 0 || !loading) {
        fetchJobs(false, 1, false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    sortBy,
    selectedFilter,
    selectedTab,
    debouncedSearchQuery,
    isInteractionComplete,
    isInitialLoad,
    fetchJobs,
    jobsData.length,
    loading,
  ]);

  // Enhanced refresh function
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMoreJobs(true);
    setError(null);
    setNetworkError(false);

    try {
      await Promise.all([
        fetchJobs(false, 1, false),
        fetchJobsStats(false),
        fetchSavedJobs(),
      ]);
    } catch (refreshError) {
      console.error('Refresh failed:', refreshError);
    } finally {
      setRefreshing(false);
    }
  }, [fetchJobs, fetchJobsStats, fetchSavedJobs]);

  // Enhanced load more with better performance
  const loadMoreJobs = useCallback(() => {
    if (
      !loadingMore &&
      hasMoreJobs &&
      !loading &&
      selectedTab !== 'saved' &&
      !error &&
      !networkError
    ) {
      fetchJobs(false, currentPage + 1, true);
    }
  }, [
    loadingMore,
    hasMoreJobs,
    loading,
    selectedTab,
    currentPage,
    error,
    networkError,
    fetchJobs,
  ]);

  // Enhanced search filtering with better performance
  const getFilteredJobs = useMemo(() => {
    let filtered = selectedTab === 'saved' ? savedJobsData : jobsData;

    if (selectedTab === 'urgent') {
      filtered = filtered.filter(job => job.urgent);
    }

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        job =>
          job.title.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query) ||
          job.location.toLowerCase().includes(query) ||
          job.category.toLowerCase().includes(query) ||
          (job.skills &&
            job.skills.some(skill => skill.toLowerCase().includes(query))),
      );
    }

    return filtered;
  }, [jobsData, savedJobsData, selectedTab, debouncedSearchQuery]);

  // Enhanced job action handlers with optimistic updates
  const handleApplyJob = useCallback(
    job => {
      if (job.has_applied) {
        Alert.alert(
          'Already Applied',
          'You have already applied for this job.',
          [{text: 'OK'}],
        );
        return;
      }
      navigation.navigate('ApplyJobScreen', {job});
    },
    [navigation],
  );

  const handleSaveJob = useCallback(async job => {
    try {
      // Optimistic update
      const updateJobInList = jobsList =>
        jobsList.map(item =>
          item.id === job.id ? {...item, is_saved: !item.is_saved} : item,
        );

      // Update UI immediately
      setJobsData(updateJobInList);

      if (job.is_saved) {
        // Remove from saved jobs
        setSavedJobsData(prev => prev.filter(item => item.id !== job.id));
        setJobsStats(prev => ({
          ...prev,
          saved_jobs: Math.max(0, prev.saved_jobs - 1),
        }));
      } else {
        // Add to saved jobs
        setSavedJobsData(prev => [...prev, {...job, is_saved: true}]);
        setJobsStats(prev => ({
          ...prev,
          saved_jobs: prev.saved_jobs + 1,
        }));
      }

      // Make API call
      if (job.is_saved) {
        await unsaveJob(job.id);
        Alert.alert('Success', 'Job removed from saved list');
      } else {
        await saveJob(job.id);
        Alert.alert('Success', 'Job saved successfully');
      }
    } catch (saveJobError) {
      console.error('Save job error:', saveJobError);

      // Revert optimistic update on error
      const revertJobInList = jobsList =>
        jobsList.map(item =>
          item.id === job.id ? {...item, is_saved: job.is_saved} : item,
        );

      setJobsData(revertJobInList);

      if (job.is_saved) {
        setSavedJobsData(prev => [...prev, {...job, is_saved: true}]);
        setJobsStats(prev => ({
          ...prev,
          saved_jobs: prev.saved_jobs + 1,
        }));
      } else {
        setSavedJobsData(prev => prev.filter(item => item.id !== job.id));
        setJobsStats(prev => ({
          ...prev,
          saved_jobs: Math.max(0, prev.saved_jobs - 1),
        }));
      }

      Alert.alert('Error', 'Failed to save job. Please try again.');
    }
  }, []);

  const handleJobDetails = useCallback(
    job => {
      navigation.navigate('JobDetailScreen', {jobId: job.id, job});
    },
    [navigation],
  );

  // Focus effect for screen refresh
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (showSortModal) {
          setShowSortModal(false);
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      return () => backHandler.remove();
    }, [showSortModal]),
  );

  // Enhanced stats data with better structure
  const statsData = useMemo(
    () => [
      {
        title: 'Available Jobs',
        value: jobsStats.available_jobs,
        change: `${jobsStats.ratio_available_jobs || 0}% from last month`,
        changeColor:
          jobsStats.ratio_available_jobs >= 0 ? colors.splashGreen : '#F44336',
        icon: Briefcase,
        color: colors.splashGreen,
        trend: jobsStats.ratio_available_jobs >= 0 ? 'up' : 'down',
      },
      {
        title: 'Applied Jobs',
        value: jobsStats.applied_jobs,
        change: `${jobsStats.ratio_applied_jobs || 0}% from last month`,
        changeColor: jobsStats.ratio_applied_jobs >= 0 ? '#2196F3' : '#F44336',
        icon: CheckCircle,
        color: '#2196F3',
        trend: jobsStats.ratio_applied_jobs >= 0 ? 'up' : 'down',
      },
      {
        title: 'Success Rate',
        value: `${jobsStats.success_rate || 0}%`,
        change: `${jobsStats.ratio_success_rate || 0}% from last month`,
        changeColor: jobsStats.ratio_success_rate >= 0 ? '#FF9800' : '#F44336',
        icon: TrendingUp,
        color: '#FF9800',
        trend: jobsStats.ratio_success_rate >= 0 ? 'up' : 'down',
      },
      {
        title: 'Saved Jobs',
        value: jobsStats.saved_jobs,
        change: `${jobsStats.ratio_saved_jobs || 0}% from last month`,
        changeColor: jobsStats.ratio_saved_jobs >= 0 ? '#E91E63' : '#F44336',
        icon: Bookmark,
        color: '#E91E63',
        trend: jobsStats.ratio_saved_jobs >= 0 ? 'up' : 'down',
      },
    ],
    [jobsStats],
  );

  // Enhanced tabs with better UX
  const tabs = useMemo(
    () => [
      {
        key: 'all',
        label: 'All Jobs',
        count: jobsData.length,
        icon: Briefcase,
      },
      {
        key: 'urgent',
        label: 'Urgent',
        count: jobsData.filter(job => job.urgent).length,
        icon: Zap,
      },
      {
        key: 'saved',
        label: 'Saved',
        count: savedJobsData.length,
        icon: Bookmark,
      },
    ],
    [jobsData, savedJobsData],
  );

  // Enhanced error handling component
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <View style={styles.errorIconContainer}>
        {networkError ? (
          <WifiOff color={colors.textSecondary} size={48} />
        ) : (
          <AlertCircle color={colors.textSecondary} size={48} />
        )}
      </View>
      <Text style={styles.errorTitle}>
        {networkError ? 'Connection Error' : 'Something went wrong'}
      </Text>
      <Text style={styles.errorSubtitle}>
        {networkError
          ? 'Please check your internet connection and try again.'
          : error || 'Failed to load jobs. Please try again.'}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
        <RefreshCw color="#fff" size={16} />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  // Enhanced job card renderer with optimized performance
  const renderJobCard = useCallback(
    ({item, index}) => (
      <TouchableOpacity
        style={[styles.jobCard, index === 0 && styles.firstJobCard]}
        onPress={() => handleJobDetails(item)}
        activeOpacity={0.8}>
        {/* Header with Save Button and Status */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            {item.urgent && (
              <View style={styles.urgentBadge}>
                <Zap color="#F44336" size={12} />
                <Text style={styles.urgentText}>URGENT</Text>
              </View>
            )}
            {item.tag && !item.urgent && (
              <View
                style={[styles.tagBadge, {backgroundColor: item.tagBgColor}]}>
                <Text style={[styles.tagText, {color: item.tagColor}]}>
                  {item.tag}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.cardHeaderRight}>
            {item.has_applied && (
              <View style={styles.appliedBadge}>
                <CheckCircle color={colors.splashGreen} size={12} />
                <Text style={styles.appliedBadgeText}>Applied</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => handleSaveJob(item)}>
              <Heart
                color={item.is_saved ? '#E91E63' : colors.textSecondary}
                size={16}
                fill={item.is_saved ? '#E91E63' : 'none'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Job Title and Category */}
        <Text style={styles.jobTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.jobMeta}>
          <View style={styles.categoryContainer}>
            <Tag color={colors.splashGreen} size={12} />
            <Text style={styles.jobCategory}>{item.category}</Text>
          </View>
          {item.client_rating > 0 && (
            <View style={styles.ratingContainer}>
              <Star color="#FFD700" size={12} fill="#FFD700" />
              <Text style={styles.ratingText}>
                {item.client_rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Location and Posted Time */}
        <View style={styles.jobMetaRow}>
          <View style={styles.jobLocation}>
            <MapPin color={colors.textSecondary} size={12} />
            <Text style={styles.jobLocationText} numberOfLines={1}>
              {item.location}
            </Text>
          </View>
          <View style={styles.jobTimeContainer}>
            <Clock color={colors.textSecondary} size={12} />
            <Text style={styles.jobTimeText}>{item.postedTime}</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.jobDescription} numberOfLines={3}>
          {item.description}
        </Text>

        {/* Skills */}
        {item.skills && item.skills.length > 0 && (
          <View style={styles.skillsContainer}>
            {item.skills.slice(0, 3).map((skill, skillIndex) => (
              <View key={skillIndex} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
            {item.skills.length > 3 && (
              <View style={styles.moreSkillsTag}>
                <Text style={styles.moreSkills}>+{item.skills.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {/* Enhanced Footer with Budget and Details */}
        <View style={styles.jobFooter}>
          <View style={styles.budgetSection}>
            <Text style={styles.priceText}>{item.price}</Text>
            {item.budget_type === 'hourly' && item.hourly_rate && (
              <Text style={styles.hourlyRate}>PKR {item.hourly_rate}/hr</Text>
            )}
          </View>

          <View style={styles.jobDetails}>
            <View style={styles.applicantsContainer}>
              <Users color={colors.textSecondary} size={12} />
              <Text style={styles.applicantsText}>
                {item.applicants} proposals
              </Text>
            </View>
            {item.deadline && (
              <View style={styles.deadlineContainer}>
                <Calendar color={colors.textSecondary} size={12} />
                <Text style={styles.deadlineText}>
                  {new Date(item.deadline).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Apply Button */}
        <TouchableOpacity
          style={[styles.applyButton, item.has_applied && styles.appliedButton]}
          onPress={() => handleApplyJob(item)}
          disabled={item.has_applied}>
          <Text
            style={[
              styles.applyButtonText,
              item.has_applied && styles.appliedButtonText,
            ]}>
            {item.has_applied ? 'Applied' : 'Apply Now'}
          </Text>
          {!item.has_applied && <ArrowUpRight color="#FFFFFF" size={16} />}
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [handleJobDetails, handleSaveJob, handleApplyJob],
  );

  // Enhanced stats card renderer
  const renderStatsCard = useCallback(
    ({item, index}) => (
      <View style={[styles.statCard, index % 2 === 1 && styles.statCardRight]}>
        <View style={styles.statHeader}>
          <Text style={styles.statTitle}>{item.title}</Text>
          <View
            style={[
              styles.statIconContainer,
              {backgroundColor: `${item.color}20`},
            ]}>
            <item.icon color={item.color} size={20} />
          </View>
        </View>
        <Text style={styles.statValue}>{item.value}</Text>
        <View style={styles.statChange}>
          <View style={styles.trendIndicator}>
            {item.trend === 'up' ? (
              <TrendingUp color={item.changeColor} size={14} />
            ) : (
              <TrendingUp
                color={item.changeColor}
                size={14}
                style={{transform: [{rotate: '180deg'}]}}
              />
            )}
          </View>
          <Text style={[styles.changeText, {color: item.changeColor}]}>
            {item.change}
          </Text>
        </View>
      </View>
    ),
    [],
  );

  // Enhanced header component
  const renderHeader = useCallback(
    () => (
      <View style={styles.headerContainer}>
        {/* Main Header Section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.greeting}>{getGreeting()}!</Text>
              <Text style={styles.userName}>Find Your Next Job</Text>
              <Text style={styles.subtitle}>
                Discover opportunities that match your skills
              </Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity
                style={styles.notificationButton}
                onPress={() => navigation.navigate('NotificationsScreen')}>
                <Bell color={colors.textSecondary} size={20} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.myApplicationsButton}
                onPress={() => navigation.navigate('MyApplicationsScreen')}>
                <Briefcase color={colors.splashGreen} size={16} />
                <Text style={styles.myApplicationsText}>Applications</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Network Status Indicator */}
        {networkError && (
          <View style={styles.networkErrorBanner}>
            <WifiOff color="#fff" size={16} />
            <Text style={styles.networkErrorText}>No internet connection</Text>
            <TouchableOpacity onPress={onRefresh}>
              <RefreshCw color="#fff" size={16} />
            </TouchableOpacity>
          </View>
        )}

        {/* Enhanced Stats Grid */}
        <View style={styles.statsContainer}>
          {statsData.map((stat, index) => (
            <View
              key={`stat-${index}`}
              style={[
                styles.statCard,
                index % 2 === 1 && styles.statCardRight,
              ]}>
              <View style={styles.statHeader}>
                <Text style={styles.statTitle}>{stat.title}</Text>
                <View
                  style={[
                    styles.statIconContainer,
                    {backgroundColor: `${stat.color}20`},
                  ]}>
                  <stat.icon color={stat.color} size={20} />
                </View>
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <View style={styles.statChange}>
                <View style={styles.trendIndicator}>
                  {stat.trend === 'up' ? (
                    <TrendingUp color={stat.changeColor} size={14} />
                  ) : (
                    <TrendingUp
                      color={stat.changeColor}
                      size={14}
                      style={{transform: [{rotate: '180deg'}]}}
                    />
                  )}
                </View>
                <Text style={[styles.changeText, {color: stat.changeColor}]}>
                  {stat.change}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Enhanced Search and Filter Section */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search color={colors.textSecondary} size={16} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search jobs, skills, location..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={colors.textSecondary}
                returnKeyType="search"
                onSubmitEditing={() => {
                  setDebouncedSearchQuery(searchQuery);
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setDebouncedSearchQuery('');
                  }}>
                  <Text style={styles.clearSearch}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowSortModal(true)}>
              <Filter color={colors.text} size={16} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('JobPreferencesScreen')}>
              <Settings color={colors.text} size={16} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Tabs Section */}
        <View style={styles.tabsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}>
            {tabs.map(tab => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tab,
                  selectedTab === tab.key && styles.activeTab,
                ]}
                onPress={() => setSelectedTab(tab.key)}>
                <tab.icon
                  color={
                    selectedTab === tab.key
                      ? colors.background
                      : colors.textSecondary
                  }
                  size={16}
                />
                <Text
                  style={[
                    styles.tabText,
                    selectedTab === tab.key && styles.activeTabText,
                  ]}>
                  {tab.label}
                </Text>
                <View
                  style={[
                    styles.tabBadge,
                    selectedTab === tab.key && styles.activeTabBadge,
                  ]}>
                  <Text
                    style={[
                      styles.tabBadgeText,
                      selectedTab === tab.key && styles.activeTabBadgeText,
                    ]}>
                    {tab.count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Section Title with Actions */}
        <View style={styles.sectionTitleContainer}>
          <View style={styles.sectionTitleLeft}>
            <Text style={styles.sectionTitle}>
              {selectedTab === 'all' && 'Job Opportunities'}
              {selectedTab === 'urgent' && 'Urgent Jobs'}
              {selectedTab === 'saved' && 'Saved Jobs'}
            </Text>
            <Text style={styles.sectionCount}>({getFilteredJobs.length})</Text>
          </View>
          <View style={styles.sectionTitleRight}>
            <TouchableOpacity
              onPress={() => navigation.navigate('AnalyticsScreen')}>
              <BarChart3 color={colors.splashGreen} size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    ),
    [
      getGreeting,
      networkError,
      onRefresh,
      statsData,
      searchQuery,
      setSearchQuery,
      setDebouncedSearchQuery,
      tabs,
      selectedTab,
      setSelectedTab,
      getFilteredJobs.length,
      navigation,
    ],
  );

  // Enhanced footer component
  const renderFooter = useCallback(() => {
    if (selectedTab === 'saved') {
      return null;
    }

    if (loadingMore) {
      return (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={colors.splashGreen} />
          <Text style={styles.loadingMoreText}>Loading more jobs...</Text>
        </View>
      );
    }

    if (!hasMoreJobs && jobsData.length > 0) {
      return (
        <View style={styles.endOfListContainer}>
          <Text style={styles.endOfListText}>You've reached the end!</Text>
          <Text style={styles.endOfListSubtext}>
            Check back later for new opportunities
          </Text>
        </View>
      );
    }

    return null;
  }, [selectedTab, loadingMore, hasMoreJobs, jobsData.length]);

  // Enhanced empty component
  const renderEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          {selectedTab === 'saved' ? (
            <Bookmark color={colors.textSecondary} size={48} />
          ) : searchQuery ? (
            <Search color={colors.textSecondary} size={48} />
          ) : (
            <Briefcase color={colors.textSecondary} size={48} />
          )}
        </View>
        <Text style={styles.emptyText}>
          {selectedTab === 'saved'
            ? 'No saved jobs yet'
            : searchQuery
            ? 'No jobs found'
            : 'No jobs available'}
        </Text>
        <Text style={styles.emptySubtext}>
          {selectedTab === 'saved'
            ? 'Jobs you save will appear here for easy access'
            : searchQuery
            ? 'Try adjusting your search criteria or filters'
            : 'New opportunities are added regularly. Check back soon!'}
        </Text>
        {selectedTab !== 'saved' && (
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <RefreshCw color="#fff" size={16} />
            <Text style={styles.refreshButtonText}>Refresh Jobs</Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    [selectedTab, searchQuery, onRefresh],
  );

  // Main loading state
  if (loading && isInitialLoad) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading opportunities...</Text>
        <Text style={styles.loadingSubtext}>Finding the best jobs for you</Text>
      </View>
    );
  }

  // Error state
  if (error && !loading && jobsData.length === 0) {
    return <View style={styles.container}>{renderErrorState()}</View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={getFilteredJobs}
        renderItem={renderJobCard}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!loading ? renderEmptyComponent : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.splashGreen]}
            tintColor={colors.splashGreen}
            title="Pull to refresh"
            titleColor={colors.textSecondary}
          />
        }
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreJobs}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.listContent}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={100}
        windowSize={10}
        initialNumToRender={10}
      />

      {/* Enhanced Sort Modal */}
      <Modal
        visible={showSortModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSortModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort & Filter Jobs</Text>
              <TouchableOpacity
                onPress={() => setShowSortModal(false)}
                style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Sort Options */}
              <Text style={styles.sectionLabel}>Sort By</Text>
              {[
                {key: 'recent', label: 'Most Recent', icon: Clock},
                {
                  key: 'priceLowToHigh',
                  label: 'Price: Low to High',
                  icon: DollarSign,
                },
                {
                  key: 'priceHighToLow',
                  label: 'Price: High to Low',
                  icon: DollarSign,
                },
                {key: 'mostApplicants', label: 'Most Popular', icon: Users},
                {key: 'deadline', label: 'Deadline', icon: Calendar},
              ].map(option => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortOption,
                    sortBy === option.key && styles.sortOptionActive,
                  ]}
                  onPress={() => {
                    setSortBy(option.key);
                  }}>
                  <View style={styles.sortOptionLeft}>
                    <View style={styles.sortOptionIcon}>
                      <option.icon color={colors.text} size={16} />
                    </View>
                    <Text style={styles.sortOptionText}>{option.label}</Text>
                  </View>
                  {sortBy === option.key && (
                    <CheckCircle color={colors.splashGreen} size={20} />
                  )}
                </TouchableOpacity>
              ))}

              {/* Filter Options */}
              <Text style={styles.sectionLabel}>Category</Text>
              {filterOptions.map(filter => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.sortOption,
                    selectedFilter === filter && styles.sortOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedFilter(filter);
                  }}>
                  <View style={styles.sortOptionLeft}>
                    <View style={styles.sortOptionIcon}>
                      <Tag color={colors.text} size={16} />
                    </View>
                    <Text style={styles.sortOptionText}>{filter}</Text>
                  </View>
                  {selectedFilter === filter && (
                    <CheckCircle color={colors.splashGreen} size={20} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => {
                  setSortBy('recent');
                  setSelectedFilter('All Jobs');
                }}>
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyFilterButton}
                onPress={() => setShowSortModal(false)}>
                <Text style={styles.applyFilterButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Enhanced Styles with better organization
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  // Loading States
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: fontSizes.lg,
    color: colors.text,
    fontFamily: fonts.semiBold,
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },

  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  errorTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },

  // Header Container
  headerContainer: {
    backgroundColor: colors.background,
  },

  // Header Section
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greeting: {
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  userName: {
    fontSize: fontSizes['3xl'],
    fontFamily: fonts.bold,
    color: colors.text,
    marginTop: 4,
  },
  subtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 4,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myApplicationsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  myApplicationsText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },

  // Network Error Banner
  networkErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
  },
  networkErrorText: {
    color: '#fff',
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    flex: 1,
    textAlign: 'center',
  },

  // Enhanced Stats Container
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardRight: {
    marginLeft: 'auto',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    flex: 1,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  statChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendIndicator: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.medium,
    flex: 1,
  },

  // Enhanced Search Section
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  clearSearch: {
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  // Enhanced Tabs Section
  tabsSection: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  tabsContent: {
    paddingRight: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#F0F0F0',
    gap: 8,
    minHeight: 40,
  },
  activeTab: {
    backgroundColor: colors.splashGreen,
  },
  tabText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.background,
  },
  tabBadge: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  activeTabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabBadgeText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  activeTabBadgeText: {
    color: colors.background,
  },

  // Section Title
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  sectionCount: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  sectionTitleRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Job Card Styles
  jobCard: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  firstJobCard: {
    marginTop: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  urgentText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bold,
    color: '#F44336',
    letterSpacing: 0.5,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
  },
  appliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  appliedBadgeText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },
  saveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
    lineHeight: 24,
  },
  jobMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobCategory: {
    fontSize: fontSizes.sm,
    color: colors.splashGreen,
    fontFamily: fonts.medium,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: fontSizes.sm,
    color: '#FFD700',
    fontFamily: fonts.medium,
  },
  jobMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  jobLocationText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    flex: 1,
  },
  jobTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobTimeText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  jobDescription: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    lineHeight: 20,
    marginBottom: 12,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  skillText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.medium,
    color: colors.splashGreen,
  },
  moreSkillsTag: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  moreSkills: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  budgetSection: {
    flex: 1,
  },
  priceText: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.splashGreen,
  },
  hourlyRate: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  jobDetails: {
    alignItems: 'flex-end',
  },
  applicantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  applicantsText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  deadlineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  deadlineText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  applyButton: {
    backgroundColor: colors.splashGreen,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  appliedButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  applyButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },
  appliedButtonText: {
    color: colors.textSecondary,
  },

  // Loading More
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  // End of List
  endOfListContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 32,
  },
  endOfListText: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  endOfListSubtext: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },
  modalBody: {
    maxHeight: 400,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  sortOptionActive: {
    backgroundColor: '#E8F5E9',
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  sortOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  sortOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortOptionText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.medium,
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  applyFilterButton: {
    flex: 1,
    backgroundColor: colors.splashGreen,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyFilterButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },
});

export default JobsScreen;
