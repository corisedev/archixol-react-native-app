import React, {useState, useCallback, useEffect} from 'react';
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
  FlatList,
} from 'react-native';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Share2,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  Briefcase,
  AlertTriangle,
  Users,
  Eye,
  CheckCircle,
  XCircle,
  PlayCircle,
  Phone,
  Mail,
  MessageCircle,
  FileText,
  Star,
  ChevronRight,
  Download,
  ExternalLink,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {getJobsAndProjects, deleteJob} from '../../../api/client'; // Using available APIs
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from '@react-navigation/native';
import DeleteConfirmationModal from '../components/Modals/DeleteConfirmationModal';

// Status Update Modal Component
const StatusUpdateModal = ({
  visible,
  onClose,
  currentStatus,
  onUpdateStatus,
  loading,
}) => {
  const statusOptions = [
    {label: 'Open', value: 'open', color: '#FFC107'},
    {label: 'Under Review', value: 'under review', color: '#8B5CF6'},
    {label: 'Awarded', value: 'awarded', color: '#10B981'},
    {label: 'In Progress', value: 'in progress', color: '#2196F3'},
    {label: 'Completed', value: 'completed', color: colors.splashGreen},
    {label: 'Cancelled', value: 'cancelled', color: '#F44336'},
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Job Status</Text>
            <TouchableOpacity onPress={onClose}>
              <XCircle color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.statusOptions}>
            {statusOptions.map(status => (
              <TouchableOpacity
                key={status.value}
                style={[
                  styles.statusOption,
                  currentStatus === status.value && styles.selectedStatusOption,
                ]}
                onPress={() => onUpdateStatus(status.value)}
                disabled={loading}>
                <View
                  style={[
                    styles.statusIndicator,
                    {backgroundColor: status.color},
                  ]}
                />
                <Text
                  style={[
                    styles.statusOptionText,
                    currentStatus === status.value &&
                      styles.selectedStatusOptionText,
                  ]}>
                  {status.label}
                </Text>
                {currentStatus === status.value && (
                  <CheckCircle color={status.color} size={16} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.splashGreen} />
              <Text style={styles.loadingText}>Updating status...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

// Image Viewer Modal Component
const ImageViewerModal = ({visible, onClose, images, initialIndex = 0}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  if (!images || images.length === 0) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.imageViewerOverlay}>
        <View style={styles.imageViewerHeader}>
          <Text style={styles.imageViewerTitle}>
            {currentIndex + 1} of {images.length}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <XCircle color={colors.background} size={24} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          onMomentumScrollEnd={event => {
            const index = Math.round(
              event.nativeEvent.contentOffset.x /
                event.nativeEvent.layoutMeasurement.width,
            );
            setCurrentIndex(index);
          }}
          renderItem={({item}) => (
            <View style={styles.imageViewerContainer}>
              <Image source={{uri: item.uri}} style={styles.fullScreenImage} />
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
      </View>
    </Modal>
  );
};

const JobDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {jobId} = route.params;

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobData, setJobData] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Fetch job details from jobs list
  const fetchJobDetails = useCallback(async () => {
    try {
      console.log('Fetching jobs to find job with ID:', jobId);
      const response = await getJobsAndProjects();
      console.log('Jobs response:', response);

      if (response && response.jobs && Array.isArray(response.jobs)) {
        // Find the specific job by ID
        const job = response.jobs.find(
          j => j._id === jobId || j.id === jobId || j.project_id === jobId,
        );

        if (job) {
          console.log('Found job:', job);
          // Structure the data to match expected format
          setJobData({
            job: job,
            proposals: [], // You can get this from getJobProposal if needed
            client: {
              name: 'Client Name', // Add client info if available
              rating: 4.5,
              phone: null,
              email: null,
            },
          });
        } else {
          throw new Error('Job not found');
        }
      } else {
        throw new Error('No jobs data received');
      }
    } catch (error) {
      console.error('Failed to load job details:', error);
      Alert.alert('Error', 'Unable to load job details. Please try again.');
    }
  }, [jobId]);

  // Initial data load and refresh on focus
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        await fetchJobDetails();
        setLoading(false);
      };
      loadData();
    }, [fetchJobDetails]),
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchJobDetails();
    setRefreshing(false);
  }, [fetchJobDetails]);

  // Delete job
  const handleDeleteJob = async () => {
    try {
      setDeleteLoading(true);
      await deleteJob({job_id: jobId});
      Alert.alert('Success', 'Job deleted successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Delete failed:', error);
      Alert.alert('Error', 'Failed to delete job. Please try again.');
    } finally {
      setDeleteLoading(false);
      setDeleteModalVisible(false);
    }
  };

  // Update job status (placeholder - implement when API is available)
  const handleStatusUpdate = async newStatus => {
    try {
      setStatusUpdateLoading(true);

      // Since updateJobStatus API might not be available,
      // we'll just update local state for now
      setJobData(prev => ({
        ...prev,
        job: {
          ...prev.job,
          status: newStatus,
        },
      }));

      setStatusModalVisible(false);
      Alert.alert('Success', `Job status updated to ${newStatus}`);
    } catch (error) {
      console.error('Status update failed:', error);
      Alert.alert('Error', 'Failed to update job status. Please try again.');
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Share job
  const handleShareJob = () => {
    Alert.alert('Share', 'Share functionality will be implemented');
  };

  // Contact functions
  const handleCall = phoneNumber => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleEmail = email => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  // Helper functions
  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `PKR ${amount.toLocaleString()}`;
    }
    return `PKR ${amount || '0'}`;
  };

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = status => {
    if (!status) return colors.textSecondary;
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
        return '#8B5CF6';
      case 'awarded':
        return '#10B981';
      case 'cancelled':
        return '#F44336';
      default:
        return colors.textSecondary;
    }
  };

  const getJobNumber = job => {
    if (job?.project_id) return job.project_id;
    if (job?.id) return `#${job.id.toString().substring(0, 8)}`;
    if (job?._id) return `#${job._id.toString().substring(0, 8)}`;
    return '#N/A';
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  // Error state
  if (!jobData || !jobData.job) {
    return (
      <View style={[styles.container, styles.centered]}>
        <AlertTriangle color={colors.textSecondary} size={48} />
        <Text style={styles.errorText}>Job not found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {job, proposals = [], client} = jobData;
  const statusColor = getStatusColor(job.status);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Job Details</Text>
          <Text style={styles.headerSubtitle}>{getJobNumber(job)}</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={handleShareJob}>
            <Share2 color={colors.text} size={18} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() =>
              navigation.navigate('EditJobScreen', {
                jobId,
                jobData: job,
              })
            }>
            <Edit color={colors.text} size={18} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerActionButton, styles.deleteActionButton]}
            onPress={() => setDeleteModalVisible(true)}>
            <Trash2 color="#F44336" size={18} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* Job Status Banner */}
        <View style={[styles.statusBanner, {backgroundColor: statusColor}]}>
          <View style={styles.statusContent}>
            <Text style={styles.statusText}>
              {job.status?.toUpperCase() || 'OPEN'}
            </Text>
            <TouchableOpacity
              style={styles.updateStatusButton}
              onPress={() => setStatusModalVisible(true)}>
              <Text style={styles.updateStatusText}>Update Status</Text>
              <ChevronRight color={colors.background} size={16} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Job Header */}
        <View style={styles.jobHeader}>
          <View style={styles.jobTitleSection}>
            <Text style={styles.jobTitle}>{job.title || job.name}</Text>
            {job.urgent && (
              <View style={styles.urgentBadge}>
                <AlertTriangle color={colors.background} size={12} />
                <Text style={styles.urgentText}>URGENT</Text>
              </View>
            )}
          </View>

          <Text style={styles.jobBudget}>{formatCurrency(job.budget)}</Text>
          <Text style={styles.jobDate}>
            Posted on {formatDate(job.created_at || job.date)}
          </Text>
        </View>

        {/* Job Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Overview</Text>

          <View style={styles.overviewGrid}>
            <View style={styles.overviewItem}>
              <Briefcase color={colors.splashGreen} size={20} />
              <Text style={styles.overviewLabel}>Category</Text>
              <Text style={styles.overviewValue}>
                {job.category || 'Not specified'}
              </Text>
            </View>

            <View style={styles.overviewItem}>
              <MapPin color={colors.splashGreen} size={20} />
              <Text style={styles.overviewLabel}>Location</Text>
              <Text style={styles.overviewValue}>
                {job.location || job.city || 'Not specified'}
              </Text>
            </View>

            <View style={styles.overviewItem}>
              <Clock color={colors.splashGreen} size={20} />
              <Text style={styles.overviewLabel}>Duration</Text>
              <Text style={styles.overviewValue}>
                {job.timeline || job.days_project
                  ? `${job.timeline || job.days_project} days`
                  : 'Not specified'}
              </Text>
            </View>

            <View style={styles.overviewItem}>
              <Calendar color={colors.splashGreen} size={20} />
              <Text style={styles.overviewLabel}>Start Date</Text>
              <Text style={styles.overviewValue}>
                {job.starting_date
                  ? formatDate(job.starting_date)
                  : 'To be determined'}
              </Text>
            </View>

            <View style={styles.overviewItem}>
              <Users color={colors.splashGreen} size={20} />
              <Text style={styles.overviewLabel}>Proposals</Text>
              <Text style={styles.overviewValue}>
                {job.proposal_count || proposals.length || 0}
              </Text>
            </View>

            <View style={styles.overviewItem}>
              <Eye color={colors.splashGreen} size={20} />
              <Text style={styles.overviewLabel}>Views</Text>
              <Text style={styles.overviewValue}>
                {job.view_count || 'N/A'}
              </Text>
            </View>
          </View>
        </View>

        {/* Job Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.jobDescription}>
            {job.description || job.details || 'No description provided'}
          </Text>
        </View>

        {/* Additional Notes */}
        {job.note && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <Text style={styles.jobDescription}>{job.note}</Text>
          </View>
        )}

        {/* Job Images */}
        {job.images && job.images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Project Images ({job.images.length})
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.imagesContainer}>
              {job.images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.imageItem}
                  onPress={() => {
                    setSelectedImageIndex(index);
                    setImageViewerVisible(true);
                  }}>
                  <Image source={{uri: image.uri}} style={styles.jobImage} />
                  <View style={styles.imageOverlay}>
                    <Eye color={colors.background} size={16} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Client Information */}
        {client && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client Information</Text>
            <View style={styles.clientCard}>
              <View style={styles.clientHeader}>
                <View style={styles.clientAvatar}>
                  <Text style={styles.clientInitial}>
                    {client.name?.charAt(0) || 'C'}
                  </Text>
                </View>
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>
                    {client.name || 'Client Name'}
                  </Text>
                  <Text style={styles.clientRole}>Project Owner</Text>
                </View>
                <View style={styles.clientRating}>
                  <Star color="#FFC107" size={16} fill="#FFC107" />
                  <Text style={styles.ratingText}>
                    {client.rating || 'N/A'}
                  </Text>
                </View>
              </View>

              <View style={styles.clientActions}>
                {client.phone && (
                  <TouchableOpacity
                    style={styles.clientActionButton}
                    onPress={() => handleCall(client.phone)}>
                    <Phone color={colors.splashGreen} size={16} />
                    <Text style={styles.clientActionText}>Call</Text>
                  </TouchableOpacity>
                )}

                {client.email && (
                  <TouchableOpacity
                    style={styles.clientActionButton}
                    onPress={() => handleEmail(client.email)}>
                    <Mail color={colors.splashGreen} size={16} />
                    <Text style={styles.clientActionText}>Email</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.clientActionButton}
                  onPress={() =>
                    navigation.navigate('ChatScreen', {
                      clientId: client.id,
                    })
                  }>
                  <MessageCircle color={colors.splashGreen} size={16} />
                  <Text style={styles.clientActionText}>Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() =>
                navigation.navigate('JobProposalsScreen', {
                  jobId,
                })
              }>
              <Users color={colors.background} size={20} />
              <Text style={styles.quickActionText}>
                View Proposals ({proposals.length || 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.quickActionButton, styles.secondaryActionButton]}
              onPress={() =>
                navigation.navigate('JobAnalyticsScreen', {
                  jobId,
                })
              }>
              <FileText color={colors.splashGreen} size={20} />
              <Text
                style={[
                  styles.quickActionText,
                  styles.secondaryActionButtonText,
                ]}>
                View Analytics
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Status Update Modal */}
      <StatusUpdateModal
        visible={statusModalVisible}
        onClose={() => setStatusModalVisible(false)}
        currentStatus={job.status}
        onUpdateStatus={handleStatusUpdate}
        loading={statusUpdateLoading}
      />

      {/* Image Viewer Modal */}
      <ImageViewerModal
        visible={imageViewerVisible}
        onClose={() => setImageViewerVisible(false)}
        images={job.images}
        initialIndex={selectedImageIndex}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteJob}
        itemType="Job"
        itemName={getJobNumber(job)}
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
  errorText: {
    marginTop: 12,
    fontSize: fontSizes.lg,
    color: colors.text,
    fontFamily: fonts.semiBold,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
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
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteActionButton: {
    backgroundColor: '#FFF3F3',
  },

  scrollView: {
    flex: 1,
  },

  // Status Banner
  statusBanner: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusText: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.background,
  },
  updateStatusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  updateStatusText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },

  // Job Header
  jobHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  jobTitleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  jobTitle: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.bold,
    color: colors.text,
    flex: 1,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  urgentText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bold,
    color: colors.background,
  },
  jobBudget: {
    fontSize: fontSizes['3xl'],
    fontFamily: fonts.bold,
    color: colors.splashGreen,
    marginBottom: 8,
  },
  jobDate: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Sections
  section: {
    backgroundColor: colors.background,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 16,
  },

  // Overview Grid
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  overviewItem: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  overviewLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  overviewValue: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.semiBold,
    textAlign: 'center',
  },

  // Job Description
  jobDescription: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
    lineHeight: 24,
  },

  // Images
  imagesContainer: {
    paddingRight: 16,
  },
  imageItem: {
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  jobImage: {
    width: 120,
    height: 90,
    backgroundColor: '#E0E0E0',
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 4,
    borderRadius: 4,
  },

  // Client Card
  clientCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clientInitial: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.background,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  clientRole: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  clientRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  clientActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  clientActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  clientActionText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },

  // Quick Actions
  quickActions: {
    gap: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.splashGreen,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  secondaryActionButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.splashGreen,
  },
  quickActionText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },
  secondaryActionButtonText: {
    color: colors.splashGreen,
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
    maxHeight: '70%',
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

  // Status Options
  statusOptions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  selectedStatusOption: {
    backgroundColor: '#F0F9FF',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusOptionText: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  selectedStatusOptionText: {
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },

  // Image Viewer Modal
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  imageViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  imageViewerTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },
  closeButton: {
    padding: 8,
  },
  imageViewerContainer: {
    flex: 1,
    width: require('react-native').Dimensions.get('window').width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '90%',
    height: '70%',
    resizeMode: 'contain',
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 100,
  },
});

export default JobDetailScreen;
