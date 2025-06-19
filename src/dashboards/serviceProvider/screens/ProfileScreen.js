import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Dimensions,
  StatusBar,
  Linking,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {
  getProfile,
  getProjects,
  getCertificate,
  getCompanyDocs,
} from '../../../api/serviceProvider';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {VITE_API_BASE_URL} from '@env';
import {useContext} from 'react';
import {BackendContext} from '../../../context/BackendContext';
import LocalFallbackImage from '../../../assets/images/BathroomRenovation.jpg';

// Lucide React Native Icons
import {
  Edit,
  Mail,
  Phone,
  MapPin,
  Globe,
  Star,
  Award,
  Briefcase,
  Play,
  Eye,
  Camera,
  Settings,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Calendar,
  Clock,
  User,
} from 'lucide-react-native';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const ProfileScreen = () => {
  const navigation = useNavigation();
  const {backendUrl} = useContext(BackendContext);

  // State Management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [projectsData, setProjectsData] = useState([]);
  const [certificatesData, setCertificatesData] = useState([]);
  const [companyDocsData, setCompanyDocsData] = useState([]);

  // Modal States
  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [projectImages, setProjectImages] = useState([]);

  // Loading States
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [certificatesLoading, setCertificatesLoading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);

  const hasFetchedInitially = useRef(false);

  // Get full image URL helper function
  const getFullImageUrl = (relativePath, fallbackText = '') => {
    if (!relativePath || relativePath === '') {
      return Image.resolveAssetSource(LocalFallbackImage).uri;
    }

    if (relativePath.startsWith('http')) return relativePath;

    const baseUrl = backendUrl || VITE_API_BASE_URL;
    if (!baseUrl) {
      console.warn('No backend URL configured');
      return Image.resolveAssetSource(LocalFallbackImage).uri;
    }

    const cleanPath = relativePath.startsWith('/')
      ? relativePath.substring(1)
      : relativePath;

    const fullUrl = `${baseUrl}/${cleanPath}`;
    return fullUrl;
  };

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    try {
      const response = await getProfile();
      const userData = response.user || response;
      const mergedProfileData = {
        fullname: userData.fullname || response.fullname || '',
        username: userData.username || response.username || '',
        email: userData.email || response.email || '',
        phone:
          userData.phone_number ||
          response.phone ||
          response.phone_number ||
          '',
        phone_number: userData.phone_number || response.phone_number || '',
        address: userData.address || response.address || '',
        cnic: userData.cnic || response.cnic || '',
        website: userData.website || response.website || '',
        profile_img: userData.profile_img || response.profile_img,
        banner_img: userData.banner_img || response.banner_img,
        intro_video: userData.intro_video || response.intro_video,
        bio:
          userData.introduction ||
          userData.bio ||
          response.bio ||
          response.introduction ||
          '',
        introduction:
          userData.introduction ||
          response.introduction ||
          userData.bio ||
          response.bio ||
          '',
        location:
          userData.service_location ||
          userData.location ||
          response.location ||
          '',
        skills: userData.skills || response.skills || [],
        services_tags: userData.services_tags || response.services_tags || [],
        experience_level:
          userData.experience_level || response.experience_level || '',
        experience: userData.experience || response.experience || '',
        rating: response.rating || 0,
        total_reviews: response.total_reviews || 0,
        isCompany: userData.isCompany || false,
      };
      setProfileData(mergedProfileData);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    }
  }, []);

  // Fetch projects data
  const fetchProjects = useCallback(async () => {
    try {
      setProjectsLoading(true);
      const response = await getProjects();
      setProjectsData(response.projects || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setProjectsData([]);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  // Fetch certificates data
  const fetchCertificates = useCallback(async () => {
    try {
      setCertificatesLoading(true);
      const response = await getCertificate();
      setCertificatesData(response.certificates || []);
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
      setCertificatesData([]);
    } finally {
      setCertificatesLoading(false);
    }
  }, []);

  // Fetch company documents data
  const fetchCompanyDocs = useCallback(async () => {
    if (
      profileData &&
      !profileData.isCompany &&
      profileData.account_type !== 'company'
    ) {
      setCompanyDocsData([]);
      return;
    }

    try {
      setDocsLoading(true);
      const response = await getCompanyDocs();
      setCompanyDocsData(response.documents || []);
    } catch (error) {
      console.error('Failed to fetch company documents:', error);
      setCompanyDocsData([]);
    } finally {
      setDocsLoading(false);
    }
  }, [profileData]);

  // Initial data load
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      if (!isMounted) {
        return;
      }
      setLoading(true);
      try {
        await fetchProfile();
        await Promise.allSettled([fetchProjects(), fetchCertificates()]);
        hasFetchedInitially.current = true;
      } catch (err) {
        console.error('Error in initial data load:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!hasFetchedInitially.current) return;
      fetchProfile();
    }, [fetchProfile]),
  );

  useEffect(() => {
    if (profileData && !loading) {
      fetchCompanyDocs();
    }
  }, [profileData, loading, fetchCompanyDocs]);

  // Refresh all data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchProfile();
      await Promise.allSettled([
        fetchProjects(),
        fetchCertificates(),
        fetchCompanyDocs(),
      ]);
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchProfile, fetchProjects, fetchCertificates, fetchCompanyDocs]);

  // Handle edit profile
  const handleEditProfile = () => {
    navigation.navigate('EditProfileScreen', {profileData});
  };

  // Handle website link
  const handleWebsitePress = url => {
    if (url) {
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      Linking.openURL(formattedUrl).catch(() => {
        Alert.alert('Error', 'Could not open website link');
      });
    }
  };

  // Handle project image gallery
  const openProjectImageGallery = (images, index = 0) => {
    setProjectImages(images);
    setSelectedImageIndex(index);
    setImageModalVisible(true);
  };

  // Navigate gallery images
  const navigateImage = direction => {
    if (direction === 'next') {
      setSelectedImageIndex(prev =>
        prev >= projectImages.length - 1 ? 0 : prev + 1,
      );
    } else {
      setSelectedImageIndex(prev =>
        prev <= 0 ? projectImages.length - 1 : prev - 1,
      );
    }
  };

  // Calculate project duration
  const calculateProjectDuration = (startDate, endDate) => {
    if (!startDate || !endDate) {
      return 0;
    }
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return 0;
    }
  };

  // Format date helper
  const formatDate = dateString => {
    if (!dateString) {
      return 'No date';
    }
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

  // Render rating stars
  const renderRating = rating => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);

    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          color={i < fullStars ? '#FFD700' : '#E5E5E5'}
          fill={i < fullStars ? '#FFD700' : 'transparent'}
        />,
      );
    }

    return (
      <View style={styles.ratingContainer}>
        {stars}
        <Text style={styles.ratingText}>
          {rating ? rating.toFixed(1) : '0.0'}
        </Text>
      </View>
    );
  };

  // Render profile header with modern design
  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      {/* Header Actions */}
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate('SettingsScreen')}>
          <Settings color={colors.text} size={20} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}>
          <Share2 color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      {/* Profile Content */}
      <View style={styles.profileContent}>
        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <Image
            source={{
              uri:
                getFullImageUrl(
                  profileData?.profile_img,
                  profileData?.fullname?.charAt(0) || 'U',
                ) ||
                'https://via.placeholder.com/100x100/22c55e/FFFFFF?text=' +
                  encodeURIComponent(profileData?.fullname?.charAt(0) || 'U'),
            }}
            style={styles.profileImage}
            resizeMode="cover"
          />
          <TouchableOpacity style={styles.cameraButton}>
            <Camera color={colors.background} size={16} />
          </TouchableOpacity>
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {profileData?.fullname || 'Your Name'}
          </Text>
          <Text style={styles.userHandle}>
            @{profileData?.username || 'username'}
          </Text>
          {profileData?.location && (
            <View style={styles.locationContainer}>
              <MapPin color={colors.textSecondary} size={14} />
              <Text style={styles.locationText}>{profileData.location}</Text>
            </View>
          )}
          {renderRating(profileData?.rating)}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{projectsData.length}</Text>
            <Text style={styles.statLabel}>Projects</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{certificatesData.length}</Text>
            <Text style={styles.statLabel}>Certificates</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>
              {profileData?.total_reviews || 0}
            </Text>
            <Text style={styles.statLabel}>Reviews</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}>
            <Edit color={colors.background} size={18} />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          {profileData?.intro_video && (
            <TouchableOpacity
              style={styles.videoButton}
              onPress={() => setVideoModalVisible(true)}>
              <Play color={colors.splashGreen} size={18} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  // Render quick info cards
  const renderQuickInfo = () => (
    <View style={styles.quickInfoContainer}>
      {[
        {
          icon: Mail,
          label: 'Email',
          value: profileData?.email || 'Not provided',
          onPress: profileData?.email
            ? () => Linking.openURL(`mailto:${profileData.email}`)
            : null,
        },
        {
          icon: Phone,
          label: 'Phone',
          value: profileData?.phone || 'Not provided',
          onPress: profileData?.phone
            ? () => Linking.openURL(`tel:${profileData.phone}`)
            : null,
        },
        {
          icon: Globe,
          label: 'Website',
          value: profileData?.website || 'Not provided',
          onPress: profileData?.website
            ? () => handleWebsitePress(profileData.website)
            : null,
        },
      ].map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.quickInfoCard}
          onPress={item.onPress}
          disabled={!item.onPress}>
          <View style={styles.quickInfoIcon}>
            <item.icon color={colors.splashGreen} size={20} />
          </View>
          <View style={styles.quickInfoContent}>
            <Text style={styles.quickInfoLabel}>{item.label}</Text>
            <Text
              style={[
                styles.quickInfoValue,
                item.onPress && styles.quickInfoValueActive,
              ]}
              numberOfLines={1}>
              {item.value}
            </Text>
          </View>
          {item.onPress && (
            <ArrowRight color={colors.textSecondary} size={16} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render about section with modern design
  const renderAboutSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>About</Text>

      {profileData?.bio || profileData?.introduction ? (
        <Text style={styles.bioText}>
          {profileData.introduction || profileData.bio}
        </Text>
      ) : (
        <View style={styles.emptyBio}>
          <User color={colors.textSecondary} size={24} />
          <Text style={styles.emptyBioText}>No bio added yet</Text>
        </View>
      )}

      {/* Skills/Services Tags */}
      {profileData?.services_tags && profileData.services_tags.length > 0 && (
        <View style={styles.skillsContainer}>
          <Text style={styles.skillsTitle}>Skills & Services</Text>
          <View style={styles.skillsWrapper}>
            {profileData.services_tags.slice(0, 6).map((tag, index) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillText}>{tag}</Text>
              </View>
            ))}
            {profileData.services_tags.length > 6 && (
              <View style={styles.moreSkillsTag}>
                <Text style={styles.moreSkillsText}>
                  +{profileData.services_tags.length - 6}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Experience */}
      {profileData?.experience && (
        <View style={styles.experienceCard}>
          <Clock color={colors.splashGreen} size={16} />
          <Text style={styles.experienceText}>
            {profileData.experience} years of experience
          </Text>
        </View>
      )}
    </View>
  );

  // Render projects section with modern design
  const renderProjectsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Projects</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('ProjectsScreen')}
          style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>View All</Text>
          <ArrowRight color={colors.splashGreen} size={16} />
        </TouchableOpacity>
      </View>

      {projectsLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.splashGreen} />
          <Text style={styles.loadingText}>Loading projects...</Text>
        </View>
      ) : projectsData.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.projectsScroll}>
          {projectsData.slice(0, 5).map((project, index) => (
            <TouchableOpacity
              key={project.id || index}
              style={styles.projectCard}
              onPress={() =>
                navigation.navigate('ProjectDetailScreen', {project})
              }>
              <TouchableOpacity
                onPress={() => {
                  if (project.project_imgs && project.project_imgs.length > 0) {
                    openProjectImageGallery(project.project_imgs, 0);
                  }
                }}>
                <Image
                  source={{
                    uri:
                      getFullImageUrl(
                        project.project_imgs?.[0],
                        project.project_title || 'Project',
                      ) ||
                      'https://via.placeholder.com/200x150/22c55e/FFFFFF?text=Project',
                  }}
                  style={styles.projectImage}
                  resizeMode="cover"
                />
                {project.project_imgs && project.project_imgs.length > 1 && (
                  <View style={styles.imageCountBadge}>
                    <Text style={styles.imageCountText}>
                      +{project.project_imgs.length - 1}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.projectDetails}>
                <Text style={styles.projectTitle} numberOfLines={2}>
                  {project.project_title || 'Project Title'}
                </Text>
                <Text style={styles.projectCategory}>
                  {project.project_category || 'Category'}
                </Text>

                <View style={styles.projectMeta}>
                  <View style={styles.projectMetaItem}>
                    <MapPin color={colors.textSecondary} size={12} />
                    <Text style={styles.projectMetaText}>
                      {project.project_location || 'Location'}
                    </Text>
                  </View>
                  <View style={styles.projectMetaItem}>
                    <Calendar color={colors.textSecondary} size={12} />
                    <Text style={styles.projectMetaText}>
                      {calculateProjectDuration(
                        project.start_date,
                        project.end_date,
                      )}{' '}
                      days
                    </Text>
                  </View>
                </View>

                {project.project_rating && renderRating(project.project_rating)}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Briefcase color={colors.textSecondary} size={32} />
          <Text style={styles.emptyStateTitle}>No projects yet</Text>
          <Text style={styles.emptyStateText}>
            Start showcasing your work by adding projects
          </Text>
        </View>
      )}
    </View>
  );

  // Render certificates section
  const renderCertificatesSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Certificates</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CertificatesScreen')}
          style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>View All</Text>
          <ArrowRight color={colors.splashGreen} size={16} />
        </TouchableOpacity>
      </View>

      {certificatesLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.splashGreen} />
          <Text style={styles.loadingText}>Loading certificates...</Text>
        </View>
      ) : certificatesData.length > 0 ? (
        <View style={styles.certificatesGrid}>
          {certificatesData.slice(0, 4).map((certificate, index) => (
            <TouchableOpacity
              key={certificate.id || index}
              style={styles.certificateCard}
              onPress={() =>
                navigation.navigate('CertificateDetailScreen', {certificate})
              }>
              <View style={styles.certificateHeader}>
                <Award color={colors.splashGreen} size={20} />
                {certificate.certificate_img && (
                  <TouchableOpacity style={styles.viewCertButton}>
                    <Eye color={colors.textSecondary} size={14} />
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.certificateTitle} numberOfLines={2}>
                {certificate.certificate_name || 'Certificate Name'}
              </Text>
              <Text style={styles.certificateOrg} numberOfLines={1}>
                {certificate.organization || 'Organization'}
              </Text>
              <Text style={styles.certificateDate}>
                {formatDate(certificate.issue_date)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Award color={colors.textSecondary} size={32} />
          <Text style={styles.emptyStateTitle}>No certificates yet</Text>
          <Text style={styles.emptyStateText}>
            Add certificates to build credibility
          </Text>
        </View>
      )}
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingScreen]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingScreenText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.splashGreen]}
            tintColor={colors.splashGreen}
          />
        }
        showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        {renderProfileHeader()}

        {/* Quick Info */}
        {renderQuickInfo()}

        {/* About Section */}
        {renderAboutSection()}

        {/* Projects Section */}
        {renderProjectsSection()}

        {/* Certificates Section */}
        {renderCertificatesSection()}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Video Modal */}
      <Modal
        visible={videoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVideoModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Introduction Video</Text>
            <TouchableOpacity onPress={() => setVideoModalVisible(false)}>
              <X color={colors.background} size={24} />
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.videoPlaceholder}>
              Video player will be implemented here
            </Text>
          </View>
        </View>
      </Modal>

      {/* Image Gallery Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setImageModalVisible(false)}>
              <X color={colors.background} size={24} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedImageIndex + 1} of {projectImages.length}
            </Text>
          </View>

          {projectImages.length > 0 && (
            <View style={styles.galleryContainer}>
              <Image
                source={{
                  uri: getFullImageUrl(projectImages[selectedImageIndex]),
                }}
                style={styles.galleryImage}
                resizeMode="contain"
              />

              {projectImages.length > 1 && (
                <>
                  <TouchableOpacity
                    style={[styles.galleryNavButton, styles.galleryNavLeft]}
                    onPress={() => navigateImage('prev')}>
                    <ChevronLeft color={colors.background} size={24} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.galleryNavButton, styles.galleryNavRight]}
                    onPress={() => navigateImage('next')}>
                    <ChevronRight color={colors.background} size={24} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Enhanced Modern Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Loading Screen
  loadingScreen: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingScreenText: {
    marginTop: 12,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  // Profile Header - Modern Design
  profileHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginBottom: 20,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileContent: {
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: colors.background,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.background,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    fontSize: fontSizes.xl * 1.2,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  userHandle: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Stats Container - Card Design
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  statNumber: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    shadowColor: colors.splashGreen,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  editButtonText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
  },
  videoButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.splashGreen,
  },

  // Quick Info Cards
  quickInfoContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  quickInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quickInfoContent: {
    flex: 1,
  },
  quickInfoLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    marginBottom: 2,
  },
  quickInfoValue: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.medium,
  },
  quickInfoValueActive: {
    color: colors.splashGreen,
  },

  // Section Styles
  section: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
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
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },

  // About Section
  bioText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
    lineHeight: 24,
    marginBottom: 16,
  },
  emptyBio: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyBioText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    marginTop: 8,
  },
  skillsContainer: {
    marginBottom: 16,
  },
  skillsTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
  },
  skillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.splashGreen,
  },
  skillText: {
    fontSize: fontSizes.sm,
    color: colors.splashGreen,
    fontFamily: fonts.medium,
  },
  moreSkillsTag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  moreSkillsText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },
  experienceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  experienceText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.semiBold,
  },

  // Projects Section
  projectsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  projectCard: {
    width: 220,
    backgroundColor: colors.background,
    borderRadius: 16,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  projectImage: {
    width: '100%',
    height: 140,
  },
  imageCountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCountText: {
    color: colors.background,
    fontSize: fontSizes.xs,
    fontFamily: fonts.bold,
  },
  projectDetails: {
    padding: 16,
  },
  projectTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 6,
  },
  projectCategory: {
    fontSize: fontSizes.sm,
    color: colors.splashGreen,
    fontFamily: fonts.semiBold,
    marginBottom: 12,
  },
  projectMeta: {
    marginBottom: 12,
  },
  projectMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  projectMetaText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Certificates Section
  certificatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  certificateCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  certificateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewCertButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certificateTitle: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 6,
  },
  certificateOrg: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    marginBottom: 4,
  },
  certificateDate: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Rating
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.semiBold,
  },

  // Loading and Empty States
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateTitle: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight + 16,
    paddingBottom: 16,
  },
  modalTitle: {
    color: colors.background,
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  videoPlaceholder: {
    color: colors.background,
    fontSize: fontSizes.lg,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },

  // Gallery Modal
  galleryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryImage: {
    width: screenWidth,
    height: '80%',
  },
  galleryNavButton: {
    position: 'absolute',
    top: '50%',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -25,
  },
  galleryNavLeft: {
    left: 20,
  },
  galleryNavRight: {
    right: 20,
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 20,
  },
});

export default ProfileScreen;
