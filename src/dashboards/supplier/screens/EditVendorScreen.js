import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Globe,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {updateVendor, getVendor} from '../../../api/serviceSupplier';
import {useNavigation} from '@react-navigation/native';

const EditVendorScreen = ({route}) => {
  const navigation = useNavigation();
  const {vendorId, vendorData} = route.params;

  // Data state
  const [vendor, setVendor] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    street_address: '',
    city: '',
    state_province: '',
    zip_code: '',
    country: '',
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Load vendor data into form
  const loadVendorData = data => {
    setVendor(data);
    setFormData({
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      email: data.email || '',
      phone_number: data.phone_number || '',
      street_address: data.street_address || '',
      city: data.city || '',
      state_province: data.state_province || '',
      zip_code: data.zip_code || '',
      country: data.country || '',
    });
  };

  // Fetch vendor data
  const fetchVendorData = React.useCallback(async () => {
    setDataLoading(true);
    try {
      // If we have data from route params, use it, otherwise fetch
      if (vendorData) {
        loadVendorData(vendorData);
      } else {
        const response = await getVendor({vendor_id: vendorId});
        if (response && response.vendor) {
          loadVendorData(response.vendor);
        }
      }
    } catch (error) {
      console.error('Failed to fetch vendor:', error);
      Alert.alert('Error', 'Failed to load vendor data');
    } finally {
      setDataLoading(false);
    }
  }, [vendorData, vendorId]);

  useEffect(() => {
    fetchVendorData();
  }, [fetchVendorData]);

  // Update form field
  const updateField = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: ''}));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = 'Phone number is required';
    }

    if (!formData.street_address.trim()) {
      newErrors.street_address = 'Street address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert(
        'Validation Error',
        'Please fill in all required fields correctly.',
      );
      return;
    }

    setLoading(true);
    try {
      const response = await updateVendor({
        vendor_id: vendorId,
        ...formData,
      });
      Alert.alert('Success', 'Vendor updated successfully!', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error) {
      console.error('Failed to update vendor:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error ||
          'Failed to update vendor. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Render input field
  const renderInputField = ({
    label,
    field,
    placeholder,
    keyboardType = 'default',
    icon: Icon,
    multiline = false,
  }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputContainer, errors[field] && styles.inputError]}>
        {Icon && (
          <Icon
            color={colors.textSecondary}
            size={20}
            style={styles.inputIcon}
          />
        )}
        <TextInput
          style={[styles.textInput, Icon && styles.textInputWithIcon]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={formData[field]}
          onChangeText={value => updateField(field, value)}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          textAlignVertical={multiline ? 'top' : 'center'}
        />
      </View>
      {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
    </View>
  );

  // Loading state
  if (dataLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading vendor data...</Text>
      </View>
    );
  }

  // Error state
  if (!vendor) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Building color={colors.textSecondary} size={48} />
        <Text style={styles.errorTitle}>Vendor Not Found</Text>
        <Text style={styles.errorSubtitle}>
          Unable to load vendor data. Please try again.
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Edit Vendor</Text>
          <Text style={styles.headerSubtitle}>
            {vendor.vendor_name || `${vendor.first_name} ${vendor.last_name}`}
          </Text>
        </View>

        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Company Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>

          <View style={styles.row}>
            {renderInputField({
              label: 'First Name *',
              field: 'first_name',
              placeholder: 'John',
              icon: User,
            })}

            {renderInputField({
              label: 'Last Name *',
              field: 'last_name',
              placeholder: 'Doe',
              icon: User,
            })}
          </View>
        </View>

        {/* Contact Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>

          {renderInputField({
            label: 'Email Address *',
            field: 'email',
            placeholder: 'e.g. johndoe@gmail.com',
            keyboardType: 'email-address',
            icon: Mail,
          })}

          {renderInputField({
            label: 'Phone Number *',
            field: 'phone_number',
            placeholder: 'xxxx-xxxxxxx',
            keyboardType: 'phone-pad',
            icon: Phone,
          })}
        </View>

        {/* Address Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address</Text>

          {renderInputField({
            label: 'Street Address *',
            field: 'street_address',
            placeholder: 'Enter street address',
            icon: MapPin,
          })}

          <View style={styles.row}>
            {renderInputField({
              label: 'City *',
              field: 'city',
              placeholder: 'Enter city',
              icon: Building,
            })}

            {renderInputField({
              label: 'State/Province',
              field: 'state_province',
              placeholder: 'Enter state/province',
            })}
          </View>

          <View style={styles.row}>
            {renderInputField({
              label: 'Postal/ZIP Code',
              field: 'zip_code',
              placeholder: 'Enter postal code',
              keyboardType: 'numeric',
            })}

            {renderInputField({
              label: 'Country *',
              field: 'country',
              placeholder: 'Enter country',
              icon: Globe,
            })}
          </View>
        </View>

        {/* Form Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Vendor Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Name:</Text>
            <Text style={styles.summaryValue}>
              {formData.first_name || formData.last_name
                ? `${formData.first_name} ${formData.last_name}`.trim()
                : 'Not specified'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Email:</Text>
            <Text style={styles.summaryValue}>
              {formData.email || 'Not specified'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Location:</Text>
            <Text style={styles.summaryValue}>
              {formData.city && formData.country
                ? `${formData.city}, ${formData.country}`
                : 'Not specified'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => navigation.goBack()}
            disabled={loading}>
            <Text style={styles.secondaryButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Update Vendor</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  errorTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
    fontFamily: fonts.regular,
  },
  retryButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingTop: 50,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 2,
  },

  // Content
  content: {
    flex: 1,
    padding: 16,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 16,
  },

  // Form fields
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
  },
  inputError: {
    borderColor: '#F44336',
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  textInputWithIcon: {
    paddingLeft: 0,
  },
  errorText: {
    fontSize: fontSizes.xs,
    color: '#F44336',
    fontFamily: fonts.regular,
    marginTop: 4,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  summaryTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  summaryValue: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.medium,
    flex: 1,
    textAlign: 'right',
  },

  // Buttons
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.splashGreen,
  },
  secondaryButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
  },
});

export default EditVendorScreen;
