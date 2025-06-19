import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import {
  Home,
  Briefcase,
  ShoppingBag,
  MessageCircle,
  User,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';

const {width} = Dimensions.get('window');

const BottomNav = ({active = 'Home', setActive}) => {
  const navigation = useNavigation();
  const [isInitialized, setIsInitialized] = useState(false);

  // FIXED: Proper animation initialization with error handling
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleAnimations = useRef([]).current;
  const fadeAnimations = useRef([]).current;

  const menuItems = React.useMemo(
    () => [
      {
        title: 'Home',
        icon: Home,
        route: 'ServiceProviderDashboard',
      },
      {
        title: 'Jobs',
        icon: Briefcase,
        route: 'JobsScreen',
      },
      {
        title: 'Orders',
        icon: ShoppingBag,
        route: 'OrdersScreen',
      },
      {
        title: 'Messages',
        icon: MessageCircle,
        route: 'MessagesScreen',
      },
      {
        title: 'Profile',
        icon: User,
        route: 'ProfileScreen',
      },
    ],
    [],
  );

  const TAB_WIDTH = width / menuItems.length;

  // FIXED: Initialize animations safely
  useEffect(() => {
    if (!isInitialized) {
      // Clear existing animations
      scaleAnimations.length = 0;
      fadeAnimations.length = 0;

      // Initialize new animations
      for (let i = 0; i < menuItems.length; i++) {
        scaleAnimations[i] = new Animated.Value(1);
        fadeAnimations[i] = new Animated.Value(1);
      }

      setIsInitialized(true);
      console.log('✅ ServiceProviderBottomNav animations initialized');
    }
  }, [menuItems.length, scaleAnimations, fadeAnimations, isInitialized]);

  // FIXED: Set active tab indicator position with safety check
  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    const index = menuItems.findIndex(item => item.title === active);
    if (index !== -1 && translateX) {
      try {
        Animated.spring(translateX, {
          toValue: index * TAB_WIDTH,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }).start();
      } catch (error) {
        console.warn('Animation error in translateX:', error);
      }
    }
  }, [active, menuItems, translateX, TAB_WIDTH, isInitialized]);

  // FIXED: Handle press with proper error handling
  const handlePress = (item, index) => {
    if (!isInitialized) {
      console.warn('Navigation not initialized yet');
      return;
    }

    try {
      // Animate indicator safely
      if (translateX && translateX._value !== undefined) {
        Animated.spring(translateX, {
          toValue: index * TAB_WIDTH,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }).start();
      }

      // Animate button press safely
      const scaleAnim = scaleAnimations[index];
      const fadeAnim = fadeAnimations[index];

      if (
        scaleAnim &&
        fadeAnim &&
        scaleAnim._value !== undefined &&
        fadeAnim._value !== undefined
      ) {
        Animated.sequence([
          Animated.parallel([
            Animated.spring(scaleAnim, {
              toValue: 0.85,
              damping: 15,
              stiffness: 300,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 0.7,
              duration: 100,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.spring(scaleAnim, {
              toValue: 1,
              damping: 15,
              stiffness: 300,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
          ]),
        ]).start();
      }

      // Update state and navigate
      if (setActive && typeof setActive === 'function') {
        setActive(item.title);
      }

      if (navigation?.navigate) {
        navigation.navigate(item.route);
      }
    } catch (error) {
      console.error('Error in handlePress:', error);
    }
  };

  // FIXED: Safe animation value getter
  const getAnimationValue = (animValue, defaultValue = 1) => {
    try {
      return animValue && animValue._value !== undefined
        ? animValue
        : new Animated.Value(defaultValue);
    } catch (error) {
      console.warn('Animation value error:', error);
      return new Animated.Value(defaultValue);
    }
  };

  // Service Provider theme colors
  const serviceProviderPrimary = colors.splashGreen || '#00C950';

  // Don't render until animations are initialized
  if (!isInitialized) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.safeAreaWrapper}>
        <View style={[styles.container, styles.loadingContainer]}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeAreaWrapper}>
      <View style={styles.container}>
        {/* Active Indicator */}
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              transform: [{translateX: getAnimationValue(translateX, 0)}],
              backgroundColor: serviceProviderPrimary,
              width: TAB_WIDTH,
            },
          ]}
        />

        {/* Navigation Items */}
        {menuItems.map((item, index) => {
          const isActive = active === item.title;
          const scaleValue = getAnimationValue(scaleAnimations[index], 1);
          const fadeValue = getAnimationValue(fadeAnimations[index], 1);
          const IconComponent = item.icon;

          return (
            <TouchableOpacity
              key={`${item.title}-${index}`}
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
                <IconComponent
                  size={24}
                  color={
                    isActive ? serviceProviderPrimary : colors.textSecondary
                  }
                  fill={isActive ? serviceProviderPrimary : 'none'}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </Animated.View>
              <Text
                style={[
                  styles.text,
                  isActive && [
                    styles.activeText,
                    {color: serviceProviderPrimary},
                  ],
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
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    position: 'relative',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    marginBottom: 4,
  },
  text: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    textAlign: 'center',
    lineHeight: 14,
  },
  activeText: {
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 3,
    borderRadius: 1.5,
    zIndex: 0,
  },
  bottomSafeArea: {
    backgroundColor: '#FFFFFF',
    height: Platform.OS === 'android' ? 0 : 20,
  },
});

export default BottomNav;
