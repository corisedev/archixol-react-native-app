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
  getServiceProviderDashboard,
  getAvailableJobs,
  getMyApplications,
  getAllServices,
  getProfile,
} from '../../../api/serviceProvider';
import {useNavigation} from '@react-navigation/native';

// Lucide React Native Icons
import {
  BarChart3,
  Briefcase,
  PlusSquare,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
  Eye,
  Settings,
} from 'lucide-react-native';

const HomeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [servicesCount, setServicesCount] = useState(0);

  // Dashboard metrics
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalJobsCompleted, setTotalJobsCompleted] = useState(0);
  const [totalJobRequested, setTotalJobRequested] = useState(0);
  const [pendingJobs, setPendingJobs] = useState(0);
  const [chartData, setChartData] = useState([]);

  const navigation = useNavigation();

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await getServiceProviderDashboard();
      console.log('Service Provider Dashboard API Response:', response);
      setDashboardData(response);

      // Extract key metrics from response
      setTotalEarnings(response.total_earnings || 0);
      setTotalJobsCompleted(response.total_job_completed || 0);
      setTotalJobRequested(response.total_job_requested || 0);
      setPendingJobs(response.total_pending_jobs || 0);

      // Set chart data for trends
      if (response.graph_data && Array.isArray(response.graph_data)) {
        setChartData(response.graph_data);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      Alert.alert('Error', 'Unable to load dashboard data. Please try again.');
    }
  }, []);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    try {
      const response = await getProfile();
      console.log('Profile API Response:', response);
      setProfileData(response);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }, []);

  // Fetch recent available jobs
  const fetchRecentJobs = useCallback(async () => {
    try {
      const response = await getAvailableJobs({
        page: 1,
        limit: 5,
        sort_by: 'created_date',
        sort_order: 'desc',
      });

      console.log('Recent Jobs API Response:', response);

      if (response?.jobs && Array.isArray(response.jobs)) {
        setRecentJobs(response.jobs);
      } else if (response?.data && Array.isArray(response.data)) {
        setRecentJobs(response.data);
      }
    } catch (error) {
      console.error('Failed to load recent jobs:', error);
    }
  }, []);

  // Fetch my applications
  // Fetch my applications - FIXED VERSION
  const fetchMyApplications = useCallback(async () => {
    try {
      // FIXED: Individual parameters instead of object
      const response = await getMyApplications(1, 3, ''); // page, limit, status

      console.log('My Applications API Response:', response);

      if (response?.applications && Array.isArray(response.applications)) {
        setMyApplications(response.applications);
      } else {
        setMyApplications([]);
      }
    } catch (error) {
      console.error('Failed to load applications:', error);
      setMyApplications([]);
    }
  }, []);

  // Fetch services count
  const fetchServicesCount = useCallback(async () => {
    try {
      const response = await getAllServices();
      if (response?.services && Array.isArray(response.services)) {
        setServicesCount(response.services.length);
      } else if (response?.data && Array.isArray(response.data)) {
        setServicesCount(response.data.length);
      }
    } catch (error) {
      console.error('Failed to load services count:', error);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboardData(),
        fetchProfile(),
        fetchRecentJobs(),
        fetchMyApplications(),
        fetchServicesCount(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [
    fetchDashboardData,
    fetchProfile,
    fetchRecentJobs,
    fetchMyApplications,
    fetchServicesCount,
  ]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      fetchProfile(),
      fetchRecentJobs(),
      fetchMyApplications(),
      fetchServicesCount(),
    ]);
    setRefreshing(false);
  }, [
    fetchDashboardData,
    fetchProfile,
    fetchRecentJobs,
    fetchMyApplications,
    fetchServicesCount,
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

  // Get application status color
  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'accepted':
      case 'approved':
        return '#10B981'; // Green
      case 'completed':
      case 'finished':
        return '#059669'; // Dark Green
      case 'pending':
      case 'submitted':
      case 'requested':
        return '#F59E0B'; // Amber
      case 'rejected':
      case 'declined':
        return '#EF4444'; // Red
      case 'cancelled':
      case 'withdrawn':
        return '#F97316'; // Orange
      case 'in_progress':
      case 'ongoing':
        return '#3B82F6'; // Blue
      default:
        return colors.textSecondary; // Gray
    }
  };

  // Render chart bars
  const renderEarningsChart = () => {
    if (!chartData || chartData.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>No earnings data available</Text>
        </View>
      );
    }

    const maxValue = Math.max(...chartData.map(item => item.earnings || 0), 1);

    return (
      <View style={styles.chart}>
        {chartData.map((item, index) => {
          const height = Math.max(((item.earnings || 0) / maxValue) * 100, 2);
          return (
            <View key={index} style={styles.chartBarContainer}>
              <Text style={styles.chartValue}>
                {item.earnings > 999
                  ? `${(item.earnings / 1000).toFixed(1)}K`
                  : item.earnings || 0}
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

  // Get user name
  const userName =
    profileData?.fullname || profileData?.name || 'Service Provider';

  // Prepare main stats data
  const mainStatsData = [
    {
      title: 'Total Earnings',
      value: formatCurrency(totalEarnings),
      change: dashboardData?.ratio_earnings
        ? `${dashboardData.ratio_earnings}% from last month`
        : '0% from last month',
      changeColor: colors.splashGreen,
      icon: DollarSign,
    },
    {
      title: 'Jobs Completed',
      value: totalJobsCompleted.toString(),
      change: dashboardData?.ratio_job_completed
        ? `${dashboardData.ratio_job_completed}% from last month`
        : '0% from last month',
      changeColor: colors.splashGreen,
      icon: CheckCircle,
    },
    {
      title: 'Job Requests',
      value: totalJobRequested.toString(),
      change: dashboardData?.ratio_job_requested
        ? `${dashboardData.ratio_job_requested}% from last month`
        : '0% from last month',
      changeColor: colors.splashGreen,
      icon: Briefcase,
    },
    {
      title: 'Pending Jobs',
      value: pendingJobs.toString(),
      change: dashboardData?.ratio_pending_jobs
        ? `${dashboardData.ratio_pending_jobs}% from last month`
        : '0% from last month',
      changeColor: '#FFC107',
      icon: Clock,
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
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Stats Grid */}
      <View style={styles.mainStatsContainer}>
        {mainStatsData.map((stat, index) => (
          <View key={index} style={styles.mainStatCard}>
            <View style={styles.mainStatHeader}>
              <Text style={styles.mainStatTitle}>{stat.title}</Text>
              <View style={styles.statIconContainer}>
                <stat.icon color={colors.splashGreen} size={20} />
              </View>
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

      {/* Earnings Chart Section */}
      <View style={styles.chartSection}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Earnings Trend</Text>
        </View>
        <View style={styles.chartContainer}>{renderEarningsChart()}</View>
      </View>

      {/* Recent Job Opportunities Section */}
      <View style={styles.jobsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Job Opportunities</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('AvailableJobsScreen')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentJobs && recentJobs.length > 0 ? (
          recentJobs.slice(0, 3).map((job, index) => (
            <TouchableOpacity
              key={job._id || job.id || index}
              style={styles.jobCard}
              onPress={() =>
                navigation.navigate('JobDetailScreen', {
                  jobId: job._id || job.id,
                })
              }>
              <View style={styles.jobHeader}>
                <View style={styles.jobInfo}>
                  <Text style={styles.jobTitle} numberOfLines={1}>
                    {job.title || job.job_title}
                  </Text>
                  <Text style={styles.jobDescription} numberOfLines={1}>
                    {job.category || 'General'} • {job.location || 'Remote'}
                  </Text>
                </View>
                <View style={styles.jobMeta}>
                  <Text style={styles.jobBudget}>
                    {formatCurrency(job.budget || job.max_budget || 0)}
                  </Text>
                  {job.urgent && (
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentText}>URGENT</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.jobFooter}>
                <Text style={styles.jobDate}>
                  Posted{' '}
                  {new Date(
                    job.created_date || job.createdAt,
                  ).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No job opportunities yet</Text>
            <Text style={styles.emptySubtext}>
              New job opportunities will appear here
            </Text>
          </View>
        )}
      </View>

      {/* My Applications Section */}
      <View style={styles.applicationsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Applications</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MyApplicationsScreen')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {myApplications && myApplications.length > 0 ? (
          myApplications.slice(0, 3).map((application, index) => {
            // Get job title from multiple possible sources
            const jobTitle =
              application.project_job?.title ||
              application.job?.title ||
              application.job_title ||
              application.service?.service_title ||
              'Job Title Not Available';

            // Get client name
            const clientName =
              application.client?.username ||
              application.client?.name ||
              application.client_name ||
              'Unknown Client';

            // Get application status
            const applicationStatus = application.status || 'pending';

            // Get application date
            const applicationDate =
              application.applied_date ||
              application.createdAt ||
              application.created_at ||
              new Date().toISOString();

            // Get budget/price info
            const proposedPrice =
              application.price || application.proposed_price || 0;
            const clientBudget =
              application.project_job?.budget ||
              application.job?.budget ||
              application.budget ||
              0;

            return (
              <TouchableOpacity
                key={application._id || application.id || index}
                style={styles.applicationCard}
                onPress={() =>
                  navigation.navigate('ApplicationDetailScreen', {
                    applicationId: application._id || application.id,
                    application: application,
                  })
                }>
                {/* Application Header */}
                <View style={styles.applicationHeader}>
                  <View style={styles.applicationInfo}>
                    <Text style={styles.applicationTitle} numberOfLines={2}>
                      {jobTitle}
                    </Text>
                    <View style={styles.applicationMeta}>
                      <Text style={styles.applicationClient} numberOfLines={1}>
                        👤 Client: {clientName}
                      </Text>
                      <Text
                        style={styles.applicationDescription}
                        numberOfLines={1}>
                        📅 Applied:{' '}
                        {new Date(applicationDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>

                  {/* Status Badge */}
                  <View style={styles.applicationStatusContainer}>
                    <View
                      style={[
                        styles.applicationStatus,
                        {
                          backgroundColor:
                            getStatusColor(applicationStatus) + '20',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.applicationStatusText,
                          {color: getStatusColor(applicationStatus)},
                        ]}>
                        {applicationStatus?.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Price Information */}
                {(proposedPrice > 0 || clientBudget > 0) && (
                  <View style={styles.priceInfo}>
                    {proposedPrice > 0 && (
                      <Text style={styles.proposedPrice}>
                        💰 Your Bid: {formatCurrency(proposedPrice)}
                      </Text>
                    )}
                    {clientBudget > 0 && (
                      <Text style={styles.clientBudget}>
                        💼 Budget: {formatCurrency(clientBudget)}
                      </Text>
                    )}
                  </View>
                )}

                {/* Application Category/Service */}
                {(application.service?.service_category ||
                  application.category) && (
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryText}>
                      🏷️{' '}
                      {application.service?.service_category ||
                        application.category}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No applications yet</Text>
            <Text style={styles.emptySubtext}>
              Your job applications will appear here
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
          {/* Add Service */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('AddServiceScreen')}>
            <View style={styles.quickActionIcon}>
              <PlusSquare color={colors.splashGreen} size={20} />
            </View>
            <Text style={styles.quickActionTitle}>Add Service</Text>
            <Text style={styles.quickActionDescription}>
              Create new service offer
            </Text>
          </TouchableOpacity>

          {/* Browse Jobs */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('AvailableJobsScreen')}>
            <View style={styles.quickActionIcon}>
              <Briefcase color={colors.splashGreen} size={20} />
            </View>
            <Text style={styles.quickActionTitle}>Browse Jobs</Text>
            <Text style={styles.quickActionDescription}>
              Find new opportunities
            </Text>
          </TouchableOpacity>

          {/* View Portfolio */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('PortfolioScreen')}>
            <View style={styles.quickActionIcon}>
              <Eye color={colors.splashGreen} size={20} />
            </View>
            <Text style={styles.quickActionTitle}>View Portfolio</Text>
            <Text style={styles.quickActionDescription}>
              Manage your profile
            </Text>
          </TouchableOpacity>

          {/* Analytics */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('AnalyticsScreen')}>
            <View style={styles.quickActionIcon}>
              <BarChart3 color={colors.splashGreen} size={20} />
            </View>
            <Text style={styles.quickActionTitle}>Analytics</Text>
            <Text style={styles.quickActionDescription}>
              View detailed reports
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
    fontFamily: fonts.regular,
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
    fontFamily: fonts.regular,
  },
  userName: {
    fontSize: fontSizes['3xl'],
    fontFamily: fonts.bold,
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

  // Main Stats Container
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mainStatTitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    flex: 1,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainStatValue: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  mainStatChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.medium,
  },

  // Chart Section
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
    fontFamily: fonts.bold,
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
    fontFamily: fonts.medium,
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
    fontFamily: fonts.medium,
  },
  emptyChart: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    color: colors.textSecondary,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
  },

  // Jobs Section
  jobsSection: {
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
    fontFamily: fonts.bold,
    color: colors.text,
  },
  seeAllText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },
  jobCard: {
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
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  jobInfo: {
    flex: 1,
    marginRight: 12,
  },
  jobTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 3,
  },
  jobDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  jobMeta: {
    alignItems: 'flex-end',
  },
  jobBudget: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.splashGreen,
    marginBottom: 4,
  },
  urgentBadge: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  urgentText: {
    fontSize: fontSizes.xs,
    color: 'white',
    fontFamily: fonts.bold,
  },
  jobFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  jobDate: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Applications Section

  applicationCard: {
    backgroundColor: colors.background,
    borderRadius: 16, // Increased border radius
    padding: 16, // Increased padding
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  applicationInfo: {
    flex: 1,
    marginRight: 12,
  },
  applicationTitle: {
    fontSize: fontSizes.lg, // Larger font
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  applicationMeta: {
    gap: 4,
  },
  applicationClient: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.medium,
    marginBottom: 2,
  },
  applicationDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  applicationStatusContainer: {
    alignItems: 'flex-end',
  },
  applicationStatus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  applicationStatusText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },

  // Price Information
  priceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
  },
  proposedPrice: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.bold,
    color: colors.splashGreen,
  },
  clientBudget: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  // Category Information
  categoryInfo: {
    alignSelf: 'flex-start',
  },
  categoryText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  applicationsSection: {
    marginTop: 20,
    paddingHorizontal: 16,
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
  quickActionTitle: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 3,
    textAlign: 'center',
  },
  quickActionDescription: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: fonts.regular,
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
    fontFamily: fonts.medium,
  },
  emptySubtext: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: fonts.regular,
  },
});

export default HomeScreen;
