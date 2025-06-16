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
} from 'react-native';
import {colors} from '../../../utils/colors';
import {useNavigation} from '@react-navigation/native';
import {
  getAvailableJobs,
  getMyApplications,
  getSavedJobs,
  saveJob,
  unsaveJob,
} from '../../../api/serviceProvider';

const JobsScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All Jobs');
  const [showSortModal, setShowSortModal] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [jobsData, setJobsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreJobs, setHasMoreJobs] = useState(true);

  // Stats state
  const [jobsStats, setJobsStats] = useState({
    total_jobs: 0,
    applied_jobs: 0,
    success_rate: 0,
    saved_jobs: 0,
  });

  // Dynamic categories state
  const [filterCategories, setFilterCategories] = useState(['All Jobs']);
  const [matchingCategories, setMatchingCategories] = useState([]);

  // Add state to prevent multiple simultaneous calls
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsLoadAttempted, setStatsLoadAttempted] = useState(false);

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

  // Format jobs data from backend response
  const formatJobsData = useCallback(jobs => {
    return jobs.map(job => {
      const daysAgo =
        job.createdAt || job.created_at
          ? Math.floor(
              (new Date() - new Date(job.createdAt || job.created_at)) /
                (1000 * 60 * 60 * 24),
            )
          : 0;

      return {
        id: job.id || job._id || Math.random().toString(),
        title: job.title || 'Untitled Job',
        location: job.city || job.location || 'Location not specified',
        description: job.description || 'No description provided',
        price: job.budget
          ? `Rs ${job.budget.toLocaleString()}`
          : 'Budget not set',
        minPrice: job.budget || 0,
        maxPrice: job.budget || 0,
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
        created_at: job.createdAt || job.created_at,
        deadline: job.deadline,
        experience_level: job.experience_level || 'Any',
        job_type: job.job_type || 'One-time',
        has_applied: job.has_applied || false,
        is_saved: job.is_saved || false,
        proposal_count: job.proposal_count || 0,
      };
    });
  }, []);

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    if (isLoadingStats) {
      return {
        applied_jobs: 0,
        success_rate: 0,
        saved_jobs: 0,
      };
    }

    try {
      setIsLoadingStats(true);

      let applied_jobs = 0;
      let success_rate = 0;
      let saved_jobs = 0;

      try {
        const savedJobsResult = await getSavedJobs({
          page: 1,
          limit: 1,
        });
        saved_jobs = savedJobsResult.pagination?.total_saved_jobs || 0;
      } catch (savedError) {
        saved_jobs = 0;
      }

      try {
        const applicationsResult = await getMyApplications({
          page: 1,
          limit: 1,
        });

        applied_jobs = applicationsResult.pagination?.total_applications || 0;

        if (applied_jobs > 0 && applicationsResult.applications) {
          const successfulApps = applicationsResult.applications.filter(
            app => app.status === 'accepted' || app.status === 'completed',
          ).length;
          success_rate = Math.round((successfulApps / applied_jobs) * 100);
        }
      } catch (appError) {
        applied_jobs = 0;
        success_rate = 0;
      }

      setStatsLoadAttempted(true);
      return {
        applied_jobs,
        success_rate,
        saved_jobs,
      };
    } catch (error) {
      setStatsLoadAttempted(true);
      return {
        applied_jobs: 0,
        success_rate: 0,
        saved_jobs: 0,
      };
    } finally {
      setIsLoadingStats(false);
    }
  }, [isLoadingStats]);

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
          const backendCategory = matchingCategories.find(
            cat => cat.toLowerCase() === selectedFilter.toLowerCase(),
          );
          if (backendCategory) {
            params.category = backendCategory;
          }
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

          if (result.pagination?.total_jobs) {
            setJobsStats(prev => ({
              ...prev,
              total_jobs: result.pagination.total_jobs,
            }));
          }
        }
      } catch (error) {
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
      matchingCategories,
      getSortByBackendValue,
      getSortOrderBackendValue,
      formatJobsData,
    ],
  );

  // Fetch initial data
  const fetchInitialData = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        let jobsResult = null;
        try {
          jobsResult = await getAvailableJobs({
            page: 1,
            limit: 10,
            sort_by: getSortByBackendValue(sortBy),
            sort_order: getSortOrderBackendValue(sortBy),
          });
        } catch (jobsError) {
          setJobsData([]);
          jobsResult = {jobs: [], pagination: {total_jobs: 0}};
        }

        let statsResult = {
          applied_jobs: 0,
          success_rate: 0,
          saved_jobs: 0,
        };

        if (!statsLoadAttempted && !isLoadingStats) {
          try {
            statsResult = await fetchDashboardStats();
          } catch (statsError) {
            // Continue with defaults
          }
        }

        const total_jobs = jobsResult?.pagination?.total_jobs || 0;
        setJobsStats(prev => ({
          total_jobs,
          ...statsResult,
        }));

        if (
          jobsResult?.filters?.matching_categories &&
          jobsResult.filters.matching_categories.length > 0
        ) {
          const categories = [
            'All Jobs',
            ...jobsResult.filters.matching_categories.map(
              cat => cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase(),
            ),
          ];
          setFilterCategories(categories);
          setMatchingCategories(jobsResult.filters.matching_categories);
        }

        if (jobsResult?.jobs) {
          const formattedJobs = formatJobsData(jobsResult.jobs);
          setJobsData(formattedJobs);

          const totalPages = jobsResult.pagination?.total_pages || 1;
          setHasMoreJobs(totalPages > 1);
          setCurrentPage(1);
        } else {
          setJobsData([]);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load jobs data. Please try again.');
        setJobsData([]);
        setJobsStats({
          total_jobs: 0,
          applied_jobs: 0,
          success_rate: 0,
          saved_jobs: 0,
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      sortBy,
      fetchDashboardStats,
      statsLoadAttempted,
      getSortByBackendValue,
      getSortOrderBackendValue,
      formatJobsData,
      isLoadingStats,
    ],
  );

  // Initial load
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Refetch when sort or filter changes
  useEffect(() => {
    if (!loading && jobsData.length > 0) {
      const timer = setTimeout(() => {
        fetchJobs(false, 1, false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sortBy, selectedFilter, fetchJobs, loading, jobsData.length]);

  // Refresh function
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMoreJobs(true);
    setStatsLoadAttempted(false);
    fetchInitialData(false);
  }, [fetchInitialData]);

  // Load more function
  const loadMoreJobs = useCallback(() => {
    if (!loadingMore && hasMoreJobs && !loading) {
      fetchJobs(false, currentPage + 1, true);
    }
  }, [loadingMore, hasMoreJobs, loading, currentPage, fetchJobs]);

  // Search filtering
  const getFilteredJobs = useCallback(() => {
    let filtered = jobsData;

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
  }, [jobsData, searchQuery]);

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
      navigation.navigate('ApplyOnJob', {job});
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

      setJobsData(prev =>
        prev.map(item =>
          item.id === job.id ? {...item, is_saved: !item.is_saved} : item,
        ),
      );

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
      navigation.navigate('JobDetails', {jobId: job.id});
    },
    [navigation],
  );

  const renderJobCard = useCallback(
    ({item}) => (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => handleJobDetails(item)}
        activeOpacity={0.7}>
        {/* Card Header */}
        <View style={styles.jobHeader}>
          <View style={styles.jobHeaderLeft}>
            <Text style={styles.jobTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <View style={styles.jobLocation}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.jobLocationText} numberOfLines={1}>
                {item.location}
              </Text>
            </View>
          </View>
          <View style={styles.jobHeaderRight}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => handleSaveJob(item)}>
              <Text
                style={[
                  styles.saveIcon,
                  {
                    color: item.is_saved
                      ? colors.splashGreen
                      : colors.textSecondary,
                  },
                ]}>
                {item.is_saved ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Card Body */}
        <Text style={styles.jobDescription} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Skills */}
        {item.skills && item.skills.length > 0 && (
          <View style={styles.skillsContainer}>
            {item.skills.slice(0, 3).map((skill, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
            {item.skills.length > 3 && (
              <View style={styles.skillTag}>
                <Text style={styles.skillText}>+{item.skills.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {/* Card Footer */}
        <View style={styles.jobFooter}>
          <View style={styles.jobMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>🕐</Text>
              <Text style={styles.metaText}>{item.postedTime}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>👥</Text>
              <Text style={styles.metaText}>{item.applicants} applicants</Text>
            </View>
          </View>

          <View style={styles.jobFooterRight}>
            <Text style={styles.priceText}>{item.price}</Text>
            <TouchableOpacity
              style={[
                styles.applyButton,
                item.has_applied && styles.appliedButton,
              ]}
              onPress={() => handleApplyJob(item)}>
              <Text
                style={[
                  styles.applyButtonText,
                  item.has_applied && styles.appliedButtonText,
                ]}>
                {item.has_applied ? 'Applied' : 'Apply'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [handleJobDetails, handleSaveJob, handleApplyJob],
  );

  const renderHeader = useCallback(
    () => (
      <View>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Available Jobs</Text>
          <Text style={styles.pageSubtitle}>
            Find opportunities that match your skills
          </Text>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{jobsStats.total_jobs}</Text>
              <Text style={styles.statLabel}>Total Jobs</Text>
            </View>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('MyApplications')}>
              <Text style={styles.statNumber}>{jobsStats.applied_jobs}</Text>
              <Text style={styles.statLabel}>Applied</Text>
            </TouchableOpacity>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{jobsStats.success_rate}%</Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
            <TouchableOpacity
              style={styles.statCard}
              onPress={() => navigation.navigate('SavedJobs')}>
              <Text style={styles.statNumber}>{jobsStats.saved_jobs}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search jobs..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortModal(true)}>
            <Text style={styles.sortIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Categories */}
        <View style={styles.filterSection}>
          {filterCategories.map(filter => (
            <TouchableOpacity
              key={filter}
              onPress={() => setSelectedFilter(filter)}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.filterChipActive,
              ]}>
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter && styles.filterTextActive,
                ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Jobs ({getFilteredJobs().length})
          </Text>
        </View>
      </View>
    ),
    [
      jobsStats,
      filterCategories,
      selectedFilter,
      getFilteredJobs,
      navigation,
      searchQuery,
    ],
  );

  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={colors.splashGreen} />
        <Text style={styles.loadingMoreText}>Loading more...</Text>
      </View>
    );
  }, [loadingMore]);

  const renderEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>💼</Text>
        <Text style={styles.emptyText}>No jobs found</Text>
        <Text style={styles.emptySubtext}>
          {searchQuery
            ? 'Try adjusting your search criteria'
            : 'Check back later for new opportunities'}
        </Text>
      </View>
    ),
    [searchQuery],
  );

  const filteredJobs = getFilteredJobs();

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading jobs...</Text>
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
        onEndReachedThreshold={0.1}
        contentContainerStyle={
          filteredJobs.length === 0 ? styles.emptyList : styles.list
        }
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
            <Text style={styles.modalTitle}>Sort Jobs</Text>

            {[
              {key: 'recent', label: 'Most Recent'},
              {key: 'priceLowToHigh', label: 'Price: Low to High'},
              {key: 'priceHighToLow', label: 'Price: High to Low'},
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
                <Text style={styles.sortOptionText}>{option.label}</Text>
                {sortBy === option.key && (
                  <Text style={styles.checkmark}>✓</Text>
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
  list: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  emptyList: {
    flexGrow: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 10,
  },

  // Header
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.splashGreen,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  sortButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortIcon: {
    fontSize: 16,
  },

  // Filters
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.background,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
  },
  filterChipActive: {
    backgroundColor: colors.splashGreen,
  },
  filterText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.background,
  },

  // Section Header
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },

  // Job Cards
  jobCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  jobHeaderLeft: {
    flex: 1,
    marginRight: 8,
  },
  jobHeaderRight: {
    alignItems: 'flex-end',
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  jobLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  jobLocationText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  saveButton: {
    padding: 4,
  },
  saveIcon: {
    fontSize: 16,
  },
  jobDescription: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 8,
  },

  // Skills
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  skillTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
  },
  skillText: {
    fontSize: 11,
    color: colors.textSecondary,
  },

  // Footer
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  jobMeta: {
    flex: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  metaIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  metaText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  jobFooterRight: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.splashGreen,
    marginBottom: 4,
  },
  applyButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.splashGreen,
    borderRadius: 6,
  },
  appliedButton: {
    backgroundColor: '#E8F5E9',
  },
  applyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  appliedButtonText: {
    color: colors.splashGreen,
  },

  // Loading More
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadingMoreText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 8,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sortOptionActive: {
    backgroundColor: '#F8F9FA',
  },
  sortOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  checkmark: {
    fontSize: 16,
    color: colors.splashGreen,
    fontWeight: '600',
  },
});

export default JobsScreen;
