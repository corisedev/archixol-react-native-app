import React, {useState, useContext} from 'react';
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
  Share,
  Dimensions,
} from 'react-native';
import {colors} from '../../../../utils/colors';;;
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {
  getProfile,
  getCertificate,
  getProjects,
  deleteIntroVideo,
} from '../../../../api/serviceProvider';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../../context/BackendContext';

const {width: screenWidth} = Dimensions.get('window');

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [profile, setProfile] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingVideo, setDeletingVideo] = useState(false);

  // Get backend URL from context or env
  const {backendUrl} = useContext(BackendContext);
  const BASE_IMAGE_URL = backendUrl || VITE_API_BASE_URL;

  // Helper function to get full image URL
  const getFullImageUrl = relativePath => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;
    return `${BASE_IMAGE_URL}${relativePath}`;
  };

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchAllData();
    }, []),
  );

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [profileData, certificatesData, projectsData] = await Promise.all([
        getProfile(),
        getCertificate(),
        getProjects(),
      ]);

      const actualProfile = profileData.user || profileData;
      setProfile(actualProfile);
      setCertificates(certificatesData.certificates || []);
      setProjects(projectsData.projects || []);
    } catch (error) {
      console.error('Failed to load profile data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', {profile});
  };

  const handleManageCertificates = () => {
    navigation.navigate('ManageCertificates');
  };

  const handleManageProjects = () => {
    navigation.navigate('ManageProjects');
  };

  const handleShareProfile = async () => {
    try {
      const shareMessage = `Check out ${
        profile.fullname || profile.username
      }'s professional profile!\n\n${
        profile.introduction || 'Experienced service provider'
      }\n\nServices: ${
        profile.services?.join(', ') || 'Various services available'
      }`;

      await Share.share({
        message: shareMessage,
        title: `${profile.fullname || profile.username}'s Profile`,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share profile');
    }
  };

  const handleDeleteIntroVideo = async () => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete your intro video?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDeleteVideo,
        },
      ],
    );
  };

  const confirmDeleteVideo = async () => {
    try {
      setDeletingVideo(true);
      await deleteIntroVideo({intro_video: profile.intro_video});
      setProfile(prev => ({...prev, intro_video: null}));
      Alert.alert('Success', 'Intro video deleted successfully');
    } catch (error) {
      console.error('Failed to delete video:', error);
      Alert.alert('Error', 'Failed to delete intro video');
    } finally {
      setDeletingVideo(false);
    }
  };

  const getCompletionPercentage = () => {
    const fields = [
      profile?.fullname,
      profile?.email,
      profile?.phone_number,
      profile?.introduction,
      profile?.profile_img,
      profile?.experience,
      profile?.service_location,
      profile?.services?.length > 0,
      projects?.length > 0,
      certificates?.length > 0,
    ];

    const completedFields = fields.filter(field => field).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const renderProfileHeader = () => {
    const profileImageUrl = getFullImageUrl(profile?.profile_img);
    const bannerImageUrl = getFullImageUrl(profile?.banner_img);
    const completionPercentage = getCompletionPercentage();

    return (
      <View style={styles.profileHeader}>
        {/* Enhanced Banner */}
        <View style={styles.bannerContainer}>
          {bannerImageUrl ? (
            <Image source={{uri: bannerImageUrl}} style={styles.bannerImage} />
          ) : (
            <View style={styles.bannerGradient}>
              <View style={styles.bannerPattern} />
            </View>
          )}

          {/* Header Actions */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={handleShareProfile}>
              <Text style={styles.headerActionIcon}>📤</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerActionButton, styles.editActionButton]}
              onPress={handleEditProfile}>
              <Text style={styles.editActionIcon}>✏️</Text>
              <Text style={styles.editActionText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Profile Image with Enhanced Shadow */}
          <View style={styles.profileImageContainer}>
            <View style={styles.profileImageShadow}>
              {profileImageUrl ? (
                <Image
                  source={{uri: profileImageUrl}}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Text style={styles.profileImagePlaceholderText}>👤</Text>
                </View>
              )}
              <View style={styles.onlineIndicator} />
            </View>
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfoContainer}>
          <Text style={styles.profileName}>
            {profile.fullname || 'No Name'}
          </Text>
          <Text style={styles.profileUsername}>@{profile.username}</Text>

          {/* Profile Stats with Icons */}
          <View style={styles.profileStatsContainer}>
            {profile.experience && (
              <View style={styles.statPill}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statIcon}>⏱️</Text>
                </View>
                <Text style={styles.statText}>
                  {profile.experience} years exp.
                </Text>
              </View>
            )}
            {profile.service_location && (
              <View style={styles.statPill}>
                <View style={styles.statIconContainer}>
                  <Text style={styles.statIcon}>📍</Text>
                </View>
                <Text style={styles.statText}>{profile.service_location}</Text>
              </View>
            )}
          </View>

          {/* Enhanced Profile Completion */}
          <View style={styles.completionSection}>
            <View style={styles.completionHeader}>
              <Text style={styles.completionLabel}>Profile Completion</Text>
              <Text style={styles.completionPercentage}>
                {completionPercentage}%
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {width: `${completionPercentage}%`},
                  ]}
                />
              </View>
            </View>
            {completionPercentage < 100 && (
              <TouchableOpacity
                style={styles.completeProfileButton}
                onPress={handleEditProfile}>
                <Text style={styles.completeProfileText}>Complete Profile</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Introduction */}
          {profile.introduction && (
            <View style={styles.introductionCard}>
              <Text style={styles.introductionText}>
                {profile.introduction}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderQuickStats = () => {
    const statsData = [
      {
        icon: '📁',
        label: 'Projects',
        value: projects.length,
        color: '#E3F2FD',
        action: handleManageProjects,
      },
      {
        icon: '🏆',
        label: 'Certificates',
        value: certificates.length,
        color: '#E8F5E9',
        action: handleManageCertificates,
      },
      {
        icon: '🛠️',
        label: 'Services',
        value: profile?.services_tags?.length || 0,
        color: '#FFF3E0',
        action: () => navigation.navigate('Services'),
      },
      {
        icon: '⭐',
        label: 'Rating',
        value: '4.8',
        color: '#F3E5F5',
        action: () => {},
      },
    ];

    return (
      <View style={styles.quickStatsContainer}>
        {statsData.map((stat, index) => (
          <TouchableOpacity
            key={index}
            style={styles.statCard}
            onPress={stat.action}
            activeOpacity={0.7}>
            <View style={[styles.statCardIcon, {backgroundColor: stat.color}]}>
              <Text style={styles.statCardIconText}>{stat.icon}</Text>
            </View>
            <Text style={styles.statCardValue}>{stat.value}</Text>
            <Text style={styles.statCardLabel}>{stat.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderQuickActions = () => {
    const actions = [
      {
        icon: '✏️',
        title: 'Edit Profile',
        subtitle: 'Update your information',
        color: '#E3F2FD',
        action: handleEditProfile,
      },
      {
        icon: '📁',
        title: 'Manage Projects',
        subtitle: `${projects.length} projects`,
        color: '#E8F5E9',
        action: handleManageProjects,
      },
      {
        icon: '🏆',
        title: 'Certificates',
        subtitle: `${certificates.length} certificates`,
        color: '#FFF3E0',
        action: handleManageCertificates,
      },
      {
        icon: '🏢',
        title: 'Company Profile',
        subtitle: 'Business details',
        color: '#F3E5F5',
        action: () => navigation.navigate('CompanyProfile'),
      },
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionCard}
              onPress={action.action}
              activeOpacity={0.7}>
              <View
                style={[
                  styles.quickActionIcon,
                  {backgroundColor: action.color},
                ]}>
                <Text style={styles.quickActionIconText}>{action.icon}</Text>
              </View>
              <Text style={styles.quickActionTitle}>{action.title}</Text>
              <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderContactInfo = () => {
    const contactItems = [
      {icon: '📧', label: 'Email', value: profile.email, color: '#E3F2FD'},
      {
        icon: '📱',
        label: 'Phone',
        value: profile.phone_number,
        color: '#E8F5E9',
      },
      {icon: '🌐', label: 'Website', value: profile.website, color: '#FFF3E0'},
      {icon: '🏠', label: 'Address', value: profile.address, color: '#F3E5F5'},
    ].filter(item => item.value);

    if (contactItems.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📞 Contact Information</Text>
        <View style={styles.contactGrid}>
          {contactItems.map((item, index) => (
            <View key={index} style={styles.contactCard}>
              <View
                style={[
                  styles.contactIconContainer,
                  {backgroundColor: item.color},
                ]}>
                <Text style={styles.contactIcon}>{item.icon}</Text>
              </View>
              <View style={styles.contactContent}>
                <Text style={styles.contactLabel}>{item.label}</Text>
                <Text style={styles.contactValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderServices = () => {
    if (!profile.services_tags || profile.services_tags.length === 0)
      return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🛠️ Services Offered</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Services')}>
            <Text style={styles.seeAllText}>Manage</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.servicesContainer}>
          {profile.services_tags.slice(0, 8).map((service, index) => (
            <View key={index} style={styles.serviceChip}>
              <Text style={styles.serviceChipText}>{service}</Text>
            </View>
          ))}
          {profile.services_tags.length > 8 && (
            <View style={[styles.serviceChip, styles.moreServicesChip]}>
              <Text style={[styles.serviceChipText, styles.moreServicesText]}>
                +{profile.services_tags.length - 8} more
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderIntroVideo = () => {
    if (!profile.intro_video) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎥 Introduction Video</Text>
          <TouchableOpacity
            style={styles.deleteVideoButton}
            onPress={handleDeleteIntroVideo}
            disabled={deletingVideo}>
            {deletingVideo ? (
              <ActivityIndicator size="small" color="#F44336" />
            ) : (
              <Text style={styles.deleteVideoText}>🗑️</Text>
            )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.videoCard} activeOpacity={0.8}>
          <View style={styles.videoPlayButton}>
            <Text style={styles.videoPlayIcon}>▶️</Text>
          </View>
          <View style={styles.videoInfo}>
            <Text style={styles.videoTitle}>Introduction Video</Text>
            <Text style={styles.videoSubtitle}>
              Tap to play your intro video
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderRecentActivity = () => {
    const hasActivity = projects.length > 0 || certificates.length > 0;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 Recent Activity</Text>

        {hasActivity ? (
          <View style={styles.activityContainer}>
            {/* Recent Projects */}
            {projects.length > 0 && (
              <View style={styles.activityGroup}>
                <Text style={styles.activityGroupTitle}>Latest Projects</Text>
                {projects.slice(0, 3).map((project, index) => (
                  <View key={index} style={styles.activityItem}>
                    <View style={styles.activityIconContainer}>
                      <Text style={styles.activityIcon}>📁</Text>
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>
                        {project.project_title}
                      </Text>
                      <Text style={styles.activitySubtitle}>
                        {project.project_category} •{' '}
                        {project.dated
                          ? new Date(project.dated).toLocaleDateString()
                          : 'No date'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Recent Certificates */}
            {certificates.length > 0 && (
              <View style={styles.activityGroup}>
                <Text style={styles.activityGroupTitle}>
                  Latest Certificates
                </Text>
                {certificates.slice(0, 3).map((certificate, index) => (
                  <View key={index} style={styles.activityItem}>
                    <View style={styles.activityIconContainer}>
                      <Text style={styles.activityIcon}>🏆</Text>
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>
                        {certificate.title}
                      </Text>
                      <Text style={styles.activitySubtitle}>
                        {certificate.dated
                          ? new Date(certificate.dated).toLocaleDateString()
                          : 'No date'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Text style={styles.emptyStateIconText}>📝</Text>
            </View>
            <Text style={styles.emptyStateTitle}>No Recent Activity</Text>
            <Text style={styles.emptyStateSubtitle}>
              Add projects and certificates to showcase your work
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={handleEditProfile}>
              <Text style={styles.emptyStateButtonText}>Get Started</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color={colors.splashGreen} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      );
    }

    if (!profile) {
      return (
        <View style={[styles.container, styles.centered]}>
          <Text style={styles.errorIcon}>👤</Text>
          <Text style={styles.errorText}>Profile not found</Text>
          <Text style={styles.errorSubtext}>Unable to load profile data</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAllData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.splashGreen]}
            tintColor={colors.splashGreen}
          />
        }>
        {renderProfileHeader()}
        {renderQuickStats()}
        {renderQuickActions()}
        {renderContactInfo()}
        {renderServices()}
        {renderIntroVideo()}
        {renderRecentActivity()}
        <View style={styles.bottomPadding} />
      </ScrollView>
    );
  };

  return renderContent();
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },

  // Profile Header
  profileHeader: {
    backgroundColor: colors.background,
    marginBottom: 20,
  },
  bannerContainer: {
    height: 180,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerGradient: {
    flex: 1,
    backgroundColor: colors.splashGreen,
    position: 'relative',
  },
  bannerPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerActions: {
    position: 'absolute',
    top: 20,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerActionIcon: {
    fontSize: 16,
  },
  editActionIcon: {
    fontSize: 14,
  },
  editActionText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  profileImageContainer: {
    position: 'absolute',
    bottom: -50,
    left: screenWidth / 2 - 60,
    alignItems: 'center',
  },
  profileImageShadow: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: colors.background,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: colors.background,
  },
  profileImagePlaceholderText: {
    fontSize: 48,
    color: colors.textSecondary,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    borderWidth: 3,
    borderColor: colors.background,
  },

  // Profile Info
  profileInfoContainer: {
    paddingTop: 70,
    paddingHorizontal: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  profileName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  profileUsername: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  profileStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statIconContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    fontSize: 12,
  },
  statText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },

  // Profile Completion
  completionSection: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  completionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  completionPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.splashGreen,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.splashGreen,
    borderRadius: 3,
  },
  completeProfileButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'center',
  },
  completeProfileText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },

  // Introduction
  introductionCard: {
    width: '100%',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
  },
  introductionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    textAlign: 'center',
  },

  // Quick Stats
  quickStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statCardIconText: {
    fontSize: 20,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statCardLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Common Section Styles
  section: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.splashGreen,
  },

  // Quick Actions
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '47%',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionIconText: {
    fontSize: 20,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Contact Info
  contactGrid: {
    gap: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactIcon: {
    fontSize: 16,
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },

  // Services
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  moreServicesChip: {
    backgroundColor: colors.splashGreen,
    borderColor: colors.splashGreen,
  },
  serviceChipText: {
    fontSize: 12,
    color: '#1565C0',
    fontWeight: '600',
  },
  moreServicesText: {
    color: colors.background,
  },

  // Video Section
  deleteVideoButton: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteVideoText: {
    fontSize: 16,
  },
  videoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  videoPlayButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.splashGreen,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  videoPlayIcon: {
    fontSize: 24,
    marginLeft: 4,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  videoSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Activity Section
  activityContainer: {
    gap: 20,
  },
  activityGroup: {
    gap: 12,
  },
  activityGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityIcon: {
    fontSize: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateIconText: {
    fontSize: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyStateButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyStateButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },

  // Bottom Padding
  bottomPadding: {
    height: 20,
  },
});

export default ProfileScreen;
