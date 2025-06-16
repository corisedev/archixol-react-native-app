import React, {useState, useCallback, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  TextInput,
  ScrollView,
  Modal,
  Switch,
} from 'react-native';
import {
  User,
  Edit,
  Camera,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Settings,
  Shield,
  Bell,
  HelpCircle,
  LogOut,
  Save,
  X,
  Eye,
  EyeOff,
  Building,
  Globe,
  DollarSign,
  Package,
  Users,
  ShoppingBag,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import * as API from '../../../api/serviceSupplier';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../context/BackendContext';
import {AuthContext} from '../../../context/AuthContext';

// Fallback data for when API is not available
const FALLBACK_PROFILE = {
  name: 'Demo User',
  email: 'demo@example.com',
  phone: '+92 300 1234567',
  address: '123 Business Street, Rawalpindi, Punjab',
  business_name: 'Demo Business',
  business_type: 'Retail',
  website: 'https://demobusiness.com',
  created_at: new Date().toISOString(),
  profile_image: null,
};

const FALLBACK_STATS = {
  total_revenue: 125000,
  total_orders: 45,
  total_products: 28,
  total_customers: 32,
};

// Edit Profile Modal Component
const EditProfileModal = ({visible, onClose, profile, onSave, loading}) => {
  const [editedProfile, setEditedProfile] = useState(profile || {});
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    setEditedProfile(profile || {});
  }, [profile]);

  const handleSave = () => {
    onSave(editedProfile);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.editModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.editForm}
            showsVerticalScrollIndicator={false}>
            {/* Personal Information */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Personal Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedProfile?.name || ''}
                  onChangeText={text =>
                    setEditedProfile({...editedProfile, name: text})
                  }
                  placeholder="Enter full name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedProfile?.email || ''}
                  onChangeText={text =>
                    setEditedProfile({...editedProfile, email: text})
                  }
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedProfile?.phone || ''}
                  onChangeText={text =>
                    setEditedProfile({...editedProfile, phone: text})
                  }
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={editedProfile?.address || ''}
                  onChangeText={text =>
                    setEditedProfile({...editedProfile, address: text})
                  }
                  placeholder="Enter address"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            {/* Business Information */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Business Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Business Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedProfile?.business_name || ''}
                  onChangeText={text =>
                    setEditedProfile({...editedProfile, business_name: text})
                  }
                  placeholder="Enter business name"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Business Type</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedProfile?.business_type || ''}
                  onChangeText={text =>
                    setEditedProfile({...editedProfile, business_type: text})
                  }
                  placeholder="Enter business type"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Website</Text>
                <TextInput
                  style={styles.textInput}
                  value={editedProfile?.website || ''}
                  onChangeText={text =>
                    setEditedProfile({...editedProfile, website: text})
                  }
                  placeholder="Enter website URL"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Security */}
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Security</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password (optional)</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.textInput, styles.passwordInput]}
                    value={editedProfile?.new_password || ''}
                    onChangeText={text =>
                      setEditedProfile({...editedProfile, new_password: text})
                    }
                    placeholder="Enter new password"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff color={colors.textSecondary} size={16} />
                    ) : (
                      <Eye color={colors.textSecondary} size={16} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}>
              <Text style={[styles.modalButtonText, styles.cancelButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSave}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <>
                  <Save color={colors.background} size={16} />
                  <Text style={styles.modalButtonText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Settings Modal Component
const SettingsModal = ({visible, onClose}) => {
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const {logout} = useContext(AuthContext);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          onClose();
          logout();
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.settingsModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.settingsContent}
            showsVerticalScrollIndicator={false}>
            {/* Notifications */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Notifications</Text>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Bell color={colors.text} size={20} />
                  <Text style={styles.settingText}>Push Notifications</Text>
                </View>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  trackColor={{
                    false: '#E0E0E0',
                    true: colors.splashGreen + '30',
                  }}
                  thumbColor={notifications ? colors.splashGreen : '#F4F4F4'}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Mail color={colors.text} size={20} />
                  <Text style={styles.settingText}>Email Notifications</Text>
                </View>
                <Switch
                  value={emailNotifications}
                  onValueChange={setEmailNotifications}
                  trackColor={{
                    false: '#E0E0E0',
                    true: colors.splashGreen + '30',
                  }}
                  thumbColor={
                    emailNotifications ? colors.splashGreen : '#F4F4F4'
                  }
                />
              </View>
            </View>

            {/* Appearance */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Appearance</Text>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Settings color={colors.text} size={20} />
                  <Text style={styles.settingText}>Dark Mode</Text>
                </View>
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  trackColor={{
                    false: '#E0E0E0',
                    true: colors.splashGreen + '30',
                  }}
                  thumbColor={darkMode ? colors.splashGreen : '#F4F4F4'}
                />
              </View>
            </View>

            {/* Account */}
            <View style={styles.settingsSection}>
              <Text style={styles.settingsSectionTitle}>Account</Text>

              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Shield color={colors.text} size={20} />
                  <Text style={styles.settingText}>Privacy & Security</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <HelpCircle color={colors.text} size={20} />
                  <Text style={styles.settingText}>Help & Support</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingItem, styles.logoutItem]}
                onPress={handleLogout}>
                <View style={styles.settingInfo}>
                  <LogOut color="#F44336" size={20} />
                  <Text style={[styles.settingText, styles.logoutText]}>
                    Logout
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const navigation = useNavigation();
  const {backendUrl} = useContext(BackendContext);

  // Get full image URL helper function
  const getFullImageUrl = relativePath => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;

    const baseUrl = backendUrl || VITE_API_BASE_URL;
    const cleanPath = relativePath.startsWith('/')
      ? relativePath.substring(1)
      : relativePath;
    return `${baseUrl}/${cleanPath}`;
  };

  // Fetch profile data with fallback
  const fetchProfile = useCallback(async () => {
    try {
      // Try to get profile data
      try {
        const profileResponse = await API.getUserProfile();
        console.log('Profile API Response:', profileResponse);
        if (profileResponse) {
          setProfile(profileResponse.user || profileResponse);
        } else {
          setProfile(FALLBACK_PROFILE);
        }
      } catch (profileError) {
        console.log(
          'Profile API failed, using fallback data:',
          profileError.message,
        );
        setProfile(FALLBACK_PROFILE);
      }

      // Try to get stats data
      try {
        const statsResponse = await API.getBusinessStats();
        console.log('Stats API Response:', statsResponse);
        if (statsResponse) {
          setStats(statsResponse.stats || statsResponse);
        } else {
          setStats(FALLBACK_STATS);
        }
      } catch (statsError) {
        console.log(
          'Stats API failed, using fallback data:',
          statsError.message,
        );
        setStats(FALLBACK_STATS);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      // Use fallback data on any error
      setProfile(FALLBACK_PROFILE);
      setStats(FALLBACK_STATS);
      // Only show alert if it's a network or serious error
      if (error.message && !error.message.includes('endpoint')) {
        Alert.alert(
          'Info',
          'Using demo data. Connect to your backend to see real profile information.',
        );
      }
    }
  }, []);

  // Initial data load and refresh on focus
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        await fetchProfile();
        setLoading(false);
      };
      loadData();
    }, [fetchProfile]),
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  // Handle profile update
  const handleUpdateProfile = async updatedProfile => {
    try {
      setUpdateLoading(true);

      // Try to update via API
      try {
        const response = await API.updateUserProfile(updatedProfile);
        if (response) {
          setProfile(response.user || response);
          setEditModalVisible(false);
          Alert.alert('Success', 'Profile updated successfully');
          return;
        }
      } catch (updateError) {
        console.log('Profile update API failed:', updateError.message);
      }

      // Fallback: update local state only
      setProfile(updatedProfile);
      setEditModalVisible(false);
      Alert.alert('Success', 'Profile updated locally (demo mode)');
    } catch (error) {
      console.error('Profile update failed:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle profile image upload
  const handleImageUpload = async () => {
    // Implementation for image picker and upload
    Alert.alert(
      'Feature Coming Soon',
      'Profile image upload will be available soon.',
    );
  };

  // Format date
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Format currency
  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `PKR ${amount.toLocaleString()}`;
    }
    return `PKR ${amount || '0'}`;
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setSettingsModalVisible(true)}>
          <Settings color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Profile Image and Basic Info */}
          <View style={styles.profileHeader}>
            <View style={styles.profileImageContainer}>
              {profile?.profile_image ? (
                <Image
                  source={{uri: getFullImageUrl(profile.profile_image)}}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <User color={colors.background} size={40} />
                </View>
              )}
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={handleImageUpload}>
                <Camera color={colors.background} size={16} />
              </TouchableOpacity>
            </View>

            <View style={styles.profileBasicInfo}>
              <Text style={styles.profileName}>
                {profile?.name || 'User Name'}
              </Text>
              <Text style={styles.profileEmail}>
                {profile?.email || 'user@example.com'}
              </Text>
              {profile?.business_name && (
                <Text style={styles.businessName}>{profile.business_name}</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditModalVisible(true)}>
              <Edit color={colors.splashGreen} size={20} />
            </TouchableOpacity>
          </View>

          {/* Profile Details */}
          <View style={styles.profileDetails}>
            {profile?.phone && (
              <View style={styles.profileDetail}>
                <Phone color={colors.textSecondary} size={16} />
                <Text style={styles.detailText}>{profile.phone}</Text>
              </View>
            )}

            {profile?.address && (
              <View style={styles.profileDetail}>
                <MapPin color={colors.textSecondary} size={16} />
                <Text style={styles.detailText}>{profile.address}</Text>
              </View>
            )}

            {profile?.website && (
              <View style={styles.profileDetail}>
                <Globe color={colors.textSecondary} size={16} />
                <Text style={styles.detailText}>{profile.website}</Text>
              </View>
            )}

            <View style={styles.profileDetail}>
              <Calendar color={colors.textSecondary} size={16} />
              <Text style={styles.detailText}>
                Joined {formatDate(profile?.created_at || profile?.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Business Stats */}
        {stats && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Business Overview</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <DollarSign color={colors.splashGreen} size={24} />
                </View>
                <Text style={styles.statValue}>
                  {formatCurrency(stats.total_revenue || stats.revenue || 0)}
                </Text>
                <Text style={styles.statLabel}>Total Revenue</Text>
              </View>

              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <ShoppingBag color="#2196F3" size={24} />
                </View>
                <Text style={styles.statValue}>
                  {stats.total_orders || stats.orders || 0}
                </Text>
                <Text style={styles.statLabel}>Total Orders</Text>
              </View>

              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <Package color="#FF9800" size={24} />
                </View>
                <Text style={styles.statValue}>
                  {stats.total_products || stats.products || 0}
                </Text>
                <Text style={styles.statLabel}>Products</Text>
              </View>

              <View style={styles.statItem}>
                <View style={styles.statIcon}>
                  <Users color="#9C27B0" size={24} />
                </View>
                <Text style={styles.statValue}>
                  {stats.total_customers || stats.customers || 0}
                </Text>
                <Text style={styles.statLabel}>Customers</Text>
              </View>
            </View>
          </View>
        )}

        {/* Business Information */}
        {profile?.business_name && (
          <View style={styles.businessCard}>
            <Text style={styles.businessCardTitle}>Business Information</Text>

            <View style={styles.businessDetails}>
              <View style={styles.businessDetail}>
                <Building color={colors.textSecondary} size={16} />
                <View style={styles.businessDetailText}>
                  <Text style={styles.businessDetailLabel}>Business Name</Text>
                  <Text style={styles.businessDetailValue}>
                    {profile.business_name}
                  </Text>
                </View>
              </View>

              {profile?.business_type && (
                <View style={styles.businessDetail}>
                  <Package color={colors.textSecondary} size={16} />
                  <View style={styles.businessDetailText}>
                    <Text style={styles.businessDetailLabel}>
                      Business Type
                    </Text>
                    <Text style={styles.businessDetailValue}>
                      {profile.business_type}
                    </Text>
                  </View>
                </View>
              )}

              {profile?.tax_id && (
                <View style={styles.businessDetail}>
                  <Shield color={colors.textSecondary} size={16} />
                  <View style={styles.businessDetailText}>
                    <Text style={styles.businessDetailLabel}>Tax ID</Text>
                    <Text style={styles.businessDetailValue}>
                      {profile.tax_id}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        profile={profile}
        onSave={handleUpdateProfile}
        loading={updateLoading}
      />

      {/* Settings Modal */}
      <SettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
      />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: fontSizes['3xl'],
    fontFamily: fonts.bold,
    color: colors.text,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll View
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Profile Card
  profileCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  profileImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  profileBasicInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: 4,
    fontFamily: fonts.regular,
  },
  businessName: {
    fontSize: fontSizes.sm,
    color: colors.splashGreen,
    fontFamily: fonts.semiBold,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.splashGreen + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDetails: {
    padding: 20,
  },
  profileDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  detailText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.regular,
  },

  // Stats Card
  statsCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statsTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
    textAlign: 'center',
    fontFamily: fonts.regular,
  },

  // Business Card
  businessCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  businessCardTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 16,
  },
  businessDetails: {
    gap: 16,
  },
  businessDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  businessDetailText: {
    flex: 1,
  },
  businessDetailLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 2,
  },
  businessDetailValue: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.semiBold,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  editModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  settingsModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },

  // Edit Form
  editForm: {
    flex: 1,
    paddingHorizontal: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.semiBold,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
    backgroundColor: colors.background,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 48,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },

  // Modal Buttons
  modalButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  saveButton: {
    backgroundColor: colors.splashGreen,
  },
  modalButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },
  cancelButtonText: {
    color: colors.text,
  },

  // Settings Content
  settingsContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsSectionTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  logoutItem: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  logoutText: {
    color: '#F44336',
  },
});

export default ProfileScreen;
