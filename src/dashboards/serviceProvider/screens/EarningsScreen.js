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
  Dimensions,
} from 'react-native';
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ShoppingCart,
  Percent,
  ChartLine,
  Wallet,
  Clock,
  Eye,
  Download,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {getAnalytics, getOrderStatistics} from '../../../api/serviceSupplier';
import {useNavigation} from '@react-navigation/native';

const {width: screenWidth} = Dimensions.get('window');

const EarningsScreen = () => {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [earningsData, setEarningsData] = useState({
    available: {
      value: 0,
      monthly: 0,
    },
    pending: {
      value: 0,
      payment: 0,
    },
    total: {
      value: 0,
      percent: 0,
    },
  });
  const [statsData, setStatsData] = useState({
    averageOrderValue: 0,
    conversionRate: 0,
    monthlyGrowth: 0,
    totalOrders: 0,
    completedProjects: 0,
    averageRating: 0,
  });

  // Format currency helper
  const formatCurrency = amount => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Format percentage helper
  const formatPercentage = value => {
    return `${(value || 0).toFixed(1)}%`;
  };

  // Fetch earnings data
  const fetchEarningsData = useCallback(async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      // Fetch analytics and order statistics
      const [analyticsResponse, statsResponse] = await Promise.all([
        getAnalytics({period: 'month'}),
        getOrderStatistics(),
      ]);

      console.log('Analytics Response:', analyticsResponse);
      console.log('Stats Response:', statsResponse);

      // Process earnings data
      const totalEarnings = statsResponse.total_earnings || 0;
      const thisMonthEarnings = statsResponse.this_month_earnings || 0;
      const lastMonthEarnings = statsResponse.last_month_earnings || 0;
      const earningsGrowth = statsResponse.earnings_growth || 0;

      setEarningsData({
        available: {
          value: totalEarnings * 0.8, // Assuming 80% is available
          monthly: thisMonthEarnings,
        },
        pending: {
          value: totalEarnings * 0.2, // Assuming 20% is pending
          payment: totalEarnings * 0.1, // Assuming 10% in processing
        },
        total: {
          value: totalEarnings,
          percent: earningsGrowth,
        },
      });

      // Process stats data
      const avgOrderValue =
        totalEarnings / Math.max(statsResponse.total_projects || 1, 1);

      setStatsData({
        averageOrderValue: avgOrderValue,
        conversionRate: 29, // Placeholder - would come from API
        monthlyGrowth: earningsGrowth,
        totalOrders: statsResponse.total_projects || 0,
        completedProjects: statsResponse.completed_projects || 0,
        averageRating: statsResponse.average_rating || 0,
      });
    } catch (error) {
      console.error('Failed to load earnings data:', error);
      Alert.alert('Error', 'Unable to load earnings data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchEarningsData();
  }, [fetchEarningsData]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEarningsData();
  }, [fetchEarningsData]);

  // Handle withdraw funds
  const handleWithdrawFunds = () => {
    Alert.alert(
      'Withdraw Funds',
      'Withdrawal functionality will be available soon.',
      [{text: 'OK', style: 'default'}],
    );
  };

  // Handle view details
  const handleViewDetails = () => {
    Alert.alert(
      'View Details',
      'Detailed earnings breakdown will be available soon.',
      [{text: 'OK', style: 'default'}],
    );
  };

  // Handle download report
  const handleDownloadReport = () => {
    Alert.alert(
      'Download Report',
      'Earnings report download will be available soon.',
      [{text: 'OK', style: 'default'}],
    );
  };

  // Render earnings card
  const renderEarningsCard = () => {
    return (
      <View style={styles.earningsCard}>
        {/* Available Balance */}
        <View style={styles.earningsSection}>
          <Text style={styles.earningsSectionTitle}>Available Balance</Text>
          <Text style={styles.earningsAmount}>
            {formatCurrency(earningsData.available.value)}
          </Text>
          <View style={styles.earningsInfo}>
            <ArrowUp color={colors.splashGreen} size={16} />
            <Text style={styles.earningsInfoText}>
              {formatCurrency(earningsData.available.monthly)} this month
            </Text>
          </View>
          <TouchableOpacity
            style={styles.earningsAction}
            onPress={handleWithdrawFunds}>
            <Text style={styles.earningsActionText}>Withdraw Funds</Text>
            <ChevronRight color={colors.splashGreen} size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.earningsDivider} />

        {/* Pending Earnings */}
        <View style={styles.earningsSection}>
          <Text style={styles.earningsSectionTitle}>Pending Earnings</Text>
          <Text style={styles.earningsAmount}>
            {formatCurrency(earningsData.pending.value)}
          </Text>
          <View style={styles.earningsInfo}>
            <Clock color={colors.textSecondary} size={16} />
            <Text style={styles.earningsInfoText}>
              {formatCurrency(earningsData.pending.payment)} processing
            </Text>
          </View>
          <TouchableOpacity
            style={styles.earningsAction}
            onPress={handleViewDetails}>
            <Text style={styles.earningsActionText}>View Details</Text>
            <ChevronRight color={colors.splashGreen} size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.earningsDivider} />

        {/* Total Earnings */}
        <View style={styles.earningsSection}>
          <Text style={styles.earningsSectionTitle}>Total Earnings</Text>
          <Text style={styles.earningsAmount}>
            {formatCurrency(earningsData.total.value)}
          </Text>
          <View style={styles.earningsInfo}>
            {earningsData.total.percent >= 0 ? (
              <TrendingUp color={colors.splashGreen} size={16} />
            ) : (
              <TrendingDown color="#F44336" size={16} />
            )}
            <Text style={styles.earningsInfoText}>
              {formatPercentage(Math.abs(earningsData.total.percent))} from last
              year
            </Text>
          </View>
          <TouchableOpacity
            style={styles.earningsAction}
            onPress={handleDownloadReport}>
            <Text style={styles.earningsActionText}>Download Report</Text>
            <ChevronRight color={colors.splashGreen} size={16} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render stats card
  const renderStatsCard = (
    icon,
    title,
    value,
    trend,
    suffix = '',
    iconColor = colors.splashGreen,
  ) => {
    const isPositive = trend >= 0;

    return (
      <View style={styles.statsCard}>
        <View style={styles.statsHeader}>
          <View style={[styles.statsIcon, {backgroundColor: iconColor + '20'}]}>
            {icon}
          </View>
          <View style={styles.statsTrend}>
            {isPositive ? (
              <TrendingUp color={colors.splashGreen} size={14} />
            ) : (
              <TrendingDown color="#F44336" size={14} />
            )}
            <Text
              style={[
                styles.statsTrendText,
                {color: isPositive ? colors.splashGreen : '#F44336'},
              ]}>
              {formatPercentage(Math.abs(trend))}
            </Text>
          </View>
        </View>

        <Text style={styles.statsTitle}>{title}</Text>

        <Text style={styles.statsValue}>
          {typeof value === 'number' && title.includes('Value')
            ? formatCurrency(value)
            : `${value}${suffix}`}
        </Text>
      </View>
    );
  };

  // Loading state
  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading earnings data...</Text>
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
          <Text style={styles.headerTitle}>Earnings</Text>
          <Text style={styles.headerSubtitle}>Manage your earnings</Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleDownloadReport}>
          <Download color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.contentContainer}>
          {/* Earnings Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Earnings Overview</Text>
            {renderEarningsCard()}
          </View>

          {/* Performance Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Statistics</Text>

            <View style={styles.statsGrid}>
              {renderStatsCard(
                <ShoppingCart color="#8B5CF6" size={20} />,
                'Average Order Value',
                statsData.averageOrderValue,
                33,
                '',
                '#8B5CF6',
              )}

              {renderStatsCard(
                <Percent color="#3B82F6" size={20} />,
                'Conversion Rate',
                statsData.conversionRate,
                12,
                '%',
                '#3B82F6',
              )}

              {renderStatsCard(
                <ChartLine color={colors.splashGreen} size={20} />,
                'Monthly Growth',
                statsData.monthlyGrowth,
                2.1,
                '%',
                colors.splashGreen,
              )}

              {renderStatsCard(
                <Wallet color="#F59E0B" size={20} />,
                'Total Orders',
                statsData.totalOrders,
                15,
                '',
                '#F59E0B',
              )}

              {renderStatsCard(
                <Eye color="#10B981" size={20} />,
                'Completed Projects',
                statsData.completedProjects,
                8,
                '',
                '#10B981',
              )}

              {renderStatsCard(
                <TrendingUp color="#EF4444" size={20} />,
                'Average Rating',
                statsData.averageRating,
                5,
                '⭐',
                '#EF4444',
              )}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>

            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleWithdrawFunds}>
                <Wallet color={colors.splashGreen} size={24} />
                <Text style={styles.actionButtonText}>Withdraw Funds</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleViewDetails}>
                <Eye color={colors.splashGreen} size={24} />
                <Text style={styles.actionButtonText}>View Details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDownloadReport}>
                <Download color={colors.splashGreen} size={24} />
                <Text style={styles.actionButtonText}>Download Report</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </View>
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
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

  // Earnings Card
  earningsCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  earningsSection: {
    paddingVertical: 8,
  },
  earningsDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
  earningsSectionTitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 8,
  },
  earningsAmount: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  earningsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  earningsInfoText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  earningsAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earningsActionText: {
    fontSize: fontSizes.base,
    color: colors.splashGreen,
    fontFamily: fonts.medium,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  statsCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    width: (screenWidth - 44) / 2, // Two cards per row with margins
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 12,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statsTrendText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.medium,
  },
  statsTitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 8,
  },
  statsValue: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  // Quick Actions
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    gap: 8,
  },
  actionButtonText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },

  bottomSpacing: {
    height: 20,
  },
});

export default EarningsScreen;
