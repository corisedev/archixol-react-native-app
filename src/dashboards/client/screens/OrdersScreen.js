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
  FlatList,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {getOrders} from '../../../api/client';
import {useNavigation} from '@react-navigation/native';
import {useContext} from 'react';
import {BackendContext} from '../../../context/BackendContext';

// Lucide React Native Icons
import {
  Package,
  ShoppingCart,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Calendar,
  DollarSign,
  Eye,
  Filter,
  Search,
  AlertCircle,
} from 'lucide-react-native';

const OrdersScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Order statistics
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);

  const navigation = useNavigation();
  const {backendUrl} = useContext(BackendContext);

  // Filter options
  const filterOptions = [
    {key: 'all', label: 'All Orders', icon: Package},
    {key: 'pending', label: 'Pending', icon: Clock},
    {key: 'completed', label: 'Completed', icon: CheckCircle},
    {key: 'delivered', label: 'Delivered', icon: Truck},
    {key: 'cancelled', label: 'Cancelled', icon: XCircle},
  ];

  // Fetch orders data
  const fetchOrders = useCallback(async () => {
    try {
      const response = await getOrders();
      console.log('Orders API Response:', response);
      
      let ordersData = [];
      if (response?.orders_list && Array.isArray(response.orders_list)) {
        ordersData = response.orders_list;
      } else if (response?.orders && Array.isArray(response.orders)) {
        ordersData = response.orders;
      } else if (response?.data && Array.isArray(response.data)) {
        ordersData = response.data;
      } else if (Array.isArray(response)) {
        ordersData = response;
      }

      setOrders(ordersData);
      setFilteredOrders(ordersData);
      calculateStatistics(ordersData);
      
      // Set additional statistics from API response if available
      if (response?.total_orders) {
        setTotalOrders(response.total_orders);
      }
      if (response?.total_spent) {
        setTotalSpent(response.total_spent);
      }
      if (response?.pending_payments) {
        setPendingOrders(response.pending_payments);
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      Alert.alert('Error', 'Unable to load orders. Please try again.');
    }
  }, []);

  // Calculate order statistics
  const calculateStatistics = useCallback((ordersData) => {
    const total = ordersData.length;
    const totalAmount = ordersData.reduce((sum, order) => sum + (order.total || order.total_amount || order.subtotal || 0), 0);
    const pending = ordersData.filter(order => order.status?.toLowerCase() === 'pending').length;
    const completed = ordersData.filter(order => 
      ['completed', 'delivered'].includes(order.status?.toLowerCase())
    ).length;

    // Only update if not already set from API response
    if (totalOrders === 0) setTotalOrders(total);
    if (totalSpent === 0) setTotalSpent(totalAmount);
    setPendingOrders(pending);
    setCompletedOrders(completed);
  }, [totalOrders, totalSpent]);

  // Filter orders based on selected filter and search query
  const filterOrders = useCallback(() => {
    let filtered = orders;

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(order => 
        order.status?.toLowerCase() === selectedFilter.toLowerCase()
      );
    }

  // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        (order.order_no?.toLowerCase() || '').includes(query) ||
        (order.order_number?.toLowerCase() || '').includes(query) ||
        (order.supplier_name?.toLowerCase() || '').includes(query) ||
        (order.order_id?.toLowerCase() || '').includes(query) ||
        (order._id?.toLowerCase() || '').includes(query)
      );
    }

    setFilteredOrders(filtered);
  }, [orders, selectedFilter, searchQuery]);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchOrders();
      setLoading(false);
    };
    loadData();
  }, [fetchOrders]);

  // Apply filters when dependencies change
  useEffect(() => {
    filterOrders();
  }, [filterOrders]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  // Format currency
  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `PKR ${amount.toLocaleString()}`;
    }
    return `PKR ${amount || '0'}`;
  };

  // Get status color
  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return colors.splashGreen;
      case 'pending':
      case 'processing':
        return '#F59E0B';
      case 'cancelled':
      case 'rejected':
        return '#EF4444';
      case 'shipped':
        return '#3B82F6';
      default:
        return colors.textSecondary;
    }
  };

  // Get status icon
  const getStatusIcon = status => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return CheckCircle;
      case 'pending':
      case 'processing':
        return Clock;
      case 'cancelled':
      case 'rejected':
        return XCircle;
      case 'shipped':
        return Truck;
      default:
        return Package;
    }
  };

  // Format date helper
  const formatDate = dateString => {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  // Navigate to order details
  const navigateToOrderDetails = order => {
    navigation.navigate('OrderDetailScreen', {
      orderId: order.order_id || order._id || order.id,
      order: order,
    });
  };

  // Render order item
  const renderOrderItem = ({item: order}) => {
    const StatusIcon = getStatusIcon(order.status);
    const statusColor = getStatusColor(order.status);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigateToOrderDetails(order)}
        activeOpacity={0.7}>
        <View style={styles.orderHeader}>
          <View style={styles.orderTitleSection}>
            <View style={styles.orderIdContainer}>
              <Package color={colors.splashGreen} size={18} />
              <Text style={styles.orderTitle} numberOfLines={1}>
                Order #{order.order_no || order.order_number || order.order_id?.substring(0, 8)}
              </Text>
            </View>
            <View style={styles.orderStatusContainer}>
              <StatusIcon color={statusColor} size={16} />
              <Text style={[styles.orderStatusText, {color: statusColor}]}>
                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => navigateToOrderDetails(order)}>
            <Eye color={colors.splashGreen} size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.orderDetailRow}>
            <Text style={styles.orderDetailLabel}>Supplier:</Text>
            <Text style={styles.orderDetailValue} numberOfLines={1}>
              {order.supplier_name || 'Unknown Supplier'}
            </Text>
          </View>
          
          <View style={styles.orderDetailRow}>
            <Text style={styles.orderDetailLabel}>Items:</Text>
            <Text style={styles.orderDetailValue}>
              {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
            </Text>
          </View>

          <View style={styles.orderDetailRow}>
            <Text style={styles.orderDetailLabel}>Date:</Text>
            <Text style={styles.orderDetailValue}>
              {formatDate(order.created_at || order.placed_at)}
            </Text>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.orderAmountContainer}>
            <DollarSign color={colors.splashGreen} size={16} />
            <Text style={styles.orderAmount}>
              {formatCurrency(order.total || order.total_amount || 0)}
            </Text>
          </View>
          
          {order.items && order.items.length > 0 && (
            <Text style={styles.itemsPreview} numberOfLines={1}>
              {order.items.map(item => item.name || item.title).join(', ')}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render filter button
  const renderFilterButton = ({item: filter}) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter.key && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedFilter(filter.key)}>
      <filter.icon
        color={selectedFilter === filter.key ? colors.background : colors.splashGreen}
        size={16}
      />
      <Text
        style={[
          styles.filterButtonText,
          selectedFilter === filter.key && styles.filterButtonTextActive,
        ]}>
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

  // Statistics data
  const statsData = [
    {
      title: 'Total Orders',
      value: totalOrders.toString(),
      icon: ShoppingCart,
      color: colors.splashGreen,
    },
    {
      title: 'Total Spent',
      value: formatCurrency(totalSpent),
      icon: DollarSign,
      color: '#3B82F6',
    },
    {
      title: 'Pending',
      value: pendingOrders.toString(),
      icon: Clock,
      color: '#F59E0B',
    },
    {
      title: 'Completed',
      value: completedOrders.toString(),
      icon: CheckCircle,
      color: colors.splashGreen,
    },
  ];

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
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Orders</Text>
          <TouchableOpacity style={styles.searchButton}>
            <Search color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>
        
        {/* Statistics Cards */}
        <View style={styles.statsContainer}>
          {statsData.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIconContainer, {backgroundColor: stat.color + '20'}]}>
                <stat.icon color={stat.color} size={18} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>

        {/* Filter Buttons */}
        <View style={styles.filtersSection}>
          <FlatList
            data={filterOptions}
            renderItem={renderFilterButton}
            keyExtractor={item => item.key}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContainer}
          />
        </View>

        {/* Orders List */}
        <View style={styles.ordersSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedFilter === 'all' ? 'All Orders' : `${selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)} Orders`}
            </Text>
            <Text style={styles.ordersCount}>
              {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
            </Text>
          </View>

          {filteredOrders.length > 0 ? (
            filteredOrders.map((order, index) => {
              const StatusIcon = getStatusIcon(order.status);
              const statusColor = getStatusColor(order.status);
              
              return (
                <TouchableOpacity
                  key={order.order_id || order._id || order.id || order.order_no || index}
                  style={styles.orderCard}
                  onPress={() => navigateToOrderDetails(order)}
                  activeOpacity={0.7}>
                  <View style={styles.orderHeader}>
                    <View style={styles.orderTitleSection}>
                      <View style={styles.orderIdContainer}>
                        <Package color={colors.splashGreen} size={18} />
                        <Text style={styles.orderTitle} numberOfLines={1}>
                          Order #{order.order_no || order.order_number || order.order_id?.substring(0, 8)}
                        </Text>
                      </View>
                      <View style={styles.orderStatusContainer}>
                        <StatusIcon color={statusColor} size={16} />
                        <Text style={[styles.orderStatusText, {color: statusColor}]}>
                          {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() => navigateToOrderDetails(order)}>
                      <Eye color={colors.splashGreen} size={16} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.orderDetails}>
                    <View style={styles.orderDetailRow}>
                      <Text style={styles.orderDetailLabel}>Supplier:</Text>
                      <Text style={styles.orderDetailValue} numberOfLines={1}>
                        {order.supplier_name || 'Unknown Supplier'}
                      </Text>
                    </View>
                    
                    <View style={styles.orderDetailRow}>
                      <Text style={styles.orderDetailLabel}>Items:</Text>
                      <Text style={styles.orderDetailValue}>
                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                      </Text>
                    </View>

                    <View style={styles.orderDetailRow}>
                      <Text style={styles.orderDetailLabel}>Date:</Text>
                      <Text style={styles.orderDetailValue}>
                        {formatDate(order.created_at || order.placed_at)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.orderFooter}>
                    <View style={styles.orderAmountContainer}>
                      <DollarSign color={colors.splashGreen} size={16} />
                      <Text style={styles.orderAmount}>
                        {formatCurrency(order.total || order.total_amount || 0)}
                      </Text>
                    </View>
                    
                    {order.items && order.items.length > 0 && (
                      <Text style={styles.itemsPreview} numberOfLines={1}>
                        {order.items.map(item => item.name || item.title).join(', ')}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <AlertCircle color={colors.textSecondary} size={48} />
              <Text style={styles.emptyStateTitle}>No Orders Found</Text>
              <Text style={styles.emptyStateDescription}>
                {selectedFilter === 'all' 
                  ? "You haven't placed any orders yet" 
                  : `No ${selectedFilter} orders found`}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Header Styles - Not sticky anymore
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.bold,
    color: colors.text,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Statistics Styles - Better spacing
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 110,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 6,
  },
  statTitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },

  // Filters Styles
  filtersSection: {
    marginBottom: 20,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.splashGreen,
    gap: 8,
    minHeight: 45,
  },
  filterButtonActive: {
    backgroundColor: colors.splashGreen,
  },
  filterButtonText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.splashGreen,
  },
  filterButtonTextActive: {
    color: colors.background,
  },

  // Orders Section Styles
  ordersSection: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  ordersCount: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  // Order Card Styles - Better spacing
  orderCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderTitleSection: {
    flex: 1,
    gap: 8,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    flex: 1,
  },
  orderStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderStatusText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
  },
  viewButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Order Details Styles
  orderDetails: {
    gap: 8,
    marginBottom: 12,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDetailLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    flex: 1,
  },
  orderDetailValue: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.medium,
    flex: 2,
    textAlign: 'right',
  },

  // Order Footer Styles
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
    gap: 8,
  },
  orderAmountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderAmount: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.splashGreen,
  },
  itemsPreview: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontStyle: 'italic',
  },

  // Empty State Styles
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default OrdersScreen;