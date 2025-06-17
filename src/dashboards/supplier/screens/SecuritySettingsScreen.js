import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import {
  X,
  Lock,
  Mail,
  Phone,
  Key,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {
  getRecoveryEmail,
  addRecoveryEmail,
  addRecoveryPhone,
  resendRecoveryVerificationEmail,
  requestPasswordReset,
} from '../../../api/serviceSupplier';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SecuritySettingsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [recoveryData, setRecoveryData] = useState(null);
  const [formData, setFormData] = useState({
    recovery_email: '',
    recovery_phone: '',
  });

  const navigation = useNavigation();

  // Get user email from storage
  const getUserEmail = useCallback(async () => {
    try {
      const userData = await AsyncStorage.getItem('USER_DATA');
      if (userData) {
        const user = JSON.parse(userData);
        setUserEmail(user.email || '');
      }
    } catch (error) {
      console.error('Failed to get user email:', error);
    }
  }, []);

  // Fetch recovery email
  const fetchRecoveryEmail = useCallback(async () => {
    try {
      const response = await getRecoveryEmail();
      console.log('Recovery email:', response);

      if (response) {
        setRecoveryData(response);
        setFormData(prev => ({
          ...prev,
          recovery_email: response.recovery_email || '',
        }));
      }
    } catch (error) {
      console.error('Failed to load recovery email:', error);
      // Don't show alert for this as it might not exist
    }
  }, []);

  // Initial data load
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        await Promise.all([getUserEmail(), fetchRecoveryEmail()]);
        setLoading(false);
      };
      loadData();
    }, [getUserEmail, fetchRecoveryEmail]),
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([getUserEmail(), fetchRecoveryEmail()]);
    setRefreshing(false);
  }, [getUserEmail, fetchRecoveryEmail]);

  // Update form field
  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle update recovery email
  const handleUpdateRecoveryEmail = async () => {
    if (!formData.recovery_email?.trim()) {
      Alert.alert('Error', 'Please enter a recovery email address');
      return;
    }

    try {
      setSavingEmail(true);
      const response = await addRecoveryEmail({
        recovery_email: formData.recovery_email,
      });

      if (response && response.success !== false) {
        Alert.alert('Success', 'Recovery email updated successfully');
        await fetchRecoveryEmail();
      }
    } catch (error) {
      console.error('Failed to update recovery email:', error);
      Alert.alert(
        'Error',
        'Failed to update recovery email. Please try again.',
      );
    } finally {
      setSavingEmail(false);
    }
  };

  // Handle verify recovery email
  const handleVerifyRecoveryEmail = async () => {
    if (!recoveryData?.recovery_email) {
      Alert.alert('Error', 'No recovery email found to verify');
      return;
    }

    try {
      setVerifyingEmail(true);
      const response = await resendRecoveryVerificationEmail(
        null,
        recoveryData.recovery_email,
      );

      if (response && response.success !== false) {
        Alert.alert('Success', 'Verification email sent successfully');
      }
    } catch (error) {
      console.error('Failed to send verification email:', error);
      Alert.alert(
        'Error',
        'Failed to send verification email. Please try again.',
      );
    } finally {
      setVerifyingEmail(false);
    }
  };

  // Handle update recovery phone
  const handleUpdateRecoveryPhone = async () => {
    if (!formData.recovery_phone?.trim()) {
      Alert.alert('Error', 'Please enter a recovery phone number');
      return;
    }

    try {
      setSavingPhone(true);
      const response = await addRecoveryPhone({
        recovery_phone: formData.recovery_phone,
      });

      if (response && response.success !== false) {
        Alert.alert('Success', 'Recovery phone updated successfully');
        setFormData(prev => ({...prev, recovery_phone: ''}));
      }
    } catch (error) {
      console.error('Failed to update recovery phone:', error);
      Alert.alert(
        'Error',
        'Failed to update recovery phone. Please try again.',
      );
    } finally {
      setSavingPhone(false);
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!userEmail) {
      Alert.alert('Error', 'No email address found');
      return;
    }

    Alert.alert(
      'Reset Password',
      'A password reset link will be sent to your email address. Do you want to continue?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Send Reset Link',
          onPress: async () => {
            try {
              setResettingPassword(true);
              const response = await requestPasswordReset(userEmail);

              if (response && response.success !== false) {
                Alert.alert(
                  'Success',
                  'Password reset link sent to your email address',
                );
              }
            } catch (error) {
              console.error('Failed to send password reset:', error);
              Alert.alert(
                'Error',
                'Failed to send password reset link. Please try again.',
              );
            } finally {
              setResettingPassword(false);
            }
          },
        },
      ],
    );
  };

  // Render input field
  const renderInputField = (
    label,
    field,
    icon,
    placeholder,
    keyboardType = 'default',
    description,
  ) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldLabelContainer}>
          <icon color={colors.textSecondary} size={16} />
          <Text style={styles.fieldLabel}>{label}</Text>
        </View>
      </View>
      <TextInput
        style={styles.fieldInput}
        value={formData[field] || ''}
        onChangeText={value => updateField(field, value)}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
      {description && (
        <Text style={styles.fieldDescription}>{description}</Text>
      )}
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading security settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <X color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Password Reset Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Password Reset</Text>
          <Text style={styles.sectionDescription}>
            Update your password to keep your account secure.
          </Text>
          <View style={styles.sectionContent}>
            <View style={styles.passwordResetContainer}>
              <View style={styles.passwordResetInfo}>
                <View style={styles.passwordResetIconContainer}>
                  <Lock color={colors.splashGreen} size={24} />
                </View>
                <View style={styles.passwordResetTextContainer}>
                  <Text style={styles.passwordResetTitle}>Update Password</Text>
                  <Text style={styles.passwordResetDescription}>
                    We'll send a secure reset link to your email address
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.passwordResetButton,
                  resettingPassword && styles.buttonDisabled,
                ]}
                onPress={handlePasswordReset}
                disabled={resettingPassword}
                activeOpacity={0.7}>
                {resettingPassword ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <>
                    <Key color={colors.background} size={16} />
                    <Text style={styles.passwordResetButtonText}>
                      Update Password
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Account Recovery Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Recovery</Text>
          <Text style={styles.sectionDescription}>
            Set up recovery methods to regain access to your account
          </Text>
          <View style={styles.sectionContent}>
            {/* Recovery Email */}
            <View style={styles.recoverySection}>
              {renderInputField(
                'Recovery Email',
                'recovery_email',
                Mail,
                'Enter recovery email address',
                'email-address',
                "Add secondary email address to recover your account if you can't access your primary email",
              )}

              {/* Email Verification Status */}
              {recoveryData && (
                <View style={styles.statusContainer}>
                  <View style={styles.statusInfo}>
                    <View
                      style={[
                        styles.statusIcon,
                        recoveryData.verified
                          ? styles.statusIconSuccess
                          : styles.statusIconWarning,
                      ]}>
                      {recoveryData.verified ? (
                        <CheckCircle color={colors.background} size={16} />
                      ) : (
                        <AlertCircle color={colors.background} size={16} />
                      )}
                    </View>
                    <Text style={styles.statusText}>
                      {recoveryData.verified
                        ? 'Email verified'
                        : 'Email not verified'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Info Banner */}
              <View style={styles.infoBanner}>
                <Info color={colors.splashGreen} size={16} />
                <Text style={styles.infoBannerText}>
                  We recommend verify your recovery email to ensure you can
                  regain access to your account
                </Text>
              </View>

              {/* Email Action Buttons */}
              <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.verifyButton,
                    (verifyingEmail || recoveryData?.verified) &&
                      styles.buttonDisabled,
                  ]}
                  onPress={handleVerifyRecoveryEmail}
                  disabled={verifyingEmail || recoveryData?.verified}
                  activeOpacity={0.7}>
                  {verifyingEmail ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <Text style={styles.actionButtonText}>
                      {recoveryData?.verified
                        ? 'Verified'
                        : 'Verify recovery email'}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.updateButton,
                    savingEmail && styles.buttonDisabled,
                  ]}
                  onPress={handleUpdateRecoveryEmail}
                  disabled={savingEmail}
                  activeOpacity={0.7}>
                  {savingEmail ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <Text style={styles.actionButtonText}>Update email</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.separator} />

            {/* Recovery Phone */}
            <View style={styles.recoverySection}>
              {renderInputField(
                'Recovery Phone',
                'recovery_phone',
                Phone,
                'Enter recovery phone number',
                'phone-pad',
                'A phone number to receive verification code for account recovery',
              )}

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.updateButton,
                  styles.fullWidthButton,
                  savingPhone && styles.buttonDisabled,
                ]}
                onPress={handleUpdateRecoveryPhone}
                disabled={savingPhone}
                activeOpacity={0.7}>
                {savingPhone ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={styles.actionButtonText}>Update phone</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  headerPlaceholder: {
    width: 40,
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
  },

  // Sections
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 12,
  },
  sectionContent: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  // Password Reset
  passwordResetContainer: {
    marginBottom: 8,
  },
  passwordResetInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  passwordResetIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  passwordResetTextContainer: {
    flex: 1,
  },
  passwordResetTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 2,
  },
  passwordResetDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  passwordResetButton: {
    backgroundColor: colors.splashGreen,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  passwordResetButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },

  // Recovery Section
  recoverySection: {
    marginBottom: 8,
  },

  // Fields
  fieldContainer: {
    marginBottom: 16,
  },
  fieldHeader: {
    marginBottom: 8,
  },
  fieldLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabel: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  fieldInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fieldDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 4,
  },

  // Status
  statusContainer: {
    marginBottom: 12,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIconSuccess: {
    backgroundColor: '#4CAF50',
  },
  statusIconWarning: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },

  // Info Banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  infoBannerText: {
    fontSize: fontSizes.sm,
    color: colors.splashGreen,
    fontFamily: fonts.regular,
    flex: 1,
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  verifyButton: {
    backgroundColor: '#2196F3',
    flex: 1,
  },
  updateButton: {
    backgroundColor: colors.splashGreen,
    flex: 1,
  },
  fullWidthButton: {
    flex: 0,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 20,
  },

  // Bottom spacing
  bottomSpacing: {
    height: 100,
  },
});

export default SecuritySettingsScreen;
