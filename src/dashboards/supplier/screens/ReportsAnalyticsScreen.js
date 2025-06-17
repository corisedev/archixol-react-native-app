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
  Dimensions,
} from 'react-native';
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  Download,
  Eye,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {
  generateReport,
  getDashboardAnalytics,
  getBusinessMetrics,
} from '../../../api/serviceSupplier';
import {useNavigation} from '@react-navigation/native';

const {width} = Dimensions.get('window');

const ReportsAnalyticsScreen = () => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [reports, setReports] = useState([]);
  const [analytics, setAnalytics] = useState({
    avg_order_value: 4250,
    conversion_rate: '3.2',
    total_visitors: '12.5K',
    sales_chart: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
      data: [20, 45, 28, 80, 99],
    },
  });
  const [metrics, setMetrics] = useState({
    total_revenue: 125000,
    revenue_change: 12.5,
    total_orders: 1250,
    orders_change: -2.3,
    active_products: 850,
    products_change: 5.7,
    total_customers: 2850,
    customers_change: 8.2,
  });
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const navigation = useNavigation();

  // Sample reports data matching your website structure
  const sampleReports = React.useMemo(
    () => [
      {
        name: 'Sales Overview',
        table_name: 'sales_overview',
        icon: TrendingUp,
        description: 'Complete sales performance overview',
        color: colors.splashGreen,
      },
      {
        name: 'Sales by Product',
        table_name: 'sales_by_product',
        icon: Package,
        description: 'Product-wise sales breakdown',
        color: '#3B82F6',
      },
      {
        name: 'Sales by Customer',
        table_name: 'sales_by_customer',
        icon: Users,
        description: 'Customer purchase analytics',
        color: '#8B5CF6',
      },
      {
        name: 'Inventory Levels',
        table_name: 'inventory_levels',
        icon: BarChart3,
        description: 'Current inventory status',
        color: '#F59E0B',
      },
    ],
    [],
  );

  // Format currency
  const formatCurrency = amount => {
    return `Rs ${new Intl.NumberFormat('en-PK').format(amount || 0)}`;
  };

  // Format number
  const formatNumber = num => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num?.toString() || '0';
  };

  // Fetch data - simplified without API calls for now
  const fetchData = useCallback(async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      setReports(sampleReports);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      Alert.alert('Error', 'Unable to load analytics data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing, sampleReports]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
  }, [fetchData]);

  // Handle report view
  const handleViewReport = async report => {
    try {
      setLoading(true);

      // Simulate report generation
      const sampleReportData = {
        summary: {
          total_sales: 125000,
          total_orders: 1250,
        },
        chart_data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
          values: [20, 45, 28, 80, 99],
        },
        products: [
          {product_name: 'Product A', quantity_sold: 150, total_revenue: 45000},
          {product_name: 'Product B', quantity_sold: 120, total_revenue: 36000},
        ],
        customers: [
          {customer_name: 'John Doe', orders_count: 15, total_spent: 25000},
          {customer_name: 'Jane Smith', orders_count: 12, total_spent: 20000},
        ],
        inventory: [
          {product_name: 'Product A', current_stock: 150, status: 'In Stock'},
          {product_name: 'Product B', current_stock: 5, status: 'Low Stock'},
        ],
      };

      // You can uncomment this when API is ready
      // const reportData = await generateReport({
      //   table_name: report.table_name,
      //   period: selectedPeriod,
      // });

      navigation.navigate('ReportDetailScreen', {
        report: report,
        data: sampleReportData,
        period: selectedPeriod,
      });
    } catch (error) {
      console.error('Failed to generate report:', error);
      Alert.alert('Error', 'Failed to load report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Period selector
  const PeriodSelector = () => (
    <View style={styles.periodSelector}>
      {[
        {key: 'today', label: 'Today'},
        {key: 'week', label: 'Week'},
        {key: 'month', label: 'Month'},
        {key: 'year', label: 'Year'},
      ].map(period => (
        <TouchableOpacity
          key={period.key}
          style={[
            styles.periodButton,
            selectedPeriod === period.key && styles.periodButtonActive,
          ]}
          onPress={() => setSelectedPeriod(period.key)}>
          <Text
            style={[
              styles.periodButtonText,
              selectedPeriod === period.key && styles.periodButtonTextActive,
            ]}>
            {period.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Metrics card
  const MetricCard = ({title, value, change, icon: Icon, color}) => (
    <View style={styles.metricCard}>
      <View style={styles.metricHeader}>
        <View style={[styles.metricIcon, {backgroundColor: color + '20'}]}>
          <Icon color={color} size={20} />
        </View>
        {change !== undefined && (
          <View style={styles.changeContainer}>
            {change > 0 ? (
              <TrendingUp color={colors.splashGreen} size={16} />
            ) : (
              <TrendingDown color="#F87171" size={16} />
            )}
            <Text
              style={[
                styles.changeText,
                {color: change > 0 ? colors.splashGreen : '#F87171'},
              ]}>
              {Math.abs(change)}%
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
    </View>
  );

  // Report item
  const ReportItem = ({item}) => (
    <TouchableOpacity
      style={styles.reportItem}
      onPress={() => handleViewReport(item)}
      activeOpacity={0.7}>
      <View style={styles.reportItemHeader}>
        <View style={[styles.reportIcon, {backgroundColor: item.color + '20'}]}>
          <item.icon color={item.color} size={24} />
        </View>
        <TouchableOpacity style={styles.reportActionButton}>
          <Eye color={colors.textSecondary} size={16} />
        </TouchableOpacity>
      </View>
      <Text style={styles.reportItemTitle}>{item.name}</Text>
      <Text style={styles.reportItemDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  // Simple Sales Chart (without external library for now)
  const SalesChart = () => {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Sales Trend</Text>
        <View style={styles.chartPlaceholder}>
          <BarChart3 color={colors.splashGreen} size={48} />
          <Text style={styles.chartPlaceholderText}>
            Chart will be displayed here
          </Text>
          <Text style={styles.chartSubtext}>
            Install react-native-chart-kit for charts
          </Text>
        </View>
      </View>
    );
  };

  // Loading state
  if (loading && !analytics) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Reports & Analytics</Text>
          <Text style={styles.headerSubtitle}>Business insights and data</Text>
        </View>

        <TouchableOpacity style={styles.headerButton}>
          <Download color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Period Selector */}
        <PeriodSelector />

        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(metrics.total_revenue)}
              change={metrics.revenue_change}
              icon={DollarSign}
              color={colors.splashGreen}
            />
            <MetricCard
              title="Total Orders"
              value={formatNumber(metrics.total_orders)}
              change={metrics.orders_change}
              icon={ShoppingCart}
              color="#3B82F6"
            />
            <MetricCard
              title="Active Products"
              value={formatNumber(metrics.active_products)}
              change={metrics.products_change}
              icon={Package}
              color="#8B5CF6"
            />
            <MetricCard
              title="Total Customers"
              value={formatNumber(metrics.total_customers)}
              change={metrics.customers_change}
              icon={Users}
              color="#F59E0B"
            />
          </View>
        </View>

        {/* Sales Chart */}
        <View style={styles.section}>
          <SalesChart />
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatCurrency(analytics.avg_order_value)}
              </Text>
              <Text style={styles.statLabel}>Avg Order Value</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{analytics.conversion_rate}%</Text>
              <Text style={styles.statLabel}>Conversion Rate</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{analytics.total_visitors}</Text>
              <Text style={styles.statLabel}>Visitors</Text>
            </View>
          </View>
        </View>

        {/* Available Reports */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Reports</Text>
          <FlatList
            data={reports}
            renderItem={({item}) => <ReportItem item={item} />}
            keyExtractor={item => item.table_name}
            numColumns={2}
            columnWrapperStyle={styles.reportsRow}
            scrollEnabled={false}
          />
        </View>

        <View style={{height: 20}} />
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
  headerContent: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 2,
  },

  // Content
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 16,
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: colors.splashGreen,
  },
  periodButtonText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  periodButtonTextActive: {
    color: colors.background,
    fontFamily: fonts.semiBold,
  },

  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: (width - 44) / 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
  },
  metricValue: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  metricTitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Chart
  chartContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  chartTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 16,
  },
  chartPlaceholder: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  chartPlaceholderText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 8,
  },
  chartSubtext: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 4,
  },

  // Stats
  statsContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },

  // Reports
  reportsRow: {
    justifyContent: 'space-between',
  },
  reportItem: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  reportItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportItemTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 6,
  },
  reportItemDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    lineHeight: 18,
  },
});

export default ReportsAnalyticsScreen;
