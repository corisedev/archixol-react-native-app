import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Dimensions,
  StatusBar,
  Platform,
  Linking,
  RefreshControl,
  TextInput,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  getOrderProjectDetail,
  completeProjectOrder,
  updateProjectStatus,
} from '../../../api/serviceProvider';

// Lucide React Native Icons
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  User,
  Mail,
  Phone,
  Home,
  Calendar,
  AlertCircle,
  FileText,
  CheckCircle,
  XCircle,
  MessageCircle,
  Download,
  StickyNote,
  Briefcase,
  Star,
  TrendingUp,
  Package,
  Settings,
  Play,
  Pause,
  MoreVertical,
  Edit3,
  Send,
  X,
} from 'lucide-react-native';

const {height: screenHeight, width: screenWidth} = Dimensions.get('window');

const OrderDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {orderId, order: initialOrder} = route.params || {};

  // State Management
  const [order, setOrder] = useState(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionNotes, setCompletionNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Format currency
  const formatCurrency = useCallback(amount => {
    if (!amount || amount === 0) return 'PKR 0';
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(numAmount)) return 'PKR 0';
    return `PKR ${numAmount.toLocaleString()}`;
  }, []);

  // Format date
  const formatDate = useCallback(dateString => {
    if (!dateString) return 'Date not available';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid date';
    }
  }, []);

  // Get status configuration
  const getStatusConfig = useCallback(status => {
    const configs = {
      open: {
        color: '#3B82F6',
        backgroundColor: '#DBEAFE',
        icon: Clock,
        label: 'Open',
      },
      in_progress: {
        color: '#F59E0B',
        backgroundColor: '#FEF3C7',
        icon: Play,
        label: 'In Progress',
      },
      completed: {
        color: '#10B981',
        backgroundColor: '#D1FAE5',
        icon: CheckCircle,
        label: 'Completed',
      },
      cancelled: {
        color: '#EF4444',
        backgroundColor: '#FEE2E2',
        icon: XCircle,
        label: 'Cancelled',
      },
      closed: {
        color: '#6B7280',
        backgroundColor: '#F3F4F6',
        icon: Package,
        label: 'Closed',
      },
      pending_client_approval: {
        color: '#8B5CF6',
        backgroundColor: '#EDE9FE',
        icon: Clock,
        label: 'Pending Approval',
      },
    };
    return configs[status] || configs.open;
  }, []);

  // Parse notes
  const parseNotes = useCallback(rawNote => {
    if (!rawNote) return {cleanNote: null, formattedDate: null};

    const dateMatch = rawNote.match(
      /\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z)\]/,
    );
    const dateISO = dateMatch?.[1] ?? null;

    const noteMatch = rawNote.match(/Notes:\s*(.*)/s);
    const cleanNote = noteMatch?.[1]?.trim() ?? null;

    const formattedDate = dateISO
      ? new Date(dateISO).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

    return {cleanNote, formattedDate};
  }, []);

  // Fetch order details
  const fetchOrderDetails = useCallback(
    async (showLoader = true) => {
      if (!orderId) {
        Alert.alert('Error', 'Order ID is missing');
        navigation.goBack();
        return;
      }

      try {
        if (showLoader) setLoading(true);

        const result = await getOrderProjectDetail(orderId);

        if (result && result.project) {
          setOrder(result.project);
        } else {
          Alert.alert('Error', 'Failed to load order details');
        }
      } catch (error) {
        console.error('Failed to fetch order details:', error);
        Alert.alert(
          'Error',
          error.message || 'Failed to load order details. Please try again.',
        );
      } finally {
        setLoading(false);
      }
    },
    [orderId, navigation],
  );

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrderDetails(false);
    setRefreshing(false);
  }, [fetchOrderDetails]);

  // Handle status update
  const handleStatusUpdate = useCallback(
    async (newStatus, notes = '') => {
      if (!order?.id) return;

      try {
        setUpdatingStatus(true);

        if (newStatus === 'completed') {
          await completeProjectOrder(order.id, {
            completion_notes: notes,
          });
        } else {
          await updateProjectStatus(order.id, newStatus, {
            update_notes: notes,
          });
        }

        Alert.alert('Success', `Order status updated to ${newStatus}`);
        await fetchOrderDetails(false);
      } catch (error) {
        Alert.alert('Error', error.message || 'Failed to update order status');
      } finally {
        setUpdatingStatus(false);
        setShowStatusModal(false);
        setShowCompletionModal(false);
        setCompletionNotes('');
      }
    },
    [order?.id, fetchOrderDetails],
  );

  // Handle completion
  const handleCompletion = useCallback(() => {
    if (!completionNotes.trim() || completionNotes.trim().length < 10) {
      Alert.alert(
        'Error',
        'Please enter at least 10 characters for completion notes',
      );
      return;
    }
    handleStatusUpdate('completed', completionNotes);
  }, [completionNotes, handleStatusUpdate]);

  // Handle chat navigation
  const handleChat = useCallback(() => {
    navigation.navigate('ChatScreen', {
      chat_id: order?.id,
      clientName:
        order?.client?.fullname || order?.client?.username || 'Client',
    });
  }, [navigation, order]);

  // Handle document download
  const handleDocumentDownload = useCallback(async docUrl => {
    try {
      const supported = await Linking.canOpenURL(docUrl);
      if (supported) {
        await Linking.openURL(docUrl);
      } else {
        Alert.alert('Error', 'Cannot open this document');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open document');
    }
  }, []);

  // Handle phone call
  const handlePhoneCall = useCallback(async phoneNumber => {
    try {
      const phoneUrl = `tel:${phoneNumber}`;
      const supported = await Linking.canOpenURL(phoneUrl);
      if (supported) {
        await Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Error', 'Cannot make phone calls on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to make phone call');
    }
  }, []);

  // Handle email
  const handleEmail = useCallback(async email => {
    try {
      const emailUrl = `mailto:${email}`;
      const supported = await Linking.canOpenURL(emailUrl);
      if (supported) {
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert('Error', 'Cannot send emails on this device');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send email');
    }
  }, []);

  // Load order details on mount
  useEffect(() => {
    if (!initialOrder) {
      fetchOrderDetails();
    }
  }, [initialOrder, fetchOrderDetails]);

  // Status options for updating
  const statusOptions = [
    {
      key: 'in_progress',
      label: 'Mark as In Progress',
      icon: Play,
      color: '#F59E0B',
      condition: order?.status === 'open',
    },
    {
      key: 'completed',
      label: 'Mark as Completed',
      icon: CheckCircle,
      color: '#10B981',
      condition: order?.status === 'in_progress' || order?.status === 'open',
    },
    {
      key: 'cancelled',
      label: 'Cancel Order',
      icon: XCircle,
      color: '#EF4444',
      condition: order?.status !== 'completed' && order?.status !== 'cancelled',
    },
  ].filter(option => option.condition);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.splashGreen} />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="transparent"
          translucent
        />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContent}>
          <AlertCircle color={colors.textSecondary} size={48} />
          <Text style={styles.errorText}>Order not found</Text>
          <Text style={styles.errorSubtext}>
            The order you're looking for doesn't exist or has been removed.
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const {cleanNote, formattedDate} = parseNotes(order.note);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setShowStatusModal(true)}>
          <MoreVertical color={colors.text} size={24} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.splashGreen]}
            tintColor={colors.splashGreen}
          />
        }>
        {/* Order Header Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.titleSection}>
              <Text style={styles.orderTitle} numberOfLines={2}>
                {order.title || 'Project Title'}
              </Text>
              <View style={styles.badgeContainer}>
                <View style={styles.categoryBadge}>
                  <Briefcase color={colors.splashGreen} size={14} />
                  <Text style={styles.categoryText}>
                    {order.category
                      ?.replace(/_/g, ' ')
                      ?.replace(/\b\w/g, l => l.toUpperCase()) || 'General'}
                  </Text>
                </View>
                {order.urgent && (
                  <View style={styles.urgentBadge}>
                    <AlertCircle color="#EF4444" size={14} />
                    <Text style={styles.urgentText}>Urgent</Text>
                  </View>
                )}
              </View>
            </View>
            <View
              style={[
                styles.statusBadge,
                {backgroundColor: statusConfig.backgroundColor},
              ]}>
              <statusConfig.icon color={statusConfig.color} size={16} />
              <Text style={[styles.statusText, {color: statusConfig.color}]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {order.description && (
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.descriptionText}>{order.description}</Text>
            </View>
          )}

          {(cleanNote || formattedDate) && (
            <View style={styles.notesSection}>
              <View style={styles.notesHeader}>
                <StickyNote color="#F59E0B" size={18} />
                <Text style={styles.notesTitle}>Additional Notes</Text>
              </View>
              {cleanNote && <Text style={styles.notesText}>{cleanNote}</Text>}
              {formattedDate && (
                <Text style={styles.notesDate}>Logged on: {formattedDate}</Text>
              )}
            </View>
          )}
        </View>

        {/* Project Details */}
        <View style={styles.detailsGrid}>
          {/* Timeline Card */}
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Clock color={colors.splashGreen} size={20} />
              <Text style={styles.detailTitle}>Timeline</Text>
            </View>
            <View style={styles.detailContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Started</Text>
                <Text style={styles.detailValue}>
                  {formatDate(order.started_at)}
                </Text>
              </View>
              {order.timeline && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>{order.timeline} days</Text>
                </View>
              )}
              {order.time_remaining_days !== undefined && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Time Remaining</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      order.is_overdue && styles.overdueText,
                    ]}>
                    {order.time_remaining_days} days
                  </Text>
                </View>
              )}
              {order.timeline && order.time_remaining_days !== undefined && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min(
                            100,
                            100 -
                              (order.time_remaining_days / order.timeline) *
                                100,
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Budget Card */}
          <View style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <DollarSign color={colors.splashGreen} size={20} />
              <Text style={styles.detailTitle}>Budget</Text>
            </View>
            <View style={styles.detailContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Project Value</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(order.budget)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Payment Status</Text>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>Pending</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Location Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderSimple}>
            <MapPin color={colors.splashGreen} size={20} />
            <Text style={styles.cardTitle}>Location</Text>
          </View>
          <View style={styles.locationContent}>
            {order.address && (
              <View style={styles.locationRow}>
                <Home color={colors.textSecondary} size={16} />
                <Text style={styles.locationText}>{order.address}</Text>
              </View>
            )}
            {order.city && (
              <View style={styles.locationRow}>
                <MapPin color={colors.textSecondary} size={16} />
                <Text style={styles.locationText}>{order.city}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Client Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderSimple}>
            <User color={colors.splashGreen} size={20} />
            <Text style={styles.cardTitle}>Client Details</Text>
          </View>
          <View style={styles.clientContent}>
            <View style={styles.clientRow}>
              <Text style={styles.clientLabel}>Name</Text>
              <Text style={styles.clientValue}>
                {order.client?.fullname ||
                  order.client?.username ||
                  'Not provided'}
              </Text>
            </View>

            <View style={styles.contactSection}>
              <Text style={styles.clientLabel}>Contact</Text>
              <View style={styles.contactMethods}>
                {order.client?.email && (
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={() => handleEmail(order.client.email)}>
                    <Mail color={colors.splashGreen} size={16} />
                    <Text style={styles.contactButtonText}>
                      {order.client.email}
                    </Text>
                  </TouchableOpacity>
                )}
                {order.client?.phone_number && (
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={() => handlePhoneCall(order.client.phone_number)}>
                    <Phone color={colors.splashGreen} size={16} />
                    <Text style={styles.contactButtonText}>
                      {order.client.phone_number}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {order.client?.address && (
              <View style={styles.clientRow}>
                <Text style={styles.clientLabel}>Address</Text>
                <Text style={styles.clientValue}>{order.client.address}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Requirements Card */}
        {(order.required_skills?.length > 0 || order.tags?.length > 0) && (
          <View style={styles.card}>
            <View style={styles.cardHeaderSimple}>
              <Star color={colors.splashGreen} size={20} />
              <Text style={styles.cardTitle}>Requirements</Text>
            </View>
            <View style={styles.requirementsContent}>
              {order.required_skills?.length > 0 && (
                <View style={styles.skillsSection}>
                  <Text style={styles.skillsLabel}>Required Skills</Text>
                  <View style={styles.skillsContainer}>
                    {order.required_skills.map((skill, index) => (
                      <View key={index} style={styles.skillChip}>
                        <Text style={styles.skillText}>{skill}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {order.tags?.length > 0 && (
                <View style={styles.skillsSection}>
                  <Text style={styles.skillsLabel}>Tags</Text>
                  <View style={styles.skillsContainer}>
                    {order.tags.map((tag, index) => (
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
          </View>
        )}

        {/* Documents Card */}
        {order.docs?.length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeaderSimple}>
              <FileText color={colors.splashGreen} size={20} />
              <Text style={styles.cardTitle}>Documents</Text>
            </View>
            <View style={styles.documentsContent}>
              {order.docs.map((doc, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.documentItem}
                  onPress={() => handleDocumentDownload(doc)}>
                  <View style={styles.documentInfo}>
                    <FileText color={colors.textSecondary} size={18} />
                    <Text style={styles.documentName} numberOfLines={1}>
                      {doc.split('/').pop() || `Document ${index + 1}`}
                    </Text>
                  </View>
                  <Download color={colors.splashGreen} size={18} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.chatButton} onPress={handleChat}>
          <MessageCircle color="white" size={20} />
          <Text style={styles.chatButtonText}>Chat</Text>
        </TouchableOpacity>

        {(order.status === 'open' || order.status === 'in_progress') && (
          <TouchableOpacity
            style={[
              styles.completeButton,
              updatingStatus && styles.disabledButton,
            ]}
            onPress={() => setShowCompletionModal(true)}
            disabled={updatingStatus}>
            {updatingStatus ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <>
                <CheckCircle color="#10B981" size={20} />
                <Text style={styles.completeButtonText}>Complete</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Status Update Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatusModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Order Status</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <X color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>
            <View style={styles.statusOptions}>
              {statusOptions.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.statusOption}
                  onPress={() => {
                    if (option.key === 'completed') {
                      setShowStatusModal(false);
                      setShowCompletionModal(true);
                    } else {
                      handleStatusUpdate(option.key);
                    }
                  }}>
                  <View style={styles.statusOptionLeft}>
                    <View
                      style={[
                        styles.statusIconContainer,
                        {backgroundColor: option.color + '20'},
                      ]}>
                      <option.icon color={option.color} size={18} />
                    </View>
                    <Text style={styles.statusOptionText}>{option.label}</Text>
                  </View>
                  <ArrowLeft
                    color={colors.textSecondary}
                    size={16}
                    style={{transform: [{rotate: '180deg'}]}}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Completion Modal */}
      <Modal
        visible={showCompletionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCompletionModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCompletionModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complete Project</Text>
              <TouchableOpacity onPress={() => setShowCompletionModal(false)}>
                <X color={colors.textSecondary} size={24} />
              </TouchableOpacity>
            </View>
            <View style={styles.completionForm}>
              <Text style={styles.inputLabel}>Completion Notes *</Text>
              <TextInput
                style={styles.textArea}
                value={completionNotes}
                onChangeText={setCompletionNotes}
                placeholder="Add notes about the project completion..."
                multiline={true}
                numberOfLines={5}
                textAlignVertical="top"
              />
              <Text style={styles.inputHelper}>
                Minimum 10 characters ({completionNotes.length}/10)
              </Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCompletionModal(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (updatingStatus || completionNotes.length < 10) &&
                    styles.disabledButton,
                ]}
                onPress={handleCompletion}
                disabled={updatingStatus || completionNotes.length < 10}>
                {updatingStatus ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Send color="white" size={16} />
                    <Text style={styles.submitButtonText}>Submit</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSizes?.lg || 18,
    fontFamily: fonts?.bold || 'System',
    color: colors?.text || '#1F2937',
  },
  headerRight: {
    width: 40,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Loading & Error States
  loadingContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: fontSizes?.base || 16,
    color: colors?.textSecondary || '#6B7280',
    fontFamily: fonts?.medium || 'System',
  },
  errorContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: fontSizes?.xl || 20,
    fontFamily: fonts?.bold || 'System',
    color: colors?.text || '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: fontSizes?.base || 16,
    color: colors?.textSecondary || '#6B7280',
    fontFamily: fonts?.regular || 'System',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: colors?.splashGreen || '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    fontSize: fontSizes?.sm || 14,
    fontFamily: fonts?.semiBold || 'System',
    color: '#FFFFFF',
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Cards
  card: {
    backgroundColor: colors?.background || '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: fontSizes?.lg || 18,
    fontFamily: fonts?.bold || 'System',
    color: colors?.text || '#1F2937',
  },

  // Order Header
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  orderTitle: {
    fontSize: fontSizes?.xl || 20,
    fontFamily: fonts?.bold || 'System',
    color: colors?.text || '#1F2937',
    marginBottom: 12,
    lineHeight: 28,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  categoryText: {
    fontSize: fontSizes?.sm || 14,
    fontFamily: fonts?.medium || 'System',
    color: colors?.splashGreen || '#10B981',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  urgentText: {
    fontSize: fontSizes?.sm || 14,
    fontFamily: fonts?.semiBold || 'System',
    color: '#EF4444',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: fontSizes?.sm || 14,
    fontFamily: fonts?.semiBold || 'System',
  },

  // Description
  descriptionSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: fontSizes?.lg || 18,
    fontFamily: fonts?.semiBold || 'System',
    color: colors?.text || '#1F2937',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: fontSizes?.base || 16,
    color: colors?.textSecondary || '#6B7280',
    fontFamily: fonts?.regular || 'System',
    lineHeight: 24,
  },

  // Notes
  notesSection: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  notesTitle: {
    fontSize: fontSizes?.base || 16,
    fontFamily: fonts?.semiBold || 'System',
    color: '#D97706',
  },
  notesText: {
    fontSize: fontSizes?.sm || 14,
    color: '#92400E',
    fontFamily: fonts?.regular || 'System',
    lineHeight: 20,
    marginBottom: 8,
  },
  notesDate: {
    fontSize: fontSizes?.xs || 12,
    color: '#A16207',
    fontFamily: fonts?.medium || 'System',
  },

  // Details Grid
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  detailCard: {
    flex: 1,
    backgroundColor: colors?.background || '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  detailTitle: {
    fontSize: fontSizes?.base || 16,
    fontFamily: fonts?.semiBold || 'System',
    color: colors?.text || '#1F2937',
  },
  detailContent: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: fontSizes?.sm || 14,
    color: colors?.textSecondary || '#6B7280',
    fontFamily: fonts?.regular || 'System',
  },
  detailValue: {
    fontSize: fontSizes?.sm || 14,
    color: colors?.text || '#1F2937',
    fontFamily: fonts?.semiBold || 'System',
  },
  overdueText: {
    color: '#EF4444',
  },
  pendingBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: fontSizes?.xs || 12,
    fontFamily: fonts?.semiBold || 'System',
    color: '#D97706',
  },

  // Progress Bar
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors?.splashGreen || '#10B981',
    borderRadius: 3,
  },

  // Location
  locationContent: {
    gap: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationText: {
    fontSize: fontSizes?.base || 16,
    color: colors?.text || '#1F2937',
    fontFamily: fonts?.regular || 'System',
    flex: 1,
  },

  // Client
  clientContent: {
    gap: 16,
  },
  clientRow: {
    gap: 4,
  },
  clientLabel: {
    fontSize: fontSizes?.sm || 14,
    color: colors?.textSecondary || '#6B7280',
    fontFamily: fonts?.semiBold || 'System',
  },
  clientValue: {
    fontSize: fontSizes?.base || 16,
    color: colors?.text || '#1F2937',
    fontFamily: fonts?.regular || 'System',
  },
  contactSection: {
    gap: 8,
  },
  contactMethods: {
    gap: 8,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  contactButtonText: {
    fontSize: fontSizes?.sm || 14,
    color: colors?.text || '#1F2937',
    fontFamily: fonts?.medium || 'System',
    flex: 1,
  },

  // Requirements
  requirementsContent: {
    gap: 16,
  },
  skillsSection: {
    gap: 8,
  },
  skillsLabel: {
    fontSize: fontSizes?.sm || 14,
    color: colors?.textSecondary || '#6B7280',
    fontFamily: fonts?.semiBold || 'System',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    fontSize: fontSizes?.sm || 14,
    fontFamily: fonts?.medium || 'System',
    color: colors?.splashGreen || '#10B981',
  },
  tagChip: {
    backgroundColor: '#F3F4F6',
  },
  tagText: {
    color: colors?.textSecondary || '#6B7280',
  },

  // Documents
  documentsContent: {
    gap: 12,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  documentName: {
    fontSize: fontSizes?.sm || 14,
    color: colors?.text || '#1F2937',
    fontFamily: fonts?.medium || 'System',
    flex: 1,
  },

  // Action Bar
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors?.background || '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors?.splashGreen || '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  chatButtonText: {
    fontSize: fontSizes?.base || 16,
    fontFamily: fonts?.semiBold || 'System',
    color: '#FFFFFF',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 8,
  },
  completeButtonText: {
    fontSize: fontSizes?.base || 16,
    fontFamily: fonts?.semiBold || 'System',
    color: '#10B981',
  },
  disabledButton: {
    opacity: 0.6,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors?.background || '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 20,
    maxHeight: screenHeight * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: fontSizes?.xl || 20,
    fontFamily: fonts?.bold || 'System',
    color: colors?.text || '#1F2937',
  },

  // Status Options
  statusOptions: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  statusOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusOptionText: {
    fontSize: fontSizes?.base || 16,
    fontFamily: fonts?.medium || 'System',
    color: colors?.text || '#1F2937',
  },

  // Completion Form
  completionForm: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  inputLabel: {
    fontSize: fontSizes?.base || 16,
    fontFamily: fonts?.semiBold || 'System',
    color: colors?.text || '#1F2937',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: fontSizes?.base || 16,
    fontFamily: fonts?.regular || 'System',
    color: colors?.text || '#1F2937',
    backgroundColor: colors?.background || '#FFFFFF',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  inputHelper: {
    fontSize: fontSizes?.sm || 14,
    color: colors?.textSecondary || '#6B7280',
    fontFamily: fonts?.regular || 'System',
    marginTop: 8,
  },

  // Modal Actions
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: fontSizes?.base || 16,
    fontFamily: fonts?.semiBold || 'System',
    color: colors?.text || '#1F2937',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors?.splashGreen || '#10B981',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    fontSize: fontSizes?.base || 16,
    fontFamily: fonts?.semiBold || 'System',
    color: '#FFFFFF',
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 20,
  },
});

export default OrderDetailScreen;
