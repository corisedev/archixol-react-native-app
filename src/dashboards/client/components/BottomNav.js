import React, {useEffect, useRef} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import HomeImage from '../../../assets/images/icons/home.png';
import HomeActiveImage from '../../../assets/images/icons/home-active.png';
import JobsImage from '../../../assets/images/icons/jobs.png';
import JobsActiveImage from '../../../assets/images/icons/jobs-active.png';
import ProjectsImage from '../../../assets/images/icons/company.png';
import ProjectsActiveImage from '../../../assets/images/icons/company.png';
import OrdersImage from '../../../assets/images/icons/orders.png';
import OrdersActiveImage from '../../../assets/images/icons/orders-active.png';
import MessagesImage from '../../../assets/images/icons/messages.png';
import MessagesActiveImage from '../../../assets/images/icons/messages-active.png';
import ProfileImage from '../../../assets/images/icons/profile.png';
import ProfileActiveImage from '../../../assets/images/icons/profile-active.png';

const {width} = Dimensions.get('window');
const TAB_WIDTH = width / 6; // Changed to 6 tabs

const BottomNav = ({active = 'Home', setActive}) => {
  const navigation = useNavigation();
  const translateX = useRef(new Animated.Value(0)).current;

  const scaleAnimations = useRef(
    Array.from({length: 6}, () => new Animated.Value(1)), // Changed to 6 tabs
  ).current;

  const fadeAnimations = useRef(
    Array.from({length: 6}, () => new Animated.Value(1)), // Changed to 6 tabs
  ).current;

  const menuItems = React.useMemo(
    () => [
      {
        title: 'Home',
        icon: HomeImage,
        activeIcon: HomeActiveImage,
        route: 'DashboardMain',
      },
      {
        title: 'Jobs',
        icon: JobsImage,
        activeIcon: JobsActiveImage,
        route: 'JobsScreen',
      },
      {
        title: 'Projects',
        icon: ProjectsImage,
        activeIcon: ProjectsActiveImage,
        route: 'MyProjectsScreen',
      },
      {
        title: 'Orders',
        icon: OrdersImage,
        activeIcon: OrdersActiveImage,
        route: 'OrdersScreen',
      },
      {
        title: 'Messages',
        icon: MessagesImage,
        activeIcon: MessagesActiveImage,
        route: 'MessagesScreen',
      },
      {
        title: 'Profile',
        icon: ProfileImage,
        activeIcon: ProfileActiveImage,
        route: 'Profile',
      },
    ],
    [],
  );

  // Set active tab indicator position
  useEffect(() => {
    const index = menuItems.findIndex(item => item.title === active);
    if (index !== -1) {
      Animated.spring(translateX, {
        toValue: index * TAB_WIDTH,
        damping: 20,
        stiffness: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [active, menuItems, translateX]);

  const handlePress = (item, index) => {
    // Animate indicator
    Animated.spring(translateX, {
      toValue: index * TAB_WIDTH,
      damping: 20,
      stiffness: 200,
      useNativeDriver: true,
    }).start();

    // Animate button press
    if (scaleAnimations[index] && fadeAnimations[index]) {
      Animated.sequence([
        Animated.parallel([
          Animated.spring(scaleAnimations[index], {
            toValue: 0.85,
            damping: 15,
            stiffness: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnimations[index], {
            toValue: 0.7,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(scaleAnimations[index], {
            toValue: 1,
            damping: 15,
            stiffness: 300,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnimations[index], {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }

    // Update state and navigate
    if (setActive) {
      setActive(item.title);
    }

    if (navigation?.navigate) {
      navigation.navigate('ClientDashboard', {
        screen: item.route,
      });
    }
  };

  // Client theme colors
  const clientPrimary = colors.clientPrimary || colors.splashGreen || '#00C950';

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeAreaWrapper}>
      <View style={styles.container}>
        {/* Active Indicator */}
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              transform: [{translateX}],
              backgroundColor: clientPrimary,
            },
          ]}
        />

        {/* Navigation Items */}
        {menuItems.map((item, index) => {
          const isActive = active === item.title;
          const scaleValue = scaleAnimations[index];
          const fadeValue = fadeAnimations[index];

          return (
            <TouchableOpacity
              key={item.title}
              onPress={() => handlePress(item, index)}
              style={styles.navItem}
              activeOpacity={0.8}>
              <Animated.View
                style={[
                  styles.iconContainer,
                  {
                    transform: [{scale: scaleValue}],
                    opacity: fadeValue,
                  },
                ]}>
                <Image
                  source={isActive ? item.activeIcon : item.icon}
                  style={[
                    styles.iconImage,
                    {
                      tintColor: isActive
                        ? clientPrimary
                        : colors.textSecondary,
                    },
                  ]}
                  resizeMode="contain"
                />
              </Animated.View>
              <Text
                style={[
                  styles.text,
                  isActive && [styles.activeText, {color: clientPrimary}],
                ]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Extra bottom safe area for devices with home indicator */}
      <View style={styles.bottomSafeArea} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaWrapper: {
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 8,
    paddingBottom: 0,
    paddingHorizontal: 2, // Reduced padding for 6 tabs
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2, // Reduced for better fit
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28, // Slightly smaller for 6 tabs
    height: 28,
    marginBottom: 4,
  },
  iconImage: {
    width: 20, // Slightly smaller for 6 tabs
    height: 20,
  },
  text: {
    fontSize: 10, // Slightly smaller for 6 tabs
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeText: {
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: TAB_WIDTH,
    height: 3, // Slightly thicker for better visibility
    borderRadius: 1.5,
  },
  bottomSafeArea: {
    backgroundColor: '#FFFFFF',
    height: Platform.OS === 'android' ? 10 : 30,
  },
});

export default BottomNav;
