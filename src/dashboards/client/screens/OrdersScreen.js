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
  Image,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {
  getOrders,
  getPaymentHistory,
  submitReview,
  cancelProject,
} from '../../../api/client';

// Import your icons here
import TotalOrdersIcon from '../../../assets/images/icons/company.png';
import PendingOrdersIcon from '../../../assets/images/icons/company.png';
import CompletedOrdersIcon from '../../../assets/images/icons/company.png';
import TotalSpentIcon from '../../../assets/images/icons/company.png';
import SearchIcon from '../../../assets/images/icons/company.png';
import CalendarIcon from '../../../assets/images/icons/company.png';
import LocationIcon from '../../../assets/images/icons/location.png';
import PaymentIcon from '../../../assets/images/icons/company.png';

const OrdersScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [ordersData, setOrdersData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reviewData, setReviewData] = useState({
    rating: 5,
    comment: '',
  });

  // Filter options
  const filterOptions = [
    {label: 'All Orders', value: 'all'},
    {label: 'Pending', value: 'pending'},
    {label: 'In Progress', value: 'in_progress'},
    {label: 'Completed', value: 'completed'},
    {label: 'Cancelled', value: 'cancelled'},
  ];

  // Fetch orders data
  const fetchOrdersData = useCallback(async () => {
    try {
      const response = await getOrders();
      console.log('Orders API Response:', response);
      setOrdersData(response);
      setOrders(response.orders || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      Alert.alert('Error', 'Unable to load orders data. Please try again.');
    }
  }, []);

  // Fetch payment history
  const fetchPaymentHistory = useCallback(async () => {
    try {
      const response = await getPaymentHistory({limit: 10});
      console.log('Payment History API Response:', response);
      setPaymentHistory(response.payments || []);
    } catch (error) {
      console.error('Failed to load payment history:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchOrdersData(), fetchPaymentHistory()]);
      setLoading(false);
    };
    loadData();
  }, [fetchOrdersData, fetchPaymentHistory]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchOrdersData(), fetchPaymentHistory()]);
    setRefreshing(false);
  }, [fetchOrdersData, fetchPaymentHistory]);

  // Filter orders locally based on search and filter
  const filteredOrders = orders.filter(order => {
    // Filter by status
    if (selectedFilter !== 'all' && order.status !== selectedFilter) {
      return false;
    }

    // Filter by search query
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      order.title?.toLowerCase().includes(searchLower) ||
      order.description?.toLowerCase().includes(searchLower) ||
      order.provider_name?.toLowerCase().includes(searchLower) ||
      order.order_id?.toLowerCase().includes(searchLower)
    );
  });

  // Handle cancel order
  const handleCancelOrder = async orderId => {
    try {
      Alert.alert(
        'Cancel Order',
        'Are you sure you want to cancel this order?',
        [
          {text: 'No', style: 'cancel'},
          {
            text: 'Yes',
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              const response = await cancelProject({project_id: orderId});
              if (response) {
                Alert.alert('Success', 'Order cancelled successfully');
                await fetchOrdersData();
              }
              setLoading(false);
            },
          },
        ],
      );
    } catch (error) {
      console.error('Failed to cancel order:', error);
      Alert.alert('Error', 'Failed to cancel order. Please try again.');
      setLoading(false);
    }
  };

  // Handle submit review
  const handleSubmitReview = async () => {
    try {
      if (!reviewData.comment.trim()) {
        Alert.alert('Error', 'Please add a comment for your review');
        return;
      }

      setLoading(true);
      const response = await submitReview({
        order_id: selectedOrder.order_id,
        rating: reviewData.rating,
        comment: reviewData.comment,
        type: 'service_provider',
      });

      if (response) {
        Alert.alert('Success', 'Review submitted successfully!');
        setShowReviewModal(false);
        setReviewData({rating: 5, comment: ''});
        await fetchOrdersData();
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
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
      case 'pending':
        return {bg: '#FFF3E0', text: '#FF9800'};
      case 'in_progress':
        return {bg: '#E3F2FD', text: colors.primary};
      case 'completed':
        return {bg: '#E8F5E9', text: colors.splashGreen};
      case 'cancelled':
        return {bg: '#FFEBEE', text: '#F44336'};
      default:
        return {bg: '#F5F5F5', text: colors.textSecondary};
    }
  };

  // Loading state
  if (loading && orders.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  if (!ordersData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{color: colors.text}}>No data available</Text>
      </View>
    );
  }

  // Prepare stats data
  const statsData = [
    {
      icon: TotalOrdersIcon,
      bgColor: '#E8F5E9',
      label: 'Total Orders',
      value: ordersData.total_orders?.toString() ?? '0',
      change: `All Time`,
      changeColor: colors.splashGreen,
    },
    {
      icon: PendingOrdersIcon,
      bgColor: '#FFF3E0',
      label: 'Pending Orders',
      value: ordersData.pending_orders?.toString() ?? '0',
      change: `Awaiting Action`,
      changeColor: '#FF9800',
    },
    {
      icon: CompletedOrdersIcon,
      bgColor: '#F3E5F5',
      label: 'Completed Orders',
      value: ordersData.completed_orders?.toString() ?? '0',
      change: `Successfully Done`,
      changeColor: '#9C27B0',
    },
    {
      icon: TotalSpentIcon,
      bgColor: '#E3F2FD',
      label: 'Total Spent',
      value: formatCurrency(ordersData.total_spent ?? 0),
      change: `This Month`,
      changeColor: colors.primary,
    },
  ];

  // Render order item - Compact version
  const renderOrderItem = ({item: order}) => {
    const statusColors = getStatusColor(order.status);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => {
          setSelectedOrder(order);
          setShowOrderModal(true);
        }}
        activeOpacity={0.7}>
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderTitle} numberOfLines={1}>
              {order.title || 'Order #' + order.order_id}
            </Text>
            <Text style={styles.orderProvider}>
              by {order.provider_name || 'Unknown Provider'}
            </Text>
          </View>
          <View style={styles.orderMeta}>
            <Text style={styles.orderPrice}>
              {formatCurrency(order.amount || order.price)}
            </Text>
            <View
              style={[styles.statusBadge, {backgroundColor: statusColors.bg}]}>
              <Text style={[styles.statusText, {color: statusColors.text}]}>
                {order.status?.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.orderDescription} numberOfLines={2}>
          {order.description || 'No description available'}
        </Text>

        <View style={styles.orderFooter}>
          <View style={styles.orderMetaRow}>
            <View style={styles.orderMetaItem}>
              <Image
                source={CalendarIcon}
                style={styles.metaIcon}
                resizeMode="contain"
              />
              <Text style={styles.metaText}>
                {formatDate(order.created_at || order.order_date)}
              </Text>
            </View>
            {order.location && (
              <View style={styles.orderMetaItem}>
                <Image
                  source={LocationIcon}
                  style={styles.metaIcon}
                  resizeMode="contain"
                />
                <Text style={styles.metaText}>{order.location}</Text>
              </View>
            )}
          </View>

          <View style={styles.orderActions}>
            {order.status === 'completed' && !order.reviewed && (
              <TouchableOpacity
                style={styles.reviewButton}
                onPress={() => {
                  setSelectedOrder(order);
                  setShowReviewModal(true);
                }}>
                <Text style={styles.reviewButtonText}>Review</Text>
              </TouchableOpacity>
            )}
            {(order.status === 'pending' || order.status === 'in_progress') && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => handleCancelOrder(order.order_id)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render payment history item - Compact version
  const renderPaymentItem = ({item: payment}) => (
    <View style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentIcon}>
          <Image
            source={PaymentIcon}
            style={styles.paymentIconImage}
            resizeMode="contain"
          />
        </View>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentTitle}>
            {payment.description || 'Payment'}
          </Text>
          <Text style={styles.paymentDate}>
            {formatDate(payment.created_at)}
          </Text>
        </View>
        <View style={styles.paymentMeta}>
          <Text
            style={[
              styles.paymentAmount,
              {
                color:
                  payment.type === 'credit' ? colors.splashGreen : '#F44336',
              },
            ]}>
            {payment.type === 'credit' ? '+' : '-'}
            {formatCurrency(payment.amount)}
          </Text>
          <Text style={styles.paymentStatus}>
            {payment.status?.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );

  // Render order details modal
  const renderOrderModal = () => (
    <Modal
      visible={showOrderModal}
      animationType="slide"
      presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowOrderModal(false)}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Order Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}>
          {selectedOrder && (
            <View style={styles.orderDetails}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Order Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order ID:</Text>
                  <Text style={styles.detailValue}>
                    {selectedOrder.order_id}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Title:</Text>
                  <Text style={styles.detailValue}>{selectedOrder.title}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Provider:</Text>
                  <Text style={styles.detailValue}>
                    {selectedOrder.provider_name}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      {color: colors.splashGreen, fontWeight: '600'},
                    ]}>
                    {formatCurrency(
                      selectedOrder.amount || selectedOrder.price,
                    )}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getStatusColor(selectedOrder.status)
                          .bg,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.statusText,
                        {color: getStatusColor(selectedOrder.status).text},
                      ]}>
                      {selectedOrder.status?.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              {selectedOrder.description && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Description</Text>
                  <Text style={styles.descriptionText}>
                    {selectedOrder.description}
                  </Text>
                </View>
              )}

              <View style={styles.modalActions}>
                {selectedOrder.status === 'completed' &&
                  !selectedOrder.reviewed && (
                    <TouchableOpacity
                      style={styles.modalActionButton}
                      onPress={() => {
                        setShowOrderModal(false);
                        setShowReviewModal(true);
                      }}>
                      <Text style={styles.modalActionButtonText}>
                        Leave Review
                      </Text>
                    </TouchableOpacity>
                  )}
                {(selectedOrder.status === 'pending' ||
                  selectedOrder.status === 'in_progress') && (
                  <TouchableOpacity
                    style={[
                      styles.modalActionButton,
                      {backgroundColor: '#F44336'},
                    ]}
                    onPress={() => {
                      setShowOrderModal(false);
                      handleCancelOrder(selectedOrder.order_id);
                    }}>
                    <Text style={styles.modalActionButtonText}>
                      Cancel Order
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  // Render review modal
  const renderReviewModal = () => (
    <Modal
      visible={showReviewModal}
      animationType="slide"
      presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.cancelButtonModal}
            onPress={() => setShowReviewModal(false)}>
            <Text style={styles.cancelButtonTextModal}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Leave Review</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSubmitReview}>
            <Text style={styles.saveButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.reviewForm}>
            <Text style={styles.reviewTitle}>
              Rate your experience with {selectedOrder?.provider_name}
            </Text>

            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>Rating</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity
                    key={star}
                    onPress={() =>
                      setReviewData({...reviewData, rating: star})
                    }>
                    <Text
                      style={[
                        styles.starText,
                        {
                          color:
                            star <= reviewData.rating ? '#FFD700' : '#E0E0E0',
                        },
                      ]}>
                      ⭐
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.commentSection}>
              <Text style={styles.commentLabel}>Comment</Text>
              <TextInput
                style={styles.commentInput}
                value={reviewData.comment}
                onChangeText={text =>
                  setReviewData({...reviewData, comment: text})
                }
                placeholder="Share your experience..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
        </ScrollView>
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
              <Text style={styles.headerTitle}>My Orders</Text>
              <Text style={styles.headerSubtitle}>
                Track your orders and payments
              </Text>
            </View>
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
              placeholder="Search orders..."
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

        {/* Orders List */}
        <View style={styles.ordersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Orders</Text>
            <Text style={styles.orderCount}>
              {filteredOrders.length} Orders
            </Text>
          </View>

          {filteredOrders.length > 0 ? (
            filteredOrders.map((order, index) => (
              <View key={order.order_id || index}>
                {renderOrderItem({item: order})}
              </View>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'No orders match your search'
                  : 'No orders found'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Your orders will appear here once you make a purchase'}
              </Text>
            </View>
          )}
        </View>

        {/* Payment History - Compact */}
        {paymentHistory.length > 0 && (
          <View style={styles.paymentsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Payments</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {paymentHistory.slice(0, 5).map((payment, index) => (
              <View key={payment.payment_id || index}>
                {renderPaymentItem({item: payment})}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Order Details Modal */}
      {renderOrderModal()}

      {/* Review Modal */}
      {renderReviewModal()}
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

  ordersSection: {
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
  orderCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.splashGreen,
  },

  // Order Cards - More Compact
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8, // Reduced margin
  },
  orderInfo: {
    flex: 1,
    marginRight: 12,
  },
  orderTitle: {
    fontSize: 15, // Smaller font
    fontWeight: '600',
    color: colors.text,
    marginBottom: 3, // Reduced margin
  },
  orderProvider: {
    fontSize: 12, // Smaller font
    color: colors.textSecondary,
  },
  orderMeta: {
    alignItems: 'flex-end',
  },
  orderPrice: {
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
  orderDescription: {
    fontSize: 12, // Smaller font
    color: colors.textSecondary,
    lineHeight: 16, // Reduced line height
    marginBottom: 12, // Reduced margin
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderMetaRow: {
    flex: 1,
  },
  orderMetaItem: {
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
  orderActions: {
    flexDirection: 'row',
    gap: 6, // Reduced gap
  },
  reviewButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 10, // Reduced padding
    paddingVertical: 5,
    borderRadius: 12, // Smaller radius
  },
  reviewButtonText: {
    color: colors.background,
    fontSize: 11, // Smaller font
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10, // Reduced padding
    paddingVertical: 5,
    borderRadius: 12, // Smaller radius
    borderWidth: 1,
    borderColor: '#F44336',
  },
  cancelButtonText: {
    color: '#F44336',
    fontSize: 11, // Smaller font
    fontWeight: '600',
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
  },

  // Payment Section - More Compact
  paymentsSection: {
    marginTop: 20, // Reduced margin
    paddingHorizontal: 16,
    marginBottom: 0,
  },
  paymentCard: {
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
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIcon: {
    width: 32, // Smaller icon
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10, // Reduced margin
  },
  paymentIconImage: {
    width: 16, // Smaller image
    height: 16,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: 13, // Smaller font
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  paymentDate: {
    fontSize: 11, // Smaller font
    color: colors.textSecondary,
  },
  paymentMeta: {
    alignItems: 'flex-end',
  },
  paymentAmount: {
    fontSize: 14, // Smaller font
    fontWeight: '700',
    marginBottom: 2,
  },
  paymentStatus: {
    fontSize: 9, // Smaller font
    color: colors.textSecondary,
    fontWeight: '500',
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 32,
  },
  cancelButtonModal: {
    minWidth: 60,
  },
  cancelButtonTextModal: {
    color: colors.textSecondary,
    fontSize: 16,
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
  orderDetails: {
    paddingVertical: 16,
  },
  detailSection: {
    marginBottom: 20, // Reduced margin
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12, // Reduced margin
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6, // Reduced padding
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 13, // Smaller font
    color: colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13, // Smaller font
    color: colors.text,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  modalActions: {
    paddingTop: 16,
    gap: 10, // Reduced gap
  },
  modalActionButton: {
    backgroundColor: colors.splashGreen,
    paddingVertical: 10, // Reduced padding
    borderRadius: 12, // Smaller radius
    alignItems: 'center',
  },
  modalActionButtonText: {
    color: colors.background,
    fontSize: 14, // Smaller font
    fontWeight: '600',
  },

  // Review Modal Styles
  reviewForm: {
    paddingVertical: 16,
  },
  reviewTitle: {
    fontSize: 15, // Smaller font
    fontWeight: '600',
    color: colors.text,
    marginBottom: 20, // Reduced margin
    textAlign: 'center',
  },
  ratingSection: {
    marginBottom: 20, // Reduced margin
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 10, // Reduced margin
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6, // Reduced gap
  },
  starText: {
    fontSize: 28, // Smaller stars
  },
  commentSection: {
    marginBottom: 20, // Reduced margin
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  commentInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 90, // Reduced height
    textAlignVertical: 'top',
  },
});

export default OrdersScreen;
