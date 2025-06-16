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
  Image,
  Linking,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {
  getJobDetails,
  getJobProposals,
  proposalAction,
  deleteJob,
  updateJob,
} from '../../../api/client';
import {useNavigation, useRoute} from '@react-navigation/native';

// Import your icons
import LocationIcon from '../../../assets/images/icons/location.png';
import CalendarIcon from '../../../assets/images/icons/company.png';
import MoneyIcon from '../../../assets/images/icons/company.png';
import TimeIcon from '../../../assets/images/icons/company.png';
import UserIcon from '../../../assets/images/icons/company.png';

const {width} = Dimensions.get('window');

const JobDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {jobId} = route.params;
  // 👇 Add these debug logs
  console.log('JobDetailsScreen mounted!');
  console.log('Route params:', route.params);
  console.log('JobId extracted:', jobId);
  console.log('JobId type:', typeof jobId);
  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobDetails, setJobDetails] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'proposals'

  // Fetch job details
  const fetchJobData = useCallback(async () => {
    try {
      console.log('🔍 Fetching job data for ID:', jobId);
      setLoading(true);

      // Use the proposals endpoint since it's working and contains job data
      const response = await getJobProposals({job_id: jobId});
      console.log('✅ Job Data Response:', response);

      if (response && response.job) {
        const job = response.job;
        setJobDetails(job);
        setProposals(response.proposals || []);

        // Initialize edit form data
        setEditFormData({
          title: job.title || '',
          description: job.description || '',
          budget: job.budget?.toString() || '',
          timeline: job.timeline || '',
          location: job.location || job.city || '',
          category: job.category || '',
          urgent: job.urgent || false,
          note: job.note || '',
        });
      } else {
        throw new Error('No job data found');
      }
    } catch (error) {
      console.error('❌ Failed to load job data:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      Alert.alert('Error', 'Unable to load job details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  // Initial load
  useEffect(() => {
    fetchJobData();
  }, [fetchJobData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobData();
    setRefreshing(false);
  }, [fetchJobData]);

  // Handle proposal action
  const handleProposalAction = async (proposalId, action) => {
    try {
      setLoading(true);
      const response = await proposalAction({
        job_id: jobId,
        proposal_id: proposalId,
        action: action,
        message:
          action === 'accept'
            ? 'Looking forward to working with you!'
            : 'Thank you for your proposal.',
      });

      if (response) {
        Alert.alert('Success', `Proposal ${action}ed successfully!`);
        await fetchJobData(); // Refresh data
      }
    } catch (error) {
      console.error(`Failed to ${action} proposal:`, error);
      Alert.alert('Error', `Failed to ${action} proposal.`);
    } finally {
      setLoading(false);
    }
  };

  // Handle job update
  const handleUpdateJob = async () => {
    try {
      if (
        !editFormData.title ||
        !editFormData.description ||
        !editFormData.budget
      ) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      setLoading(true);
      const updatedData = {
        name: editFormData.title,
        details: editFormData.description,
        budget: parseFloat(editFormData.budget),
        days_project: editFormData.timeline,
        location: editFormData.location,
        category: editFormData.category,
        urgent: editFormData.urgent,
        note: editFormData.note,
      };

      const response = await updateJob(jobId, updatedData);

      if (response) {
        Alert.alert('Success', 'Job updated successfully!');
        setShowEditModal(false);
        await fetchJobData();
      }
    } catch (error) {
      console.error('Failed to update job:', error);
      Alert.alert('Error', 'Failed to update job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle job deletion
  const handleDeleteJob = async () => {
    try {
      setLoading(true);
      const response = await deleteJob(jobId);

      if (response) {
        Alert.alert('Success', 'Job deleted successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to delete job:', error);
      Alert.alert('Error', 'Failed to delete job. Please try again.');
    } finally {
      setLoading(false);
      setShowDeleteAlert(false);
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
            <Text style={styles.providerExperience}>
              {proposal.provider_profile?.experience || 0} years experience
            </Text>
          </View>
        </View>
        <View style={styles.proposalMeta}>
          <Text style={styles.proposalPrice}>
            {formatCurrency(proposal.proposed_budget)}
          </Text>
          <Text style={styles.proposalTimeline}>
            {proposal.proposed_timeline || 'Timeline not specified'}
          </Text>
        </View>
      </View>

      <Text style={styles.proposalText} numberOfLines={3}>
        {proposal.proposal_text || 'No description provided'}
      </Text>

      <View style={styles.proposalFooter}>
        <Text style={styles.proposalDate}>
          Submitted: {formatDate(proposal.submitted_at)}
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

        {proposal.proposal_status === 'accepted' && (
          <View style={styles.statusBadge}>
            <Text style={styles.acceptedText}>✓ Accepted</Text>
          </View>
        )}

        {proposal.proposal_status === 'rejected' && (
          <View style={styles.statusBadge}>
            <Text style={styles.rejectedText}>✗ Rejected</Text>
          </View>
        )}
      </View>
    </View>
  );

  // Loading state
  if (loading && !jobDetails) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  if (!jobDetails) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Job not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusColors = getStatusColor(jobDetails.status);
  const canEdit = ['open', 'pending'].includes(
    jobDetails.status?.toLowerCase(),
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={styles.headerActions}>
          {canEdit && (
            <>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => setShowEditModal(true)}>
                <Text style={styles.editBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => setShowDeleteAlert(true)}>
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Job Header Card */}
        <View style={styles.jobHeaderCard}>
          <View style={styles.jobTitleRow}>
            <View style={styles.jobTitleInfo}>
              <Text style={styles.jobTitle}>{jobDetails.title}</Text>
              <View style={styles.jobLocationRow}>
                <Image source={LocationIcon} style={styles.smallIcon} />
                <Text style={styles.jobLocation}>
                  {jobDetails.location ||
                    jobDetails.city ||
                    'Location not specified'}
                </Text>
              </View>
            </View>
            <View style={styles.jobPriceSection}>
              <Text style={styles.jobPrice}>
                {formatCurrency(jobDetails.budget)}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  {backgroundColor: statusColors.bg},
                ]}>
                <Text style={[styles.statusText, {color: statusColors.text}]}>
                  {jobDetails.status?.toUpperCase().replace('_', ' ')}
                </Text>
              </View>
            </View>
          </View>

          {jobDetails.urgent && (
            <View style={styles.urgentBanner}>
              <Text style={styles.urgentText}>🔥 URGENT PROJECT</Text>
            </View>
          )}
        </View>

        {/* Job Meta Info */}
        <View style={styles.metaCard}>
          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Image source={CalendarIcon} style={styles.metaIcon} />
              <Text style={styles.metaLabel}>Posted</Text>
              <Text style={styles.metaValue}>
                {formatDate(jobDetails.created_at || jobDetails.date)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Image source={TimeIcon} style={styles.metaIcon} />
              <Text style={styles.metaLabel}>Timeline</Text>
              <Text style={styles.metaValue}>
                {jobDetails.timeline || 'Not specified'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Image source={UserIcon} style={styles.metaIcon} />
              <Text style={styles.metaLabel}>Proposals</Text>
              <Text style={styles.metaValue}>
                {jobDetails.proposal_stats?.total_proposals ||
                  proposals.length ||
                  0}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Image source={MoneyIcon} style={styles.metaIcon} />
              <Text style={styles.metaLabel}>Category</Text>
              <Text style={styles.metaValue}>
                {jobDetails.category?.replace('_', ' ') || 'General'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'details' && styles.activeTab]}
            onPress={() => setActiveTab('details')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'details' && styles.activeTabText,
              ]}>
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'proposals' && styles.activeTab]}
            onPress={() => setActiveTab('proposals')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'proposals' && styles.activeTabText,
              ]}>
              Proposals ({proposals.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'details' ? (
          <View style={styles.tabContent}>
            {/* Job Description */}
            <View style={styles.descriptionCard}>
              <Text style={styles.sectionTitle}>Project Description</Text>
              <Text style={styles.descriptionText}>
                {jobDetails.description ||
                  jobDetails.details ||
                  'No description provided'}
              </Text>
            </View>

            {/* Additional Info */}
            {(jobDetails.required_skills?.length > 0 ||
              jobDetails.tags?.length > 0) && (
              <View style={styles.skillsCard}>
                {jobDetails.required_skills?.length > 0 && (
                  <View style={styles.skillsSection}>
                    <Text style={styles.sectionTitle}>Required Skills</Text>
                    <View style={styles.skillsContainer}>
                      {jobDetails.required_skills.map((skill, index) => (
                        <View key={index} style={styles.skillChip}>
                          <Text style={styles.skillText}>{skill}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {jobDetails.tags?.length > 0 && (
                  <View style={styles.skillsSection}>
                    <Text style={styles.sectionTitle}>Tags</Text>
                    <View style={styles.skillsContainer}>
                      {jobDetails.tags.map((tag, index) => (
                        <View
                          key={index}
                          style={[styles.skillChip, styles.tagChip]}>
                          <Text style={[styles.skillText, styles.tagText]}>
                            {tag}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Additional Notes */}
            {jobDetails.note && (
              <View style={styles.notesCard}>
                <Text style={styles.sectionTitle}>Additional Notes</Text>
                <Text style={styles.notesText}>{jobDetails.note}</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.tabContent}>
            {proposals.length > 0 ? (
              <View style={styles.proposalsContainer}>
                {proposals.map((proposal, index) => (
                  <View key={proposal.proposal_id || index}>
                    {renderProposalItem({item: proposal})}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyProposals}>
                <Text style={styles.emptyText}>No proposals yet</Text>
                <Text style={styles.emptySubtext}>
                  Proposals will appear here when providers apply for your job
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowEditModal(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Job</Text>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleUpdateJob}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Job Title *</Text>
                <TextInput
                  style={styles.textInput}
                  value={editFormData.title}
                  onChangeText={text =>
                    setEditFormData({...editFormData, title: text})
                  }
                  placeholder="Enter job title"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={editFormData.description}
                  onChangeText={text =>
                    setEditFormData({...editFormData, description: text})
                  }
                  placeholder="Describe your job requirements"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputGroupHalf}>
                  <Text style={styles.inputLabel}>Budget (Rs) *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editFormData.budget}
                    onChangeText={text =>
                      setEditFormData({...editFormData, budget: text})
                    }
                    placeholder="0"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroupHalf}>
                  <Text style={styles.inputLabel}>Timeline</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editFormData.timeline}
                    onChangeText={text =>
                      setEditFormData({...editFormData, timeline: text})
                    }
                    placeholder="e.g., 7 days"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location</Text>
                <TextInput
                  style={styles.textInput}
                  value={editFormData.location}
                  onChangeText={text =>
                    setEditFormData({...editFormData, location: text})
                  }
                  placeholder="Enter job location"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Additional Notes</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={editFormData.note}
                  onChangeText={text =>
                    setEditFormData({...editFormData, note: text})
                  }
                  placeholder="Any additional information"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Delete Confirmation Alert */}
      <Modal visible={showDeleteAlert} transparent animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            <Text style={styles.alertTitle}>Delete Job</Text>
            <Text style={styles.alertMessage}>
              Are you sure you want to delete this job? This action cannot be
              undone.
            </Text>
            <View style={styles.alertActions}>
              <TouchableOpacity
                style={styles.alertCancelButton}
                onPress={() => setShowDeleteAlert(false)}>
                <Text style={styles.alertCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.alertDeleteButton}
                onPress={handleDeleteJob}>
                <Text style={styles.alertDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingTop: 50,
  },
  backBtn: {
    padding: 8,
  },
  backBtnText: {
    color: colors.splashGreen,
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editBtnText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  deleteBtn: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  deleteBtnText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },

  scrollView: {
    flex: 1,
  },

  // Job Header Card
  jobHeaderCard: {
    backgroundColor: colors.background,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobTitleInfo: {
    flex: 1,
    marginRight: 16,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  jobLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallIcon: {
    width: 12,
    height: 12,
    marginRight: 6,
  },
  jobLocation: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  jobPriceSection: {
    alignItems: 'flex-end',
  },
  jobPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.splashGreen,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  urgentBanner: {
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  urgentText: {
    color: '#FF4444',
    fontSize: 14,
    fontWeight: '600',
  },

  // Meta Card
  metaCard: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metaItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  metaIcon: {
    width: 20,
    height: 20,
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: colors.splashGreen,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.background,
    fontWeight: '600',
  },

  // Tab Content
  tabContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },

  // Description Card
  descriptionCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },

  // Skills Card
  skillsCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skillsSection: {
    marginBottom: 16,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  tagChip: {
    backgroundColor: '#F3E5F5',
  },
  tagText: {
    color: '#9C27B0',
  },

  // Notes Card
  notesCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notesText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    fontStyle: 'italic',
  },

  // Proposals
  proposalsContainer: {
    gap: 12,
  },
  proposalCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  proposalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  providerInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 16,
  },
  providerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  providerStats: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  providerExperience: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  proposalMeta: {
    alignItems: 'flex-end',
  },
  proposalPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.splashGreen,
    marginBottom: 4,
  },
  proposalTimeline: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  proposalText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  proposalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  proposalDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  proposalActions: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectButton: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  rejectButtonText: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  acceptButtonText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  acceptedText: {
    color: colors.splashGreen,
    fontSize: 12,
    fontWeight: '600',
  },
  rejectedText: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: '600',
  },

  // Empty States
  emptyProposals: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
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
    paddingTop: 50,
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
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  formSection: {
    paddingVertical: 16,
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

  // Alert Modal Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 350,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  alertActions: {
    flexDirection: 'row',
    gap: 12,
  },
  alertCancelButton: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  alertCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  alertDeleteButton: {
    flex: 1,
    backgroundColor: '#FF4444',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  alertDeleteText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },

  // Back Button (for error state)
  backButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default JobDetailsScreen;
