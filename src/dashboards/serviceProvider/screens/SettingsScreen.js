import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {useNavigation} from '@react-navigation/native';
import ProfileImage from '../../../assets/images/profile1.jpeg';
import {SafeAreaView, Platform, StatusBar} from 'react-native';

const SettingsScreen = () => {
  const navigation = useNavigation();

  // State for switches
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [availableForWork, setAvailableForWork] = useState(true);

  // State for language
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleProfilePress = () => {
    navigation.navigate('Profile');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: () => navigation.navigate('Login'),
          style: 'destructive',
        },
      ],
      {cancelable: true},
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => navigation.navigate('Login'),
          style: 'destructive',
        },
      ],
      {cancelable: true},
    );
  };

  const renderSettingItem = ({
    icon,
    title,
    description,
    type = 'switch',
    value,
    onPress,
    onValueChange,
    tintColor,
    showChevron = false,
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress && type !== 'radio'}>
      <View
        style={[styles.settingIcon, tintColor && {backgroundColor: tintColor}]}>
        <Text style={styles.settingIconText}>{icon}</Text>
      </View>

      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && (
          <Text style={styles.settingDescription}>{description}</Text>
        )}
      </View>

      {type === 'switch' && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{false: '#D1D1D6', true: '#E8F5E9'}}
          thumbColor={value ? colors.splashGreen : '#F4F4F4'}
          ios_backgroundColor="#D1D1D6"
        />
      )}

      {type === 'button' && showChevron && (
        <Text style={styles.chevron}>›</Text>
      )}

      {type === 'radio' && (
        <View style={styles.radioContainer}>
          <View style={[styles.radioOuter, value && styles.radioOuterSelected]}>
            {value && <View style={styles.radioInner} />}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  // Calculate paddingTop for SafeAreaView to avoid inline logic in JSX
  const safeAreaPaddingTop =
    Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

  return (
    <SafeAreaView style={[styles.container, {paddingTop: safeAreaPaddingTop}]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholderView} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.profileSection}
            onPress={handleProfilePress}>
            <Image source={ProfileImage} style={styles.profileImage} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>Ahmad Khan</Text>
              <Text style={styles.profileEmail}>ahmad.khan@example.com</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          {renderSettingItem({
            icon: '🔄',
            title: 'Available for Work',
            description: 'Show your availability for new jobs',
            value: availableForWork,
            onValueChange: setAvailableForWork,
            tintColor: '#E8F5E9',
          })}

          {renderSettingItem({
            icon: '💳',
            title: 'Payment Methods',
            description: 'Manage your payment options',
            type: 'button',
            onPress: () => navigation.navigate('PaymentMethods'),
            tintColor: '#E3F2FD',
            showChevron: true,
          })}

          {renderSettingItem({
            icon: '🛡️',
            title: 'Password & Security',
            description: 'Update password and security settings',
            type: 'button',
            onPress: () => navigation.navigate('SecuritySettings'),
            tintColor: '#FFF3E0',
            showChevron: true,
          })}
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          {renderSettingItem({
            icon: '🔔',
            title: 'Notifications',
            description: 'Manage notification preferences',
            value: notificationsEnabled,
            onValueChange: setNotificationsEnabled,
            tintColor: '#FFF3E0',
          })}

          {notificationsEnabled && (
            <>
              {renderSettingItem({
                icon: '📧',
                title: 'Email Notifications',
                value: emailNotifications,
                onValueChange: setEmailNotifications,
                tintColor: '#E8F5E9',
              })}

              {renderSettingItem({
                icon: '📱',
                title: 'SMS Notifications',
                value: smsNotifications,
                onValueChange: setSmsNotifications,
                tintColor: '#E8F5E9',
              })}
            </>
          )}

          {renderSettingItem({
            icon: '📍',
            title: 'Location Services',
            description: 'Enable location-based features',
            value: locationEnabled,
            onValueChange: setLocationEnabled,
            tintColor: '#E3F2FD',
          })}

          {renderSettingItem({
            icon: '🌙',
            title: 'Dark Mode',
            description: 'Toggle dark theme',
            value: darkMode,
            onValueChange: setDarkMode,
            tintColor: '#EDE7F6',
          })}
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>

          {['English', 'Urdu', 'Arabic'].map(language => (
            <TouchableOpacity
              key={language}
              style={styles.settingItem}
              onPress={() => setSelectedLanguage(language)}>
              <View style={[styles.settingIcon, styles.settingIconLanguage]}>
                <Text style={styles.settingIconText}>🌐</Text>
              </View>

              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>{language}</Text>
              </View>

              <View style={styles.radioContainer}>
                <View
                  style={[
                    styles.radioOuter,
                    selectedLanguage === language && styles.radioOuterSelected,
                  ]}>
                  {selectedLanguage === language && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>

          {renderSettingItem({
            icon: '❓',
            title: 'Help & FAQ',
            description: 'Get help and find answers to common questions',
            type: 'button',
            onPress: () => navigation.navigate('HelpFAQ'),
            tintColor: '#E3F2FD',
            showChevron: true,
          })}

          {renderSettingItem({
            icon: '📞',
            title: 'Contact Support',
            description: 'Get in touch with our support team',
            type: 'button',
            onPress: () => navigation.navigate('ContactSupport'),
            tintColor: '#E8F5E9',
            showChevron: true,
          })}

          {renderSettingItem({
            icon: '📝',
            title: 'Terms of Service',
            type: 'button',
            onPress: () => navigation.navigate('TermsOfService'),
            tintColor: '#F3E5F5',
            showChevron: true,
          })}

          {renderSettingItem({
            icon: '🔒',
            title: 'Privacy Policy',
            type: 'button',
            onPress: () => navigation.navigate('PrivacyPolicy'),
            tintColor: '#F3E5F5',
            showChevron: true,
          })}
        </View>

        {/* Account Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>

          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <View style={[styles.settingIcon, styles.settingIconLogout]}>
              <Text style={styles.settingIconText}>🚪</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Logout</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleDeleteAccount}>
            <View style={[styles.settingIcon, styles.settingIconDelete]}>
              <Text style={styles.settingIconText}>🗑️</Text>
            </View>
            <View style={styles.settingContent}>
              <Text style={[styles.settingTitle, styles.dangerText]}>
                Delete Account
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.appInfoSection}>
          <Text style={styles.appVersion}>ArchiXol App v1.0.0</Text>
          <Text style={styles.appCopyright}>
            © 2025 ArchiXol. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Set displayName for Layout component detection
SettingsScreen.displayName = 'SettingsScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  placeholderView: {
    width: 30,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.background,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingIconText: {
    fontSize: 18,
  },
  settingIconLogout: {
    backgroundColor: '#FFF3E0',
  },
  settingIconLanguage: {
    backgroundColor: '#E3F2FD',
  },
  settingIconDelete: {
    backgroundColor: '#FFEBEE',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  chevron: {
    fontSize: 20,
    color: '#CCCCCC',
    fontWeight: '300',
  },
  radioContainer: {
    padding: 4,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D1D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.splashGreen,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.splashGreen,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  appInfoSection: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  appVersion: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dangerText: {
    color: '#F44336',
  },
});

export default SettingsScreen;
