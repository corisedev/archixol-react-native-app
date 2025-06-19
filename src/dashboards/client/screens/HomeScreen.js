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
} from 'react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {
  getClientDashboard,
  getMyProjects,
  getMyJobs,
  getOrders,
  getClientProfile,
} from '../../../api/client';
import {useNavigation} from '@react-navigation/native';
import {VITE_API_BASE_URL} from '@env';
import {useContext} from 'react';
import {BackendContext} from '../../../context/BackendContext';

// Lucide React Native Icons
import {
  PlusSquare,
  Briefcase,
  Package,
  Settings,
  Eye,
  DollarSign,
  Clock,
  CheckCircle,
  Building2,
  Search,
  User,
 
} from 'lucide-react-native';

const HomeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [recentProjects, setRecentProjects] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentJobs, setRecentJobs] = useState([]);
  const [purchasedServices, setPurchasedServices] = useState([]);

  // Dashboard metrics
  const [currentProjects, setCurrentProjects] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [projectCompletion, setProjectCompletion] = useState(0);

  const navigation = useNavigation();
  const {backendUrl} = useContext(BackendContext);

  // Get full image URL helper function
  const getFullImageUrl = relativePath => {
    if (!relativePath) {
      return null;
    }
    if (relativePath.startsWith('http')) {
      return relativePath;
    }

    const baseUrl = backendUrl || VITE_API_BASE_URL;
    const cleanPath = relativePath.startsWith('/')
      ? relativePath.substring(1)
      : relativePath;
    const fullUrl = `${baseUrl}/${cleanPath}`;

    return fullUrl;
  };

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await getClientDashboard();
      console.log('Client Dashboard API Response:', response);
      setDashboardData(response);

      // Extract key metrics from response
      setCurrentProjects(response.current_projects || 0);
      setTotalSpent(response.total_spent || 0);
      setPendingOrders(response.pending_orders || 0);
      setProjectCompletion(response.project_completion || 0);

      // Set purchased services
      if (
        response.purchased_services &&
        Array.isArray(response.purchased_services)
      ) {
        setPurchasedServices(response.purchased_services);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      Alert.alert('Error', 'Unable to load dashboard data. Please try again.');
    }
  }, []);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    try {
      const response = await getClientProfile();
      console.log('Profile API Response:', response);
      setProfileData(response);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  }, []);

  // Fetch recent projects
  const fetchRecentProjects = useCallback(async () => {
    try {
      const response = await getMyProjects();
      console.log('Recent Projects API Response:', response);

      if (response?.projects && Array.isArray(response.projects)) {
        setRecentProjects(response.projects.slice(0, 3));
      } else if (response?.data && Array.isArray(response.data)) {
        setRecentProjects(response.data.slice(0, 3));
      }
    } catch (error) {
      console.error('Failed to load recent projects:', error);
    }
  }, []);

  // Fetch recent jobs
  const fetchRecentJobs = useCallback(async () => {
    try {
      const response = await getMyJobs({page: 1, limit: 3});
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

  // Fetch recent orders
  const fetchRecentOrders = useCallback(async () => {
    try {
      const response = await getOrders();
      console.log('Recent Orders API Response:', response);

      if (response?.orders && Array.isArray(response.orders)) {
        setRecentOrders(response.orders.slice(0, 3));
      } else if (response?.data && Array.isArray(response.data)) {
        setRecentOrders(response.data.slice(0, 3));
      }
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
        fetchProfile(),
        fetchRecentProjects(),
        fetchRecentJobs(),
        fetchRecentOrders(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [
    fetchDashboardData,
    fetchProfile,
    fetchRecentProjects,
    fetchRecentJobs,
    fetchRecentOrders,
  ]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      fetchProfile(),
      fetchRecentProjects(),
      fetchRecentJobs(),
      fetchRecentOrders(),
    ]);
    setRefreshing(false);
  }, [
    fetchDashboardData,
    fetchProfile,
    fetchRecentProjects,
    fetchRecentJobs,
    fetchRecentOrders,
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

  // Get status color
  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
      case 'finished':
        return colors.splashGreen;
      case 'ongoing':
      case 'in_progress':
      case 'active':
        return '#3B82F6';
      case 'planning':
      case 'pending':
      case 'submitted':
        return '#F59E0B';
      case 'review':
      case 'under_review':
        return '#8B5CF6';
      case 'cancelled':
      case 'rejected':
        return '#EF4444';
      default:
        return colors.textSecondary;
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
  const userName = profileData?.fullname || profileData?.name || 'Client';

  // Prepare main stats data
  const mainStatsData = [
    {
      title: 'Current Projects',
      value: currentProjects.toString(),
      change: dashboardData?.project_growth
        ? `${dashboardData.project_growth}% from last month`
        : '0% from last month',
      changeColor: colors.splashGreen,
      icon: Briefcase,
    },
    {
      title: 'Total Spent',
      value: formatCurrency(totalSpent),
      change: dashboardData?.spending_growth
        ? `${dashboardData.spending_growth}% from last month`
        : '0% from last month',
      changeColor: colors.splashGreen,
      icon: DollarSign,
    },
    {
      title: 'Pending Orders',
      value: pendingOrders.toString(),
      change: dashboardData?.order_growth
        ? `${dashboardData.order_growth}% from last month`
        : '0% from last month',
      changeColor: '#FFC107',
      icon: Clock,
    },
    {
      title: 'Project Completion',
      value: `${projectCompletion}%`,
      change: dashboardData?.completion_growth
        ? `${dashboardData.completion_growth}% from last month`
        : '0% from last month',
      changeColor: colors.splashGreen,
      icon: CheckCircle,
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

      {/* Purchased Services Section */}
      <View style={styles.servicesSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Purchased Services</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('PurchasedServicesScreen')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {purchasedServices && purchasedServices.length > 0 ? (
          purchasedServices.slice(0, 3).map((service, index) => (
            <TouchableOpacity
              key={service._id || service.id || index}
              style={styles.serviceCard}
              onPress={() =>
                navigation.navigate('ServiceDetailScreen', {
                  serviceId: service._id || service.id,
                })
              }>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceTitle} numberOfLines={1}>
                    {service.title || service.service_title}
                  </Text>
                  <Text style={styles.serviceProvider} numberOfLines={1}>
                    👤 Provider: {service.provider_name || 'Unknown Provider'}
                  </Text>
                  <Text style={styles.serviceDate} numberOfLines={1}>
                    📅 Purchased: {formatDate(service.purchase_date)}
                  </Text>
                </View>
                <View style={styles.serviceMeta}>
                  <Text style={styles.servicePrice}>
                    {formatCurrency(service.price || 0)}
                  </Text>
                  <View
                    style={[
                      styles.serviceStatus,
                      {
                        backgroundColor: getStatusColor(service.status) + '20',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.serviceStatusText,
                        {color: getStatusColor(service.status)},
                      ]}>
                      {service.status?.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
              <Text style={styles.serviceDescription} numberOfLines={2}>
                {service.description || 'No description available'}
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No purchased services yet</Text>
            <Text style={styles.emptySubtext}>
              Your purchased services will appear here
            </Text>
          </View>
        )}
      </View>

      {/* Recent Projects Section */}
      <View style={styles.projectsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Projects</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MyProjectsScreen')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentProjects && recentProjects.length > 0 ? (
          recentProjects.map((project, index) => (
            <TouchableOpacity
              key={project._id || project.id || index}
              style={styles.projectCard}
              onPress={() =>
                navigation.navigate('ProjectDetailScreen', {
                  projectId: project._id || project.id,
                })
              }>
              <View style={styles.projectHeader}>
                <Building2 color={colors.splashGreen} size={24} />
                <View style={styles.projectInfo}>
                  <Text style={styles.projectTitle} numberOfLines={1}>
                    {project.title || project.project_title}
                  </Text>
                  <Text style={styles.projectDescription} numberOfLines={1}>
                    {project.category || 'General'} • Budget:{' '}
                    {formatCurrency(project.budget || 0)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.projectStatus,
                    {
                      backgroundColor: getStatusColor(project.status) + '20',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.projectStatusText,
                      {color: getStatusColor(project.status)},
                    ]}>
                    {project.status?.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.projectFooter}>
                <Text style={styles.projectDate}>
                  Created: {formatDate(project.created_at || project.createdAt)}
                </Text>
                {project.provider_name && (
                  <Text style={styles.projectProvider}>
                    Provider: {project.provider_name}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No projects yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first project to get started
            </Text>
          </View>
        )}
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
          recentOrders.map((order, index) => (
            <TouchableOpacity
              key={order._id || order.id || index}
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
                    {order.items?.length || 0} items •
                    {order.supplier_name || 'Unknown Supplier'}
                  </Text>
                </View>
                <View style={styles.orderMeta}>
                  <Text style={styles.orderPrice}>
                    {formatCurrency(order.total || order.total_amount || 0)}
                  </Text>
                  <View
                    style={[
                      styles.orderStatus,
                      {
                        backgroundColor: getStatusColor(order.status) + '20',
                      },
                    ]}>
                    <Text
                      style={[
                        styles.orderStatusText,
                        {color: getStatusColor(order.status)},
                      ]}>
                      {order.status?.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.orderFooter}>
                <Text style={styles.orderDate}>
                  Placed: {formatDate(order.created_at || order.placed_at)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubtext}>
              Your orders will appear here
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
          {/* Create Project */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('CreateProjectScreen')}>
            <View style={styles.quickActionIcon}>
              <PlusSquare color={colors.splashGreen} size={20} />
            </View>
            <Text style={styles.quickActionTitle}>Create Project</Text>
            <Text style={styles.quickActionDescription}>
              Start a new project
            </Text>
          </TouchableOpacity>

          {/* Browse Services */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('ServicesScreen')}>
            <View style={styles.quickActionIcon}>
              <Search color={colors.splashGreen} size={20} />
            </View>
            <Text style={styles.quickActionTitle}>Browse Services</Text>
            <Text style={styles.quickActionDescription}>
              Find service providers
            </Text>
          </TouchableOpacity>

          {/* Browse Products */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('ProductsScreen')}>
            <View style={styles.quickActionIcon}>
              <Package color={colors.splashGreen} size={20} />
            </View>
            <Text style={styles.quickActionTitle}>Browse Products</Text>
            <Text style={styles.quickActionDescription}>Shop for products</Text>
          </TouchableOpacity>

          {/* View Profile */}
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => navigation.navigate('ProfileScreen')}>
            <View style={styles.quickActionIcon}>
              <User color={colors.splashGreen} size={20} />
            </View>
            <Text style={styles.quickActionTitle}>View Profile</Text>
            <Text style={styles.quickActionDescription}>
              Manage your profile
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

  // Section Styles
  servicesSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  projectsSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
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
    fontFamily: fonts.bold,
    color: colors.text,
  },
  seeAllText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },

  // Service Card Styles
  serviceCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  serviceProvider: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.medium,
    marginBottom: 2,
  },
  serviceDate: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  serviceMeta: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.splashGreen,
    marginBottom: 8,
  },
  serviceStatus: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  serviceStatusText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  serviceDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    lineHeight: 20,
  },

  // Project Card Styles
  projectCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  projectInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 12,
  },
  projectTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  projectStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  projectStatusText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bold,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  projectDate: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  projectProvider: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Order Card Styles
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
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 3,
  },
  orderDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  orderMeta: {
    alignItems: 'flex-end',
  },
  orderPrice: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
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
    fontFamily: fonts.semiBold,
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 8,
  },
  orderDate: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Quick Actions Section
  actionsSection: {
    marginTop: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
    paddingBottom: 100,


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
