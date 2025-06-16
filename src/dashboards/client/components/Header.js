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
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AuthContext} from '../../../context/AuthContext';

// Import icons
import ProfileIcon from '../../../assets/images/icons/profile.png';
import NotificationIcon from '../../../assets/images/icons/notification.png';
import OrdersIcon from '../../../assets/images/icons/order-history.png';
import ProjectsIcon from '../../../assets/images/icons/jobs-active.png';
import ProductsIcon from '../../../assets/images/icons/company.png';
import ServicesIcon from '../../../assets/images/icons/services.png';
import LogoutIcon from '../../../assets/images/icons/logout.png';

const Header = () => {
  const {user} = useContext(AuthContext);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const navigation = useNavigation();
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(-10))[0];

  const userName = user?.username || user?.first_name || 'User';
  const userType = user?.user_type || 'Client';

  const handleLogout = () => {
    closeDropdown();
    // Add your logout logic here
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

  const handleNavigation = screenName => {
    closeDropdown();
    navigation.navigate(screenName);
  };

  const handleNotifications = () => {
    navigation.navigate('NotificationsScreen');
  };

  // Client theme colors
  const clientPrimary = colors.clientPrimary || colors.splashGreen || '#00C950';

  // Updated menu items configuration - removed favorites & payment history, added products & services
  const menuItems = [
    {
      title: 'My Profile',
      icon: ProfileIcon,
      screen: 'Profile',
      description: 'View and edit your profile',
    },
    {
      title: 'My Projects',
      icon: ProjectsIcon,
      screen: 'MyProjectsScreen',
      description: 'Manage your projects',
    },
    {
      title: 'My Orders',
      icon: OrdersIcon,
      screen: 'OrdersScreen',
      description: 'Track your orders',
    },
    {
      title: 'Products',
      icon: ProductsIcon,
      screen: 'ProductsScreen',
      description: 'Browse available products',
    },
    {
      title: 'Services',
      icon: ServicesIcon,
      screen: 'ServicesScreen',
      description: 'Explore our services',
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
            style={[styles.iconImage, {tintColor: clientPrimary}]}
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
          {/* Notifications Icon */}
          <TouchableOpacity
            onPress={handleNotifications}
            style={styles.actionButton}
            activeOpacity={0.7}>
            <Image
              source={NotificationIcon}
              style={[styles.actionIcon, {tintColor: colors.textSecondary}]}
              resizeMode="contain"
            />
            {/* Notification Badge - you can add notification count logic here */}
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>3</Text>
            </View>
          </TouchableOpacity>

          {/* Profile Icon with Ripple */}
          <TouchableOpacity
            onPress={toggleDropdown}
            activeOpacity={0.8}
            style={styles.profileButton}>
            <View
              style={[styles.profileIcon, {backgroundColor: clientPrimary}]}>
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
                  {backgroundColor: clientPrimary},
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
                  style={[styles.iconImage, {tintColor: '#F44336'}]}
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
  safeAreaInset: {
    backgroundColor: colors.background,
  },
  container: {
    zIndex: 1000,
    backgroundColor: colors.background,
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  leftSection: {
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: '#F8F9FA',
    position: 'relative',
  },
  actionIcon: {
    width: 20,
    height: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#F44336',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  badgeText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: '600',
  },
  profileButton: {
    borderRadius: 24,
    marginLeft: 8,
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
    fontSize: 18,
    fontWeight: '700',
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
    top: 80,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    minWidth: 300,
    maxHeight: 650,
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
    fontSize: 16,
    fontWeight: '600',
  },
  dropdownUserInfo: {
    flex: 1,
  },
  dropdownName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  dropdownType: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dropdownEmail: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
    marginVertical: 4,
  },
  menuScrollView: {
    maxHeight: 450,
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
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    marginRight: 12,
  },
  iconImage: {
    width: 18,
    height: 18,
  },
  dropdownTextContainer: {
    flex: 1,
  },
  dropdownText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  dropdownDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    color: '#CCCCCC',
    fontWeight: '300',
  },
  logoutItem: {
    marginTop: 4,
  },
  logoutText: {
    color: '#F44336',
  },
  logoutDescription: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 2,
    opacity: 0.7,
  },
});

export default Header;
