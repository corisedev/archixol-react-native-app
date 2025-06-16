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
  Image,
  FlatList,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {getServiceProviderDashboard} from '../../../api/serviceProvider';
import {useNavigation} from '@react-navigation/native';

// Import your icons here
import JobsCompletedIcon from '../../../assets/images/icons/jobs-completed.png';
import JobsRequestedIcon from '../../../assets/images/icons/jobs-requested.png';
import EarningsIcon from '../../../assets/images/icons/earnings.png';
import PendingJobsIcon from '../../../assets/images/icons/pending-jobs.png';
import ActivityCheckIcon from '../../../assets/images/icons/activity-check.png';
import ActivityMessageIcon from '../../../assets/images/icons/messages-active.png';
import ActivityRequestIcon from '../../../assets/images/icons/activity-request.png';
import LocationIcon from '../../../assets/images/icons/location.png';

const HomeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [earningsView, setEarningsView] = useState('Week');
  const navigation = useNavigation();

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await getServiceProviderDashboard();
      console.log('Service Provider Dashboard API Response:', response);
      setDashboardData(response);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      Alert.alert('Error', 'Unable to load dashboard data. Please try again.');
    }
  }, []);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchDashboardData();
      setLoading(false);
    };
    loadData();
  }, [fetchDashboardData]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  // Format currency
  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `Rs ${amount.toLocaleString()}`;
    }
    return `Rs ${amount || '0'}`;
  };

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
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

  if (!dashboardData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{color: colors.text}}>No data available</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setLoading(true);
            fetchDashboardData().finally(() => setLoading(false));
          }}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Prepare stats data from API
  const statsData = [
    {
      icon: EarningsIcon,
      bgColor: '#E3F2FD',
      label: 'Total Earnings',
      value: formatCurrency(dashboardData.total_earnings ?? 0),
      change: `This Month`,
      changeColor: colors.primary,
    },
    {
      icon: JobsCompletedIcon,
      bgColor: '#E8F5E9',
      label: 'Jobs Completed',
      value: dashboardData.total_job_completed?.toString() ?? '0',
      change: `All Time`,
      changeColor: colors.splashGreen,
    },
    {
      icon: JobsRequestedIcon,
      bgColor: '#F3E5F5',
      label: 'Jobs Requested',
      value: dashboardData.total_job_requested?.toString() ?? '0',
      change: `Total Requests`,
      changeColor: '#9C27B0',
    },
    {
      icon: PendingJobsIcon,
      bgColor: '#FFF3E0',
      label: 'Pending Jobs',
      value: dashboardData.total_pending_jobs?.toString() ?? '0',
      change: `Need Attention`,
      changeColor: '#FF9800',
    },
  ];

  // Summary data from API
  const summaryData = [
    {
      label: 'Completion Rate',
      value: `${
        Math.round(
          (dashboardData.total_job_completed /
            Math.max(dashboardData.total_job_requested, 1)) *
            100,
        ) || 0
      }%`,
    },
    {
      label: 'Monthly Earnings',
      value: formatCurrency(dashboardData.total_earnings ?? 0),
    },
    {
      label: 'Active Jobs',
      value: dashboardData.total_pending_jobs?.toString() ?? '0',
    },
  ];

  // Chart data from API
  const chartData =
    dashboardData.graph_data?.map(item => {
      const day = new Date(item.date).toLocaleDateString('en-US', {
        weekday: 'short',
      });
      return {
        day,
        jobs: item.jobs ?? 0,
        requests: item.requests ?? 0,
      };
    }) || [];

  // Recent activity (dummy data - replace with API when available)
  const activityData = [
    {
      icon: ActivityCheckIcon,
      iconBgColor: '#E8F5E9',
      title: 'Job Completed',
      description: 'Bathroom renovation at Garden Town',
      time: '2 hours ago',
    },
    {
      icon: ActivityMessageIcon,
      iconBgColor: '#E3F2FD',
      title: 'New Message',
      description: 'Ahmed sent you a message about plumbing repair',
      time: '4 hours ago',
    },
    {
      icon: ActivityRequestIcon,
      iconBgColor: '#FFF8E1',
      title: 'New Job Request',
      description: 'Kitchen plumbing installation in DHA Phase 2',
      time: 'Yesterday',
    },
  ];

  // Available jobs (dummy data - replace with API when available)
  const availableJobs = [
    {
      id: 1,
      title: 'Bathroom Plumbing Repair',
      location: 'DHA Phase 5, Lahore',
      description: 'Fix leaking sink and replace bathroom fixtures',
      budget: '15,000 - 25,000',
      time: '3 days',
      category: 'Plumbing',
    },
    {
      id: 2,
      title: 'Kitchen Installation',
      location: 'Gulberg III, Lahore',
      description: 'Complete kitchen setup with modern fixtures',
      budget: '50,000 - 75,000',
      time: '1 week',
      category: 'Installation',
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
      <View style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}!</Text>
              <Text style={styles.userName}>Service Provider</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Text style={styles.notificationIcon}>🔔</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
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

        {/* Summary Section */}
        <View style={styles.summarySection}>
          {summaryData.map((item, index) => (
            <View key={index} style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text style={styles.summaryValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Earnings Chart Section */}
        {chartData && chartData.length > 0 && (
          <View style={styles.chartSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Earnings Overview</Text>
              <View style={styles.chartTabs}>
                {['Week', 'Monthly', 'Year'].map(tab => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.chartTab,
                      earningsView === tab && styles.chartTabActive,
                    ]}
                    onPress={() => setEarningsView(tab)}>
                    <Text
                      style={[
                        styles.chartTabText,
                        earningsView === tab && styles.chartTabTextActive,
                      ]}>
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.chartContainer}>
              <View style={styles.chart}>
                {chartData.map((item, index) => {
                  const maxValue = Math.max(
                    ...chartData.map(d => Math.max(d.jobs, d.requests)),
                    1,
                  );
                  const jobsHeight = Math.max((item.jobs / maxValue) * 100, 2);
                  const requestsHeight = Math.max(
                    (item.requests / maxValue) * 100,
                    2,
                  );

                  return (
                    <View key={index} style={styles.chartBarContainer}>
                      <View style={styles.chartBars}>
                        <View
                          style={[
                            styles.chartBar,
                            styles.chartBarJobs,
                            {height: `${jobsHeight}%`},
                          ]}
                        />
                        <View
                          style={[
                            styles.chartBar,
                            styles.chartBarRequests,
                            {height: `${requestsHeight}%`},
                          ]}
                        />
                      </View>
                      <Text style={styles.chartLabel}>{item.day}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      {backgroundColor: colors.splashGreen},
                    ]}
                  />
                  <Text style={styles.legendText}>Jobs</Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[
                      styles.legendDot,
                      {backgroundColor: colors.primary},
                    ]}
                  />
                  <Text style={styles.legendText}>Requests</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Available Jobs Section */}
        <View style={styles.jobsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Jobs</Text>
            <TouchableOpacity onPress={() => navigation.navigate('JobsScreen')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={availableJobs}
            renderItem={({item: job}) => (
              <TouchableOpacity style={styles.jobCard} activeOpacity={0.7}>
                <View style={styles.jobHeader}>
                  <View style={styles.jobInfo}>
                    <Text style={styles.jobTitle} numberOfLines={1}>
                      {job.title}
                    </Text>
                    <View style={styles.jobLocation}>
                      <Image
                        source={LocationIcon}
                        style={styles.locationIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.jobLocationText} numberOfLines={1}>
                        {job.location}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.jobMeta}>
                    <Text style={styles.jobBudget}>Rs {job.budget}</Text>
                    <View style={styles.jobCategory}>
                      <Text style={styles.jobCategoryText}>{job.category}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.jobDescription} numberOfLines={2}>
                  {job.description}
                </Text>

                <View style={styles.jobFooter}>
                  <Text style={styles.jobTime}>Duration: {job.time}</Text>
                  <TouchableOpacity style={styles.applyButton}>
                    <Text style={styles.applyButtonText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={item => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
          />
        </View>

        {/* Recent Activity Section */}
        <View style={styles.activitySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('ActivityScreen')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {activityData.slice(0, 3).map((activity, index) => (
            <TouchableOpacity key={index} style={styles.activityCard}>
              <View
                style={[
                  styles.activityIcon,
                  {backgroundColor: activity.iconBgColor},
                ]}>
                <Image
                  source={activity.icon}
                  style={styles.activityIconImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.activityDetails}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityDescription} numberOfLines={1}>
                  {activity.description}
                </Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions Section */}
        <View style={styles.actionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('JobsScreen')}>
              <View style={styles.actionIcon}>
                <Text style={styles.actionIconText}>💼</Text>
              </View>
              <Text style={styles.actionTitle}>Find Jobs</Text>
              <Text style={styles.actionDescription}>
                Browse available jobs
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('EarningsScreen')}>
              <View style={styles.actionIcon}>
                <Text style={styles.actionIconText}>💰</Text>
              </View>
              <Text style={styles.actionTitle}>View Earnings</Text>
              <Text style={styles.actionDescription}>
                Check payment history
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('ProfileScreen')}>
              <View style={styles.actionIcon}>
                <Text style={styles.actionIconText}>👤</Text>
              </View>
              <Text style={styles.actionTitle}>Update Profile</Text>
              <Text style={styles.actionDescription}>Manage your details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('SupportScreen')}>
              <View style={styles.actionIcon}>
                <Text style={styles.actionIconText}>📞</Text>
              </View>
              <Text style={styles.actionTitle}>Get Support</Text>
              <Text style={styles.actionDescription}>Contact help center</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    paddingBottom: 20,
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
  retryButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },

  // Header
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
    fontSize: 16,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
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

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
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
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconImage: {
    width: 18,
    height: 18,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statChange: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Summary Section
  summarySection: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },

  // Chart Section
  chartSection: {
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  chartTabs: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    padding: 2,
  },
  chartTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  chartTabActive: {
    backgroundColor: colors.splashGreen,
  },
  chartTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chartTabTextActive: {
    color: colors.background,
  },
  chartContainer: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  chart: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    marginBottom: 16,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  chartBars: {
    width: '60%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  chartBar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 4,
  },
  chartBarJobs: {
    backgroundColor: colors.splashGreen,
  },
  chartBarRequests: {
    backgroundColor: colors.primary,
  },
  chartLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 6,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Jobs Section
  jobsSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.splashGreen,
  },
  horizontalList: {
    paddingRight: 16,
  },
  jobCard: {
    width: 280,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  jobInfo: {
    flex: 1,
    marginRight: 8,
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  jobLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 12,
    height: 12,
    marginRight: 4,
    tintColor: colors.textSecondary,
  },
  jobLocationText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  jobMeta: {
    alignItems: 'flex-end',
  },
  jobBudget: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.splashGreen,
    marginBottom: 4,
  },
  jobCategory: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  jobCategoryText: {
    fontSize: 10,
    color: colors.splashGreen,
    fontWeight: '500',
  },
  jobDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
  },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  jobTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  applyButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  applyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },

  // Activity Section
  activitySection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityIconImage: {
    width: 16,
    height: 16,
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#9E9E9E',
  },

  // Actions Section
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
  actionCard: {
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
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionIconText: {
    fontSize: 16,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 3,
    textAlign: 'center',
  },
  actionDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
});

export default HomeScreen;
