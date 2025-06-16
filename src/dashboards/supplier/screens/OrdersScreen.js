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
  Package,
  X,
  Calendar,
  ShoppingBag,
  MoreVertical,
  Eye,
  CreditCard,
  Truck,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {
  getAllOrders,
  updateFulfillmentStatus,
  markAsPaid,
  markAsDelivered,
  deleteOrder,
} from '../../../api/serviceSupplier';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';

// Move component outside of render to fix React warning
const OrderListEmpty = ({query, navigation}) => {
  return (
    <View style={styles.emptyContainer}>
      <Package color={colors.textSecondary} size={48} />
      <Text style={styles.emptyText}>
        {query ? 'No orders found matching your search' : 'No orders yet'}
      </Text>
      <Text style={styles.emptySubtext}>
        {query
          ? 'Try adjusting your search terms'
          : 'Orders will appear here once customers place them'}
      </Text>
    </View>
  );
};

// Move FilterModal component outside to fix React warning
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
          <Text style={styles.modalTitle}>Filter Orders</Text>
          <TouchableOpacity onPress={onClose}>
            <X color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Order Status</Text>
          {[
            {label: 'All Orders', value: 'all'},
            {label: 'Pending', value: 'pending'},
            {label: 'Processing', value: 'processing'},
            {label: 'Completed', value: 'completed'},
            {label: 'Delivered', value: 'delivered'},
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
  selectedOrder,
  onUpdateStatus,
  onMarkAsPaid,
  onMarkAsDelivered,
  navigation,
}) => {
  if (!selectedOrder) {
    return null;
  }

  const getOrderNumber = order => {
    if (order.order_no) {
      return order.order_no;
    }
    if (order.order_number) {
      return order.order_number;
    }
    if (order.id) {
      return `#${order.id.toString().substring(0, 8)}`;
    }
    if (order._id) {
      return `#${order._id.toString().substring(0, 8)}`;
    }
    return '#N/A';
  };

  const getCustomerName = order => {
    if (order.customer_name) {
      return order.customer_name;
    }
    if (order.customer?.name) {
      return order.customer.name;
    }
    if (order.client_name) {
      return order.client_name;
    }
    return 'Customer';
  };

  const getOrderTotal = order => {
    if (order.total) {
      return order.total;
    }
    if (order.calculations?.total) {
      return order.calculations.total;
    }
    if (order.grand_total) {
      return order.grand_total;
    }
    return 0;
  };

  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `PKR ${amount.toLocaleString()}`;
    }
    return `PKR ${amount || '0'}`;
  };

  const isPaymentNotPaid = paymentStatus => {
    if (typeof paymentStatus === 'boolean') {
      return !paymentStatus;
    }
    if (typeof paymentStatus === 'string') {
      return paymentStatus.toLowerCase() !== 'paid';
    }
    return true;
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

          <View style={styles.orderSummary}>
            <Text style={styles.orderSummaryText}>
              {getOrderNumber(selectedOrder)} • {getCustomerName(selectedOrder)}
            </Text>
            <Text style={styles.orderSummaryAmount}>
              {formatCurrency(getOrderTotal(selectedOrder))}
            </Text>
          </View>

          {/* Status Update Actions */}
          <View style={styles.actionSection}>
            <Text style={styles.actionSectionTitle}>Update Status</Text>

            {selectedOrder.status === 'pending' && (
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => {
                  onClose();
                  onUpdateStatus(
                    selectedOrder._id || selectedOrder.id,
                    'processing',
                  );
                }}>
                <AlertCircle color={colors.splashGreen} size={20} />
                <Text style={styles.quickActionText}>Mark as Processing</Text>
              </TouchableOpacity>
            )}

            {selectedOrder.status === 'processing' && (
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => {
                  onClose();
                  onUpdateStatus(
                    selectedOrder._id || selectedOrder.id,
                    'shipped',
                  );
                }}>
                <Truck color={colors.splashGreen} size={20} />
                <Text style={styles.quickActionText}>Mark as Shipped</Text>
              </TouchableOpacity>
            )}

            {(selectedOrder.status === 'shipped' ||
              selectedOrder.status === 'processing') && (
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => {
                  onClose();
                  onMarkAsDelivered(selectedOrder._id || selectedOrder.id);
                }}>
                <CheckCircle color={colors.splashGreen} size={20} />
                <Text style={styles.quickActionText}>Mark as Delivered</Text>
              </TouchableOpacity>
            )}

            {isPaymentNotPaid(selectedOrder.payment_status) && (
              <TouchableOpacity
                style={styles.quickAction}
                onPress={() => {
                  onClose();
                  onMarkAsPaid(selectedOrder._id || selectedOrder.id);
                }}>
                <CreditCard color={colors.splashGreen} size={20} />
                <Text style={styles.quickActionText}>Mark as Paid</Text>
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
                navigation.navigate('OrderDetailScreen', {
                  orderId: selectedOrder._id || selectedOrder.id,
                });
              }}>
              <Eye color={colors.text} size={20} />
              <Text style={styles.quickActionText}>View Full Details</Text>
            </TouchableOpacity>

            {selectedOrder.status !== 'cancelled' &&
              selectedOrder.status !== 'delivered' && (
                <TouchableOpacity
                  style={[styles.quickAction, styles.cancelAction]}
                  onPress={() => {
                    onClose();
                    Alert.alert(
                      'Cancel Order',
                      'Are you sure you want to cancel this order?',
                      [
                        {text: 'No', style: 'cancel'},
                        {
                          text: 'Yes',
                          style: 'destructive',
                          onPress: () =>
                            onUpdateStatus(
                              selectedOrder._id || selectedOrder.id,
                              'cancelled',
                            ),
                        },
                      ],
                    );
                  }}>
                  <XCircle color="#F44336" size={20} />
                  <Text
                    style={[styles.quickActionText, styles.cancelActionText]}>
                    Cancel Order
                  </Text>
                </TouchableOpacity>
              )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const OrdersScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [quickActionModalVisible, setQuickActionModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const navigation = useNavigation();

  // Fetch orders data
  const fetchOrders = useCallback(async () => {
    try {
      const response = await getAllOrders({
        page: 1,
        limit: 100,
        sort_by: 'createdAt',
        sort_order: 'desc',
      });
      console.log('Orders API Response:', response);

      if (response && response.orders && Array.isArray(response.orders)) {
        setOrders(response.orders);
        setFilteredOrders(response.orders);
      } else if (
        response &&
        response.order_list &&
        Array.isArray(response.order_list)
      ) {
        setOrders(response.order_list);
        setFilteredOrders(response.order_list);
      } else {
        setOrders([]);
        setFilteredOrders([]);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      Alert.alert('Error', 'Unable to load orders. Please try again.');
      setOrders([]);
      setFilteredOrders([]);
    }
  }, []);

  // Initial data load and refresh on focus
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        await fetchOrders();
        setLoading(false);
      };
      loadData();
    }, [fetchOrders]),
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  // Search orders
  const handleSearch = useCallback(
    query => {
      setSearchQuery(query);

      if (query.trim() === '') {
        applyFilters(orders, selectedFilter);
        return;
      }

      const filtered = orders.filter(order => {
        const orderNumber = getOrderNumber(order).toLowerCase();
        const customerName = getCustomerName(order).toLowerCase();
        const orderId = (order._id || order.id || '').toString().toLowerCase();
        const orderStatus = getOrderStatus(order).toLowerCase();
        const searchTerm = query.toLowerCase();

        return (
          orderNumber.includes(searchTerm) ||
          customerName.includes(searchTerm) ||
          orderId.includes(searchTerm) ||
          orderStatus.includes(searchTerm)
        );
      });
      setFilteredOrders(filtered);
    },
    [orders, selectedFilter, applyFilters],
  );

  // Apply filters
  const applyFilters = useCallback((orderList, statusFilter) => {
    let filtered = [...orderList];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => {
        const orderStatus = getOrderStatus(order);
        return orderStatus === statusFilter;
      });
    }

    setFilteredOrders(filtered);
  }, []);

  // Handle filter change
  const handleFilterChange = statusFilter => {
    setSelectedFilter(statusFilter);
    setFilterModalVisible(false);

    if (searchQuery.trim() === '') {
      applyFilters(orders, statusFilter);
    }
  };

  // Handle quick actions
  const handleQuickAction = order => {
    setSelectedOrder(order);
    setQuickActionModalVisible(true);
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await updateFulfillmentStatus({
        order_id: orderId,
        status: newStatus,
      });

      const updatedOrders = orders.map(order =>
        (order._id || order.id) === orderId
          ? {...order, status: newStatus}
          : order,
      );
      setOrders(updatedOrders);
      applyFilters(updatedOrders, selectedFilter);

      Alert.alert('Success', `Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Status update failed:', error);
      Alert.alert('Error', 'Failed to update order status. Please try again.');
    }
  };

  // Mark order as paid
  const markOrderAsPaid = async orderId => {
    try {
      await markAsPaid({order_id: orderId});

      const updatedOrders = orders.map(order =>
        (order._id || order.id) === orderId
          ? {...order, payment_status: true}
          : order,
      );
      setOrders(updatedOrders);
      applyFilters(updatedOrders, selectedFilter);

      Alert.alert('Success', 'Order marked as paid');
    } catch (error) {
      console.error('Mark as paid failed:', error);
      Alert.alert('Error', 'Failed to mark order as paid. Please try again.');
    }
  };

  // Mark order as delivered
  const markOrderAsDelivered = async orderId => {
    try {
      await markAsDelivered({order_id: orderId});

      const updatedOrders = orders.map(order =>
        (order._id || order.id) === orderId
          ? {...order, status: 'delivered'}
          : order,
      );
      setOrders(updatedOrders);
      applyFilters(updatedOrders, selectedFilter);

      Alert.alert('Success', 'Order marked as delivered');
    } catch (error) {
      console.error('Mark as delivered failed:', error);
      Alert.alert(
        'Error',
        'Failed to mark order as delivered. Please try again.',
      );
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
      case 'delivered':
        return colors.splashGreen;
      case 'processing':
      case 'shipped':
        return '#2196F3';
      case 'pending':
      case 'open':
        return '#FFC107';
      case 'cancelled':
      case 'returned':
        return '#F44336';
      default:
        return colors.textSecondary;
    }
  };

  const getPaymentStatusColor = status => {
    if (typeof status === 'boolean') {
      return status ? colors.splashGreen : '#FFC107';
    }

    if (!status || typeof status !== 'string') {
      return colors.textSecondary;
    }

    switch (status.toLowerCase()) {
      case 'paid':
      case 'true':
        return colors.splashGreen;
      case 'pending':
      case 'false':
        return '#FFC107';
      case 'failed':
      case 'refunded':
        return '#F44336';
      default:
        return colors.textSecondary;
    }
  };

  const getPaymentStatusText = status => {
    if (typeof status === 'boolean') {
      return status ? 'PAID' : 'PENDING';
    }

    if (!status) { return 'PENDING'; }

    if (typeof status === 'string') {
      return status.toUpperCase();
    }

    return 'PENDING';
  };

  const formatDate = dateString => {
    if (!dateString) return 'N/A';

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

  const getOrderTotal = order => {
    if (order.total) { return order.total; }
    if (order.calculations?.total) { return order.calculations.total; }
    if (order.grand_total) { return order.grand_total; }
    return 0;
  };

  const getCustomerName = order => {
    if (order.customer_name) { return order.customer_name; }
    if (order.customer?.name) { return order.customer.name; }
    if (order.client_name) { return order.client_name; }
    return 'Customer';
  };

  const getOrderNumber = order => {
    if (order.order_no) { return order.order_no; }
    if (order.order_number) { return order.order_number; }
    if (order.id) { return `#${order.id.toString().substring(0, 8)}`; }
    if (order._id) { return `#${order._id.toString().substring(0, 8)}`; }
    return '#N/A';
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete?.id) return;

    try {
      setDeleteLoading(true);
      await deleteOrder({order_id: orderToDelete.id});
      Alert.alert('Success', 'Order deleted successfully');
      setDeleteModalVisible(false);
      fetchOrders(); // Refresh list
    } catch (error) {
      console.error('Delete failed:', error);
      Alert.alert('Error', 'Failed to delete order. Please try again.');
    } finally {
      setDeleteLoading(false);
      setOrderToDelete(null);
    }
  };

  const getOrderStatus = order => {
    if (order.status) return order.status;
    if (order.order_status) return order.order_status;
    return 'pending';
  };

  // Render order item
  const renderOrderItem = ({item: order}) => {
    const orderStatus = getOrderStatus(order);
    const statusColor = getStatusColor(orderStatus);
    const paymentColor = getPaymentStatusColor(order.payment_status);
    const paymentStatusText = getPaymentStatusText(order.payment_status);
    const orderTotal = getOrderTotal(order);
    const customerName = getCustomerName(order);
    const orderNumber = getOrderNumber(order);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() =>
          navigation.navigate('OrderDetailScreen', {
            orderId: order._id || order.id,
          })
        }
        activeOpacity={0.7}>
        {/* Card Header with Order Info and Action Buttons */}
        <View style={styles.cardHeader}>
          <View style={styles.leftSection}>
            {/* Order Status Icon */}
            <View
              style={[
                styles.orderStatusIcon,
                {backgroundColor: statusColor + '20'},
              ]}>
              <Package color={statusColor} size={20} />
            </View>

            {/* Order Number and Customer */}
            <View style={styles.orderBasicInfo}>
              <Text style={styles.orderNumber}>{orderNumber}</Text>
              <Text style={styles.customerName}>{customerName}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                navigation.navigate('OrderDetailScreen', {
                  orderId: order._id || order.id,
                })
              }>
              <Edit color={colors.text} size={16} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => {
                setOrderToDelete({
                  id: order._id || order.id,
                  number: getOrderNumber(order),
                });
                setDeleteModalVisible(true);
              }}>
              <Trash2 color="#F44336" size={16} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Order Details */}
        <View style={styles.orderInfo}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderAmount}>{formatCurrency(orderTotal)}</Text>
            <View style={styles.badgesContainer}>
              <View
                style={[
                  styles.statusBadge,
                  {backgroundColor: statusColor + '20'},
                ]}>
                <Text style={[styles.statusBadgeText, {color: statusColor}]}>
                  {orderStatus.toUpperCase()}
                </Text>
              </View>
              {order.payment_status !== undefined && (
                <View
                  style={[
                    styles.statusBadge,
                    {backgroundColor: paymentColor + '20'},
                  ]}>
                  <Text style={[styles.statusBadgeText, {color: paymentColor}]}>
                    {paymentStatusText}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.orderDetail}>
            <Calendar color={colors.textSecondary} size={12} />
            <Text style={styles.detailText}>
              {formatDate(
                order.createdAt || order.placed_at || order.created_at,
              )}
            </Text>
          </View>

          <View style={styles.orderDetail}>
            <ShoppingBag color={colors.textSecondary} size={12} />
            <Text style={styles.detailText}>
              {order.products?.length ||
                order.items?.length ||
                order.order_items?.length ||
                0}{' '}
              items
            </Text>
          </View>

          <View style={styles.orderMeta}>
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() =>
                navigation.navigate('OrderDetailScreen', {
                  orderId: order._id || order.id,
                })
              }>
              <Eye color={colors.background} size={16} />
              <Text style={styles.viewButtonText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => handleQuickAction(order)}>
              <MoreVertical color={colors.text} size={16} />
              <Text style={styles.quickActionButtonText}>Actions</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Orders</Text>
        <Text style={styles.headerSubtitle}>
          {filteredOrders.length} orders
        </Text>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search color={colors.textSecondary} size={16} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
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
            Showing {filteredOrders.length} {selectedFilter} orders
          </Text>
          <TouchableOpacity onPress={() => handleFilterChange('all')}>
            <Text style={styles.clearFiltersText}>Show All</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={(item, index) => item._id || item.id || index.toString()}
        contentContainerStyle={styles.ordersList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <OrderListEmpty query={searchQuery} navigation={navigation} />
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
        selectedOrder={selectedOrder}
        onUpdateStatus={updateOrderStatus}
        onMarkAsPaid={markOrderAsPaid}
        onMarkAsDelivered={markOrderAsDelivered}
        navigation={navigation}
      />

      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onClose={() => {
          setDeleteModalVisible(false);
          setOrderToDelete(null);
        }}
        onConfirm={confirmDeleteOrder}
        itemType="Order"
        itemName={orderToDelete?.number || ''}
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
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 4,
    fontFamily: fonts.regular,
  },

  // Search and Filter
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    gap: 12,
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

  // Orders List
  ordersList: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  orderCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },

  // Card Header with Order Info and Actions
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
  orderStatusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderBasicInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 2,
  },
  customerName: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Action Buttons - Now positioned at top right
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

  // Order Info
  orderInfo: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderAmount: {
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
  orderDetail: {
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
  orderMeta: {
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
  orderSummary: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  orderSummaryText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  orderSummaryAmount: {
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

export default OrdersScreen;
