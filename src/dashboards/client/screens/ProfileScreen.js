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
  TextInput,
  Modal,
  Image,
  Switch,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {colors} from '../../../utils/colors';
import {
  getClientProfile,
  updateClientProfile,
  changePassword,
  getAdditionalSettings,
  updateAdditionalSettings,
} from '../../../api/client';

// Import your icons here
import EditIcon from '../../../assets/images/icons/company.png';
import SecurityIcon from '../../../assets/images/icons/company.png';
import NotificationIcon from '../../../assets/images/icons/company.png';
import PrivacyIcon from '../../../assets/images/icons/company.png';
import LogoutIcon from '../../../assets/images/icons/company.png';
import CameraIcon from '../../../assets/images/icons/company.png';
import CheckIcon from '../../../assets/images/icons/company.png';
import LocationIcon from '../../../assets/images/icons/location.png';
import PhoneIcon from '../../../assets/images/icons/company.png';
import EmailIcon from '../../../assets/images/icons/company.png';

const ProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Profile form data
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    bio: '',
    profile_image: null,
  });

  // Password form data
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Settings form data
  const [settingsForm, setSettingsForm] = useState({
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    marketing_emails: false,
    privacy_profile: 'public',
    language: 'en',
    currency: 'PKR',
  });

  // Fetch profile data
  const fetchProfileData = useCallback(async () => {
    try {
      const response = await getClientProfile();
      console.log('Profile API Response:', response);
      setProfileData(response);
      setProfileForm({
        first_name: response.first_name || '',
        last_name: response.last_name || '',
        email: response.email || '',
        phone: response.phone || '',
        address: response.address || '',
        city: response.city || '',
        country: response.country || '',
        bio: response.bio || '',
        profile_image: response.profile_image || null,
      });
    } catch (error) {
      console.error('Failed to load profile:', error);
      Alert.alert('Error', 'Unable to load profile data. Please try again.');
    }
  }, []);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    try {
      const response = await getAdditionalSettings();
      console.log('Settings API Response:', response);
      setSettings(response);
      setSettingsForm({
        email_notifications: response.email_notifications ?? true,
        push_notifications: response.push_notifications ?? true,
        sms_notifications: response.sms_notifications ?? false,
        marketing_emails: response.marketing_emails ?? false,
        privacy_profile: response.privacy_profile || 'public',
        language: response.language || 'en',
        currency: response.currency || 'PKR',
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProfileData(), fetchSettings()]);
      setLoading(false);
    };
    loadData();
  }, [fetchProfileData, fetchSettings]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProfileData(), fetchSettings()]);
    setRefreshing(false);
  }, [fetchProfileData, fetchSettings]);

  // Handle image selection
  const handleImageSelection = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel || response.error) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0];
        setProfileForm({
          ...profileForm,
          profile_image: {
            uri: imageUri.uri,
            type: imageUri.type,
            name: imageUri.fileName || 'profile.jpg',
          },
        });
      }
    });
  };

  // Handle profile update
  const handleProfileUpdate = async () => {
    try {
      if (!profileForm.first_name || !profileForm.email) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      setLoading(true);
      const response = await updateClientProfile(profileForm);

      if (response) {
        Alert.alert('Success', 'Profile updated successfully!');
        setShowEditModal(false);
        await fetchProfileData();
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    try {
      if (
        !passwordForm.current_password ||
        !passwordForm.new_password ||
        !passwordForm.confirm_password
      ) {
        Alert.alert('Error', 'Please fill in all password fields');
        return;
      }

      if (passwordForm.new_password !== passwordForm.confirm_password) {
        Alert.alert('Error', 'New passwords do not match');
        return;
      }

      if (passwordForm.new_password.length < 8) {
        Alert.alert('Error', 'New password must be at least 8 characters long');
        return;
      }

      setLoading(true);
      const response = await changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });

      if (response) {
        Alert.alert('Success', 'Password changed successfully!');
        setShowPasswordModal(false);
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      Alert.alert(
        'Error',
        'Failed to change password. Please check your current password.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle settings update
  const handleSettingsUpdate = async () => {
    try {
      setLoading(true);
      const response = await updateAdditionalSettings(settingsForm);

      if (response) {
        Alert.alert('Success', 'Settings updated successfully!');
        setShowSettingsModal(false);
        await fetchSettings();
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      Alert.alert('Error', 'Failed to update settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.multiRemove([
              'ACCESS_TOKEN',
              'USER_DATA',
              'USER_TYPE',
            ]);
            // Navigate to login screen
            // navigation.reset({index: 0, routes: [{name: 'Login'}]});
          } catch (error) {
            console.error('Failed to logout:', error);
          }
        },
      },
    ]);
  };

  // Loading state
  if (loading && !profileData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profileData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={{color: colors.text}}>No profile data available</Text>
      </View>
    );
  }

  // Profile stats
  const profileStats = [
    {
      label: 'Projects Completed',
      value: profileData.projects_completed || '0',
      color: colors.splashGreen,
    },
    {
      label: 'Total Spent',
      value: `Rs ${(profileData.total_spent || 0).toLocaleString()}`,
      color: colors.primary,
    },
    {
      label: 'Active Orders',
      value: profileData.active_orders || '0',
      color: '#FF9800',
    },
    {
      label: 'Member Since',
      value: profileData.member_since
        ? new Date(profileData.member_since).getFullYear()
        : new Date().getFullYear(),
      color: '#9C27B0',
    },
  ];

  // Menu items
  const menuItems = [
    {
      icon: EditIcon,
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      onPress: () => setShowEditModal(true),
      color: colors.splashGreen,
    },
    {
      icon: SecurityIcon,
      title: 'Change Password',
      subtitle: 'Update your account security',
      onPress: () => setShowPasswordModal(true),
      color: colors.primary,
    },
    {
      icon: NotificationIcon,
      title: 'Notification Settings',
      subtitle: 'Manage your preferences',
      onPress: () => setShowSettingsModal(true),
      color: '#FF9800',
    },
    {
      icon: PrivacyIcon,
      title: 'Privacy Settings',
      subtitle: 'Control your privacy',
      onPress: () => setShowSettingsModal(true),
      color: '#9C27B0',
    },
    {
      icon: LogoutIcon,
      title: 'Logout',
      subtitle: 'Sign out of your account',
      onPress: handleLogout,
      color: '#F44336',
    },
  ];

  // Render edit profile modal
  const renderEditModal = () => (
    <Modal
      visible={showEditModal}
      animationType="slide"
      presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowEditModal(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleProfileUpdate}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            {/* Profile Image */}
            <View style={styles.imageSection}>
              <TouchableOpacity
                style={styles.imageContainer}
                onPress={handleImageSelection}>
                {profileForm.profile_image ? (
                  <Image
                    source={{
                      uri:
                        profileForm.profile_image.uri ||
                        profileForm.profile_image,
                    }}
                    style={styles.profileImage}
                  />
                ) : (
                  <View style={styles.placeholderImage}>
                    <Image source={CameraIcon} style={styles.cameraIcon} />
                    <Text style={styles.placeholderText}>Add Photo</Text>
                  </View>
                )}
                <View style={styles.editImageIcon}>
                  <Image source={EditIcon} style={styles.editIcon} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Personal Information */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>Personal Information</Text>

              <View style={styles.inputRow}>
                <View style={styles.inputGroupHalf}>
                  <Text style={styles.inputLabel}>First Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={profileForm.first_name}
                    onChangeText={text =>
                      setProfileForm({...profileForm, first_name: text})
                    }
                    placeholder="Enter first name"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={styles.inputGroupHalf}>
                  <Text style={styles.inputLabel}>Last Name</Text>
                  <TextInput
                    style={styles.textInput}
                    value={profileForm.last_name}
                    onChangeText={text =>
                      setProfileForm({...profileForm, last_name: text})
                    }
                    placeholder="Enter last name"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.textInput}
                  value={profileForm.email}
                  onChangeText={text =>
                    setProfileForm({...profileForm, email: text})
                  }
                  placeholder="Enter email address"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={profileForm.phone}
                  onChangeText={text =>
                    setProfileForm({...profileForm, phone: text})
                  }
                  placeholder="Enter phone number"
                  keyboardType="phone-pad"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={profileForm.bio}
                  onChangeText={text =>
                    setProfileForm({...profileForm, bio: text})
                  }
                  placeholder="Tell us about yourself"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            {/* Address Information */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionTitle}>Address Information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={profileForm.address}
                  onChangeText={text =>
                    setProfileForm({...profileForm, address: text})
                  }
                  placeholder="Enter your address"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputGroupHalf}>
                  <Text style={styles.inputLabel}>City</Text>
                  <TextInput
                    style={styles.textInput}
                    value={profileForm.city}
                    onChangeText={text =>
                      setProfileForm({...profileForm, city: text})
                    }
                    placeholder="Enter city"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={styles.inputGroupHalf}>
                  <Text style={styles.inputLabel}>Country</Text>
                  <TextInput
                    style={styles.textInput}
                    value={profileForm.country}
                    onChangeText={text =>
                      setProfileForm({...profileForm, country: text})
                    }
                    placeholder="Enter country"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  // Render password modal
  const renderPasswordModal = () => (
    <Modal
      visible={showPasswordModal}
      animationType="slide"
      presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowPasswordModal(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Change Password</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handlePasswordChange}>
            <Text style={styles.saveButtonText}>Update</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            <Text style={styles.sectionTitle}>Security Information</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password *</Text>
              <TextInput
                style={styles.textInput}
                value={passwordForm.current_password}
                onChangeText={text =>
                  setPasswordForm({...passwordForm, current_password: text})
                }
                placeholder="Enter current password"
                secureTextEntry
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password *</Text>
              <TextInput
                style={styles.textInput}
                value={passwordForm.new_password}
                onChangeText={text =>
                  setPasswordForm({...passwordForm, new_password: text})
                }
                placeholder="Enter new password"
                secureTextEntry
                placeholderTextColor={colors.textSecondary}
              />
              <Text style={styles.inputHelper}>
                Password must be at least 8 characters long
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password *</Text>
              <TextInput
                style={styles.textInput}
                value={passwordForm.confirm_password}
                onChangeText={text =>
                  setPasswordForm({...passwordForm, confirm_password: text})
                }
                placeholder="Confirm new password"
                secureTextEntry
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  // Render settings modal
  const renderSettingsModal = () => (
    <Modal
      visible={showSettingsModal}
      animationType="slide"
      presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowSettingsModal(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Settings</Text>
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSettingsUpdate}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}>
          <View style={styles.formSection}>
            {/* Notification Settings */}
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>Notification Preferences</Text>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Email Notifications</Text>
                  <Text style={styles.settingSubtitle}>
                    Receive updates via email
                  </Text>
                </View>
                <Switch
                  value={settingsForm.email_notifications}
                  onValueChange={value =>
                    setSettingsForm({
                      ...settingsForm,
                      email_notifications: value,
                    })
                  }
                  trackColor={{
                    false: '#E0E0E0',
                    true: colors.splashGreen + '40',
                  }}
                  thumbColor={
                    settingsForm.email_notifications
                      ? colors.splashGreen
                      : '#F4F3F4'
                  }
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Push Notifications</Text>
                  <Text style={styles.settingSubtitle}>
                    Receive push notifications
                  </Text>
                </View>
                <Switch
                  value={settingsForm.push_notifications}
                  onValueChange={value =>
                    setSettingsForm({
                      ...settingsForm,
                      push_notifications: value,
                    })
                  }
                  trackColor={{
                    false: '#E0E0E0',
                    true: colors.splashGreen + '40',
                  }}
                  thumbColor={
                    settingsForm.push_notifications
                      ? colors.splashGreen
                      : '#F4F3F4'
                  }
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>SMS Notifications</Text>
                  <Text style={styles.settingSubtitle}>
                    Receive text messages
                  </Text>
                </View>
                <Switch
                  value={settingsForm.sms_notifications}
                  onValueChange={value =>
                    setSettingsForm({...settingsForm, sms_notifications: value})
                  }
                  trackColor={{
                    false: '#E0E0E0',
                    true: colors.splashGreen + '40',
                  }}
                  thumbColor={
                    settingsForm.sms_notifications
                      ? colors.splashGreen
                      : '#F4F3F4'
                  }
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Marketing Emails</Text>
                  <Text style={styles.settingSubtitle}>
                    Receive promotional content
                  </Text>
                </View>
                <Switch
                  value={settingsForm.marketing_emails}
                  onValueChange={value =>
                    setSettingsForm({...settingsForm, marketing_emails: value})
                  }
                  trackColor={{
                    false: '#E0E0E0',
                    true: colors.splashGreen + '40',
                  }}
                  thumbColor={
                    settingsForm.marketing_emails
                      ? colors.splashGreen
                      : '#F4F3F4'
                  }
                />
              </View>
            </View>

            {/* Privacy Settings */}
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>Privacy Settings</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Profile Visibility</Text>
                <View style={styles.radioGroup}>
                  {['public', 'private'].map(option => (
                    <TouchableOpacity
                      key={option}
                      style={styles.radioOption}
                      onPress={() =>
                        setSettingsForm({
                          ...settingsForm,
                          privacy_profile: option,
                        })
                      }>
                      <View
                        style={[
                          styles.radioCircle,
                          settingsForm.privacy_profile === option &&
                            styles.radioSelected,
                        ]}>
                        {settingsForm.privacy_profile === option && (
                          <Image source={CheckIcon} style={styles.checkIcon} />
                        )}
                      </View>
                      <Text style={styles.radioLabel}>
                        {option.charAt(0).toUpperCase() + option.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* App Settings */}
            <View style={styles.settingsSection}>
              <Text style={styles.sectionTitle}>App Preferences</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Language</Text>
                <View style={styles.radioGroup}>
                  {[
                    {value: 'en', label: 'English'},
                    {value: 'ur', label: 'Urdu'},
                  ].map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={styles.radioOption}
                      onPress={() =>
                        setSettingsForm({
                          ...settingsForm,
                          language: option.value,
                        })
                      }>
                      <View
                        style={[
                          styles.radioCircle,
                          settingsForm.language === option.value &&
                            styles.radioSelected,
                        ]}>
                        {settingsForm.language === option.value && (
                          <Image source={CheckIcon} style={styles.checkIcon} />
                        )}
                      </View>
                      <Text style={styles.radioLabel}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Currency</Text>
                <View style={styles.radioGroup}>
                  {[
                    {value: 'PKR', label: 'Pakistani Rupee (PKR)'},
                    {value: 'USD', label: 'US Dollar (USD)'},
                  ].map(option => (
                    <TouchableOpacity
                      key={option.value}
                      style={styles.radioOption}
                      onPress={() =>
                        setSettingsForm({
                          ...settingsForm,
                          currency: option.value,
                        })
                      }>
                      <View
                        style={[
                          styles.radioCircle,
                          settingsForm.currency === option.value &&
                            styles.radioSelected,
                        ]}>
                        {settingsForm.currency === option.value && (
                          <Image source={CheckIcon} style={styles.checkIcon} />
                        )}
                      </View>
                      <Text style={styles.radioLabel}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

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
          <View style={styles.profileSection}>
            <View style={styles.profileImageContainer}>
              {profileData.profile_image ? (
                <Image
                  source={{uri: profileData.profile_image}}
                  style={styles.profileImageLarge}
                />
              ) : (
                <View style={styles.placeholderImageLarge}>
                  <Text style={styles.placeholderTextLarge}>
                    {(profileData.first_name?.[0] || 'U').toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {`${profileData.first_name || ''} ${
                  profileData.last_name || ''
                }`.trim() || 'User Name'}
              </Text>
              <Text style={styles.profileEmail}>{profileData.email}</Text>
              {profileData.bio && (
                <Text style={styles.profileBio} numberOfLines={2}>
                  {profileData.bio}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactGrid}>
            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Image source={EmailIcon} style={styles.contactIconImage} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactValue}>
                  {profileData.email || 'Not provided'}
                </Text>
              </View>
            </View>
            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Image source={PhoneIcon} style={styles.contactIconImage} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone</Text>
                <Text style={styles.contactValue}>
                  {profileData.phone || 'Not provided'}
                </Text>
              </View>
            </View>
            <View style={styles.contactItem}>
              <View style={styles.contactIcon}>
                <Image source={LocationIcon} style={styles.contactIconImage} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Location</Text>
                <Text style={styles.contactValue}>
                  {profileData.city && profileData.country
                    ? `${profileData.city}, ${profileData.country}`
                    : 'Not provided'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Statistics</Text>
          <View style={styles.statsGrid}>
            {profileStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={[styles.statValue, {color: stat.color}]}>
                  {stat.value}
                </Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.lastMenuItem,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}>
              <View
                style={[styles.menuIcon, {backgroundColor: item.color + '20'}]}>
                <Image
                  source={item.icon}
                  style={[styles.menuIconImage, {tintColor: item.color}]}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Edit Profile Modal */}
      {renderEditModal()}

      {/* Change Password Modal */}
      {renderPasswordModal()}

      {/* Settings Modal */}
      {renderSettingsModal()}
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
    paddingBottom: 10,
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
    paddingTop: 40,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImageLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  placeholderImageLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderTextLarge: {
    fontSize: 32,
    fontWeight: '600',
    color: colors.background,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  profileBio: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  contactSection: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  contactGrid: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactIconImage: {
    width: 20,
    height: 20,
  },
  contactInfo: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  statsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  menuSection: {
    marginTop: 24,
    paddingHorizontal: 16,
    marginBottom: 0,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  lastMenuItem: {
    marginBottom: 0,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuIconImage: {
    width: 20,
    height: 20,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  menuArrow: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: '300',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingTop: 40,
  },
  cancelButton: {
    minWidth: 60,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  formSection: {
    paddingVertical: 16,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    width: 24,
    height: 24,
    marginBottom: 4,
  },
  placeholderText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  editImageIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    width: 16,
    height: 16,
    tintColor: colors.background,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputGroupHalf: {
    flex: 1,
    marginRight: 8,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputHelper: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  settingsSection: {
    marginBottom: 24,
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
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  radioGroup: {
    gap: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.splashGreen,
    backgroundColor: colors.splashGreen,
  },
  checkIcon: {
    width: 12,
    height: 12,
    tintColor: colors.background,
  },
  radioLabel: {
    fontSize: 14,
    color: colors.text,
  },
});

export default ProfileScreen;
