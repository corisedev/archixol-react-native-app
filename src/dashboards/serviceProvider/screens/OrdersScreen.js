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
  StatusBar,
  Platform,
  FlatList,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {useNavigation} from '@react-navigation/native';
import {
  getOrders,
  getOrderProjectDetail,
  completeProjectOrder,
  updateProjectStatus,
} from '../../../api/serviceProvider';

// Lucide React Native Icons
import {
  Package,
  DollarSign,
  CheckCircle,
  Clock,
  Users,
  Calendar,
  MapPin,
  Star,
  Filter,
  Eye,
  Play,
  Pause,
  CheckSquare,
  XCircle,
  MoreVertical,
  FileText,
  TrendingUp,
  AlertCircle,
  Clipboard,
  Briefcase,
  Settings,
  MessageCircle,
  ArrowRight,
} from 'lucide-react-native';

const {height: screenHeight, width: screenWidth} = Dimensions.get('window');

const OrdersScreen = () => {
  const navigation = useNavigation();

  // State Management
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ongoing');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // Statistics from orders data
  const [statistics, setStatistics] = useState({
    total_projects: 0,
    total_earnings: 0,
    completed_projects: 0,
    ongoing_projects: 0,
    cancelled_projects: 0,
    paused_projects: 0,
    average_rating: 0,
  });

  // Calculate statistics from orders data
  const calculateStatistics = useCallback(ordersData => {
    if (!ordersData || !Array.isArray(ordersData)) {
      return {
        total_projects: 0,
        total_earnings: 0,
        completed_projects: 0,
        ongoing_projects: 0,
        cancelled_projects: 0,
        paused_projects: 0,
        average_rating: 0,
      };
    }

    const stats = ordersData.reduce(
      (acc, order) => {
        acc.total_projects += 1;

        // Map different status variations
        const orderStatus = order.status?.toLowerCase();

        if (orderStatus === 'completed') {
          acc.total_earnings += parseFloat(order.budget || order.amount || 0);
          acc.completed_projects += 1;
        } else if (
          orderStatus === 'ongoing' ||
          orderStatus === 'in_progress' ||
          orderStatus === 'open'
        ) {
          acc.ongoing_projects += 1;
        } else if (orderStatus === 'cancelled') {
          acc.cancelled_projects += 1;
        } else if (orderStatus === 'paused') {
          acc.paused_projects += 1;
        }

        return acc;
      },
      {
        total_projects: 0,
        total_earnings: 0,
        completed_projects: 0,
        ongoing_projects: 0,
        cancelled_projects: 0,
        paused_projects: 0,
        average_rating: 0,
      },
    );

    return stats;
  }, []);

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

  // Get status configuration - Updated to match OrderDetailScreen
  const getStatusConfig = useCallback(status => {
    const normalizedStatus = status?.toLowerCase();
    const configs = {
      open: {
        color: '#3B82F6',
        backgroundColor: '#DBEAFE',
        icon: Clock,
        label: 'Open',
      },
      ongoing: {
        color: '#3B82F6',
        backgroundColor: '#DBEAFE',
        icon: Clock,
        label: 'Ongoing',
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
      paused: {
        color: '#F59E0B',
        backgroundColor: '#FEF3C7',
        icon: Pause,
        label: 'Paused',
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
    return configs[normalizedStatus] || configs.ongoing;
  }, []);

  // Get order ID with multiple fallbacks
  const getOrderId = useCallback(item => {
    return item?.id || item?._id || item?.project_id || item?.order_id || null;
  }, []);

  // Fetch all orders for statistics
  const fetchAllOrdersForStats = useCallback(async () => {
    try {
      const allOrdersPromises = [
        getOrders({status: '', page: 1, limit: 100}), // Get all orders
      ];

      const results = await Promise.all(allOrdersPromises);
      const allOrders = results[0]?.projects || [];

      const calculatedStats = calculateStatistics(allOrders);
      setStatistics(calculatedStats);
    } catch (error) {
      console.log('Failed to fetch all orders for statistics:', error);
      // Set default statistics
      setStatistics({
        total_projects: orders.length,
        total_earnings: 0,
        completed_projects: 0,
        ongoing_projects: 0,
        cancelled_projects: 0,
        paused_projects: 0,
        average_rating: 0,
      });
    }
  }, [orders.length, calculateStatistics]);

  // Fetch orders
  const fetchOrders = useCallback(
    async (page = 1, append = false, showLoader = true) => {
      try {
        if (showLoader && page === 1) setLoading(true);
        if (page > 1) setLoadingMore(true);

        const result = await getOrders({
          status: selectedStatus === 'all' ? '' : selectedStatus,
          page: page,
          limit: 10,
          sort_by: 'created_date',
          sort_order: 'desc',
        });

        if (result && result.projects) {
          if (append && page > 1) {
            setOrders(prev => [...prev, ...result.projects]);
          } else {
            setOrders(result.projects);
          }

          const totalPages = result.pagination?.total_pages || 1;
          setHasMoreOrders(page < totalPages);
          setCurrentPage(page);
        } else {
          if (!append) setOrders([]);
          setHasMoreOrders(false);
        }
      } catch (error) {
        console.error('Failed to load orders:', error);
        Alert.alert('Error', 'Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedStatus],
  );

  // Initial load
  useEffect(() => {
    fetchOrders(1, false, true);
  }, [selectedStatus, fetchOrders]);

  // Fetch statistics after orders are loaded
  useEffect(() => {
    if (orders.length > 0) {
      fetchAllOrdersForStats();
    }
  }, [orders, fetchAllOrdersForStats]);

  // Refresh orders
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMoreOrders(true);
    await fetchOrders(1, false, false);
    setRefreshing(false);
  }, [fetchOrders]);

  // Load more orders
  const loadMoreOrders = useCallback(() => {
    if (!loadingMore && hasMoreOrders && !loading) {
      fetchOrders(currentPage + 1, true, false);
    }
  }, [loadingMore, hasMoreOrders, loading, currentPage, fetchOrders]);

  // Handle order status update
  const handleUpdateOrderStatus = useCallback(
    async (orderId, newStatus) => {
      if (!orderId) {
        Alert.alert('Error', 'Order ID is missing');
        return;
      }

      Alert.alert(
        'Update Order Status',
        `Are you sure you want to mark this order as ${newStatus}?`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Update',
            onPress: async () => {
              try {
                setUpdatingOrderId(orderId);

                if (newStatus === 'completed') {
                  await completeProjectOrder(orderId, {
                    completion_notes: 'Order completed from orders list',
                  });
                } else {
                  await updateProjectStatus(orderId, newStatus, {
                    update_notes: `Status updated to ${newStatus} from orders list`,
                  });
                }

                Alert.alert('Success', `Order status updated to ${newStatus}`);
                onRefresh();
              } catch (error) {
                Alert.alert(
                  'Error',
                  error.message || 'Failed to update order status',
                );
              } finally {
                setUpdatingOrderId(null);
              }
            },
          },
        ],
      );
    },
    [onRefresh],
  );

  // Handle view order details - Fixed navigation
  const handleViewOrderDetails = useCallback(
    order => {
      const orderId = getOrderId(order);

      if (!orderId) {
        Alert.alert('Error', 'Order ID is missing. Cannot view details.');
        return;
      }

      // Log for debugging
      console.log('Navigating to OrderDetailScreen with:', {
        orderId,
        orderTitle: order?.title || order?.project_title,
        orderStatus: order?.status,
      });

      try {
        navigation.navigate('OrderDetailScreen', {
          orderId: orderId,
          order: order, // Pass the full order object for initial display
        });
      } catch (error) {
        console.error('Navigation error:', error);
        Alert.alert('Error', 'Failed to navigate to order details');
      }
    },
    [navigation, getOrderId],
  );

  // Handle chat navigation
  const handleChat = useCallback(
    order => {
      const orderId = getOrderId(order);

      if (!orderId) {
        Alert.alert('Error', 'Cannot start chat. Order ID is missing.');
        return;
      }

      navigation.navigate('ChatScreen', {
        chat_id: orderId,
        clientName:
          order?.client?.fullname || order?.client?.username || 'Client',
        orderTitle: order?.title || order?.project_title || 'Project',
      });
    },
    [navigation, getOrderId],
  );

  // Filter status options - Updated to match OrderDetailScreen statuses
  const statusFilters = React.useMemo(
    () => [
      {
        key: 'all',
        label: 'All Orders',
        count: statistics.total_projects,
        icon: Package,
      },
      {
        key: 'ongoing',
        label: 'Active', // Combined ongoing/in_progress/open
        count: statistics.ongoing_projects,
        icon: Clock,
      },
      {
        key: 'completed',
        label: 'Completed',
        count: statistics.completed_projects,
        icon: CheckCircle,
      },
      {
        key: 'cancelled',
        label: 'Cancelled',
        count: statistics.cancelled_projects || 0,
        icon: XCircle,
      },
      {
        key: 'paused',
        label: 'Paused',
        count: statistics.paused_projects || 0,
        icon: Pause,
      },
    ],
    [statistics],
  );

  // Stats data for the top section
  const statsData = React.useMemo(
    () => [
      {
        title: 'Total Projects',
        value: statistics.total_projects || 0,
        icon: Clipboard,
        color: '#3B82F6',
        trend: '+12%',
      },
      {
        title: 'Total Earnings',
        value: formatCurrency(statistics.total_earnings),
        icon: DollarSign,
        color: '#F59E0B',
        trend: '+18%',
      },
      {
        title: 'Completed',
        value: statistics.completed_projects || 0,
        icon: CheckCircle,
        color: '#10B981',
        trend: '+5%',
      },
      {
        title: 'Active',
        value: statistics.ongoing_projects || 0,
        icon: Clock,
        color: '#3B82F6',
        trend: '+3%',
      },
    ],
    [statistics, formatCurrency],
  );

  // Render header
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}!</Text>
          <Text style={styles.userName}>Orders Management</Text>
          <Text style={styles.subtitle}>Track your projects & earnings</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowFilterModal(true)}>
          <Filter color={colors.splashGreen} size={20} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render stats header
  const renderStatsHeader = () => (
    <View style={styles.statsContainer}>
      {statsData.map((stat, index) => (
        <View key={index} style={styles.statCard}>
          <View style={styles.statHeader}>
            <View
              style={[
                styles.statIconContainer,
                {backgroundColor: stat.color + '20'},
              ]}>
              <stat.icon color={stat.color} size={20} />
            </View>
            <Text style={[styles.statTrend, {color: stat.color}]}>
              📈 {stat.trend}
            </Text>
          </View>
          <Text style={styles.statValue}>{stat.value}</Text>
          <Text style={styles.statTitle}>{stat.title}</Text>
        </View>
      ))}
    </View>
  );

  // Render filter section
  const renderFilterSection = () => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>Filter by Status</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContainer}>
        {statusFilters.map((filter, index) => (
          <TouchableOpacity
            key={filter.key || index}
            style={[
              styles.filterChip,
              selectedStatus === filter.key && styles.filterChipActive,
            ]}
            onPress={() => setSelectedStatus(filter.key)}>
            <filter.icon
              color={
                selectedStatus === filter.key ? 'white' : colors.textSecondary
              }
              size={16}
            />
            <Text
              style={[
                styles.filterChipText,
                selectedStatus === filter.key && styles.filterChipTextActive,
              ]}>
              {filter.label}
            </Text>
            <View
              style={[
                styles.filterChipBadge,
                selectedStatus === filter.key && styles.filterChipBadgeActive,
              ]}>
              <Text
                style={[
                  styles.filterChipBadgeText,
                  selectedStatus === filter.key &&
                    styles.filterChipBadgeTextActive,
                ]}>
                {filter.count || 0}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render order card - Fixed button states and navigation
  const renderOrderCard = useCallback(
    ({item}) => {
      const statusConfig = getStatusConfig(item.status);
      const orderId = getOrderId(item);
      const isUpdating = updatingOrderId === orderId;
      const hasValidId = Boolean(orderId);

      // Debug log
      console.log('Rendering order card:', {
        title: item.title,
        orderId,
        hasValidId,
        status: item.status,
      });

      return (
        <View style={styles.orderCard}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderLeft}>
              <Text style={styles.orderTitle} numberOfLines={2}>
                {item.title || item.project_title || 'Project Title'}
              </Text>
              <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                  <Users color={colors.textSecondary} size={12} />
                  <Text style={styles.metaText}>
                    {item.client?.fullname ||
                      item.client?.username ||
                      item.client_name ||
                      'Unknown Client'}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Calendar color={colors.textSecondary} size={12} />
                  <Text style={styles.metaText}>
                    {formatDate(
                      item.started_at || item.start_date || item.createdAt,
                    )}
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

          {/* Project Details */}
          <View style={styles.projectDetails}>
            <View style={styles.detailItem}>
              <DollarSign color={colors.splashGreen} size={16} />
              <View>
                <Text style={styles.detailLabel}>Project Value</Text>
                <Text style={styles.detailValue}>
                  {formatCurrency(item.budget || item.amount)}
                </Text>
              </View>
            </View>

            {(item.deadline || item.timeline) && (
              <View style={styles.detailItem}>
                <Clock color={colors.textSecondary} size={16} />
                <View>
                  <Text style={styles.detailLabel}>
                    {item.deadline ? 'Deadline' : 'Duration'}
                  </Text>
                  <Text style={styles.detailValue}>
                    {item.deadline
                      ? formatDate(item.deadline)
                      : `${item.timeline} days`}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Progress Bar */}
          {item.progress !== undefined && (
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressPercent}>
                  {item.progress || 0}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {width: `${item.progress || 0}%`},
                  ]}
                />
              </View>
            </View>
          )}

          {/* Description */}
          {item.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          )}

          {/* Footer Actions */}
          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={[styles.viewButton, !hasValidId && styles.disabledButton]}
              onPress={() => hasValidId && handleViewOrderDetails(item)}
              disabled={!hasValidId}>
              <Eye color="white" size={16} />
              <Text style={styles.viewButtonText}>
                {hasValidId ? 'View Details' : 'ID Missing'}
              </Text>
            </TouchableOpacity>

            {hasValidId && (
              <TouchableOpacity
                style={styles.chatButton}
                onPress={() => handleChat(item)}>
                <MessageCircle color={colors.splashGreen} size={16} />
              </TouchableOpacity>
            )}

            {hasValidId &&
              (item.status === 'ongoing' ||
                item.status === 'in_progress' ||
                item.status === 'open') && (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.completeButton,
                    isUpdating && styles.disabledButton,
                  ]}
                  onPress={() => handleUpdateOrderStatus(orderId, 'completed')}
                  disabled={isUpdating}>
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#10B981" />
                  ) : (
                    <>
                      <CheckSquare color="#10B981" size={16} />
                      <Text style={styles.completeButtonText}>Complete</Text>
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
      getOrderId,
      formatDate,
      formatCurrency,
      handleViewOrderDetails,
      handleChat,
      handleUpdateOrderStatus,
      updatingOrderId,
    ],
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
          <Package color={colors.textSecondary} size={48} />
        </View>
        <Text style={styles.emptyText}>No Orders Found</Text>
        <Text style={styles.emptySubtext}>
          {selectedStatus === 'all'
            ? "You don't have any orders yet."
            : `No ${selectedStatus} orders found.`}
        </Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('AvailableJobsScreen')}>
          <Briefcase color="white" size={16} />
          <Text style={styles.emptyButtonText}>Browse Jobs</Text>
        </TouchableOpacity>
      </View>
    ),
    [selectedStatus, navigation],
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading your orders...</Text>
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

      {/* Main Content */}
      <FlatList
        data={orders}
        renderItem={renderOrderCard}
        keyExtractor={(item, index) => (getOrderId(item) || index).toString()}
        ListHeaderComponent={
          <>
            {renderHeader()}
            {renderStatsHeader()}
            {renderFilterSection()}
          </>
        }
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
        onEndReached={loadMoreOrders}
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
              <Text style={styles.modalTitle}>Filter Orders</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <XCircle color={colors.textSecondary} size={20} />
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
                        {filter.count || 0} orders
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

  // Header Styles
  header: {
    backgroundColor: colors?.background || '#FFFFFF',
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
    fontSize: fontSizes?.lg || 18,
    color: colors?.textSecondary || '#6B7280',
    fontFamily: fonts?.regular || 'System',
  },
  userName: {
    fontSize: fontSizes?.['3xl'] || 24,
    fontFamily: fonts?.bold || 'System',
    color: colors?.text || '#1F2937',
    marginTop: 4,
  },
  subtitle: {
    fontSize: fontSizes?.sm || 14,
    color: colors?.textSecondary || '#6B7280',
    fontFamily: fonts?.regular || 'System',
    marginTop: 2,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List Content
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },

  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 2,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    width: (screenWidth - 48) / 2,
    backgroundColor: colors?.background || '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: fontSizes?.lg || 18,
    fontFamily: fonts?.bold || 'System',
    color: colors?.text || '#1F2937',
    marginBottom: 2,
    textAlign: 'left',
  },
  statTitle: {
    fontSize: fontSizes?.xs || 12,
    color: colors?.textSecondary || '#6B7280',
    fontFamily: fonts?.medium || 'System',
  },
  statTrend: {
    fontSize: fontSizes?.xs || 10,
    fontFamily: fonts?.medium || 'System',
  },

  // Filter Section
  filterSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  filterTitle: {
    fontSize: fontSizes?.lg || 18,
    fontFamily: fonts?.bold || 'System',
    color: colors?.text || '#1F2937',
    marginBottom: 12,
  },
  filterScrollContainer: {
    paddingRight: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors?.background || '#FFFFFF',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  filterChipActive: {
    backgroundColor: colors?.splashGreen || '#10B981',
    borderColor: colors?.splashGreen || '#10B981',
  },
  filterChipText: {
    fontSize: fontSizes?.sm || 14,
    fontFamily: fonts?.medium || 'System',
    color: colors?.text || '#1F2937',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts?.semiBold || 'System',
  },
  filterChipBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  filterChipBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterChipBadgeText: {
    fontSize: fontSizes?.xs || 12,
    fontFamily: fonts?.bold || 'System',
    color: colors?.textSecondary || '#6B7280',
  },
  filterChipBadgeTextActive: {
    color: '#FFFFFF',
  },

  // Order Card
  orderCard: {
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
  orderTitle: {
    fontSize: fontSizes?.lg || 18,
    fontFamily: fonts?.bold || 'System',
    color: colors?.text || '#1F2937',
    marginBottom: 8,
    lineHeight: 24,
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

  // Project Details
  projectDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: fontSizes?.xs || 12,
    color: colors?.textSecondary || '#6B7280',
    fontFamily: fonts?.medium || 'System',
  },
  detailValue: {
    fontSize: fontSizes?.sm || 14,
    color: colors?.text || '#1F2937',
    fontFamily: fonts?.bold || 'System',
  },

  // Progress Bar
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: fontSizes?.sm || 14,
    color: colors?.text || '#1F2937',
    fontFamily: fonts?.medium || 'System',
  },
  progressPercent: {
    fontSize: fontSizes?.sm || 14,
    color: colors?.splashGreen || '#10B981',
    fontFamily: fonts?.bold || 'System',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors?.splashGreen || '#10B981',
    borderRadius: 4,
  },

  // Description
  descriptionContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors?.splashGreen || '#10B981',
  },
  descriptionText: {
    fontSize: fontSizes?.sm || 14,
    color: colors?.text || '#1F2937',
    fontFamily: fonts?.regular || 'System',
    lineHeight: 20,
  },

  // Card Footer - Updated with chat button
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 16,
    gap: 8,
  },
  viewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: colors?.splashGreen || '#10B981',
    borderRadius: 12,
    gap: 8,
  },
  viewButtonText: {
    fontSize: fontSizes?.sm || 14,
    fontFamily: fonts?.semiBold || 'System',
    color: '#FFFFFF',
  },
  chatButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors?.splashGreen || '#10B981',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  completeButton: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  completeButtonText: {
    fontSize: fontSizes?.xs || 12,
    fontFamily: fonts?.semiBold || 'System',
    color: '#10B981',
  },
  disabledButton: {
    opacity: 0.6,
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

  // Empty State
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
    marginBottom: 24,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors?.splashGreen || '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: fontSizes?.sm || 14,
    fontFamily: fonts?.semiBold || 'System',
    color: '#FFFFFF',
  },

  // Modal Styles
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

export default OrdersScreen;
