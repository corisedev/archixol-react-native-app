import {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {
  getSupplierDashboard,
  getSupplierGlobalData,
  getAllOrders,
  getAllCustomers,
} from '../../../api/serviceSupplier';
import {useNavigation} from '@react-navigation/native';

// Import your icons here
import EarningsIcon from '../../../assets/images/icons/earnings.png';
import OrdersIcon from '../../../assets/images/icons/activity-check.png';
import AnalyticsIcon from '../../../assets/images/icons/analytics.png';
import UsersIcon from '../../../assets/images/icons/profile.png';
import {BarChart3, Boxes, PlusSquare, Users} from 'lucide-react-native';

const HomeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [, setDashboardData] = useState(null);
  const [globalData, setGlobalData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [totalClients, setTotalClients] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [salesChartData, setSalesChartData] = useState([]);

  const navigation = useNavigation();

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await getSupplierDashboard();
      console.log('Supplier Dashboard API Response:', response);
      setDashboardData(response.dashboard_data || response);

      // Extract key metrics from response
      const data = response.dashboard_data || response;
      setTotalSales(data.total_sale || 0);
      setTotalOrders(data.orders_count || 0);

      // Calculate conversion rate
      const conversion =
        data.orders_count > 0
          ? (
              ((data.orders_count - data.orders_unfullfilled) /
                data.orders_count) *
              100
            ).toFixed(1)
          : 0;
      setConversionRate(conversion);

      // Set sales chart data
      if (data.sales_data && Array.isArray(data.sales_data)) {
        setSalesChartData(data.sales_data);
      }

      // Count low stock items
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      Alert.alert('Error', 'Unable to load dashboard data. Please try again.');
    }
  }, []);

  // Fetch global data
  const fetchGlobalData = useCallback(async () => {
    try {
      const response = await getSupplierGlobalData();
      console.log('Global Data API Response:', response);
      setGlobalData(response);
    } catch (error) {
      console.error('Failed to load global data:', error);
    }
  }, []);

  // Fetch customers count
  const fetchCustomersCount = useCallback(async () => {
    try {
      const response = await getAllCustomers({page: 1, limit: 1});
      if (response && response.total_customers) {
        setTotalClients(response.total_customers);
      } else if (response && response.customers) {
        setTotalClients(response.customers.length);
      }
    } catch (error) {
      console.error('Failed to load customers count:', error);
    }
  }, []);

  // Fetch recent orders
  const fetchRecentOrders = useCallback(async () => {
    try {
      const response = await getAllOrders({
        page: 1,
        limit: 5,
        sort_by: 'createdAt',
        sort_order: 'desc',
      });

      console.log('Recent Orders API Response:', response);

      let orders = [];

      if (response?.orders && Array.isArray(response.orders)) {
        orders = response.orders;
      } else if (response?.order_list && Array.isArray(response.order_list)) {
        orders = response.order_list;
      }

      // Sort by createdAt (or placed_at) descending
      const sorted = orders.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.placed_at);
        const dateB = new Date(b.createdAt || b.placed_at);
        return dateB - dateA; // Descending
      });

      setRecentOrders(sorted);
    } catch (error) {
      console.error('Failed to load recent orders:', error);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboardData(),
        fetchGlobalData(),
        fetchRecentOrders(),
        fetchCustomersCount(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [
    fetchDashboardData,
    fetchGlobalData,
    fetchRecentOrders,
    fetchCustomersCount,
  ]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      fetchGlobalData(),
      fetchRecentOrders(),
      fetchCustomersCount(),
    ]);
    setRefreshing(false);
  }, [
    fetchDashboardData,
    fetchGlobalData,
    fetchRecentOrders,
    fetchCustomersCount,
  ]);

  // Format currency
  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `PKR ${amount.toLocaleString()}`;
    }
    return `PKR ${amount || '0'}`;
  };

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

  // Get order status color
  const getOrderStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return colors.splashGreen;
      case 'processing':
      case 'shipped':
        return colors.primary;
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

  // Render chart bars
  const renderSalesChart = () => {
    if (!salesChartData || salesChartData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>No sales data available</Text>
        </View>
      );
    }

    const maxValue = Math.max(
      ...salesChartData.map(item => item.total_sales || 0),
      1,
    );

    return (
      <View style={styles.chart}>
        {salesChartData.map((item, index) => {
          const height = Math.max(
            ((item.total_sales || 0) / maxValue) * 100,
            2,
          );
          return (
            <View key={index} style={styles.chartBarContainer}>
              <Text style={styles.chartValue}>
                {item.total_sales > 999
                  ? `${(item.total_sales / 1000).toFixed(1)}K`
                  : item.total_sales || 0}
              </Text>
              <View style={[styles.chartBar, {height: `${height}%`}]} />
              <Text style={styles.chartLabel}>
                {item.month?.substring(0, 3) || `M${index + 1}`}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  // Get store name
  const storeName = globalData?.store_data?.store_name || 'Your Store';

  // Prepare main stats data matching website
  const mainStatsData = [
    {
      title: 'Total Clients',
      value: totalClients.toString(),
      change: '0% from last month',
      changeColor: colors.splashGreen,
      icon: UsersIcon,
    },
    {
      title: 'Total Sales',
      value: formatCurrency(totalSales),
      change: '0% from last month',
      changeColor: colors.splashGreen,
      icon: EarningsIcon,
    },
    {
      title: 'Orders',
      value: totalOrders.toString(),
      change: '0% from last month',
      changeColor: colors.splashGreen,
      icon: OrdersIcon,
    },
    {
      title: 'Conversion Rate',
      value: `${conversionRate}%`,
      change: '0% from last month',
      changeColor: colors.splashGreen,
      icon: AnalyticsIcon,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}!</Text>
            <Text style={styles.userName}>{storeName}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Stats Grid - Website Style */}
      <View style={styles.mainStatsContainer}>
        {mainStatsData.map((stat, index) => (
          <View key={index} style={styles.mainStatCard}>
            <View style={styles.mainStatHeader}>
              <Text style={styles.mainStatTitle}>{stat.title}</Text>
            </View>
            <Text style={styles.mainStatValue}>{stat.value}</Text>
            <View style={styles.mainStatChange}>
              <Text style={[styles.changeText, {color: stat.changeColor}]}>
                📈 {stat.change}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Sales Chart Section - Website Style */}
      <View style={styles.chartSection}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Sales</Text>
        </View>
        <View style={styles.chartContainer}>{renderSalesChart()}</View>
      </View>

      {/* Recent Orders Section */}
      <View style={styles.ordersSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Orders</Text>
          <TouchableOpacity onPress={() => navigation.navigate('OrdersScreen')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentOrders && recentOrders.length > 0 ? (
          recentOrders.slice(0, 3).map((order, index) => (
            <TouchableOpacity
              key={order._id || index}
              style={styles.orderCard}
              onPress={() =>
                navigation.navigate('OrderDetailScreen', {
                  orderId: order._id || order.id,
                })
              }>
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderTitle} numberOfLines={1}>
                    Order #{order.order_number || order._id?.substring(0, 8)}
                  </Text>
                  <Text style={styles.orderDescription} numberOfLines={1}>
                    {order.customer_name || 'Customer'} •{' '}
                    {order.items?.length ||
                      order.products?.length ||
                      order.order_items?.length ||
                      0}{' '}
                    items
                  </Text>
                </View>
                <View style={styles.orderMeta}>
                  <Text style={styles.orderPrice}>
                    {formatCurrency(
                      order.total || order.calculations?.total || 0,
                    )}
                  </Text>
                  <View
                    style={[
                      styles.orderStatus,
                      {
                        backgroundColor:
                          getOrderStatusColor(order.status) + '20',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.orderStatusText,
                        {color: getOrderStatusColor(order.status)},
                      ]}>
                      {order.status?.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.orderFooter}>
                <Text style={styles.orderDate}>
                  {new Date(
                    order.createdAt || order.placed_at,
                  ).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>
              Orders will appear here once customers place them
            </Text>
          </View>
        )}
      </View>

      {/* Quick Actions Section */}
      <View style={styles.actionsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.actionsGrid}>
          {/* Add Product */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('AddProductScreen')}>
            <View style={styles.quickActionIcon}>
              <PlusSquare color={colors.splashGreen} size={20} />
            </View>
            <Text style={styles.quickActionTitle}>Add Product</Text>
            <Text style={styles.quickActionDescription}>
              Add new items to inventory
            </Text>
          </TouchableOpacity>

          {/* View Analytics */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('ReportsAnalyticsScreen')}>
            <View style={styles.quickActionIcon}>
              <BarChart3 color={colors.splashGreen} size={20} />
            </View>
            <Text style={styles.quickActionTitle}>View Analytics</Text>
            <Text style={styles.quickActionDescription}>
              Check detailed reports
            </Text>
          </TouchableOpacity>

          {/* Inventory */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('InventoryScreen')}>
            <View style={styles.quickActionIcon}>
              <Boxes color={colors.splashGreen} size={20} />
            </View>
            <Text style={styles.quickActionTitle}>Inventory</Text>
            <Text style={styles.quickActionDescription}>
              Manage product stock
            </Text>
          </TouchableOpacity>

          {/* Vendors */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('VendorsScreen')}>
            <View style={styles.quickActionIcon}>
              <Users color={colors.splashGreen} size={20} />
            </View>
            <Text style={styles.quickActionTitle}>Vendors</Text>
            <Text style={styles.quickActionDescription}>
              View and manage vendors
            </Text>
          </TouchableOpacity>
        </View>
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
    paddingBottom: 20,
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
    fontFamily: fonts.regular, // Added Poppins
  },

  // Header Styles
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
  greeting: {
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    fontFamily: fonts.regular, // Added Poppins
  },
  userName: {
    fontSize: fontSizes['3xl'],
    fontFamily: fonts.bold, // Changed to Poppins Bold
    color: colors.text,
    marginTop: 4,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationIcon: {
    fontSize: 20,
  },

  // Main Stats Container - Website Style
  mainStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  mainStatCard: {
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
  mainStatHeader: {
    marginBottom: 8,
  },
  mainStatTitle: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.medium, // Added Poppins Medium
  },
  mainStatValue: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.bold, // Changed to Poppins Bold
    color: colors.text,
    marginBottom: 8,
  },
  mainStatChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.medium, // Added Poppins Medium
  },

  // Chart Section - Website Style
  chartSection: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold, // Added Poppins Bold
    color: colors.text,
  },
  chartContainer: {
    height: 200,
  },
  chart: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartValue: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: 4,
    fontFamily: fonts.medium, // Added Poppins Medium
  },
  chartBar: {
    width: '70%',
    backgroundColor: colors.splashGreen,
    borderRadius: 4,
    minHeight: 8,
  },
  chartLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 8,
    fontFamily: fonts.medium, // Added Poppins Medium
  },
  emptyChart: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    color: colors.textSecondary,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular, // Added Poppins
  },

  // Orders Section
  ordersSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold, // Added Poppins Bold
    color: colors.text,
  },
  seeAllText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold, // Added Poppins SemiBold
    color: colors.splashGreen,
  },
  orderCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
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
    marginBottom: 8,
  },
  orderInfo: {
    flex: 1,
    marginRight: 12,
  },
  orderTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold, // Added Poppins SemiBold
    color: colors.text,
    marginBottom: 3,
  },
  orderDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular, // Added Poppins
  },
  orderMeta: {
    alignItems: 'flex-end',
  },
  orderPrice: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold, // Added Poppins Bold
    color: colors.splashGreen,
    marginBottom: 4,
  },
  orderStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orderStatusText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold, // Added Poppins SemiBold
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  orderDate: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular, // Added Poppins
  },

  // Quick Actions Section
  actionsSection: {
    marginTop: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '47%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionIconImage: {
    width: 20,
    height: 20,
  },
  quickActionTitle: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold, // Added Poppins SemiBold
    color: colors.text,
    marginBottom: 3,
    textAlign: 'center',
  },
  quickActionDescription: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: fonts.regular, // Added Poppins
  },

  // Empty State
  emptyCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    marginBottom: 3,
    fontFamily: fonts.medium, // Added Poppins Medium
  },
  emptySubtext: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: fonts.regular, // Added Poppins
  },
});

export default HomeScreen;
