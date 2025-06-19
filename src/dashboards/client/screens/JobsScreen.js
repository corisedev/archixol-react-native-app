import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  FlatList,
  Modal,
} from 'react-native';
import {
  Search,
  Filter,
  Edit,
  Trash2,
  Briefcase,
  X,
  Calendar,
  Clock,
  MapPin,
  Users,
  Eye,
  MoreVertical,
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle,
  PlayCircle,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {getJobsAndProjects, deleteJob} from '../../../api/client';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import DeleteConfirmationModal from '../components/Modals/DeleteConfirmationModal';

// Empty state component
const JobListEmpty = ({query, navigation}) => {
  return (
    <View style={styles.emptyContainer}>
      <Briefcase color={colors.textSecondary} size={48} />
      <Text style={styles.emptyText}>
        {query ? 'No jobs found matching your search' : 'No jobs yet'}
      </Text>
      <Text style={styles.emptySubtext}>
        {query
          ? 'Try adjusting your search terms'
          : 'Start by posting your first job to find the right professionals'}
      </Text>
      {!query && (
        <TouchableOpacity
          style={styles.createJobButton}
          onPress={() => navigation.navigate('CreateJobScreen')}>
          <Plus color={colors.background} size={16} />
          <Text style={styles.createJobButtonText}>Create New Job</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Filter Modal component
const FilterModal = ({
  visible,
  onClose,
  selectedFilter,
  setSelectedFilter,
  onApply,
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="slide"
    onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filter Jobs</Text>
          <TouchableOpacity onPress={onClose}>
            <X color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Job Status</Text>
          {[
            {label: 'All Jobs', value: 'all'},
            {label: 'Open', value: 'open'},
            {label: 'Bidding Open', value: 'bidding open'},
            {label: 'Under Review', value: 'under review'},
            {label: 'Awarded', value: 'awarded'},
            {label: 'In Progress', value: 'in progress'},
            {label: 'Completed', value: 'completed'},
            {label: 'Cancelled', value: 'cancelled'},
          ].map(filter => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterOption,
                selectedFilter === filter.value && styles.selectedFilterOption,
              ]}
              onPress={() => setSelectedFilter(filter.value)}>
              <Text
                style={[
                  styles.filterOptionText,
                  selectedFilter === filter.value &&
                    styles.selectedFilterOptionText,
                ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() => onApply(selectedFilter)}>
            <Text style={styles.modalButtonText}>Apply Filter</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// Quick Action Modal Component
const QuickActionModal = ({
  visible,
  onClose,
  selectedJob,
  onUpdateStatus,
  onMarkAsCompleted,
  navigation,
}) => {
  if (!selectedJob) {
    return null;
  }

  const getJobNumber = job => {
    if (job.project_id) {
      return job.project_id;
    }
    if (job.id) {
      return `#${job.id.toString().substring(0, 8)}`;
    }
    if (job._id) {
      return `#${job._id.toString().substring(0, 8)}`;
    }
    return '#N/A';
  };

  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `PKR ${amount.toLocaleString()}`;
    }
    return `PKR ${amount || '0'}`;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.quickActionModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Quick Actions</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.jobSummary}>
            <Text style={styles.jobSummaryText}>
              {getJobNumber(selectedJob)} • {selectedJob.title}
            </Text>
            <Text style={styles.jobSummaryAmount}>
              {formatCurrency(selectedJob.budget)}
            </Text>
          </View>

          {/* Status Update Actions */}
          <View style={styles.actionSection}>
            <Text style={styles.actionSectionTitle}>Update Status</Text>

            {selectedJob.status === 'open' && (
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => {
                  onClose();
                  onUpdateStatus(
                    selectedJob._id || selectedJob.id,
                    'under review',
                  );
                }}>
                <AlertCircle color={colors.splashGreen} size={20} />
                <Text style={styles.quickActionText}>Mark as Under Review</Text>
              </TouchableOpacity>
            )}

            {selectedJob.status === 'under review' && (
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => {
                  onClose();
                  onUpdateStatus(selectedJob._id || selectedJob.id, 'awarded');
                }}>
                <CheckCircle color={colors.splashGreen} size={20} />
                <Text style={styles.quickActionText}>Mark as Awarded</Text>
              </TouchableOpacity>
            )}

            {selectedJob.status === 'awarded' && (
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => {
                  onClose();
                  onUpdateStatus(
                    selectedJob._id || selectedJob.id,
                    'in progress',
                  );
                }}>
                <PlayCircle color={colors.splashGreen} size={20} />
                <Text style={styles.quickActionText}>Start Project</Text>
              </TouchableOpacity>
            )}

            {selectedJob.status === 'in progress' && (
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => {
                  onClose();
                  onMarkAsCompleted(selectedJob._id || selectedJob.id);
                }}>
                <CheckCircle color={colors.splashGreen} size={20} />
                <Text style={styles.quickActionText}>Mark as Completed</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Other Actions */}
          <View style={styles.actionSection}>
            <Text style={styles.actionSectionTitle}>Other Actions</Text>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => {
                onClose();
                navigation.navigate('JobDetailScreen', {
                  jobId: selectedJob._id || selectedJob.id,
                });
              }}>
              <Eye color={colors.text} size={20} />
              <Text style={styles.quickActionText}>View Full Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => {
                onClose();
                navigation.navigate('JobProposalsScreen', {
                  jobId: selectedJob._id || selectedJob.id,
                });
              }}>
              <Users color={colors.text} size={20} />
              <Text style={styles.quickActionText}>View Proposals</Text>
            </TouchableOpacity>

            {selectedJob.status !== 'cancelled' &&
              selectedJob.status !== 'completed' && (
                <TouchableOpacity
                  style={[styles.quickAction, styles.cancelAction]}
                  onPress={() => {
                    onClose();
                    Alert.alert(
                      'Cancel Job',
                      'Are you sure you want to cancel this job?',
                      [
                        {text: 'No', style: 'cancel'},
                        {
                          text: 'Yes',
                          style: 'destructive',
                          onPress: () =>
                            onUpdateStatus(
                              selectedJob._id || selectedJob.id,
                              'cancelled',
                            ),
                        },
                      ],
                    );
                  }}>
                  <XCircle color="#F44336" size={20} />
                  <Text
                    style={[styles.quickActionText, styles.cancelActionText]}>
                    Cancel Job
                  </Text>
                </TouchableOpacity>
              )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const JobsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobsData, setJobsData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [quickActionModalVisible, setQuickActionModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const navigation = useNavigation();

  // Fetch jobs data
  const fetchJobs = useCallback(async () => {
    try {
      const response = await getJobsAndProjects();
      console.log('Jobs and Projects API Response:', response);

      setJobsData(response);

      if (response && response.jobs && Array.isArray(response.jobs)) {
        setJobs(response.jobs);
        setFilteredJobs(response.jobs);
      } else {
        setJobs([]);
        setFilteredJobs([]);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
      Alert.alert('Error', 'Unable to load jobs. Please try again.');
      setJobs([]);
      setFilteredJobs([]);
    }
  }, []);

  // Initial data load and refresh on focus
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        await fetchJobs();
        setLoading(false);
      };
      loadData();
    }, [fetchJobs]),
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  }, [fetchJobs]);

  // Search jobs
  const handleSearch = useCallback(
    query => {
      setSearchQuery(query);

      if (query.trim() === '') {
        applyFilters(jobs, selectedFilter);
        return;
      }

      const filtered = jobs.filter(job => {
        const jobNumber = getJobNumber(job).toLowerCase();
        const jobTitle = (job.title || '').toLowerCase();
        const jobId = (job._id || job.id || '').toString().toLowerCase();
        const jobStatus = getJobStatus(job).toLowerCase();
        const searchTerm = query.toLowerCase();

        return (
          jobNumber.includes(searchTerm) ||
          jobTitle.includes(searchTerm) ||
          jobId.includes(searchTerm) ||
          jobStatus.includes(searchTerm)
        );
      });
      setFilteredJobs(filtered);
    },
    [jobs, selectedFilter, applyFilters],
  );

  // Apply filters
  const applyFilters = useCallback((jobList, statusFilter) => {
    let filtered = [...jobList];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => {
        const jobStatus = getJobStatus(job);
        return jobStatus.toLowerCase() === statusFilter.toLowerCase();
      });
    }

    setFilteredJobs(filtered);
  }, []);

  // Handle filter change
  const handleFilterChange = statusFilter => {
    setSelectedFilter(statusFilter);
    setFilterModalVisible(false);

    if (searchQuery.trim() === '') {
      applyFilters(jobs, statusFilter);
    }
  };

  // Handle quick actions
  const handleQuickAction = job => {
    setSelectedJob(job);
    setQuickActionModalVisible(true);
  };

  // Update job status
  const updateJobStatus = async (jobId, newStatus) => {
    try {
      await updateJobStatus({
        job_id: jobId,
        status: newStatus,
      });

      const updatedJobs = jobs.map(job =>
        (job._id || job.id) === jobId ? {...job, status: newStatus} : job,
      );
      setJobs(updatedJobs);
      applyFilters(updatedJobs, selectedFilter);

      Alert.alert('Success', `Job status updated to ${newStatus}`);
    } catch (error) {
      console.error('Status update failed:', error);
      Alert.alert('Error', 'Failed to update job status. Please try again.');
    }
  };

  // Mark job as completed
  const markJobAsCompleted = async jobId => {
    try {
      await markJobAsCompleted({job_id: jobId});

      const updatedJobs = jobs.map(job =>
        (job._id || job.id) === jobId ? {...job, status: 'completed'} : job,
      );
      setJobs(updatedJobs);
      applyFilters(updatedJobs, selectedFilter);

      Alert.alert('Success', 'Job marked as completed');
    } catch (error) {
      console.error('Mark as completed failed:', error);
      Alert.alert(
        'Error',
        'Failed to mark job as completed. Please try again.',
      );
    }
  };

  // Delete job
  const confirmDeleteJob = async () => {
    if (!jobToDelete?.id) {
      return;
    }

    try {
      setDeleteLoading(true);
      await deleteJob({job_id: jobToDelete.id});
      Alert.alert('Success', 'Job deleted successfully');
      setDeleteModalVisible(false);
      fetchJobs(); // Refresh list
    } catch (error) {
      console.error('Delete failed:', error);
      Alert.alert('Error', 'Failed to delete job. Please try again.');
    } finally {
      setDeleteLoading(false);
      setJobToDelete(null);
    }
  };

  // Helper functions
  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `PKR ${amount.toLocaleString()}`;
    }
    return `PKR ${amount || '0'}`;
  };

  const getStatusColor = status => {
    if (!status || typeof status !== 'string') {
      return colors.textSecondary;
    }

    switch (status.toLowerCase()) {
      case 'completed':
        return colors.splashGreen;
      case 'in progress':
      case 'ongoing':
        return '#2196F3';
      case 'open':
      case 'bidding open':
        return '#FFC107';
      case 'under review':
      case 'review':
        return '#8B5CF6';
      case 'awarded':
        return '#10B981';
      case 'cancelled':
        return '#F44336';
      default:
        return colors.textSecondary;
    }
  };

  const formatDate = dateString => {
    if (!dateString) {
      return 'N/A';
    }

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getJobNumber = job => {
    if (job.project_id) {
      return job.project_id;
    }
    if (job.id) {
      return `#${job.id.toString().substring(0, 8)}`;
    }
    if (job._id) {
      return `#${job._id.toString().substring(0, 8)}`;
    }
    return '#N/A';
  };

  const getJobStatus = job => {
    if (job.status) {
      return job.status;
    }
    return 'open';
  };

  // Render job item
  const renderJobItem = ({item: job}) => {
    const jobStatus = getJobStatus(job);
    const statusColor = getStatusColor(jobStatus);
    const jobNumber = getJobNumber(job);

    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() =>
          navigation.navigate('JobDetailScreen', {
            jobId: job._id || job.id,
          })
        }
        activeOpacity={0.7}>
        {/* Card Header with Job Info and Action Buttons */}
        <View style={styles.cardHeader}>
          <View style={styles.leftSection}>
            {/* Job Status Icon */}
            <View
              style={[
                styles.jobStatusIcon,
                {backgroundColor: statusColor + '20'},
              ]}>
              <Briefcase color={statusColor} size={20} />
            </View>

            {/* Job Number and Title */}
            <View style={styles.jobBasicInfo}>
              <Text style={styles.jobNumber}>{jobNumber}</Text>
              <Text style={styles.jobTitle} numberOfLines={1}>
                {job.title}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate('JobDetailScreen', {
                  jobId: job._id || job.id,
                })
              }>
              <Edit color={colors.text} size={16} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => {
                setJobToDelete({
                  id: job._id || job.id,
                  number: getJobNumber(job),
                });
                setDeleteModalVisible(true);
              }}>
              <Trash2 color="#F44336" size={16} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Job Details */}
        <View style={styles.jobInfo}>
          {/* Urgent Badge */}
          {job.urgent && (
            <View style={styles.urgentBadge}>
              <Text style={styles.urgentText}>URGENT</Text>
            </View>
          )}

          <View style={styles.jobHeader}>
            <Text style={styles.jobAmount}>{formatCurrency(job.budget)}</Text>
            <View style={styles.badgesContainer}>
              <View
                style={[
                  styles.statusBadge,
                  {backgroundColor: statusColor + '20'},
                ]}>
                <Text style={[styles.statusBadgeText, {color: statusColor}]}>
                  {jobStatus.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.jobDescription} numberOfLines={2}>
            {job.description}
          </Text>

          <View style={styles.jobDetail}>
            <Calendar color={colors.textSecondary} size={12} />
            <Text style={styles.detailText}>
              {formatDate(job.date || job.created_at)}
            </Text>
          </View>

          <View style={styles.jobDetail}>
            <Clock color={colors.textSecondary} size={12} />
            <Text style={styles.detailText}>
              {job.timeline || 'Not specified'}
            </Text>
          </View>

          <View style={styles.jobDetail}>
            <MapPin color={colors.textSecondary} size={12} />
            <Text style={styles.detailText}>
              {job.location || 'Not specified'}
            </Text>
          </View>

          <View style={styles.jobDetail}>
            <Users color={colors.textSecondary} size={12} />
            <Text style={styles.detailText}>
              {job.proposal_count || 0} proposals
            </Text>
          </View>

          <View style={styles.jobMeta}>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() =>
                navigation.navigate('JobDetailScreen', {
                  jobId: job._id || job.id,
                })
              }>
              <Eye color={colors.background} size={16} />
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction(job)}>
              <MoreVertical color={colors.text} size={16} />
              <Text style={styles.quickActionButtonText}>Actions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Prepare stats data
  const statsData = [
    {
      title: 'Total Projects',
      value: jobsData?.total_projects ?? 0,
      icon: Briefcase,
    },
    {
      title: 'Open Jobs',
      value: jobsData?.open_jobs ?? 0,
      icon: Clock,
    },
    {
      title: 'In Progress',
      value: jobsData?.inprogress ?? 0,
      icon: Users,
    },
    {
      title: 'Completed',
      value: jobsData?.completed ?? 0,
      icon: CheckCircle,
    },
  ];

  // Render stat card
  const renderStatCard = ({item}) => (
    <View style={styles.statCard}>
      <View style={styles.statIconContainer}>
        <item.icon color={colors.splashGreen} size={20} />
      </View>
      <Text style={styles.statLabel}>{item.title}</Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {item.value}
      </Text>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading jobs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredJobs}
        renderItem={renderJobItem}
        keyExtractor={(item, index) => item._id || item.id || index.toString()}
        contentContainerStyle={styles.jobsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Jobs & Projects</Text>
              <View style={styles.headerActions}>
                <Text style={styles.headerSubtitle}>
                  {filteredJobs.length} jobs
                </Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => navigation.navigate('CreateJobScreen')}>
                  <Plus color={colors.background} size={20} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsContainer}>
              <FlatList
                data={statsData}
                renderItem={renderStatCard}
                keyExtractor={(item, index) => index.toString()}
                numColumns={2}
                scrollEnabled={false}
                columnWrapperStyle={styles.statsRow}
                ItemSeparatorComponent={() => <View style={{height: 12}} />}
              />
            </View>

            {/* Search and Filter */}
            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Search color={colors.textSecondary} size={16} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search jobs..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={handleSearch}
                />
              </View>

              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setFilterModalVisible(true)}>
                <Filter color={colors.textSecondary} size={18} />
              </TouchableOpacity>
            </View>

            {/* Filter Summary */}
            {selectedFilter !== 'all' && (
              <View style={styles.filterSummary}>
                <Text style={styles.filterSummaryText}>
                  Showing {filteredJobs.length} {selectedFilter} jobs
                </Text>
                <TouchableOpacity onPress={() => handleFilterChange('all')}>
                  <Text style={styles.clearFiltersText}>Show All</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <JobListEmpty query={searchQuery} navigation={navigation} />
        }
      />

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        selectedFilter={selectedFilter}
        setSelectedFilter={setSelectedFilter}
        onApply={handleFilterChange}
      />

      {/* Quick Action Modal */}
      <QuickActionModal
        visible={quickActionModalVisible}
        onClose={() => setQuickActionModalVisible(false)}
        selectedJob={selectedJob}
        onUpdateStatus={updateJobStatus}
        onMarkAsCompleted={markJobAsCompleted}
        navigation={navigation}
      />

      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setJobToDelete(null);
        }}
        onConfirm={confirmDeleteJob}
        itemType="Job"
        itemName={jobToDelete?.number || ''}
        loading={deleteLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: fontSizes['3xl'],
    fontFamily: fonts.bold,
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats Container
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
  },
  statsRow: {
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.splashGreen + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: 'center',
  },

  // Search and Filter
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    gap: 12,
    marginBottom: 20,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filter Summary
  filterSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E8F5E9',
  },
  filterSummaryText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  clearFiltersText: {
    fontSize: fontSizes.sm,
    color: colors.splashGreen,
    fontFamily: fonts.semiBold,
  },

  // Jobs List
  jobsList: {
    paddingTop: 0,
    paddingBottom: 100,
  },
  jobCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },

  // Card Header with Job Info and Actions
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  jobStatusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jobBasicInfo: {
    flex: 1,
  },
  jobNumber: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  deleteButton: {
    backgroundColor: '#FFF3F3',
    borderColor: '#FFD6D6',
  },

  // Job Info
  jobInfo: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  urgentBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  urgentText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bold,
    color: colors.background,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobAmount: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.splashGreen,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
  },
  jobDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    lineHeight: 20,
    marginBottom: 12,
  },
  jobDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  detailText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  jobMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.splashGreen,
    paddingVertical: 10,
    borderRadius: 6,
    gap: 6,
  },
  viewButtonText: {
    color: colors.background,
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 6,
  },
  quickActionButtonText: {
    color: colors.text,
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: fonts.regular,
    marginBottom: 24,
  },
  createJobButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createJobButtonText: {
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  quickActionModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },

  // Filter Section
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSectionTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedFilterOption: {
    backgroundColor: colors.splashGreen + '20',
  },
  filterOptionText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  selectedFilterOptionText: {
    color: colors.splashGreen,
    fontFamily: fonts.semiBold,
  },
  modalButtons: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalButton: {
    backgroundColor: colors.splashGreen,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
  },

  // Quick Actions
  jobSummary: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  jobSummaryText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  jobSummaryAmount: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.splashGreen,
  },
  actionSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  actionSectionTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  cancelAction: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 8,
    paddingTop: 16,
  },
  quickActionText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  cancelActionText: {
    color: '#F44336',
  },
});

export default JobsScreen;
