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
import OrdersImage from '../../../assets/images/icons/orders.png';
import MessagesImage from '../../../assets/images/icons/messages.png';
import MessagesActiveImage from '../../../assets/images/icons/messages-active.png';
import ProfileImage from '../../../assets/images/icons/profile.png';
import ProfileActiveImage from '../../../assets/images/icons/profile-active.png';

const {width} = Dimensions.get('window');
const TAB_WIDTH = width / 5;

const BottomNav = ({active = 'Home', setActive}) => {
  const navigation = useNavigation();
  const translateX = useRef(new Animated.Value(0)).current;

  const scaleAnimations = useRef(
    Array.from({length: 5}, () => new Animated.Value(1)),
  ).current;

  const fadeAnimations = useRef(
    Array.from({length: 5}, () => new Animated.Value(1)),
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
        title: 'Orders',
        icon: OrdersImage,
        activeIcon: OrdersImage,
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
      navigation.navigate(item.route);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeAreaWrapper}>
      <View style={styles.container}>
        {/* Active Indicator */}
        <Animated.View
          style={[styles.activeIndicator, {transform: [{translateX}]}]}
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
                        ? colors.splashGreen
                        : colors.textSecondary,
                    },
                  ]}
                  resizeMode="contain"
                />
              </Animated.View>
              <Text style={[styles.text, isActive && styles.activeText]}>
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
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    marginBottom: 4,
  },
  iconImage: {
    width: 22,
    height: 22,
  },
  text: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeText: {
    color: colors.splashGreen,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: TAB_WIDTH,
    height: 2,
    backgroundColor: colors.splashGreen,
    borderRadius: 1,
  },
  bottomSafeArea: {
    backgroundColor: '#FFFFFF',
    height: Platform.OS === 'android' ? 10 : 30, // adjust for Android & iOS
  },
});

export default BottomNav;
