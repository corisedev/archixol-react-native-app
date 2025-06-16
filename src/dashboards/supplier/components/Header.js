import {useContext, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AuthContext} from '../../../context/AuthContext';
import ProfileIcon from '../../../assets/images/icons/profile.png';
import CompanyIcon from '../../../assets/images/icons/company.png';
import ProductsIcon from '../../../assets/images/icons/location.png';
import InventoryIcon from '../../../assets/images/icons/location.png';
import LogoutIcon from '../../../assets/images/icons/logout.png';

const Header = () => {
  const {user} = useContext(AuthContext); // ✅ pull from context
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const navigation = useNavigation();
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(-10))[0];

  const userName = user?.username || 'User';
  const userType = user?.user_type || 'Supplier';

  const handleLogout = () => {
    closeDropdown();
    navigation.navigate('Login');
  };

  const toggleDropdown = () => {
    dropdownVisible ? closeDropdown() : openDropdown();
  };

  const openDropdown = () => {
    setDropdownVisible(true);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDropdown = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -10,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => setDropdownVisible(false));
  };

  const getInitials = name => {
    return (
      name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase() || 'U'
    );
  };

  // Supplier theme with orange colors
  const typeConfig = {
    backgroundColor: '#FFF3E0',
    color: '#E65100',
    icon: '📦',
    gradient: ['#00C950', '#E65100'],
  };

  const handleNavigation = screenName => {
    closeDropdown();
    navigation.navigate(screenName);
  };

  // Menu items configuration for supplier
  const menuItems = [
    {
      title: 'Profile',
      icon: ProfileIcon,
      screen: 'Profile',
      description: 'View and edit profile',
    },
    {
      title: 'Company Profile',
      icon: CompanyIcon,
      screen: 'CompanyProfile',
      description: 'Manage company details',
    },
    {
      title: 'Manage Products',
      icon: ProductsIcon,
      screen: 'Products',
      description: 'Add and manage products',
    },
    {
      title: 'Inventory Management',
      icon: InventoryIcon,
      screen: 'InventoryScreen',
      description: 'Track and manage stock',
    },
  ];

  const renderDropdownItem = (item, index) => (
    <View key={index}>
      <TouchableOpacity
        style={styles.dropdownItem}
        onPress={() => handleNavigation(item.screen)}
        activeOpacity={0.7}>
        <View style={styles.dropdownIcon}>
          <Image
            source={item.icon}
            style={styles.iconImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.dropdownTextContainer}>
          <Text style={styles.dropdownText}>{item.title}</Text>
          <Text style={styles.dropdownDescription}>{item.description}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
      {index < menuItems.length - 1 && <View style={styles.dropdownDivider} />}
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeAreaInset} />

      <View style={styles.header}>
        <View style={styles.leftSection}>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{userName}</Text>
        </View>

        <View style={styles.rightSection}>
          {/* Profile Icon with Ripple */}
          <TouchableOpacity
            onPress={toggleDropdown}
            activeOpacity={0.8}
            style={styles.profileButton}>
            <View
              style={[
                styles.profileIcon,
                {backgroundColor: typeConfig.gradient[0]},
              ]}>
              <Text style={styles.profileText}>{getInitials(userName)}</Text>
              {dropdownVisible && <View style={styles.activeIndicator} />}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Animated Dropdown Menu */}
      {dropdownVisible && (
        <>
          <Pressable style={styles.overlay} onPress={closeDropdown} />
          <Animated.View
            style={[
              styles.dropdown,
              {
                opacity: fadeAnim,
                transform: [{translateY: slideAnim}],
              },
            ]}>
            {/* User Info Header */}
            <View style={styles.dropdownHeader}>
              <View
                style={[
                  styles.dropdownAvatar,
                  {backgroundColor: typeConfig.gradient[0]},
                ]}>
                <Text style={styles.dropdownAvatarText}>
                  {getInitials(userName)}
                </Text>
              </View>
              <View style={styles.dropdownUserInfo}>
                <Text style={styles.dropdownName}>{userName}</Text>
                <Text style={styles.dropdownType}>{userType}</Text>
              </View>
            </View>

            <View style={styles.dropdownDivider} />

            {/* Scrollable Menu Items */}
            <ScrollView
              style={styles.menuScrollView}
              showsVerticalScrollIndicator={false}
              bounces={false}>
              {menuItems.map((item, index) => renderDropdownItem(item, index))}
            </ScrollView>

            <View style={styles.dropdownDivider} />

            {/* Logout Item */}
            <TouchableOpacity
              style={[styles.dropdownItem, styles.logoutItem]}
              onPress={handleLogout}
              activeOpacity={0.7}>
              <View style={styles.dropdownIcon}>
                <Image
                  source={LogoutIcon}
                  style={styles.iconImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.dropdownTextContainer}>
                <Text style={[styles.dropdownText, styles.logoutText]}>
                  Logout
                </Text>
                <Text style={styles.logoutDescription}>
                  Sign out of your account
                </Text>
              </View>
              <Text style={[styles.chevron, styles.logoutText]}>›</Text>
            </TouchableOpacity>
          </Animated.View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
  },
  container: {
    zIndex: 1000,
    backgroundColor: colors.background, // make sure it matches the actual header
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: fontSizes.base,
    color: '#888888',
    fontFamily: fonts.regular, // Added Poppins Regular
    letterSpacing: 0.2,
  },
  userName: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.bold, // Changed to Poppins Bold
    color: '#1A1A1A',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  iconImage: {
    width: 20,
    height: 20,
    tintColor: colors.textSecondary,
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 16,
  },
  badgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  badgeText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold, // Added Poppins SemiBold
    letterSpacing: 0.4,
  },
  profileButton: {
    borderRadius: 24,
  },
  profileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  profileText: {
    color: '#FFFFFF',
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold, // Added Poppins Bold
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  dropdown: {
    position: 'absolute',
    top: 72,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    minWidth: 280,
    maxHeight: 500,
    paddingVertical: 8,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dropdownAvatarText: {
    color: '#FFFFFF',
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold, // Added Poppins SemiBold
  },
  dropdownUserInfo: {
    flex: 1,
  },
  dropdownName: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold, // Added Poppins SemiBold
    color: '#1A1A1A',
  },
  dropdownType: {
    fontSize: fontSizes.sm,
    color: '#888888',
    marginTop: 2,
    fontFamily: fonts.regular, // Added Poppins Regular
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  menuScrollView: {
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    marginRight: 12,
  },
  iconEmoji: {
    fontSize: 16,
  },
  dropdownTextContainer: {
    flex: 1,
  },
  dropdownText: {
    fontSize: fontSizes.base + 1, // 15px
    color: '#333333',
    fontFamily: fonts.medium, // Added Poppins Medium
  },
  dropdownDescription: {
    fontSize: fontSizes.sm,
    color: '#888888',
    marginTop: 2,
    fontFamily: fonts.regular, // Added Poppins Regular
  },
  chevron: {
    fontSize: 20,
    color: '#CCCCCC',
    fontFamily: fonts.light, // Added Poppins Light
  },
  logoutItem: {
    marginTop: 4,
  },
  logoutText: {
    color: '#F44336',
    fontFamily: fonts.medium, // Added Poppins Medium for logout
  },
  logoutDescription: {
    fontSize: fontSizes.sm,
    color: '#F44336',
    marginTop: 2,
    opacity: 0.7,
    fontFamily: fonts.regular, // Added Poppins Regular
  },
});

export default Header;
