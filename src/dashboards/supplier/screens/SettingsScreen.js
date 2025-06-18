import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Store,
  CreditCard,
  Shield,
  DollarSign,
  ChevronRight,
  User,
  Bell,
  Globe,
  HelpCircle,
  LogOut,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {useNavigation} from '@react-navigation/native';

const SettingsScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Add any refresh logic here
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Handle logout
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          // Add logout logic here
          navigation.navigate('LoginScreen');
        },
      },
    ]);
  };

  const settingSections = [
    {
      title: 'Store Management',
      items: [
        {
          id: 'store_details',
          title: 'Store Details',
          description: 'Basic store information',
          icon: Store,
          color: colors.splashGreen,
          screen: 'StoreDetailsScreen',
        },
        {
          id: 'checkout',
          title: 'Checkout Settings',
          description: 'Payment & checkout options',
          icon: CreditCard,
          color: '#2196F3',
          screen: 'CheckoutSettingsScreen',
        },
        {
          id: 'tax_duties',
          title: 'Tax & Duties',
          description: 'Tax configuration',
          icon: DollarSign,
          color: '#FF9800',
          screen: 'TaxDutiesScreen',
        },
      ],
    },
    {
      title: 'Account & Security',
      items: [
        {
          id: 'profile',
          title: 'Personal Profile',
          description: 'Your account information',
          icon: User,
          color: '#607D8B',
          screen: 'PersonalProfileScreen',
        },
        {
          id: 'security',
          title: 'Security Settings',
          description: 'Password & 2FA settings',
          icon: Shield,
          color: '#F44336',
          screen: 'SecuritySettingsScreen',
        },
      ],
    },
    {
      title: 'App Settings',
      items: [
        {
          id: 'notifications',
          title: 'Notifications',
          description: 'Push notification settings',
          icon: Bell,
          color: '#FF5722',
          screen: 'NotificationSettingsScreen',
        },
        {
          id: 'language',
          title: 'Language & Region',
          description: 'App language settings',
          icon: Globe,
          color: '#3F51B5',
          screen: 'LanguageSettingsScreen',
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          description: 'FAQs and contact support',
          icon: HelpCircle,
          color: '#795548',
          screen: 'HelpSupportScreen',
        },
      ],
    },
  ];

  const renderSettingSection = section => (
    <View key={section.title} style={styles.section}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.sectionContent}>
        {section.items.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.settingCard,
              index === section.items.length - 1 && styles.lastSettingCard,
            ]}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}>
            <View style={styles.settingCardContent}>
              <View
                style={[
                  styles.iconContainer,
                  {backgroundColor: item.color + '20'},
                ]}>
                <item.icon color={item.color} size={20} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>{item.title}</Text>
                <Text style={styles.settingDescription}>
                  {item.description}
                </Text>
              </View>
              <ChevronRight color={colors.textSecondary} size={20} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header - Same as CollectionScreen */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your app preferences</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Settings Sections */}
        {settingSections.map(renderSettingSection)}

        {/* Logout Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity
              style={[styles.settingCard, styles.logoutCard]}
              onPress={handleLogout}
              activeOpacity={0.7}>
              <View style={styles.settingCardContent}>
                <View
                  style={[styles.iconContainer, styles.logoutIconBackground]}>
                  <LogOut color="#F44336" size={20} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingTitle, styles.logoutText]}>
                    Logout
                  </Text>
                  <Text style={styles.settingDescription}>
                    Sign out of your account
                  </Text>
                </View>
                <ChevronRight color="#F44336" size={20} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
          <Text style={styles.versionSubtext}>ArchiXol Supplier</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // Header - Same as CollectionScreen
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: colors.background,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  // Setting Cards
  settingCard: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lastSettingCard: {
    borderBottomWidth: 0,
  },
  settingCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Special Cards
  logoutCard: {
    borderBottomWidth: 0,
  },
  logoutIconBackground: {
    backgroundColor: 'rgba(244, 67, 54, 0.125)',
  },
  logoutText: {
    color: '#F44336',
  },

  // Version
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    marginTop: 16,
  },
  versionText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.semiBold,
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
});

export default SettingsScreen;
