import React, {useEffect, useState, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
  Dimensions,
  Animated,
  StatusBar,
  Platform,
  FlatList,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {useNavigation} from '@react-navigation/native';
import {
  getMyApplications,
  withDrawApplication,
} from '../../../api/serviceProvider';

// Lucide React Native Icons
import {
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Filter,
  Eye,
  FileText,
  User,
  TrendingUp,
  X,
  Search,
  ChevronRight,
  DollarSign,
} from 'lucide-react-native';

const {height: screenHeight, width: screenWidth} = Dimensions.get('window');
const HEADER_HEIGHT = Platform.OS === 'ios' ? 100 : 80;

const MyApplicationsScreen = () => {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // State Management
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreApplications, setHasMoreApplications] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [statistics, setStatistics] = useState({
    total_applications: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  });

  // Animation setup
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

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

  // Transform slug to title
  const transformSlugToTitle = useCallback(slug => {
    if (!slug) return '';
    return slug
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }, []);

  // Get status configuration
  const getStatusConfig = useCallback(status => {
    const configs = {
      requested: {
        color: '#F59E0B',
        backgroundColor: '#FEF3C7',
        icon: Clock,
        label: 'Requested',
      },
      pending: {
        color: '#F59E0B',
        backgroundColor: '#FEF3C7',
        icon: Clock,
        label: 'Pending',
      },
      accepted: {
        color: colors.splashGreen || '#10B981',
        backgroundColor: '#E8F5E9',
        icon: CheckCircle,
        label: 'Accepted',
      },
      in_progress: {
        color: '#3B82F6',
        backgroundColor: '#DBEAFE',
        icon: Loader2,
        label: 'In Progress',
      },
      completed: {
        color: '#10B981',
        backgroundColor: '#D1FAE5',
        icon: CheckCircle,
        label: 'Completed',
      },
      rejected: {
        color: '#EF4444',
        backgroundColor: '#FEE2E2',
        icon: XCircle,
        label: 'Rejected',
      },
      cancelled: {
        color: '#F97316',
        backgroundColor: '#FED7AA',
        icon: AlertCircle,
        label: 'Cancelled',
      },
    };
    return configs[status] || configs.requested;
  }, []);

  // Fetch applications
  const fetchApplications = useCallback(
    async (page = 1, append = false, showLoader = true) => {
      try {
        if (showLoader && page === 1) setLoading(true);
        if (page > 1) setLoadingMore(true);

        const result = await getMyApplications(page, 10, selectedStatus);

        if (result && result.applications) {
          if (append && page > 1) {
            setApplications(prev => [...prev, ...result.applications]);
          } else {
            setApplications(result.applications);
          }

          if (result.statistics) {
            setStatistics(result.statistics);
          }

          const totalPages = result.pagination?.total_pages || 1;
          setHasMoreApplications(page < totalPages);
          setCurrentPage(page);
        } else {
          if (!append) setApplications([]);
          setHasMoreApplications(false);
        }
      } catch (error) {
        console.error('Failed to load applications:', error);
        Alert.alert('Error', 'Failed to load applications. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedStatus],
  );

  // Initial load
  useEffect(() => {
    fetchApplications(1, false, true);
  }, [selectedStatus, fetchApplications]);

  // Refresh applications
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMoreApplications(true);
    await fetchApplications(1, false, false);
    setRefreshing(false);
  }, [fetchApplications]);

  // Load more applications
  const loadMoreApplications = useCallback(() => {
    if (!loadingMore && hasMoreApplications && !loading) {
      fetchApplications(currentPage + 1, true, false);
    }
  }, [
    loadingMore,
    hasMoreApplications,
    loading,
    currentPage,
    fetchApplications,
  ]);

  // Handle withdraw application
  const handleWithdrawApplication = useCallback(
    async application => {
      Alert.alert(
        'Withdraw Application',
        `Are you sure you want to withdraw your application for "${
          application?.project_job?.title || 'this job'
        }"?`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Withdraw',
            style: 'destructive',
            onPress: async () => {
              try {
                setWithdrawingId(application.id);
                const result = await withDrawApplication({
                  application_id: application.id,
                  action: 'withdraw',
                });

                if (result.success) {
                  Alert.alert('Success', 'Application withdrawn successfully');
                  onRefresh();
                } else {
                  throw new Error(
                    result.message || 'Failed to withdraw application',
                  );
                }
              } catch (error) {
                Alert.alert(
                  'Error',
                  error.message || 'Failed to withdraw application',
                );
              } finally {
                setWithdrawingId(null);
              }
            },
          },
        ],
      );
    },
    [onRefresh],
  );

  // Handle view application details
  const handleViewDetails = useCallback(
    application => {
      navigation.navigate('ApplicationDetailScreen', {
        applicationId: application.id,
        application: application,
      });
    },
    [navigation],
  );

  // Filter status options
  const statusFilters = React.useMemo(
    () => [
      {
        key: '',
        label: 'All Applications',
        count: statistics.total_applications,
        icon: Briefcase,
      },
      {
        key: 'requested',
        label: 'Requested',
        count: statistics.pending,
        icon: Clock,
      },
      {
        key: 'accepted',
        label: 'Accepted',
        count: statistics.accepted,
        icon: CheckCircle,
      },
      {
        key: 'in_progress',
        label: 'In Progress',
        count: statistics.in_progress,
        icon: Loader2,
      },
      {
        key: 'completed',
        label: 'Completed',
        count: statistics.completed,
        icon: TrendingUp,
      },
      {
        key: 'rejected',
        label: 'Rejected',
        count: statistics.rejected,
        icon: XCircle,
      },
    ],
    [statistics],
  );

  // Stats data for the top section
  const statsData = React.useMemo(
    () => [
      {
        title: 'Total',
        value: statistics.total_applications || 0,
        icon: Briefcase,
        color: '#10B981',
      },
      {
        title: 'Pending',
        value: statistics.pending || 0,
        icon: Clock,
        color: '#F59E0B',
      },
      {
        title: 'Accepted',
        value: statistics.accepted || 0,
        icon: CheckCircle,
        color: '#10B981',
      },
      {
        title: 'Completed',
        value: statistics.completed || 0,
        icon: TrendingUp,
        color: '#10B981',
      },
    ],
    [statistics],
  );

  // Check if application can be withdrawn
  const canWithdrawApplication = useCallback(
    application => {
      const status = application?.status;
      return (
        ['requested', 'pending'].includes(status) &&
        withdrawingId !== application?.id
      );
    },
    [withdrawingId],
  );

  // Render stats header (will be part of FlatList header)
  const renderStatsHeader = () => (
    <View style={styles.statsContainer}>
      {statsData.map((stat, index) => (
        <View key={index} style={styles.statCard}>
          <View
            style={[
              styles.statIconContainer,
              {backgroundColor: stat.color + '20'},
            ]}>
            <stat.icon color={stat.color} size={20} />
          </View>
          <Text style={styles.statValue}>{stat.value}</Text>
          <Text style={styles.statTitle}>{stat.title}</Text>
        </View>
      ))}
    </View>
  );

  // Render application card
  const renderApplicationCard = useCallback(
    ({item}) => {
      const statusConfig = getStatusConfig(item.status);
      const isWithdrawing = withdrawingId === item.id;
      const canWithdraw = canWithdrawApplication(item);

      return (
        <View style={styles.applicationCard}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.jobTitle} numberOfLines={2}>
                {item.project_job?.title ||
                  item.service?.service_title ||
                  'Job Title Not Available'}
              </Text>
              <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                  <User color={colors.textSecondary} size={12} />
                  <Text style={styles.metaText}>
                    {item.client?.username || 'Unknown Client'}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Calendar color={colors.textSecondary} size={12} />
                  <Text style={styles.metaText}>
                    {formatDate(item.createdAt)}
                  </Text>
                </View>
              </View>
            </View>

            <View
              style={[
                styles.statusBadge,
                {backgroundColor: statusConfig.backgroundColor},
              ]}>
              <statusConfig.icon color={statusConfig.color} size={14} />
              <Text style={[styles.statusText, {color: statusConfig.color}]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* Service Category */}
          {item.service?.service_category && (
            <View style={styles.serviceBadge}>
              <Briefcase color={colors.splashGreen} size={14} />
              <Text style={styles.serviceCategory}>
                {transformSlugToTitle(item.service.service_category)}
              </Text>
            </View>
          )}

          {/* Price Comparison */}
          <View style={styles.priceContainer}>
            <View style={styles.priceItem}>
              <DollarSign color={colors.splashGreen} size={16} />
              <View>
                <Text style={styles.priceLabel}>Your Proposal</Text>
                <Text style={styles.proposalPrice}>
                  {formatCurrency(item.price)}
                </Text>
              </View>
            </View>
            <View style={styles.priceItem}>
              <DollarSign color={colors.text} size={16} />
              <View>
                <Text style={styles.priceLabel}>Client Budget</Text>
                <Text style={styles.clientBudget}>
                  {formatCurrency(item.project_job?.budget)}
                </Text>
              </View>
            </View>
          </View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailItem}>
              <Clock color={colors.textSecondary} size={14} />
              <Text style={styles.detailText}>
                {item.project_job?.timeline || 'Not specified'} days
              </Text>
            </View>
            <View style={styles.detailItem}>
              <MapPin color={colors.textSecondary} size={14} />
              <Text style={styles.detailText}>
                {item.project_job?.city || 'Remote'}
              </Text>
            </View>
          </View>

          {/* Requirements */}
          {item.requirements && (
            <View style={styles.requirementsContainer}>
              <Text style={styles.requirementsLabel}>Requirements:</Text>
              <Text style={styles.requirementsText} numberOfLines={2}>
                {item.requirements}
              </Text>
            </View>
          )}

          {/* Footer Actions */}
          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => handleViewDetails(item)}>
              <Eye color="white" size={16} />
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>

            {canWithdraw && (
              <TouchableOpacity
                style={[
                  styles.withdrawButton,
                  isWithdrawing && styles.withdrawButtonDisabled,
                ]}
                onPress={() => handleWithdrawApplication(item)}
                disabled={isWithdrawing}>
                {isWithdrawing ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <X color="#EF4444" size={16} />
                    <Text style={styles.withdrawButtonText}>Withdraw</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    },
    [
      getStatusConfig,
      formatDate,
      transformSlugToTitle,
      formatCurrency,
      handleViewDetails,
      handleWithdrawApplication,
      withdrawingId,
      canWithdrawApplication,
    ],
  );

  // Render list header
  const renderListHeader = () => (
    <View>
      {renderStatsHeader()}
      {selectedStatus && (
        <View style={styles.activeFilterContainer}>
          <View style={styles.activeFilterLeft}>
            <Filter color={colors.splashGreen} size={16} />
            <Text style={styles.activeFilterText}>
              Showing:{' '}
              {statusFilters.find(f => f.key === selectedStatus)?.label}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.clearFilterButton}
            onPress={() => setSelectedStatus('')}>
            <X color={colors.splashGreen} size={16} />
            <Text style={styles.clearFilterText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Render footer
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={colors.splashGreen} />
        <Text style={styles.loadingMoreText}>Loading more...</Text>
      </View>
    );
  }, [loadingMore]);

  // Render empty component
  const renderEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <FileText color={colors.textSecondary} size={48} />
        </View>
        <Text style={styles.emptyText}>No Applications Found</Text>
        <Text style={styles.emptySubtext}>
          {selectedStatus
            ? `No applications found with status "${
                statusFilters.find(f => f.key === selectedStatus)?.label
              }"`
            : "You haven't applied to any jobs yet."}
        </Text>
        {!selectedStatus && (
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate('JobsScreen')}>
            <Search color="white" size={16} />
            <Text style={styles.exploreButtonText}>Explore Jobs</Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    [selectedStatus, navigation, statusFilters],
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading your applications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Fixed Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Applications</Text>
          <Text style={styles.headerSubtitle}>Track your job applications</Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowFilterModal(true)}>
          <Filter color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <FlatList
        data={applications}
        renderItem={renderApplicationCard}
        keyExtractor={(item, index) => item.id?.toString() || index.toString()}
        ListHeaderComponent={renderListHeader}
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
        onEndReached={loadMoreApplications}
        onEndReachedThreshold={0.3}
        contentContainerStyle={styles.listContent}
      />

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Applications</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {statusFilters.map((filter, index) => (
                <TouchableOpacity
                  key={filter.key || index}
                  style={[
                    styles.filterOption,
                    selectedStatus === filter.key && styles.filterOptionActive,
                  ]}
                  onPress={() => {
                    setSelectedStatus(filter.key);
                    setShowFilterModal(false);
                  }}>
                  <View style={styles.filterOptionLeft}>
                    <filter.icon
                      color={
                        selectedStatus === filter.key
                          ? colors.splashGreen
                          : colors.textSecondary
                      }
                      size={18}
                    />
                    <View>
                      <Text
                        style={[
                          styles.filterOptionText,
                          selectedStatus === filter.key &&
                            styles.filterOptionTextActive,
                        ]}>
                        {filter.label}
                      </Text>
                      <Text style={styles.filterOptionCount}>
                        {filter.count || 0} applications
                      </Text>
                    </View>
                  </View>
                  {selectedStatus === filter.key && (
                    <CheckCircle color={colors.splashGreen} size={20} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
  loadingText: {
    marginTop: 12,
    fontSize: fontSizes?.lg || 18,
    color: colors?.textSecondary || '#6B7280',
    fontFamily: fonts?.regular || 'System',
  },

  // Fixed Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    backgroundColor: colors?.background || '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: fontSizes?.xl || 20,
    fontFamily: fonts?.bold || 'System',
    color: colors?.text || '#1F2937',
  },
  headerSubtitle: {
    fontSize: fontSizes?.sm || 14,
    color: colors?.textSecondary || '#6B7280',
    fontFamily: fonts?.regular || 'System',
  },

  // List Content
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  // Stats Container (Part of FlatList header)
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    width: (screenWidth - 56) / 2,
    backgroundColor: colors?.background || '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: fontSizes?.lg || 18,
    fontFamily: fonts?.bold || 'System',
    color: colors?.text || '#1F2937',
    marginBottom: 2,
  },
  statTitle: {
    fontSize: fontSizes?.sm || 14,
    color: colors?.textSecondary || '#6B7280',
    fontFamily: fonts?.medium || 'System',
  },

  // Active Filter
  activeFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors?.splashGreen || '#10B981',
  },
  activeFilterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeFilterText: {
    fontSize: fontSizes?.sm || 14,
    fontFamily: fonts?.medium || 'System',
    color: colors?.splashGreen || '#10B981',
  },
  clearFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  clearFilterText: {
    fontSize: fontSizes?.sm || 14,
    fontFamily: fonts?.semiBold || 'System',
    color: colors?.splashGreen || '#10B981',
  },

  // Application Card
  applicationCard: {
    backgroundColor: colors?.background || '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: fontSizes?.lg || 18,
    fontFamily: fonts?.bold || 'System',
    color: colors?.text || '#1F2937',
    marginBottom: 8,
  },
  cardMeta: {
    gap: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: fontSizes?.sm || 14,
    color: colors?.textSecondary || '#6B7280',
    fontFamily: fonts?.regular || 'System',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusText: {
    fontSize: fontSizes?.xs || 12,
    fontFamily: fonts?.semiBold || 'System',
  },

  // Service Badge
  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  serviceCategory: {
    fontSize: fontSizes?.sm || 14,
    fontFamily: fonts?.semiBold || 'System',
    color: colors?.splashGreen || '#10B981',
  },

  // Price Container
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  priceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceLabel: {
    fontSize: fontSizes?.xs || 12,
    color: colors?.textSecondary || '#6B7280',
    fontFamily: fonts?.medium || 'System',
  },
  proposalPrice: {
    fontSize: fontSizes?.base || 16,
    fontFamily: fonts?.bold || 'System',
    color: colors?.splashGreen || '#10B981',
  },
  clientBudget: {
    fontSize: fontSizes?.base || 16,
    fontFamily: fonts?.bold || 'System',
    color: colors?.text || '#1F2937',
  },

  // Details Container
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: fontSizes?.sm || 14,
    color: colors?.text || '#1F2937',
    fontFamily: fonts?.medium || 'System',
  },

  // Requirements
  requirementsContainer: {
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors?.splashGreen || '#10B981',
  },
  requirementsLabel: {
    fontSize: fontSizes?.sm || 14,
    fontFamily: fonts?.semiBold || 'System',
    color: colors?.splashGreen || '#10B981',
    marginBottom: 6,
  },
  requirementsText: {
    fontSize: fontSizes?.sm || 14,
    fontFamily: fonts?.regular || 'System',
    color: colors?.text || '#1F2937',
    lineHeight: 20,
  },

  // Enhanced Card Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 20,
    gap: 16,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: colors?.splashGreen || '#10B981',
    borderRadius: 12,
    gap: 8,
    shadowColor: colors?.splashGreen || '#10B981',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  viewButtonText: {
    fontSize: fontSizes?.sm || 14,
    fontFamily: fonts?.semiBold || 'System',
    color: '#FFFFFF',
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    minWidth: 110,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  withdrawButtonDisabled: {
    opacity: 0.6,
  },
  withdrawButtonText: {
    fontSize: fontSizes?.sm || 14,
    fontFamily: fonts?.semiBold || 'System',
    color: '#EF4444',
  },

  // Loading More
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  loadingMoreText: {
    fontSize: fontSizes?.sm || 14,
    color: colors?.textSecondary || '#6B7280',
    fontFamily: fonts?.medium || 'System',
  },

  // Enhanced Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
    minHeight: screenHeight * 0.4,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyText: {
    fontSize: fontSizes?.xl || 20,
    fontFamily: fonts?.bold || 'System',
    color: colors?.text || '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: fontSizes?.base || 16,
    color: colors?.textSecondary || '#6B7280',
    fontFamily: fonts?.regular || 'System',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors?.splashGreen || '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: colors?.splashGreen || '#10B981',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  exploreButtonText: {
    fontSize: fontSizes?.base || 16,
    fontFamily: fonts?.semiBold || 'System',
    color: '#FFFFFF',
  },

  // Enhanced Modal Styles
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
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
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
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalScrollView: {
    maxHeight: screenHeight * 0.6,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  filterOptionActive: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: colors?.splashGreen || '#10B981',
  },
  filterOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  filterIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterOptionText: {
    fontSize: fontSizes?.base || 16,
    color: colors?.text || '#1F2937',
    fontFamily: fonts?.medium || 'System',
    marginBottom: 2,
  },
  filterOptionTextActive: {
    color: colors?.splashGreen || '#10B981',
    fontFamily: fonts?.semiBold || 'System',
  },
  filterOptionCount: {
    fontSize: fontSizes?.sm || 14,
    color: colors?.textSecondary || '#6B7280',
    fontFamily: fonts?.regular || 'System',
  },
});

export default MyApplicationsScreen;
