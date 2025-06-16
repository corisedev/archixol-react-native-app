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
import {
  getClientDashboard,
  getMyProjects,
  getProducts,
  getServices,
} from '../../../api/client';
import {useNavigation} from '@react-navigation/native';
import {useContext} from 'react';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../context/BackendContext';

// Import your icons here
import ProjectsIcon from '../../../assets/images/icons/jobs-active.png';
import SpentIcon from '../../../assets/images/icons/earnings.png';
import PendingIcon from '../../../assets/images/icons/pending-jobs.png';
import CompletedIcon from '../../../assets/images/icons/activity-check.png';
import LocationIcon from '../../../assets/images/icons/location.png';

const HomeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [projectsData, setProjectsData] = useState(null);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredServices, setFeaturedServices] = useState([]);
  const navigation = useNavigation();
  const {backendUrl} = useContext(BackendContext);

  // Get full image URL helper function
  const getFullImageUrl = relativePath => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;
    const baseUrl = backendUrl || VITE_API_BASE_URL;
    return `${baseUrl}${relativePath}`;
  };

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await getClientDashboard();
      console.log('Client Dashboard API Response:', response);
      setDashboardData(response);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      Alert.alert('Error', 'Unable to load dashboard data. Please try again.');
    }
  }, []);

  // Fetch projects data
  const fetchProjectsData = useCallback(async () => {
    try {
      const response = await getMyProjects();
      console.log('My Projects API Response:', response);
      setProjectsData(response);
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  }, []);

  // Fetch featured products
  const fetchFeaturedProducts = useCallback(async () => {
    try {
      const response = await getProducts();
      if (response && response.products_list) {
        setFeaturedProducts(response.products_list.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to load featured products:', error);
    }
  }, []);

  // Fetch featured services
  const fetchFeaturedServices = useCallback(async () => {
    try {
      const response = await getServices();
      if (response && response.services_list) {
        setFeaturedServices(response.services_list.slice(0, 5));
      }
    } catch (error) {
      console.error('Failed to load featured services:', error);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboardData(),
        fetchProjectsData(),
        fetchFeaturedProducts(),
        fetchFeaturedServices(),
      ]);
      setLoading(false);
    };
    loadData();
  }, [
    fetchDashboardData,
    fetchProjectsData,
    fetchFeaturedProducts,
    fetchFeaturedServices,
  ]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      fetchProjectsData(),
      fetchFeaturedProducts(),
      fetchFeaturedServices(),
    ]);
    setRefreshing(false);
  }, [
    fetchDashboardData,
    fetchProjectsData,
    fetchFeaturedProducts,
    fetchFeaturedServices,
  ]);

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

  // Get project status color
  const getProjectStatusColor = status => {
    switch (status) {
      case 'completed':
        return colors.splashGreen;
      case 'in_progress':
        return colors.primary;
      case 'open':
        return '#FFC107';
      default:
        return colors.textSecondary;
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

  if (!dashboardData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{color: colors.text}}>No data available</Text>
      </View>
    );
  }

  // Prepare stats data from API
  const statsData = [
    {
      icon: ProjectsIcon,
      bgColor: '#E8F5E9',
      label: 'Current Projects',
      value: dashboardData.current_projects?.toString() ?? '0',
      change: 'Active Projects',
      changeColor: colors.splashGreen,
    },
    {
      icon: SpentIcon,
      bgColor: '#E8F5E9',
      label: 'Total Spent',
      value: formatCurrency(dashboardData.total_spent ?? 0),
      change: 'This Month',
      changeColor: colors.primary,
    },
    {
      icon: PendingIcon,
      bgColor: '#E8F5E9',
      label: 'Pending Orders',
      value: dashboardData.pending_orders?.toString() ?? '0',
      change: 'Awaiting Response',
      changeColor: colors.primary,
    },
    {
      icon: CompletedIcon,
      bgColor: '#E8F5E9',
      label: 'Completed Projects',
      value: dashboardData.project_completion?.toString() ?? '0',
      change: 'Successfully Done',
      changeColor: colors.primary,
    },
  ];

  // Summary data
  const summaryData = [
    {
      label: 'Active Projects',
      value: dashboardData.current_projects?.toString() ?? '0',
    },
    {
      label: 'Total Investment',
      value: formatCurrency(dashboardData.total_spent ?? 0),
    },
    {
      label: 'Success Rate',
      value: `${
        Math.round(
          (dashboardData.project_completion /
            (dashboardData.current_projects +
              dashboardData.project_completion)) *
            100,
        ) || 0
      }%`,
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
              <Text style={styles.userName}>Dashboard</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Text style={styles.notificationIcon}>🔔</Text>
            </TouchableOpacity>
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

        {/* Summary Section - More Compact */}
        <View style={styles.summarySection}>
          {summaryData.map((item, index) => (
            <View key={index} style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text style={styles.summaryValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        {/* Recent Projects Section - Compact */}
        <View style={styles.projectsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Projects</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {projectsData &&
          projectsData.projects &&
          projectsData.projects.length > 0 ? (
            projectsData.projects.slice(0, 3).map((project, index) => (
              <TouchableOpacity
                key={project.project_id || index}
                style={styles.projectCard}>
                <View style={styles.projectHeader}>
                  <View style={styles.projectInfo}>
                    <Text style={styles.projectTitle} numberOfLines={1}>
                      {project.title}
                    </Text>
                    <Text style={styles.projectDescription} numberOfLines={1}>
                      {project.description}
                    </Text>
                  </View>
                  <View style={styles.projectMeta}>
                    <Text style={styles.projectPrice}>
                      {formatCurrency(project.price)}
                    </Text>
                    <View
                      style={[
                        styles.projectStatus,
                        {
                          backgroundColor:
                            getProjectStatusColor(project.status) + '20',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.projectStatusText,
                          {color: getProjectStatusColor(project.status)},
                        ]}>
                        {project.status?.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.projectProgress}>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        {width: `${project.progressValue || 0}%`},
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {project.progressValue || 0}%
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No projects yet</Text>
              <Text style={styles.emptySubtext}>
                Start by creating your first project
              </Text>
            </View>
          )}
        </View>

        {/* Featured Products Section - Compact */}
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('ProductsScreen')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {featuredProducts.length > 0 ? (
            <FlatList
              data={featuredProducts}
              renderItem={({item: product}) => (
                <TouchableOpacity
                  style={styles.productCard}
                  activeOpacity={0.7}>
                  <View style={styles.productImageContainer}>
                    {getFullImageUrl(product.image) ? (
                      <Image
                        source={{uri: getFullImageUrl(product.image)}}
                        style={styles.productImage}
                        resizeMode="cover"
                        onError={e =>
                          console.warn(
                            '❌ Product image failed:',
                            e.nativeEvent.error,
                          )
                        }
                      />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <Text style={styles.placeholderText}>📦</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.productInfo}>
                    <Text style={styles.productTitle} numberOfLines={2}>
                      {product.title}
                    </Text>
                    <Text style={styles.productBrand}>{product.brand}</Text>
                    <View style={styles.productFooter}>
                      <Text style={styles.productPrice}>
                        {formatCurrency(product.price)}
                      </Text>
                      <View style={styles.ratingContainer}>
                        <Text style={styles.ratingText}>
                          ⭐ {product.rating || 0}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={item =>
                item.product_id?.toString() || Math.random().toString()
              }
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No products available</Text>
            </View>
          )}
        </View>

        {/* Featured Services Section - Compact */}
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Services</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('ServicesScreen')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {featuredServices.length > 0 ? (
            <FlatList
              data={featuredServices}
              renderItem={({item: service}) => (
                <TouchableOpacity
                  style={styles.serviceCard}
                  activeOpacity={0.7}>
                  <View style={styles.serviceImageContainer}>
                    {getFullImageUrl(service.image) ? (
                      <Image
                        source={{uri: getFullImageUrl(service.image)}}
                        style={styles.serviceImage}
                        resizeMode="cover"
                        onError={e =>
                          console.warn(
                            '❌ Service image failed:',
                            e.nativeEvent.error,
                          )
                        }
                      />
                    ) : (
                      <View style={styles.placeholderImage}>
                        <Text style={styles.placeholderText}>🛠️</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceTitle} numberOfLines={2}>
                      {service.title}
                    </Text>
                    <Text style={styles.serviceCategory}>
                      {service.category}
                    </Text>
                    <View style={styles.serviceLocation}>
                      <Image
                        source={LocationIcon}
                        style={styles.locationIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.serviceLocationText}>
                        {service.location}
                      </Text>
                    </View>
                    <View style={styles.serviceFooter}>
                      <View style={styles.ratingContainer}>
                        <Text style={styles.ratingText}>
                          ⭐ {service.rating || 0}
                        </Text>
                        <Text style={styles.reviewsText}>
                          ({service.no_of_reviews || 0})
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={item =>
                item.service_id?.toString() || Math.random().toString()
              }
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            />
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No services available</Text>
            </View>
          )}
        </View>

        {/* Recent Activity Section - Compact */}
        {dashboardData?.purchased_services &&
          dashboardData.purchased_services.length > 0 && (
            <View style={styles.activitySection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>

              {dashboardData.purchased_services
                .slice(0, 3)
                .map((service, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.activityCard}
                    activeOpacity={0.7}>
                    <View style={styles.activityIcon}>
                      <Text style={styles.activityIconText}>🛠️</Text>
                    </View>
                    <View style={styles.activityDetails}>
                      <Text style={styles.activityTitle}>{service.title}</Text>
                      <Text style={styles.activityDescription}>
                        by {service.provider_name}
                      </Text>
                      <Text style={styles.activityTime}>
                        {new Date(service.purchase_date).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.activityMeta}>
                      <Text style={styles.activityPrice}>
                        {formatCurrency(service.price)}
                      </Text>
                      <View
                        style={[
                          styles.activityStatus,
                          {
                            backgroundColor:
                              getProjectStatusColor(service.status) + '20',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.activityStatusText,
                            {color: getProjectStatusColor(service.status)},
                          ]}>
                          {service.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          )}
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
  // Improved Summary Section
  summarySection: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginTop: 16, // Reduced margin
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12, // Reduced padding
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
    paddingVertical: 8, // Reduced padding
  },
  summaryLabel: {
    fontSize: 14, // Smaller font
    color: colors.text,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14, // Smaller font
    color: colors.text,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12, // Reduced margin
  },
  // Projects Section - More Compact
  projectsSection: {
    marginTop: 20, // Reduced margin
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12, // Reduced margin
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.splashGreen,
  },
  projectCard: {
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
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10, // Reduced margin
  },
  projectInfo: {
    flex: 1,
    marginRight: 12,
  },
  projectTitle: {
    fontSize: 15, // Smaller font
    fontWeight: '600',
    color: colors.text,
    marginBottom: 3, // Reduced margin
  },
  projectDescription: {
    fontSize: 12, // Smaller font
    color: colors.textSecondary,
    lineHeight: 16,
  },
  projectMeta: {
    alignItems: 'flex-end',
  },
  projectPrice: {
    fontSize: 14, // Smaller font
    fontWeight: '700',
    color: colors.splashGreen,
    marginBottom: 4,
  },
  projectStatus: {
    paddingHorizontal: 6, // Reduced padding
    paddingVertical: 2,
    borderRadius: 4,
  },
  projectStatusText: {
    fontSize: 9, // Smaller font
    fontWeight: '600',
  },
  projectProgress: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarContainer: {
    flex: 1,
    height: 3, // Smaller height
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginRight: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.splashGreen,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11, // Smaller font
    color: colors.textSecondary,
    fontWeight: '600',
  },
  // Featured Sections - More Compact
  featuredSection: {
    marginTop: 20, // Reduced margin
    paddingHorizontal: 16,
  },
  horizontalList: {
    paddingRight: 16,
  },
  productCard: {
    width: 140, // Smaller width
    backgroundColor: colors.background,
    borderRadius: 12, // Smaller radius
    marginRight: 10, // Reduced margin
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productImageContainer: {
    height: 100, // Smaller height
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 24, // Smaller icon
  },
  productInfo: {
    padding: 10, // Reduced padding
  },
  productTitle: {
    fontSize: 13, // Smaller font
    fontWeight: '600',
    color: colors.text,
    marginBottom: 3,
  },
  productBrand: {
    fontSize: 11, // Smaller font
    color: colors.textSecondary,
    marginBottom: 6,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 13, // Smaller font
    fontWeight: '700',
    color: colors.splashGreen,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 11, // Smaller font
    color: colors.textSecondary,
  },
  reviewsText: {
    fontSize: 9, // Smaller font
    color: colors.textSecondary,
    marginLeft: 2,
  },
  serviceCard: {
    width: 150, // Smaller width
    backgroundColor: colors.background,
    borderRadius: 12, // Smaller radius
    marginRight: 10, // Reduced margin
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceImageContainer: {
    height: 100, // Smaller height
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  serviceInfo: {
    padding: 10, // Reduced padding
  },
  serviceTitle: {
    fontSize: 13, // Smaller font
    fontWeight: '600',
    color: colors.text,
    marginBottom: 3,
  },
  serviceCategory: {
    fontSize: 11, // Smaller font
    color: colors.textSecondary,
    marginBottom: 3,
  },
  serviceLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationIcon: {
    width: 10, // Smaller icon
    height: 10,
    marginRight: 3,
  },
  serviceLocationText: {
    fontSize: 10, // Smaller font
    color: colors.textSecondary,
  },
  serviceFooter: {
    alignItems: 'flex-start',
  },
  // Activity Section - More Compact
  activitySection: {
    marginTop: 20, // Reduced margin
    paddingHorizontal: 16,
    marginBottom: 0,
  },
  activityCard: {
    flexDirection: 'row',
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
  activityIcon: {
    width: 36, // Smaller icon
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10, // Reduced margin
  },
  activityIconText: {
    fontSize: 16, // Smaller icon
  },
  activityDetails: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14, // Smaller font
    fontWeight: '600',
    color: colors.text,
    marginBottom: 3,
  },
  activityDescription: {
    fontSize: 12, // Smaller font
    color: colors.textSecondary,
    marginBottom: 3,
  },
  activityTime: {
    fontSize: 11, // Smaller font
    color: '#9E9E9E',
  },
  activityMeta: {
    alignItems: 'flex-end',
  },
  activityPrice: {
    fontSize: 13, // Smaller font
    fontWeight: '600',
    color: colors.splashGreen,
    marginBottom: 3,
  },
  activityStatus: {
    paddingHorizontal: 6, // Reduced padding
    paddingVertical: 2,
    borderRadius: 4,
  },
  activityStatusText: {
    fontSize: 9, // Smaller font
    fontWeight: '600',
  },
  // Empty State
  emptyCard: {
    backgroundColor: colors.background,
    borderRadius: 12, // Smaller radius
    padding: 16, // Reduced padding
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
    marginBottom: 3,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 13, // Smaller font
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default HomeScreen;
