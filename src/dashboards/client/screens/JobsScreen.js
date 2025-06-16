import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  FlatList,
  Image,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {
  getJobsAndProjects,
  getMyJobs,
  createJob,
  getJobProposals,
  proposalAction,
} from '../../../api/client';

// Import your icons here
import TotalProjectsIcon from '../../../assets/images/icons/company.png';
import TotalBudgetIcon from '../../../assets/images/icons/company.png';
import CompletedIcon from '../../../assets/images/icons/company.png';
import InProgressIcon from '../../../assets/images/icons/company.png';
import SearchIcon from '../../../assets/images/icons/company.png';
import LocationIcon from '../../../assets/images/icons/location.png';
import CalendarIcon from '../../../assets/images/icons/company.png';
import ProposalIcon from '../../../assets/images/icons/company.png';
import {useNavigation} from '@react-navigation/native';

const JobsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobsData, setJobsData] = useState(null);
  const [myJobs, setMyJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showProposalsModal, setShowProposalsModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobProposals, setJobProposals] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const navigation = useNavigation();

  // Create job form data
  const [createFormData, setCreateFormData] = useState({
    name: '',
    category: '',
    details: '',
    budget: '',
    days_project: '',
    location: '',
    urgent: false,
    note: '',
    required_skills: [],
    tags: [],
  });

  // Filter options
  const filterOptions = [
    {label: 'All Jobs', value: 'all'},
    {label: 'Open', value: 'open'},
    {label: 'In Progress', value: 'in_progress'},
    {label: 'Completed', value: 'completed'},
    {label: 'Cancelled', value: 'cancelled'},
  ];

  // Job categories
  const jobCategories = [
    {label: 'Plumbing Supplies', value: 'plumbing_supplies'},
    {label: 'Electrical Components', value: 'electrical_components'},
    {label: 'Safety Gear', value: 'safety_gear'},
    {label: 'Construction Materials', value: 'construction_materials'},
    {label: 'HVAC Systems', value: 'hvac_systems'},
    {label: 'Painting Supplies', value: 'painting_supplies'},
    {label: 'Flooring Materials', value: 'flooring_materials'},
    {label: 'Roofing Materials', value: 'roofing_materials'},
  ];

  // All existing functions remain the same...
  const fetchJobsAndProjects = useCallback(async () => {
    try {
      const response = await getJobsAndProjects();
      console.log('Jobs and Projects API Response:', response);
      setJobsData(response);
    } catch (error) {
      console.error('Failed to load jobs and projects:', error);
      Alert.alert('Error', 'Unable to load jobs data. Please try again.');
    }
  }, []);

  const fetchMyJobs = useCallback(
    async (pageNum = 1, resetData = true) => {
      try {
        if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const params = {
          page: pageNum,
          limit: 20,
          ...(selectedFilter !== 'all' && {
            status: selectedFilter,
          }),
        };

        const response = await getMyJobs(params);
        console.log('My Jobs API Response:', response);

        if (response && response.jobs) {
          const newJobs = response.jobs;

          if (resetData || pageNum === 1) {
            setMyJobs(newJobs);
          } else {
            setMyJobs(prev => [...prev, ...newJobs]);
          }

          setHasMore(
            response.pagination?.current_page <
              response.pagination?.total_pages,
          );
          setPage(pageNum);
        } else {
          if (resetData || pageNum === 1) {
            setMyJobs([]);
          }
          setHasMore(false);
        }
      } catch (error) {
        console.error('Failed to load my jobs:', error);
        if (resetData || pageNum === 1) {
          setMyJobs([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedFilter],
  );

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchJobsAndProjects(), fetchMyJobs(1, true)]);
    };
    loadData();
  }, [fetchJobsAndProjects, fetchMyJobs]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchJobsAndProjects(), fetchMyJobs(1, true)]);
    setRefreshing(false);
  }, [fetchJobsAndProjects, fetchMyJobs]);

  // Load more jobs
  const loadMoreJobs = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchMyJobs(page + 1, false);
    }
  }, [fetchMyJobs, page, hasMore, loadingMore]);

  // Filter jobs locally based on search
  const filteredJobs = myJobs.filter(job => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      job.title?.toLowerCase().includes(searchLower) ||
      job.description?.toLowerCase().includes(searchLower) ||
      job.location?.toLowerCase().includes(searchLower) ||
      job.category?.toLowerCase().includes(searchLower)
    );
  });

  // Create new job
  const handleCreateJob = async () => {
    try {
      if (
        !createFormData.name ||
        !createFormData.category ||
        !createFormData.details ||
        !createFormData.budget
      ) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      setLoading(true);
      const response = await createJob(createFormData);

      if (response) {
        Alert.alert('Success', 'Job created successfully!');
        setShowCreateModal(false);
        setCreateFormData({
          name: '',
          category: '',
          details: '',
          budget: '',
          days_project: '',
          location: '',
          urgent: false,
          note: '',
          required_skills: [],
          tags: [],
        });
        await fetchMyJobs(1, true);
        await fetchJobsAndProjects();
      }
    } catch (error) {
      console.error('Failed to create job:', error);
      Alert.alert('Error', 'Failed to create job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // View job proposals
  const viewJobProposals = async job => {
    try {
      setLoading(true);
      const response = await getJobProposals({job_id: job.id});

      if (response) {
        setSelectedJob(job);
        setJobProposals(response.proposals || []);
        setShowProposalsModal(true);
      }
    } catch (error) {
      console.error('Failed to load job proposals:', error);
      Alert.alert('Error', 'Unable to load job proposals.');
    } finally {
      setLoading(false);
    }
  };

  // Handle proposal action
  const handleProposalAction = async (proposalId, action) => {
    try {
      setLoading(true);
      const response = await proposalAction({
        job_id: selectedJob.id,
        proposal_id: proposalId,
        action: action,
        message:
          action === 'accept'
            ? 'Looking forward to working with you!'
            : 'Thank you for your proposal.',
      });

      if (response) {
        Alert.alert('Success', `Proposal ${action}ed successfully!`);
        setShowProposalsModal(false);
        await fetchMyJobs(1, true);
        await fetchJobsAndProjects();
      }
    } catch (error) {
      console.error(`Failed to ${action} proposal:`, error);
      Alert.alert('Error', `Failed to ${action} proposal.`);
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `Rs ${amount.toLocaleString()}`;
    }
    return `Rs ${amount || '0'}`;
  };

  // Format date
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get status color
  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'open':
        return {bg: '#E8F5E9', text: colors.splashGreen};
      case 'in_progress':
        return {bg: '#E3F2FD', text: colors.primary};
      case 'completed':
        return {bg: '#F3E5F5', text: '#9C27B0'};
      case 'cancelled':
        return {bg: '#FFEBEE', text: '#F44336'};
      default:
        return {bg: '#F5F5F5', text: colors.textSecondary};
    }
  };

  // Loading state
  if (loading && myJobs.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading jobs...</Text>
      </View>
    );
  }

  if (!jobsData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{color: colors.text}}>No data available</Text>
      </View>
    );
  }

  // Prepare stats data from API
  const statsData = [
    {
      icon: TotalProjectsIcon,
      bgColor: '#E8F5E9',
      label: 'Total Projects',
      value: jobsData.total_projects?.toString() ?? '0',
      change: `Active Jobs`,
      changeColor: colors.splashGreen,
    },
    {
      icon: TotalBudgetIcon,
      bgColor: '#E3F2FD',
      label: 'Total Budget',
      value: formatCurrency(jobsData.total_budget ?? 0),
      change: `Allocated`,
      changeColor: colors.primary,
    },
    {
      icon: CompletedIcon,
      bgColor: '#F3E5F5',
      label: 'Completed',
      value: jobsData.completed?.toString() ?? '0',
      change: `Successfully Done`,
      changeColor: '#9C27B0',
    },
    {
      icon: InProgressIcon,
      bgColor: '#FFF3E0',
      label: 'In Progress',
      value: jobsData.inprogress?.toString() ?? '0',
      change: `Currently Active`,
      changeColor: '#FF9800',
    },
  ];

  // Render job item
  // In your JobsScreen.js, update the renderJobItem function:

  const renderJobItem = ({item: job}) => {
    const statusColors = getStatusColor(job.status);

    // 👇 Fix: Use the correct job ID field
    const jobId = job.id || job._id || job.project_id;

    console.log('Job item:', job); // 👈 Add this to debug
    console.log('Job ID:', jobId); // 👈 Add this to debug

    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => {
          console.log('Navigating to job details with ID:', jobId); // 👈 Add this to debug
          navigation.navigate('JobDetailsScreen', {jobId: jobId});
        }}
        activeOpacity={0.7}>
        <View style={styles.jobHeader}>
          <View style={styles.jobInfo}>
            <Text style={styles.jobTitle} numberOfLines={1}>
              {job.title}
            </Text>
            <View style={styles.jobLocation}>
              <Image
                source={LocationIcon}
                style={styles.locationIcon}
                resizeMode="contain"
              />
              <Text style={styles.jobLocationText}>
                {job.location || job.city || 'Location not specified'}
              </Text>
            </View>
          </View>
          <View style={styles.jobMeta}>
            <Text style={styles.jobPrice}>{formatCurrency(job.budget)}</Text>
            <View
              style={[styles.statusBadge, {backgroundColor: statusColors.bg}]}>
              <Text style={[styles.statusText, {color: statusColors.text}]}>
                {job.status?.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.jobDescription} numberOfLines={2}>
          {job.description}
        </Text>

        <View style={styles.jobFooter}>
          <View style={styles.jobMetaRow}>
            <View style={styles.jobMetaItem}>
              <Image
                source={CalendarIcon}
                style={styles.metaIcon}
                resizeMode="contain"
              />
              <Text style={styles.metaText}>
                {formatDate(job.date || job.created_at)}
              </Text>
            </View>
            <View style={styles.jobMetaItem}>
              <Image
                source={ProposalIcon}
                style={styles.metaIcon}
                resizeMode="contain"
              />
              <Text style={styles.metaText}>
                {job.proposal_stats?.total_proposals || 0} Proposals
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => {
              console.log('View Details pressed for job ID:', jobId); // 👈 Add this to debug
              navigation.navigate('JobDetailsScreen', {jobId: jobId});
            }}>
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render proposal item
  const renderProposalItem = ({item: proposal}) => (
    <View style={styles.proposalCard}>
      <View style={styles.proposalHeader}>
        <View style={styles.providerInfo}>
          <View style={styles.providerAvatar}>
            <Text style={styles.avatarText}>
              {proposal.service_provider?.username?.charAt(0).toUpperCase() ||
                'U'}
            </Text>
          </View>
          <View style={styles.providerDetails}>
            <Text style={styles.providerName}>
              {proposal.service_provider?.username || 'Unknown Provider'}
            </Text>
            <Text style={styles.providerStats}>
              {proposal.provider_stats?.success_rate || 0}% Success Rate •{' '}
              {proposal.provider_stats?.completed_jobs || 0} Jobs Completed
            </Text>
          </View>
        </View>
        <View style={styles.proposalMeta}>
          <Text style={styles.proposalPrice}>
            {formatCurrency(proposal.proposed_budget)}
          </Text>
          <Text style={styles.proposalTimeline}>
            {proposal.proposed_timeline}
          </Text>
        </View>
      </View>

      <Text style={styles.proposalText} numberOfLines={3}>
        {proposal.proposal_text}
      </Text>

      <View style={styles.proposalFooter}>
        <Text style={styles.proposalDate}>
          {formatDate(proposal.submitted_at)}
        </Text>

        {proposal.proposal_status === 'pending' && (
          <View style={styles.proposalActions}>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() =>
                handleProposalAction(proposal.proposal_id, 'reject')
              }>
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() =>
                handleProposalAction(proposal.proposal_id, 'accept')
              }>
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  // Render create job modal
  const renderCreateJobModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowCreateModal(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Create New Job</Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleCreateJob}>
            <Text style={styles.saveButtonText}>Create</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            <Text style={styles.formSectionTitle}>Job Details</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Job Title *</Text>
              <TextInput
                style={styles.textInput}
                value={createFormData.name}
                onChangeText={text =>
                  setCreateFormData({...createFormData, name: text})
                }
                placeholder="Enter job title"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category *</Text>
              <View style={styles.categoryContainer}>
                {jobCategories.map(category => (
                  <TouchableOpacity
                    key={category.value}
                    style={[
                      styles.categoryChip,
                      createFormData.category === category.value &&
                        styles.selectedCategoryChip,
                    ]}
                    onPress={() =>
                      setCreateFormData({
                        ...createFormData,
                        category: category.value,
                      })
                    }>
                    <Text
                      style={[
                        styles.categoryChipText,
                        createFormData.category === category.value &&
                          styles.selectedCategoryChipText,
                      ]}>
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={createFormData.details}
                onChangeText={text =>
                  setCreateFormData({...createFormData, details: text})
                }
                placeholder="Describe your job requirements"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>Budget (Rs) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={createFormData.budget}
                  onChangeText={text =>
                    setCreateFormData({...createFormData, budget: text})
                  }
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroupHalf}>
                <Text style={styles.inputLabel}>Timeline (days)</Text>
                <TextInput
                  style={styles.textInput}
                  value={createFormData.days_project}
                  onChangeText={text =>
                    setCreateFormData({...createFormData, days_project: text})
                  }
                  placeholder="7"
                  keyboardType="numeric"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Location</Text>
              <TextInput
                style={styles.textInput}
                value={createFormData.location}
                onChangeText={text =>
                  setCreateFormData({...createFormData, location: text})
                }
                placeholder="Enter job location"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.switchGroup}>
              <Text style={styles.inputLabel}>Mark as Urgent</Text>
              <TouchableOpacity
                style={[
                  styles.switchButton,
                  createFormData.urgent && styles.switchButtonActive,
                ]}
                onPress={() =>
                  setCreateFormData({
                    ...createFormData,
                    urgent: !createFormData.urgent,
                  })
                }>
                <Text
                  style={[
                    styles.switchButtonText,
                    createFormData.urgent && styles.switchButtonTextActive,
                  ]}>
                  {createFormData.urgent ? 'Yes' : 'No'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  // Render proposals modal
  const renderProposalsModal = () => (
    <Modal
      visible={showProposalsModal}
      animationType="slide"
      presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowProposalsModal(false)}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Job Proposals</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.proposalsHeader}>
          <Text style={styles.jobTitleInModal}>{selectedJob?.title}</Text>
          <Text style={styles.proposalsSummary}>
            {jobProposals.length} Proposals Received
          </Text>
        </View>

        <FlatList
          data={jobProposals}
          renderItem={renderProposalItem}
          keyExtractor={item => item.proposal_id}
          contentContainerStyle={styles.proposalsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyProposals}>
              <Text style={styles.emptyText}>No proposals yet</Text>
              <Text style={styles.emptySubtext}>
                Proposals will appear here when providers apply
              </Text>
            </View>
          )}
        />
      </View>
    </Modal>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}>
      <View style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>My Jobs</Text>
              <Text style={styles.headerSubtitle}>
                Manage your job postings
              </Text>
            </View>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('PostJobScreen')}>
              <Text style={styles.createButtonText}>+ Create Job</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid - More Compact */}
        <View style={styles.statsGrid}>
          {statsData.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={styles.statHeader}>
                <View
                  style={[styles.statIcon, {backgroundColor: stat.bgColor}]}>
                  <Image
                    source={stat.icon}
                    style={styles.statIconImage}
                    resizeMode="contain"
                  />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
              <Text style={styles.statLabel}>{stat.label}</Text>
              <Text style={[styles.statChange, {color: stat.changeColor}]}>
                {stat.change}
              </Text>
            </View>
          ))}
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Image
              source={SearchIcon}
              style={styles.searchIcon}
              resizeMode="contain"
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search jobs..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}>
            {filterOptions.map(filter => (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.filterTab,
                  selectedFilter === filter.value && styles.activeFilterTab,
                ]}
                onPress={() => setSelectedFilter(filter.value)}>
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === filter.value &&
                      styles.activeFilterTabText,
                  ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Jobs List */}
        <View style={styles.jobsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Jobs</Text>
            <Text style={styles.jobCount}>{filteredJobs.length} Jobs</Text>
          </View>

          {filteredJobs.length > 0 ? (
            filteredJobs.map((job, index) => (
              <View key={job.id || index}>{renderJobItem({item: job})}</View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'No jobs match your search'
                  : 'No jobs posted yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create your first job to get started'}
              </Text>
              <TouchableOpacity
                style={styles.emptyActionButton}
                onPress={() => navigation.navigate('PostJobScreen')}>
                <Text style={styles.emptyActionButtonText}>Create Job</Text>
              </TouchableOpacity>
            </View>
          )}

          {loadingMore && (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color={colors.splashGreen} />
            </View>
          )}
        </View>
      </View>

      {/* Create Job Modal */}
      {renderCreateJobModal()}

      {/* Proposals Modal */}
      {renderProposalsModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 100, // Added proper bottom spacing
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
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
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  createButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  createButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },

  // Improved Stats Grid - More Compact
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12, // Reduced gap
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.background,
    borderRadius: 12, // Smaller radius
    padding: 12, // Reduced padding
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statIcon: {
    width: 32, // Smaller icon
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconImage: {
    width: 18, // Smaller image
    height: 18,
  },
  statValue: {
    fontSize: 18, // Smaller font
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12, // Smaller label
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statChange: {
    fontSize: 11, // Smaller change text
    fontWeight: '500',
  },

  searchSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12, // Smaller radius
    paddingHorizontal: 16,
    paddingVertical: 10, // Reduced padding
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    width: 18, // Smaller icon
    height: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14, // Smaller font
    color: colors.text,
  },

  filterSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  filterContainer: {
    paddingRight: 16,
  },
  filterTab: {
    paddingHorizontal: 12, // Reduced padding
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16, // Smaller radius
    backgroundColor: '#F0F0F0',
  },
  activeFilterTab: {
    backgroundColor: colors.splashGreen,
  },
  filterTabText: {
    fontSize: 12, // Smaller font
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: colors.background,
  },

  jobsSection: {
    marginTop: 20, // Reduced margin
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12, // Reduced margin
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  jobCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Job Cards - More Compact
  jobCard: {
    backgroundColor: colors.background,
    borderRadius: 12, // Smaller radius
    padding: 12, // Reduced padding
    marginBottom: 10, // Reduced margin
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8, // Reduced margin
  },
  jobInfo: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: 15, // Smaller font
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4, // Reduced margin
  },
  jobLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 10, // Smaller icon
    height: 10,
    marginRight: 4,
  },
  jobLocationText: {
    fontSize: 12, // Smaller font
    color: colors.textSecondary,
  },
  jobMeta: {
    alignItems: 'flex-end',
  },
  jobPrice: {
    fontSize: 14, // Smaller font
    fontWeight: '700',
    color: colors.splashGreen,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 6, // Reduced padding
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 9, // Smaller font
    fontWeight: '600',
  },
  jobDescription: {
    fontSize: 12, // Smaller font
    color: colors.textSecondary,
    lineHeight: 16, // Reduced line height
    marginBottom: 12, // Reduced margin
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobMetaRow: {
    flex: 1,
  },
  jobMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3, // Reduced margin
  },
  metaIcon: {
    width: 10, // Smaller icon
    height: 10,
    marginRight: 4,
  },
  metaText: {
    fontSize: 11, // Smaller font
    color: colors.textSecondary,
  },
  viewButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 12, // Reduced padding
    paddingVertical: 6,
    borderRadius: 16, // Smaller radius
  },
  viewButtonText: {
    color: colors.background,
    fontSize: 11, // Smaller font
    fontWeight: '600',
  },

  loadMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: colors.background,
    borderRadius: 12, // Smaller radius
    padding: 32, // Reduced padding
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    fontSize: 15, // Smaller font
    color: colors.textSecondary,
    marginBottom: 6, // Reduced margin
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 13, // Smaller font
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16, // Reduced margin
  },
  emptyActionButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 16,
    paddingVertical: 8, // Reduced padding
    borderRadius: 16, // Smaller radius
  },
  emptyActionButtonText: {
    color: colors.background,
    fontSize: 13, // Smaller font
    fontWeight: '600',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingTop: 40,
  },
  cancelButton: {
    minWidth: 60,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  placeholder: {
    minWidth: 60,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  formSection: {
    paddingVertical: 16,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputGroupHalf: {
    flex: 1,
    marginRight: 8,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  selectedCategoryChip: {
    backgroundColor: colors.splashGreen,
  },
  categoryChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  selectedCategoryChipText: {
    color: colors.background,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  switchButtonActive: {
    backgroundColor: colors.splashGreen,
  },
  switchButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  switchButtonTextActive: {
    color: colors.background,
  },

  // Proposals Modal Styles - More Compact
  proposalsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12, // Reduced padding
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: colors.background,
  },
  jobTitleInModal: {
    fontSize: 15, // Smaller font
    fontWeight: '600',
    color: colors.text,
    marginBottom: 3, // Reduced margin
  },
  proposalsSummary: {
    fontSize: 13, // Smaller font
    color: colors.textSecondary,
  },
  proposalsList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  proposalCard: {
    backgroundColor: colors.background,
    borderRadius: 12, // Smaller radius
    padding: 12, // Reduced padding
    marginBottom: 10, // Reduced margin
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10, // Reduced margin
  },
  providerInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  providerAvatar: {
    width: 32, // Smaller avatar
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10, // Reduced margin
  },
  avatarText: {
    fontSize: 14, // Smaller font
    fontWeight: '600',
    color: colors.background,
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 13, // Smaller font
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  providerStats: {
    fontSize: 11, // Smaller font
    color: colors.textSecondary,
  },
  proposalMeta: {
    alignItems: 'flex-end',
  },
  proposalPrice: {
    fontSize: 14, // Smaller font
    fontWeight: '700',
    color: colors.splashGreen,
    marginBottom: 2,
  },
  proposalTimeline: {
    fontSize: 11, // Smaller font
    color: colors.textSecondary,
  },
  proposalText: {
    fontSize: 13, // Smaller font
    color: colors.text,
    lineHeight: 18, // Reduced line height
    marginBottom: 10, // Reduced margin
  },
  proposalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  proposalDate: {
    fontSize: 11, // Smaller font
    color: colors.textSecondary,
  },
  proposalActions: {
    flexDirection: 'row',
    gap: 6, // Reduced gap
  },
  rejectButton: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12, // Reduced padding
    paddingVertical: 6,
    borderRadius: 12, // Smaller radius
    borderWidth: 1,
    borderColor: '#F44336',
  },
  rejectButtonText: {
    color: '#F44336',
    fontSize: 11, // Smaller font
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 12, // Reduced padding
    paddingVertical: 6,
    borderRadius: 12, // Smaller radius
  },
  acceptButtonText: {
    color: colors.background,
    fontSize: 11, // Smaller font
    fontWeight: '600',
  },
  emptyProposals: {
    paddingVertical: 32, // Reduced padding
    alignItems: 'center',
  },
});

export default JobsScreen;
