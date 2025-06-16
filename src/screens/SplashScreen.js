import React, {useEffect, useRef, useContext, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  ImageBackground,
  TouchableOpacity,
} from 'react-native';
import {colors} from '../utils/colors';
import Logo from '../components/WhiteLogo';
import BackendURLPromptModal from '../components/modal/BackendURLPromptModal';
import {BackendContext} from '../context/BackendContext';

const SplashScreen = ({navigation}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const {backendUrl} = useContext(BackendContext);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // Animate logo and text
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 800,
      delay: 500,
      useNativeDriver: true,
    }).start(() => {
      // Animation complete callback
      setAnimationComplete(true);
    });
  }, [fadeAnim, scaleAnim, slideAnim]);

  const handleContinue = () => {
    navigation.replace('Onboarding');
  };

  return (
    <ImageBackground
      source={require('../assets/images/splash_bg.png')}
      style={styles.container}
      resizeMode="cover">
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      <View style={styles.greenOverlay} />

      {/* Animated Logo */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{scale: scaleAnim}],
        }}>
        <Logo size={100} />
      </Animated.View>

      {/* Animated App Name */}
      <Animated.Text
        style={[
          styles.logo,
          {
            opacity: fadeAnim,
            transform: [{translateY: slideAnim}],
          },
        ]}>
        ArchiXol
      </Animated.Text>

      {/* Animated Tagline */}
      <Animated.Text
        style={[
          styles.tagline,
          {
            opacity: fadeAnim,
            transform: [{translateY: slideAnim}],
          },
        ]}>
        "Connect with top suppliers, skilled{'\n'}
        service providers, and plan your dream{'\n'}
        home seamlessly—all in one place."
      </Animated.Text>

      {/* Continue Button - Only show when backend URL is set and animation is complete */}
      <Animated.View
        style={[
          styles.buttonContainer,
          {
            opacity: fadeAnim,
            transform: [{translateY: slideAnim}],
          },
        ]}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Show Modal if backend URL is not yet saved */}
      <BackendURLPromptModal />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  greenOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.splashGreen,
    opacity: 0.75,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.background,
    marginTop: 24,
    marginBottom: 32,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  tagline: {
    fontSize: 16,
    color: colors.background,
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  buttonContainer: {
    marginTop: 40,
    width: '100%',
  },
  continueButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: colors.background,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
