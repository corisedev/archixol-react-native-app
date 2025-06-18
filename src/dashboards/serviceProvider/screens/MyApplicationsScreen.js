import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Modal,
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
} from 'lucide-react-native';

const MyApplicationsScreen = () => {
  const navigation = useNavigation();

  // State Management
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreApplications, setHasMoreApplications] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [statistics, setStatistics] = useState({
    total_applications: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    in_progress: 0,
    completed: 0,
  });

  // Format currency
  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `PKR ${amount.toLocaleString()}`;
    }
    return `PKR ${amount || '0'}`;
  };

  // Format date
  const formatDate = dateString => {
    const date = new Date(dateString);
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Get status configuration
  const getStatusConfig = status => {
    const configs = {
      requested: {
        color: colors.textSecondary,
        backgroundColor: '#F3F4F6',
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
        color: colors.splashGreen,
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
  };

  // Fetch applications
  const fetchApplications = useCallback(
    async (page = 1, append = false, showLoader = true) => {
      try {
        if (showLoader && page === 1) {
          setLoading(true);
        }
        if (page > 1) {
          setLoadingMore(true);
        }

        const result = await getMyApplications(page, 10, selectedStatus);

        if (result && result.applications) {
          if (append && page > 1) {
            setApplications(prev => [...prev, ...result.applications]);
          } else {
            setApplications(result.applications);
          }

          setStatistics(result.statistics || statistics);
          const totalPages = result.pagination?.total_pages || 1;
          setHasMoreApplications(page < totalPages);
          setCurrentPage(page);
        }
      } catch (error) {
        console.error('Failed to load applications:', error);
        Alert.alert('Error', 'Failed to load applications. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedStatus, statistics],
  );

  // Initial load
  useEffect(() => {
    fetchApplications(1, false, true);
  }, [fetchApplications]);

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
    async applicationId => {
      try {
        Alert.alert(
          'Withdraw Application',
          'Are you sure you want to withdraw this application? This action cannot be undone.',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Withdraw',
              style: 'destructive',
              onPress: async () => {
                try {
                  await withDrawApplication({
                    application_id: applicationId,
                    action: 'withdraw',
                  });
                  Alert.alert('Success', 'Application withdrawn successfully');
                  onRefresh();
                } catch (error) {
                  Alert.alert('Error', 'Failed to withdraw application');
                }
              },
            },
          ],
        );
      } catch (error) {
        Alert.alert('Error', 'Failed to withdraw application');
      }
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
      {key: '', label: 'All Applications'},
      {key: 'requested', label: 'Requested'},
      {key: 'pending', label: 'Pending'},
      {key: 'accepted', label: 'Accepted'},
      {key: 'in_progress', label: 'In Progress'},
      {key: 'completed', label: 'Completed'},
      {key: 'rejected', label: 'Rejected'},
    ],
    [],
  );

  // Stats data for the top section
  const statsData = [
    {
      title: 'Total Applications',
      value: statistics.total_applications,
      icon: Briefcase,
      color: colors.splashGreen,
    },
    {
      title: 'Pending',
      value: statistics.pending,
      icon: Clock,
      color: '#F59E0B',
    },
    {
      title: 'Accepted',
      value: statistics.accepted,
      icon: CheckCircle,
      color: colors.splashGreen,
    },
    {
      title: 'In Progress',
      value: statistics.in_progress,
      icon: Loader2,
      color: '#3B82F6',
    },
  ];

  // Render application card
  const renderApplicationCard = useCallback(
    ({item, index}) => {
      const statusConfig = getStatusConfig(
        item.project_job?.proposal_status || item.status,
      );

      return (
        <TouchableOpacity
          style={styles.applicationCard}
          onPress={() => handleViewDetails(item)}
          activeOpacity={0.8}>
          {/* Header with Status */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.serviceTitle} numberOfLines={1}>
                {item.service?.service_title || 'Service Application'}
              </Text>
              <Text style={styles.serviceCategory}>
                {item.service?.service_category || 'General'}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {backgroundColor: statusConfig.backgroundColor},
              ]}>
              <statusConfig.icon color={statusConfig.color} size={12} />
              <Text style={[styles.statusText, {color: statusConfig.color}]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          {/* Job Details */}
          <View style={styles.jobDetails}>
            <Text style={styles.jobTitle} numberOfLines={2}>
              {item.project_job?.title || 'Job Title Not Available'}
            </Text>

            <View style={styles.jobMetaRow}>
              <View style={styles.jobMetaItem}>
                <MapPin color={colors.textSecondary} size={12} />
                <Text style={styles.jobMetaText} numberOfLines={1}>
                  {item.project_job?.city || 'Location not specified'}
                </Text>
              </View>
              <View style={styles.jobMetaItem}>
                <Calendar color={colors.textSecondary} size={12} />
                <Text style={styles.jobMetaText}>
                  Applied {formatDate(item.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* Price and Budget */}
          <View style={styles.priceContainer}>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Your Proposal</Text>
              <Text style={styles.priceValue}>
                {formatCurrency(item.price)}
              </Text>
            </View>
            <View style={styles.priceItem}>
              <Text style={styles.priceLabel}>Job Budget</Text>
              <Text style={styles.jobBudget}>
                {formatCurrency(item.project_job?.budget)}
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
              <Eye color={colors.splashGreen} size={14} />
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>

            {(item.status === 'requested' ||
              item.project_job?.proposal_status === 'requested') && (
              <TouchableOpacity
                style={styles.withdrawButton}
                onPress={() => handleWithdrawApplication(item.id)}>
                <Text style={styles.withdrawButtonText}>Withdraw</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      );
    },
    [handleViewDetails, handleWithdrawApplication],
  );

  // Render header
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Navigation Header */}
      <View style={styles.navHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>My Applications</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}>
          <Filter color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      {/* Stats Grid */}
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
          </View>
        ))}
      </View>

      {/* Filter Status */}
      {selectedStatus && (
        <View style={styles.activeFilterContainer}>
          <Text style={styles.activeFilterText}>
            Showing: {statusFilters.find(f => f.key === selectedStatus)?.label}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSelectedStatus('');
              fetchApplications(1, false, true);
            }}>
            <Text style={styles.clearFilterText}>Clear Filter</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Your Applications ({applications.length})
        </Text>
      </View>
    </View>
  );

  // Render footer
  const renderFooter = useCallback(() => {
    if (!loadingMore) {
      return null;
    }
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={colors.splashGreen} />
        <Text style={styles.loadingMoreText}>Loading more applications...</Text>
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
            : "You haven't applied to any jobs yet. Start exploring opportunities to grow your career!"}
        </Text>
        {!selectedStatus && (
          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => navigation.navigate('JobsScreen')}>
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
      <FlatList
        data={applications}
        renderItem={renderApplicationCard}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
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
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.modalCloseButton}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            {statusFilters.map(filter => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterOption,
                  selectedStatus === filter.key && styles.filterOptionActive,
                ]}
                onPress={() => {
                  setSelectedStatus(filter.key);
                  setShowFilterModal(false);
                  fetchApplications(1, false, true);
                }}>
                <Text style={styles.filterOptionText}>{filter.label}</Text>
                {selectedStatus === filter.key && (
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

  // Header Container
  headerContainer: {
    backgroundColor: colors.background,
    paddingBottom: 16,
  },

  // Navigation Header
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.bold,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
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
  },

  // Active Filter
  activeFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
  },
  activeFilterText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.splashGreen,
  },
  clearFilterText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },

  // Section Header
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  // Application Card
  applicationCard: {
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  serviceTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.splashGreen,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statusText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
  },

  // Job Details
  jobDetails: {
    marginBottom: 16,
  },
  jobTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  jobMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  jobMetaText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    flex: 1,
  },

  // Price Container
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  priceItem: {
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.splashGreen,
  },
  jobBudget: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  // Requirements
  requirementsContainer: {
    marginBottom: 16,
  },
  requirementsLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  requirementsText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    gap: 4,
  },
  viewButtonText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },
  withdrawButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  withdrawButtonText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: '#EF4444',
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
  exploreButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreButtonText: {
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
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  filterOptionActive: {
    backgroundColor: '#E8F5E9',
  },
  filterOptionText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.medium,
  },
});

export default MyApplicationsScreen;
