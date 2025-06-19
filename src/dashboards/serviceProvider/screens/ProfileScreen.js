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
  Modal,
  Dimensions,
  StatusBar,
  Linking,
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

// Lucide React Native Icons
import {
  Edit,
  Mail,
  Phone,
  MapPin,
  Globe,
  IdCard,
  Star,
  Award,
  Briefcase,
  FileText,
  Play,
  Plus,
  Eye,
  Camera,
  Settings,
  Share2,
  Download,
  ExternalLink,
  Video,
  X,
  Building,
} from 'lucide-react-native';

const {width: screenWidth} = Dimensions.get('window');

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

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    try {
      console.log('🔍 Fetching profile data...');
      const response = await getProfile();
      setProfileData(response);
      console.log('✅ Profile data fetched successfully');
    } catch (error) {
      console.error('❌ Failed to fetch profile:', error);
      Alert.alert('Error', 'Failed to load profile data. Please try again.');
    }
  }, []);

  // Fetch projects data
  const fetchProjects = useCallback(async () => {
    try {
      setProjectsLoading(true);
      console.log('🔍 Fetching projects data...');
      const response = await getProjects();
      setProjectsData(response.projects || []);
      console.log('✅ Projects data fetched successfully');
    } catch (error) {
      console.error('❌ Failed to fetch projects:', error);
      setProjectsData([]);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  // Fetch certificates data
  const fetchCertificates = useCallback(async () => {
    try {
      setCertificatesLoading(true);
      console.log('🔍 Fetching certificates data...');
      const response = await getCertificate();
      setCertificatesData(response.certificates || []);
      console.log('✅ Certificates data fetched successfully');
    } catch (error) {
      console.error('❌ Failed to fetch certificates:', error);
      setCertificatesData([]);
    } finally {
      setCertificatesLoading(false);
    }
  }, []);

  // Fetch company documents data
  const fetchCompanyDocs = useCallback(async () => {
    try {
      setDocsLoading(true);
      console.log('🔍 Fetching company documents data...');
      const response = await getCompanyDocs();
      setCompanyDocsData(response.documents || []);
      console.log('✅ Company documents data fetched successfully');
    } catch (error) {
      console.error('❌ Failed to fetch company documents:', error);
      setCompanyDocsData([]);
    } finally {
      setDocsLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProfile(),
        fetchProjects(),
        fetchCertificates(),
        fetchCompanyDocs(),
      ]);
      setLoading(false);
    };

    loadInitialData();
  }, [fetchProfile, fetchProjects, fetchCertificates, fetchCompanyDocs]);

  // Refresh all data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchProfile(),
      fetchProjects(),
      fetchCertificates(),
      fetchCompanyDocs(),
    ]);
    setRefreshing(false);
  }, [fetchProfile, fetchProjects, fetchCertificates, fetchCompanyDocs]);

  // Focus effect for screen refresh
  useFocusEffect(
    useCallback(() => {
      if (profileData) {
        fetchProfile(); // Refresh profile on focus
      }
    }, [fetchProfile, profileData]),
  );

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
    if (!startDate || !endDate) return 0;

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

  // Render rating stars
  const renderRating = rating => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);

    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          size={12}
          color={i < fullStars ? '#FFD700' : colors.textSecondary}
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

  // Render profile header
  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      {/* Banner Image */}
      <View style={styles.bannerContainer}>
        <Image
          source={{
            uri:
              getFullImageUrl(profileData?.banner_img) ||
              'https://via.placeholder.com/400x200/22c55e/FFFFFF?text=Banner',
          }}
          style={styles.bannerImage}
          resizeMode="cover"
        />

        {/* Header Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.headerButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerRightActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Share2 color={colors.background} size={20} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('SettingsScreen')}>
              <Settings color={colors.background} size={20} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Profile Info */}
      <View style={styles.profileInfo}>
        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <Image
            source={{
              uri:
                getFullImageUrl(profileData?.profile_img) ||
                'https://via.placeholder.com/120x120/22c55e/FFFFFF?text=' +
                  encodeURIComponent(profileData?.fullname?.charAt(0) || 'U'),
            }}
            style={styles.profileImage}
            resizeMode="cover"
          />
          <TouchableOpacity style={styles.profileImageEdit}>
            <Camera color={colors.background} size={16} />
          </TouchableOpacity>
        </View>

        {/* User Details */}
        <View style={styles.userDetails}>
          <Text style={styles.userName}>
            {profileData?.fullname || 'Your Name'}
          </Text>
          <Text style={styles.userHandle}>
            @{profileData?.username || 'username'}
          </Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{projectsData.length}</Text>
              <Text style={styles.statLabel}>Projects</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{certificatesData.length}</Text>
              <Text style={styles.statLabel}>Certificates</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {profileData?.rating ? profileData.rating.toFixed(1) : '0.0'}
              </Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={handleEditProfile}>
            <Edit color={colors.background} size={16} />
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Render personal information section
  const renderPersonalInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Personal Information</Text>
      <View style={styles.sectionContent}>
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
            value:
              profileData?.phone_number || profileData?.phone || 'Not provided',
            onPress:
              profileData?.phone_number || profileData?.phone
                ? () =>
                    Linking.openURL(
                      `tel:${profileData?.phone_number || profileData?.phone}`,
                    )
                : null,
          },
          {
            icon: MapPin,
            label: 'Address',
            value: profileData?.address || 'Not provided',
          },
          {
            icon: IdCard,
            label: 'CNIC',
            value: profileData?.cnic || 'Not provided',
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
            style={styles.infoItem}
            onPress={item.onPress}
            disabled={!item.onPress}>
            <View style={styles.infoIcon}>
              <item.icon color={colors.splashGreen} size={20} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{item.label}</Text>
              <Text
                style={[
                  styles.infoValue,
                  item.onPress && styles.infoValueClickable,
                ]}>
                {item.value}
              </Text>
            </View>
            {item.onPress && (
              <ExternalLink color={colors.textSecondary} size={16} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render about section
  const renderAboutSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>About</Text>
      <View style={styles.sectionContent}>
        <Text style={styles.aboutText}>
          {profileData?.introduction ||
            profileData?.bio ||
            'No introduction provided yet.'}
        </Text>

        {/* Services Tags */}
        {profileData?.services_tags && profileData.services_tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsTitle}>Services:</Text>
            <View style={styles.tagsWrapper}>
              {profileData.services_tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Experience */}
        {profileData?.experience && (
          <View style={styles.experienceContainer}>
            <Text style={styles.experienceText}>
              {profileData.experience} years of experience
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // Render intro video section
  const renderIntroVideo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Introduction Video</Text>
      <View style={styles.sectionContent}>
        {profileData?.intro_video ? (
          <TouchableOpacity
            style={styles.videoContainer}
            onPress={() => setVideoModalVisible(true)}>
            <View style={styles.videoThumbnail}>
              <Video color={colors.background} size={48} />
              <Text style={styles.videoText}>Watch Introduction</Text>
            </View>
            <Play color={colors.background} size={24} style={styles.playIcon} />
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyVideoContainer}>
            <Video color={colors.textSecondary} size={48} />
            <Text style={styles.emptyVideoText}>No introduction video yet</Text>
            <TouchableOpacity style={styles.addVideoButton}>
              <Plus color={colors.splashGreen} size={16} />
              <Text style={styles.addVideoText}>Add Video</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  // Render projects section
  const renderProjectsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Projects ({projectsData.length})
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('ProjectsScreen')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionContent}>
        {projectsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.splashGreen} />
            <Text style={styles.loadingText}>Loading projects...</Text>
          </View>
        ) : projectsData.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {projectsData.slice(0, 5).map((project, index) => (
              <TouchableOpacity
                key={project.id || index}
                style={styles.projectCard}
                onPress={() =>
                  navigation.navigate('ProjectDetailScreen', {project})
                }>
                {/* Project Image */}
                <TouchableOpacity
                  onPress={() => {
                    if (
                      project.project_imgs &&
                      project.project_imgs.length > 0
                    ) {
                      openProjectImageGallery(project.project_imgs, 0);
                    }
                  }}>
                  <Image
                    source={{
                      uri:
                        getFullImageUrl(project.project_imgs?.[0]) ||
                        'https://via.placeholder.com/200x150/22c55e/FFFFFF?text=' +
                          encodeURIComponent(
                            project.project_title || 'Project',
                          ),
                    }}
                    style={styles.projectImage}
                    resizeMode="cover"
                  />

                  {/* Image Count Indicator */}
                  {project.project_imgs && project.project_imgs.length > 1 && (
                    <View style={styles.imageCountBadge}>
                      <Text style={styles.imageCountText}>
                        +{project.project_imgs.length - 1}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>

                {/* Project Details */}
                <View style={styles.projectInfo}>
                  <Text style={styles.projectTitle} numberOfLines={2}>
                    {project.project_title || 'Project Title'}
                  </Text>
                  <Text style={styles.projectCategory}>
                    {project.project_category || 'Category'}
                  </Text>
                  <Text style={styles.projectLocation}>
                    📍 {project.project_location || 'Location'}
                  </Text>
                  <Text style={styles.projectDuration}>
                    ⏱️{' '}
                    {calculateProjectDuration(
                      project.start_date,
                      project.end_date,
                    )}{' '}
                    days
                  </Text>
                  {project.project_rating &&
                    renderRating(project.project_rating)}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <Briefcase color={colors.textSecondary} size={48} />
            <Text style={styles.emptyText}>No projects yet</Text>
            <Text style={styles.emptySubtext}>
              Add your first project to showcase your work
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // Render certificates section
  const renderCertificatesSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Certificates ({certificatesData.length})
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CertificatesScreen')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionContent}>
        {certificatesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.splashGreen} />
            <Text style={styles.loadingText}>Loading certificates...</Text>
          </View>
        ) : certificatesData.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {certificatesData.slice(0, 5).map((certificate, index) => (
              <TouchableOpacity
                key={certificate.id || index}
                style={styles.certificateCard}
                onPress={() =>
                  navigation.navigate('CertificateDetailScreen', {certificate})
                }>
                <View style={styles.certificateIcon}>
                  <Award color={colors.splashGreen} size={32} />
                </View>

                <View style={styles.certificateInfo}>
                  <Text style={styles.certificateTitle} numberOfLines={2}>
                    {certificate.certificate_name || 'Certificate Name'}
                  </Text>
                  <Text style={styles.certificateOrg}>
                    {certificate.organization || 'Organization'}
                  </Text>
                  <Text style={styles.certificateDate}>
                    {formatDate(certificate.issue_date)}
                  </Text>

                  {certificate.certificate_img && (
                    <TouchableOpacity style={styles.viewCertButton}>
                      <Eye color={colors.splashGreen} size={14} />
                      <Text style={styles.viewCertText}>View</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyContainer}>
            <Award color={colors.textSecondary} size={48} />
            <Text style={styles.emptyText}>No certificates yet</Text>
            <Text style={styles.emptySubtext}>
              Add your certificates to build credibility
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // Render company documents section
  const renderCompanyDocsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          Company Documents ({companyDocsData.length})
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('CompanyDocsScreen')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionContent}>
        {docsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.splashGreen} />
            <Text style={styles.loadingText}>Loading documents...</Text>
          </View>
        ) : companyDocsData.length > 0 ? (
          <View style={styles.documentsGrid}>
            {companyDocsData.slice(0, 6).map((doc, index) => (
              <TouchableOpacity
                key={doc.id || index}
                style={styles.documentCard}
                onPress={() =>
                  navigation.navigate('DocumentDetailScreen', {document: doc})
                }>
                <View style={styles.documentIcon}>
                  <FileText color={colors.splashGreen} size={24} />
                </View>

                <Text style={styles.documentTitle} numberOfLines={2}>
                  {doc.document_name || 'Document'}
                </Text>
                <Text style={styles.documentType}>
                  {doc.document_type || 'PDF'}
                </Text>

                <TouchableOpacity style={styles.downloadButton}>
                  <Download color={colors.textSecondary} size={14} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Building color={colors.textSecondary} size={48} />
            <Text style={styles.emptyText}>No company documents yet</Text>
            <Text style={styles.emptySubtext}>
              Upload your business documents
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingScreen]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingScreenText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

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

        {/* Personal Information */}
        {renderPersonalInfo()}

        {/* About Section */}
        {renderAboutSection()}

        {/* Introduction Video */}
        {renderIntroVideo()}

        {/* Projects Section */}
        {renderProjectsSection()}

        {/* Certificates Section */}
        {renderCertificatesSection()}

        {/* Company Documents Section */}
        {renderCompanyDocsSection()}

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Video Modal */}
      <Modal
        visible={videoModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setVideoModalVisible(false)}>
        <View style={styles.videoModalOverlay}>
          <View style={styles.videoModalHeader}>
            <Text style={styles.videoModalTitle}>Introduction Video</Text>
            <TouchableOpacity onPress={() => setVideoModalVisible(false)}>
              <X color={colors.background} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.videoModalContent}>
            {profileData?.intro_video && (
              <video
                source={{uri: getFullImageUrl(profileData.intro_video)}}
                style={styles.modalVideo}
                controls
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Image Gallery Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}>
        <View style={styles.galleryModalOverlay}>
          <View style={styles.galleryHeader}>
            <TouchableOpacity onPress={() => setImageModalVisible(false)}>
              <X color={colors.background} size={24} />
            </TouchableOpacity>
            <Text style={styles.galleryTitle}>
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
                    <Text style={styles.galleryNavText}>‹</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.galleryNavButton, styles.galleryNavRight]}
                    onPress={() => navigateImage('next')}>
                    <Text style={styles.galleryNavText}>›</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

// Enhanced Styles
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
    fontFamily: fonts.regular,
  },

  // Profile Header
  profileHeader: {
    backgroundColor: colors.background,
    marginBottom: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerContainer: {
    position: 'relative',
    height: 200,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerActions: {
    position: 'absolute',
    top: StatusBar.currentHeight + 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    color: colors.background,
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  profileInfo: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 8,
  },
  profileImageContainer: {
    position: 'relative',
    marginTop: -40,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.background,
  },
  profileImageEdit: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDetails: {
    flex: 1,
    marginLeft: 16,
    marginTop: -20,
  },
  userName: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  userHandle: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    gap: 6,
  },
  editProfileText: {
    color: colors.background,
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
  },

  // Section Styles
  section: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  sectionContent: {
    flex: 1,
  },
  seeAllText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },

  // Personal Info Styles
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.medium,
  },
  infoValueClickable: {
    color: colors.splashGreen,
  },

  // About Section Styles
  aboutText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
    lineHeight: 24,
    marginBottom: 16,
  },
  tagsContainer: {
    marginBottom: 16,
  },
  tagsTitle: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 8,
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: fontSizes.sm,
    color: colors.splashGreen,
    fontFamily: fonts.medium,
  },
  experienceContainer: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
  },
  experienceText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.semiBold,
    textAlign: 'center',
  },

  // Video Section Styles
  videoContainer: {
    position: 'relative',
    backgroundColor: colors.splashGreen,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  videoThumbnail: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    marginTop: 8,
  },
  playIcon: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  emptyVideoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyVideoText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 8,
    marginBottom: 16,
  },
  addVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addVideoText: {
    color: colors.splashGreen,
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
  },

  // Projects Section Styles
  projectCard: {
    width: 200,
    backgroundColor: colors.background,
    borderRadius: 12,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  imageCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  imageCountText: {
    color: colors.background,
    fontSize: fontSizes.xs,
    fontFamily: fonts.bold,
  },
  projectInfo: {
    padding: 12,
  },
  projectTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  projectCategory: {
    fontSize: fontSizes.sm,
    color: colors.splashGreen,
    fontFamily: fonts.medium,
    marginBottom: 4,
  },
  projectLocation: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 2,
  },
  projectDuration: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 8,
  },

  // Certificates Section Styles
  certificateCard: {
    width: 180,
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  certificateIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  certificateInfo: {
    alignItems: 'center',
    width: '100%',
  },
  certificateTitle: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  certificateOrg: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginBottom: 4,
  },
  certificateDate: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 8,
  },
  viewCertButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  viewCertText: {
    fontSize: fontSizes.xs,
    color: colors.splashGreen,
    fontFamily: fonts.semiBold,
  },

  // Company Documents Styles
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  documentCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  documentTitle: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  documentType: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  downloadButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Common Styles
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
    fontFamily: fonts.regular,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    textAlign: 'center',
  },

  // Rating Styles
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginLeft: 4,
  },

  // Modal Styles
  videoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  videoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight + 16,
    paddingBottom: 16,
  },
  videoModalTitle: {
    color: colors.background,
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
  },
  videoModalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalVideo: {
    width: screenWidth - 40,
    height: (screenWidth - 40) * 0.56, // 16:9 aspect ratio
    borderRadius: 12,
  },

  // Gallery Modal Styles
  galleryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight + 16,
    paddingBottom: 16,
  },
  galleryTitle: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
  },
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
  galleryNavText: {
    color: colors.background,
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.bold,
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 20,
  },
});

export default ProfileScreen;
