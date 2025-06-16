import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
  Keyboard,
  Pressable,
  StatusBar,
  Image,
} from 'react-native';
import {colors} from '../utils/colors';
import Logo from '../components/Logo';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useContext} from 'react';
import {AuthContext} from '../context/AuthContext';
import EyeImage from '../assets/images/icons/eye.png';
import EyeSlashImage from '../assets/images/icons/eye-crossed.png';

const LoginScreen = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const {login} = useContext(AuthContext);
  // Animation values
  const signInScale = new Animated.Value(1);
  const googleScale = new Animated.Value(1);
  const fadeAnim = React.useMemo(() => new Animated.Value(1), []);


  useEffect(() => {
  StatusBar.setBarStyle('dark-content'); // or 'light-content' based on theme
  if (Platform.OS === 'android') {
    StatusBar.setBackgroundColor(colors.background); // Optional
    StatusBar.setTranslucent(false); // Force visibility
    StatusBar.setHidden(false); // 🔥 Make sure it shows up
  }
}, []);



  // Handle keyboard show/hide
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      },
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [fadeAnim]);

  // Button press animations
  const animatePress = animated => {
    Animated.sequence([
      Animated.timing(animated, {
        toValue: 0.96,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animated, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSignInPress = () => {
    animatePress(signInScale);
  };

  const handleGooglePress = () => {
    animatePress(googleScale);
  };

  const validateEmail = inputEmail => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(inputEmail);
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setLoading(true);

    try {
      console.log('[LoginScreen] Logging in with:', email, password);

      const userData = await login({email, password});
      console.log('[LoginScreen] Received userData:', userData);

      if (!userData || typeof userData !== 'object') {
        throw new Error('Invalid user data received');
      }

      const user = userData.user;
      const role = user?.user_type || user?.role || 'client';

      if (!role) {
        throw new Error('Invalid user role received');
      }
      if (role === 'client') {
        navigation.replace('ClientDashboard');
      } else if (role === 'supplier') {
        navigation.replace('SupplierHome');
      } else if (role === 'service_provider') {
        navigation.replace('ServiceProviderHome');
      } else {
        Alert.alert('Error', 'Unknown role received');
      }
    } catch (error) {
      console.error('Login error:', error.message);
      Alert.alert('Login Failed', error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    // Add Google sign in logic here
    console.log('Google Sign In');
    Alert.alert(
      'Google Sign In',
      'Google authentication would be implemented here',
    );
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  // Calculate paddingTop outside of JSX to avoid inline expressions in style
  const paddingTop = Platform.OS === 'android' ? StatusBar.currentHeight : 0;

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <Pressable
        style={[styles.container, {paddingTop}]}
        onPress={dismissKeyboard}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            <View style={styles.content}>
              {/* Logo and Header */}
              <View style={styles.logoContainer}>
                <Logo size={70} color={colors.splashGreen} />
              </View>

              <Text style={styles.title}>Welcome to ArchiXol</Text>
              <Text style={styles.subtitle}>
                Your trusted partner in house construction{'\n'}and renovation.
              </Text>

              {/* Form */}
              <View style={styles.form}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="m@example.com"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  textContentType="emailAddress"
                  autoComplete="email"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />

                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="••••••••••••••••••"
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    textContentType="password"
                    autoComplete="password"
                    onSubmitEditing={handleLogin}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}>
                    <Image
                      source={showPassword ? EyeSlashImage : EyeImage}
                      style={styles.eyeIconImage}
                    />
                  </TouchableOpacity>
                </View>

                {/* Remember Me */}
                <View style={styles.rememberContainer}>
                  <TouchableOpacity
                    style={styles.checkboxContainer}
                    onPress={() => setRememberMe(!rememberMe)}
                    activeOpacity={0.7}>
                    <View
                      style={[
                        styles.checkbox,
                        rememberMe && styles.checkboxChecked,
                      ]}>
                      {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.rememberText}>Remember me</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.forgotPassword}
                    onPress={() => navigation.navigate('ForgotPassword')}
                    activeOpacity={0.7}>
                    <Text style={styles.forgotPasswordText}>
                      Forgot password?
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Sign In Button */}
                <Animated.View style={{transform: [{scale: signInScale}]}}>
                  <TouchableOpacity
                    style={[
                      styles.signInButton,
                      loading && styles.signInButtonLoading,
                    ]}
                    onPressIn={handleSignInPress}
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.9}>
                    <Text style={styles.signInButtonText}>
                      {loading ? 'Signing In...' : 'Sign In with Email'}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* OR Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                  <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                  <View style={styles.divider} />
                </View>

                {/* Google Sign In */}
                <Animated.View style={{transform: [{scale: googleScale}]}}>
                  <TouchableOpacity
                    style={styles.googleButton}
                    onPressIn={handleGooglePress}
                    onPress={handleGoogleSignIn}
                    activeOpacity={0.9}>
                    <View style={styles.googleIconContainer}>
                      <Text style={styles.googleIcon}>G</Text>
                    </View>
                    <Text style={styles.googleButtonText}>Google</Text>
                  </TouchableOpacity>
                </Animated.View>

                {/* Sign Up Link */}
                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>Don't have an account? </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('SignUp')}
                    activeOpacity={0.7}>
                    <Text style={styles.signupLink}>Sign up now</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Pressable>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.splashGreen,
    marginLeft: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  demoCredentials: {
    backgroundColor: '#F0F7FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#D1E3FF',
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  credentialCard: {
    marginBottom: 8,
  },
  credentialType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  credentialEmail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  passwordInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingRight: 50,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 12,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyeIconImage: {
  width: 20,
  height: 20,
  tintColor: colors.textSecondary, // optional for dark/light consistency
},
  eyeIconText: {
    fontSize: 20,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.splashGreen,
    borderColor: colors.splashGreen,
  },
  checkmark: {
    color: colors.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
  rememberText: {
    fontSize: 14,
    color: colors.text,
  },
  forgotPassword: {
    padding: 4, // Larger touch target
  },
  forgotPasswordText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: colors.splashGreen,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: colors.splashGreen,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  signInButtonLoading: {
    backgroundColor: colors.splashGreen + '90', // Adding transparency to indicate loading
  },
  signInButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginHorizontal: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 24,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  googleIcon: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  googleButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  signupLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default LoginScreen;
