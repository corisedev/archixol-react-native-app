import React, {useState, useCallback, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Camera,
  UserCheck,
} from 'lucide-react-native';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {BackendContext} from '../../../context/BackendContext';
import {
  getSupplierProfile,
  updateSupplierProfile,
} from '../../../api/serviceSupplier';
import {VITE_API_BASE_URL} from '@env';

const PersonalProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [formData, setFormData] = useState({
    profile_image: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
  });

  const navigation = useNavigation();
  const {backendUrl} = useContext(BackendContext);

  // Get full image URL
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
    return `${baseUrl}/${cleanPath}`;
  };

  // Fetch supplier profile
  const fetchSupplierProfile = useCallback(async () => {
    try {
      const response = await getSupplierProfile();
      console.log('Supplier profile:', response);

      if (response && response.data) {
        setProfileData(response.data);
        setFormData({
          profile_image: response.data.profile_image || '',
          first_name: response.data.first_name || '',
          last_name: response.data.last_name || '',
          email: response.data.email || '',
          phone_number: response.data.phone_number || '',
        });
      }
    } catch (error) {
      console.error('Failed to load supplier profile:', error);
      Alert.alert('Error', 'Unable to load profile. Please try again.');
    }
  }, []);

  // Initial data load
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        await fetchSupplierProfile();
        setLoading(false);
      };
      loadData();
    }, [fetchSupplierProfile]),
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchSupplierProfile();
    setRefreshing(false);
  }, [fetchSupplierProfile]);

  // Update form field
  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle image selection
  const handleImageSelection = () => {
    Alert.alert('Change Profile Picture', 'Choose an option', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Camera', onPress: () => openCamera()},
      {text: 'Gallery', onPress: () => openGallery()},
    ]);
  };

  // Open camera
  const openCamera = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 500,
      maxHeight: 500,
    };

    launchCamera(options, response => {
      if (response.assets && response.assets[0]) {
        const imageFile = {
          uri: response.assets[0].uri,
          type: response.assets[0].type,
          name: response.assets[0].fileName || 'profile.jpg',
        };
        updateField('profile_image', imageFile);
      }
    });
  };

  // Open gallery
  const openGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 500,
      maxHeight: 500,
    };

    launchImageLibrary(options, response => {
      if (response.assets && response.assets[0]) {
        const imageFile = {
          uri: response.assets[0].uri,
          type: response.assets[0].type,
          name: response.assets[0].fileName || 'profile.jpg',
        };
        updateField('profile_image', imageFile);
      }
    });
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.first_name?.trim()) {
      Alert.alert('Error', 'First name is required');
      return;
    }

    if (!formData.email?.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    try {
      setSaving(true);
      const response = await updateSupplierProfile(formData);

      if (response && response.success !== false) {
        Alert.alert('Success', 'Profile updated successfully');
        await fetchSupplierProfile();
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Render input field
  const renderInputField = (
    label,
    field,
    IconComponent,
    placeholder,
    keyboardType = 'default',
    editable = true,
  ) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldLabelContainer}>
          <IconComponent color={colors.textSecondary} size={16} />
          <Text style={styles.fieldLabel}>{label}</Text>
        </View>
      </View>
      <TextInput
        style={[styles.fieldInput, !editable && styles.fieldInputDisabled]}
        value={formData[field] || ''}
        onChangeText={value => updateField(field, value)}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        editable={editable}
      />
    </View>
  );

  // Get profile image source
  const getProfileImageSource = () => {
    if (formData.profile_image) {
      if (typeof formData.profile_image === 'object') {
        // New image selected
        return {uri: formData.profile_image.uri};
      } else {
        // Existing image URL
        return {uri: getFullImageUrl(formData.profile_image)};
      }
    }
    return null;
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
      {/* Header - Same as SettingsScreen */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Personal Profile</Text>
          <Text style={styles.headerSubtitle}>
            Manage your personal information
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Save color={colors.background} size={20} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Profile Header Section */}
        <View style={styles.profileHeaderSection}>
          <View style={styles.profileImageSection}>
            <TouchableOpacity
              style={styles.profileImageContainer}
              onPress={handleImageSelection}>
              {getProfileImageSource() ? (
                <Image
                  source={getProfileImageSource()}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <User color={colors.textSecondary} size={40} />
                </View>
              )}
              <View style={styles.cameraOverlay}>
                <Camera color={colors.background} size={16} />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfoSection}>
            <Text style={styles.profileName}>
              {profileData?.first_name || 'ArchiXol'}{' '}
              {profileData?.last_name || 'User'}
            </Text>
            <Text style={styles.profileRole}>
              Store Owner | {profileData?.email || 'example@gmail.com'}
            </Text>
          </View>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Text style={styles.sectionDescription}>
            Update your personal details and contact information
          </Text>
          <View style={styles.sectionContent}>
            {/* Name Fields */}
            <View style={styles.twoColumnContainer}>
              <View style={styles.halfWidth}>
                {renderInputField(
                  'First Name',
                  'first_name',
                  User,
                  'Enter first name',
                )}
              </View>
              <View style={styles.halfWidth}>
                {renderInputField(
                  'Last Name',
                  'last_name',
                  User,
                  'Enter last name',
                )}
              </View>
            </View>

            {/* Email and Phone */}
            <View style={styles.twoColumnContainer}>
              <View style={styles.halfWidth}>
                {renderInputField(
                  'Email',
                  'email',
                  Mail,
                  'Enter email address',
                  'email-address',
                )}
              </View>
              <View style={styles.halfWidth}>
                {renderInputField(
                  'Phone Number',
                  'phone_number',
                  Phone,
                  'Enter phone number',
                  'phone-pad',
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Profile Stats Section (Optional) */}
        {profileData && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            <View style={styles.sectionContent}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <UserCheck color={colors.splashGreen} size={20} />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statLabel}>Account Status</Text>
                  <Text style={styles.statValue}>Active</Text>
                </View>
              </View>

              <View style={styles.separator} />

              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Mail color={colors.splashGreen} size={20} />
                </View>
                <View style={styles.statContent}>
                  <Text style={styles.statLabel}>Email Verified</Text>
                  <Text style={styles.statValue}>
                    {profileData.email_verified ? 'Yes' : 'No'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
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

  // Header - Same as SettingsScreen
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
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },

  // Profile Header
  profileHeaderSection: {
    backgroundColor: colors.background,
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  profileImageSection: {
    marginBottom: 16,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  profileImagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  cameraOverlay: {
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
  profileInfoSection: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  profileRole: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },

  // Sections
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  // Fields
  fieldContainer: {
    marginBottom: 20,
  },
  fieldHeader: {
    marginBottom: 8,
  },
  fieldLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  fieldInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fieldInputDisabled: {
    backgroundColor: '#F0F0F0',
    color: colors.textSecondary,
  },

  // Layout
  twoColumnContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },

  // Stats
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 2,
  },
  statValue: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
});

export default PersonalProfileScreen;
