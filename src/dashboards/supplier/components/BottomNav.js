import React, {useEffect, useRef, useState} from 'react';
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
import {fonts, fontSizes} from '../../../utils/fonts'; // Import Poppins fonts
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';

// Import your supplier specific icons
import HomeImage from '../../../assets/images/icons/home.png';
import HomeActiveImage from '../../../assets/images/icons/home-active.png';
import ProductsImage from '../../../assets/images/icons/product.png';
import ProductsActiveImage from '../../../assets/images/icons/produtcs-active.png';
import CustomersImage from '../../../assets/images/icons/customers.png';
import CustomersActiveImage from '../../../assets/images/icons/customers-active.png';
import OrdersImage from '../../../assets/images/icons/orders.png';
import OrdersActiveImage from '../../../assets/images/icons/orders-active.png';
import ProfileImage from '../../../assets/images/icons/profile.png';
import ProfileActiveImage from '../../../assets/images/icons/profile-active.png';

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
        icon: HomeImage,
        activeIcon: HomeActiveImage,
        route: 'SupplierDashboard',
      },
      {
        title: 'Products',
        icon: ProductsImage,
        activeIcon: ProductsActiveImage,
        route: 'ProductsScreen',
      },
      {
        title: 'Customers',
        icon: CustomersImage,
        activeIcon: CustomersActiveImage,
        route: 'CustomersScreen',
      },
      {
        title: 'Orders',
        icon: OrdersImage,
        activeIcon: OrdersActiveImage,
        route: 'OrdersScreen',
      },
      {
        title: 'Profile',
        icon: ProfileImage,
        activeIcon: ProfileActiveImage,
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
      console.log('✅ SupplierBottomNav animations initialized');
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
        navigation.navigate('SupplierHome', {
          screen: item.route,
        });
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

  // Supplier theme colors
  const supplierPrimary =
    colors.supplierPrimary || colors.splashGreen || '#00C950';

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
              backgroundColor: supplierPrimary,
              width: TAB_WIDTH,
            },
          ]}
        />

        {/* Navigation Items */}
        {menuItems.map((item, index) => {
          const isActive = active === item.title;
          const scaleValue = getAnimationValue(scaleAnimations[index], 1);
          const fadeValue = getAnimationValue(fadeAnimations[index], 1);

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
                <Image
                  source={isActive ? item.activeIcon : item.icon}
                  style={[
                    styles.iconImage,
                    {
                      tintColor: isActive
                        ? supplierPrimary
                        : colors.textSecondary,
                    },
                  ]}
                  resizeMode="contain"
                />
              </Animated.View>
              <Text
                style={[
                  styles.text,
                  isActive && [styles.activeText, {color: supplierPrimary}],
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
    fontFamily: fonts.regular, // Added Poppins Regular
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
  iconImage: {
    width: 24,
    height: 24,
  },
  text: {
    fontSize: fontSizes.xs, // Using fontSizes utility (10px)
    color: colors.textSecondary,
    fontFamily: fonts.medium, // Changed to Poppins Medium
    textAlign: 'center',
    lineHeight: 14, // Better line height for small text
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
