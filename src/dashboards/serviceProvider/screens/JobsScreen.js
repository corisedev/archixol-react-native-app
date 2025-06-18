import React, {useEffect, useState, useCallback} from 'react';
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
  Dimensions,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {useNavigation} from '@react-navigation/native';
import {
  getAvailableJobs,
  getMyApplications,
  getSavedJobs,
  saveJob,
  unsaveJob,
  getJobsCount,
} from '../../../api/serviceProvider';

// Lucide React Native Icons
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
} from 'lucide-react-native';

 
const JobsScreen = () => {
  const navigation = useNavigation();

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState('All Jobs');
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortBy, setSortBy] = useState('recent');

  // Data States
  const [jobsData, setJobsData] = useState([]);
  const [savedJobsData, setSavedJobsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreJobs, setHasMoreJobs] = useState(true);

  // Stats state
  const [jobsStats, setJobsStats] = useState({
    available_jobs: 0,
    applied_jobs: 0,
    success_rate: 0,
    saved_jobs: 0,
    ratio_available_jobs: 0,
    ratio_applied_jobs: 0,
    ratio_success_rate: 0,
    ratio_saved_jobs: 0,
  });

  // Helper functions for backend sort mapping
  const getSortByBackendValue = useCallback(sortType => {
    switch (sortType) {
      case 'recent':
        return 'created_date';
      case 'priceLowToHigh':
        return 'budget';
      case 'priceHighToLow':
        return 'budget';
      case 'mostApplicants':
        return 'created_date';
      default:
        return 'created_date';
    }
  }, []);

  const getSortOrderBackendValue = useCallback(sortType => {
    switch (sortType) {
      case 'recent':
        return 'desc';
      case 'priceLowToHigh':
        return 'asc';
      case 'priceHighToLow':
        return 'desc';
      case 'mostApplicants':
        return 'desc';
      default:
        return 'desc';
    }
  }, []);

  // Format currency
  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `PKR ${amount.toLocaleString()}`;
    }
    return `PKR ${amount || '0'}`;
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return 'Good Morning';
    }
    if (hour < 17) {
      return 'Good Afternoon';
    }
    return 'Good Evening';
  };

  // Format jobs data
  const formatJobsData = useCallback(jobs => {
    return jobs.map(job => {
      const daysAgo =
        job.createdAt || job.created_date
          ? Math.floor(
              (new Date() - new Date(job.createdAt || job.created_date)) /
                (1000 * 60 * 60 * 24),
            )
          : 0;

      return {
        id: job.id || job._id || Math.random().toString(),
        title: job.title || 'Untitled Job',
        location: job.city || job.location || 'Location not specified',
        description: job.description || 'No description provided',
        price: job.budget
          ? `PKR ${job.budget.toLocaleString()}`
          : 'Budget not set',
        budget: job.budget || 0,
        postedTime: `${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago`,
        applicants: job.proposal_count || 0,
        skills: job.required_skills || [],
        tag: job.urgent ? 'Urgent' : 'New',
        tagColor: job.urgent ? '#F44336' : colors.splashGreen,
        tagBgColor: job.urgent ? '#FFEBEE' : '#E8F5E9',
        category: job.category || 'General',
        daysAgo: daysAgo,
        status: job.status || 'open',
        client_id: job.client_id,
        created_at: job.createdAt || job.created_date,
        deadline: job.deadline,
        experience_level: job.experience_level || 'Any',
        job_type: job.job_type || 'One-time',
        has_applied: job.has_applied || false,
        is_saved: job.is_saved || false,
        proposal_count: job.proposal_count || 0,
        urgent: job.urgent || false,
        timeline: job.timeline,
        starting_date: job.starting_date,
      };
    });
  }, []);

  // Fetch jobs stats
  const fetchJobsStats = useCallback(async () => {
    try {
      const statsResponse = await getJobsCount();
      setJobsStats(prev => ({
        ...prev,
        ...statsResponse,
      }));
    } catch (error) {
      console.error('Failed to load jobs stats:', error);
    }
  }, []);

  // Fetch jobs with pagination and filters
  const fetchJobs = useCallback(
    async (showLoader = true, page = 1, append = false) => {
      try {
        if (showLoader && page === 1) {
          setLoading(true);
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

        if (selectedFilter !== 'All Jobs') {
          params.category = selectedFilter.toLowerCase();
        }

        if (selectedTab === 'urgent') {
          params.urgent = true;
        }

        const result = await getAvailableJobs(params);

        if (result && result.jobs) {
          const formattedJobs = formatJobsData(result.jobs);
          if (append && page > 1) {
            setJobsData(prev => [...prev, ...formattedJobs]);
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
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load jobs:', error);
        if (page === 1) {
          setJobsData([]);
        }
        Alert.alert('Error', 'Failed to load jobs. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [
      sortBy,
      selectedFilter,
      selectedTab,
      getSortByBackendValue,
      getSortOrderBackendValue,
      formatJobsData,
    ],
  );

  // Fetch saved jobs
  const fetchSavedJobs = useCallback(async () => {
    try {
      const result = await getSavedJobs({page: 1, limit: 50});
      if (result && result.saved_jobs) {
        const formattedSavedJobs = result.saved_jobs.map(item => ({
          ...formatJobsData([item.job])[0],
          is_saved: true,
        }));
        setSavedJobsData(formattedSavedJobs);
      }
    } catch (error) {
      console.error('Failed to load saved jobs:', error);
    }
  }, [formatJobsData]);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchJobs(false, 1, false),
        fetchJobsStats(),
        fetchSavedJobs(),
      ]);
      setLoading(false);
    };
    loadInitialData();
  }, [fetchJobs, fetchJobsStats, fetchSavedJobs]);

  // Refetch when sort or filter changes
  useEffect(() => {
    if (!loading && jobsData.length > 0) {
      const timer = setTimeout(() => {
        fetchJobs(false, 1, false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [
    sortBy,
    selectedFilter,
    selectedTab,
    fetchJobs,
    loading,
    jobsData.length,
  ]);

  // Refresh function
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMoreJobs(true);
    await Promise.all([
      fetchJobs(false, 1, false),
      fetchJobsStats(),
      fetchSavedJobs(),
    ]);
    setRefreshing(false);
  }, [fetchJobs, fetchJobsStats, fetchSavedJobs]);

  // Load more function
  const loadMoreJobs = useCallback(() => {
    if (!loadingMore && hasMoreJobs && !loading && selectedTab !== 'saved') {
      fetchJobs(false, currentPage + 1, true);
    }
  }, [loadingMore, hasMoreJobs, loading, selectedTab, currentPage, fetchJobs]);

  // Search filtering
  const getFilteredJobs = useCallback(() => {
    let filtered = selectedTab === 'saved' ? savedJobsData : jobsData;

    if (selectedTab === 'urgent') {
      filtered = filtered.filter(job => job.urgent);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        job =>
          job.title.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query) ||
          job.location.toLowerCase().includes(query) ||
          (job.skills &&
            job.skills.some(skill => skill.toLowerCase().includes(query))),
      );
    }

    return filtered;
  }, [jobsData, savedJobsData, selectedTab, searchQuery]);

  // Handle job actions
  const handleApplyJob = useCallback(
    job => {
      if (job.has_applied) {
        Alert.alert(
          'Already Applied',
          'You have already applied for this job.',
        );
        return;
      }
      navigation.navigate('ApplyJobScreen', {job});
    },
    [navigation],
  );

  const handleSaveJob = useCallback(async job => {
    try {
      if (job.is_saved) {
        await unsaveJob(job.id);
        Alert.alert('Success', 'Job removed from saved list');
      } else {
        await saveJob(job.id);
        Alert.alert('Success', 'Job saved successfully');
      }

      // Update local state
      const updateJobInList = jobsList =>
        jobsList.map(item =>
          item.id === job.id ? {...item, is_saved: !item.is_saved} : item,
        );

      setJobsData(updateJobInList);

      if (job.is_saved) {
        setSavedJobsData(prev => prev.filter(item => item.id !== job.id));
      } else {
        setSavedJobsData(prev => [...prev, {...job, is_saved: true}]);
      }

      setJobsStats(prev => ({
        ...prev,
        saved_jobs: job.is_saved ? prev.saved_jobs - 1 : prev.saved_jobs + 1,
      }));
    } catch (error) {
      Alert.alert('Error', 'Failed to save job. Please try again.');
    }
  }, []);

  const handleJobDetails = useCallback(
    job => {
      navigation.navigate('JobDetailScreen', {jobId: job.id});
    },
    [navigation],
  );

  // Stats data - matching HomeScreen style
  const statsData = [
    {
      title: 'Available Jobs',
      value: jobsStats.available_jobs,
      change: jobsStats.ratio_available_jobs
        ? `${jobsStats.ratio_available_jobs}% from last month`
        : '0% from last month',
      changeColor: colors.splashGreen,
      icon: Briefcase,
      color: colors.splashGreen,
    },
    {
      title: 'Applied Jobs',
      value: jobsStats.applied_jobs,
      change: jobsStats.ratio_applied_jobs
        ? `${jobsStats.ratio_applied_jobs}% from last month`
        : '0% from last month',
      changeColor: '#2196F3',
      icon: CheckCircle,
      color: '#2196F3',
    },
    {
      title: 'Success Rate',
      value: `${jobsStats.success_rate}%`,
      change: jobsStats.ratio_success_rate
        ? `${jobsStats.ratio_success_rate}% from last month`
        : '0% from last month',
      changeColor: '#FF9800',
      icon: TrendingUp,
      color: '#FF9800',
    },
    {
      title: 'Saved Jobs',
      value: jobsStats.saved_jobs,
      change: jobsStats.ratio_saved_jobs
        ? `${jobsStats.ratio_saved_jobs}% from last month`
        : '0% from last month',
      changeColor: '#E91E63',
      icon: Bookmark,
      color: '#E91E63',
    },
  ];

  // Tab data
  const tabs = [
    {key: 'all', label: 'All Jobs', count: jobsData.length},
    {
      key: 'urgent',
      label: 'Urgent',
      count: jobsData.filter(job => job.urgent).length,
    },
    {key: 'saved', label: 'Saved', count: savedJobsData.length},
  ];

  const renderJobCard = useCallback(
    ({item, index}) => (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => handleJobDetails(item)}
        activeOpacity={0.8}>
        {/* Header with Save Button and Status */}
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={() => handleSaveJob(item)}>
            <Heart
              color={item.is_saved ? '#E91E63' : colors.textSecondary}
              size={16}
              fill={item.is_saved ? '#E91E63' : 'none'}
            />
          </TouchableOpacity>
          {item.urgent && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>URGENT</Text>
            </View>
          )}
          {item.has_applied && (
            <View style={styles.appliedBadge}>
              <CheckCircle color={colors.splashGreen} size={12} />
              <Text style={styles.appliedBadgeText}>Applied</Text>
            </View>
          )}
        </View>

        {/* Job Title and Category */}
        <Text style={styles.jobTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.jobCategory}>{item.category}</Text>

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
        <Text style={styles.jobDescription} numberOfLines={2}>
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
              <Text style={styles.moreSkills}>+{item.skills.length - 3}</Text>
            )}
          </View>
        )}

        {/* Price and Applicants */}
        <View style={styles.jobFooter}>
          <Text style={styles.priceText}>{formatCurrency(item.budget)}</Text>
          <View style={styles.applicantsContainer}>
            <Users color={colors.textSecondary} size={12} />
            <Text style={styles.applicantsText}>
              {item.applicants} proposals
            </Text>
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

  const renderStatsCard = ({item, index}) => (
    <View style={styles.statCard}>
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
        <Text style={[styles.changeText, {color: item.changeColor}]}>
          📈 {item.change}
        </Text>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Header Section - matching HomeScreen style */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}!</Text>
            <Text style={styles.userName}>Find Your Next Job</Text>
            <Text style={styles.subtitle}>
              Discover opportunities that match your skills
            </Text>
          </View>
          <TouchableOpacity
            style={styles.myApplicationsButton}
            onPress={() => navigation.navigate('MyApplicationsScreen')}>
            <Briefcase color={colors.splashGreen} size={16} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Grid - matching HomeScreen style */}
      <View style={styles.statsContainer}>
        {statsData.map((stat, index) => (
          <View key={index} style={styles.statCard}>
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
              <Text style={[styles.changeText, {color: stat.changeColor}]}>
                📈 {stat.change}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Search and Filter Section */}
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
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowSortModal(true)}>
            <Filter color={colors.text} size={16} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs Section */}
      <View style={styles.tabsSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
              onPress={() => setSelectedTab(tab.key)}>
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

      {/* Section Title */}
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>
          {selectedTab === 'all' && 'Job Opportunities'}
          {selectedTab === 'urgent' && 'Urgent Jobs'}
          {selectedTab === 'saved' && 'Saved Jobs'} ({getFilteredJobs().length})
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('AnalyticsScreen')}>
          <BarChart3 color={colors.splashGreen} size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = useCallback(() => {
    if (!loadingMore || selectedTab === 'saved') return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={colors.splashGreen} />
        <Text style={styles.loadingMoreText}>Loading more jobs...</Text>
      </View>
    );
  }, [loadingMore, selectedTab]);

  const renderEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Briefcase color={colors.textSecondary} size={48} />
        </View>
        <Text style={styles.emptyText}>
          {selectedTab === 'saved' ? 'No saved jobs yet' : 'No jobs found'}
        </Text>
        <Text style={styles.emptySubtext}>
          {selectedTab === 'saved'
            ? 'Jobs you save will appear here for easy access'
            : searchQuery
            ? 'Try adjusting your search criteria or filters'
            : 'New opportunities are added regularly. Check back soon!'}
        </Text>
        {selectedTab !== 'saved' && !searchQuery && (
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Text style={styles.refreshButtonText}>Refresh Jobs</Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    [selectedTab, searchQuery, onRefresh],
  );

  const filteredJobs = getFilteredJobs();

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading opportunities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredJobs}
        renderItem={renderJobCard}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.splashGreen]}
            tintColor={colors.splashGreen}
          />
        }
        showsVerticalScrollIndicator={false}
        onEndReached={loadMoreJobs}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.listContent}
      />

      {/* Sort Modal */}
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
            ].map(option => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortOption,
                  sortBy === option.key && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy(option.key);
                  setShowSortModal(false);
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
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Header Container - matching HomeScreen
  headerContainer: {
    backgroundColor: colors.background,
  },

  // Header Section - matching HomeScreen style
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

  // Stats Container - matching HomeScreen
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
  },
  changeText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.medium,
  },

  // Search Section - enhanced design
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

  // Tabs Section - enhanced design
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
  sectionTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  // Job Card Styles - enhanced design matching HomeScreen
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  saveButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  urgentText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bold,
    color: '#F44336',
    letterSpacing: 0.5,
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
  jobTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
    lineHeight: 24,
  },
  jobCategory: {
    fontSize: fontSizes.sm,
    color: colors.splashGreen,
    fontFamily: fonts.medium,
    marginBottom: 8,
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
  moreSkills: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    alignSelf: 'center',
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceText: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.splashGreen,
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
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  refreshButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },

  // Modal Styles - enhanced design
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
    maxHeight: '60%',
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
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  sortOptionActive: {
    backgroundColor: '#E8F5E9',
  },
  sortOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  },
});

export default JobsScreen;
