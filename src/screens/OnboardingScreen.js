import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
} from 'react-native';
import {colors} from '../utils/colors';
import ClientImage from '../assets/images/onboarding/client.png';
import SupplierImage from '../assets/images/onboarding/supplier.png';
import ProviderImage from '../assets/images/onboarding/provider.png';

const {width, height} = Dimensions.get('window');

const onboardingData = [
  {
    id: '1',
    title: 'Find Service Providers',
    subtitle:
      'Connect with skilled professionals - architects, contractors, electricians, plumbers, and more for your construction needs',
    image: ProviderImage, // Add your service provider image
    gradientColors: ['#4CAF50', '#2E7D32'],
  },
  {
    id: '2',
    title: 'Shop from Suppliers',
    subtitle:
      'Browse quality materials from trusted suppliers - cement, tiles, paint, fittings, and everything for your dream home',
    image: SupplierImage, // Add your supplier image
    gradientColors: ['#2196F3', '#1565C0'],
  },
  {
    id: '3',
    title: 'Build Your Dream Home',
    subtitle:
      'Plan, design, and build your perfect home with our all-in-one platform connecting users, providers, and suppliers',
    image: ClientImage, // Add your dream home image
    gradientColors: ['#FF9800', '#E65100'],
  },
];

const OnboardingScreen = ({navigation}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({index: nextIndex});
      setCurrentIndex(nextIndex);
    } else {
      navigation.replace('Login');
    }
  };

  const renderItem = ({item}) => (
    <View style={styles.slide}>
      {/* Background Gradient Effect */}
      <View
        style={[
          styles.gradientBackground,
          {
            backgroundColor: item.gradientColors[0],
          },
        ]}
      />
      <View
        style={[
          styles.gradientOverlay,
          {
            backgroundColor: item.gradientColors[1],
          },
        ]}
      />

      <View style={styles.contentContainer}>
        {/* Main Image */}
        <View style={styles.imageContainer}>
          <View style={styles.imageWrapper}>
            <Image source={item.image} style={styles.mainImage} />
          </View>

          {/* Decorative elements */}
          <View style={styles.decorativeElements}>
            <View style={[styles.decorativeCircle, styles.circle1]} />
            <View style={[styles.decorativeCircle, styles.circle2]} />
            <View style={[styles.decorativeCircle, styles.circle3]} />
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.subtitle}>{item.subtitle}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={event => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        keyExtractor={item => item.id}
      />

      {/* Footer Section */}
      <View style={styles.footer}>
        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {onboardingData.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, currentIndex === index && styles.activeDot]}
            />
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleNext}
            activeOpacity={0.8}>
            <Text style={styles.buttonText}>
              {currentIndex === onboardingData.length - 1
                ? 'Get Started'
                : 'Next'}
            </Text>
          </TouchableOpacity>

          {currentIndex < onboardingData.length - 1 && (
            <TouchableOpacity
              onPress={() => navigation.replace('Login')}
              style={styles.skipButton}
              activeOpacity={0.7}>
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status Bar Background */}
      <View
        style={[
          styles.statusBarBg,
          {
            backgroundColor: onboardingData[currentIndex]?.gradientColors[0],
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  slide: {
    width,
    flex: 1,
    position: 'relative',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.65,
    opacity: 0.9,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
    opacity: 0.1,
  },
  contentContainer: {
    flex: 1,
    paddingTop: 60,
  },
  imageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 40,
    position: 'relative',
  },
imageWrapper: {
  width: width * 0.80,
  height: width * 0.80,
  backgroundColor: '#ffffff',
  borderRadius: (width * 0.80) / 2,
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  borderWidth: 2,
  borderColor: '#E0E0E0',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 10,
  elevation: 5,
},

  mainImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover', // ✅ fills the circle fully
  },

  decorativeElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  decorativeCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 50,
  },
  circle1: {
    width: 20,
    height: 20,
    top: '20%',
    right: '10%',
  },
  circle2: {
    width: 15,
    height: 15,
    bottom: '25%',
    left: '15%',
  },
  circle3: {
    width: 12,
    height: 12,
    top: '60%',
    right: '20%',
  },
  textContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  footer: {
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.splashGreen,
  },
  buttonContainer: {
    alignItems: 'center',
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: colors.splashGreen,
    shadowColor: colors.splashGreen,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  statusBarBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 44, // Status bar height
    zIndex: -1,
  },
});

export default OnboardingScreen;
