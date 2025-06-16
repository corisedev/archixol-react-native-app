import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  ArrowLeft,
  Save,
  User,
  MapPin,
  FileText,
  ChevronDown,
  X,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {getCustomer, updateCustomer} from '../../../api/serviceSupplier';
import {useNavigation, useRoute} from '@react-navigation/native';

// Language options
const languageOptions = [
  {label: 'English', value: 'en'},
  {label: 'Urdu', value: 'ur'},
  {label: 'Arabic', value: 'ar'},
  {label: 'Spanish', value: 'es'},
  {label: 'French', value: 'fr'},
  {label: 'German', value: 'de'},
  {label: 'Chinese', value: 'zh'},
  {label: 'Japanese', value: 'ja'},
  {label: 'Hindi', value: 'hi'},
];

// Language Selection Modal Component
const LanguageModal = ({
  visible,
  onClose,
  selectedLanguage,
  onLanguageSelect,
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="slide"
    onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Language</Text>
          <TouchableOpacity onPress={onClose}>
            <X color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.languageList}>
          {languageOptions.map(language => (
            <TouchableOpacity
              key={language.value}
              style={[
                styles.languageOption,
                selectedLanguage === language.value &&
                  styles.selectedLanguageOption,
              ]}
              onPress={() => onLanguageSelect(language)}>
              <Text
                style={[
                  styles.languageOptionText,
                  selectedLanguage === language.value &&
                    styles.selectedLanguageOptionText,
                ]}>
                {language.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const EditCustomerScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {customerId} = route.params;

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Language modal state
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  // Customer data
  const [customerData, setCustomerData] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    customer_name: '',
    email: '',
    phone_number: '',
    language: '',
    default_address: '',
    notes: '',
    status: 'active',
  });

  // Fetch customer data
  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCustomer({customer_id: customerId});
      console.log('Customer Data Response:', response);

      if (response && response.customer) {
        const customer = response.customer;
        setCustomerData(customer);

        // Populate form with existing data
        setFormData({
          first_name: customer.first_name || '',
          last_name: customer.last_name || '',
          customer_name: customer.customer_name || '',
          email: customer.email || '',
          phone_number: customer.phone_number || '',
          language: customer.language || 'en',
          default_address: customer.default_address || '',
          notes: customer.notes || '',
          status: customer.status || 'active',
        });
      }
    } catch (error) {
      console.error('Failed to fetch customer:', error);
      Alert.alert('Error', 'Unable to load customer data. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [customerId, navigation]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle language selection
  const handleLanguageSelect = language => {
    setFormData(prev => ({
      ...prev,
      language: language.value,
    }));
    setLanguageModalVisible(false);
  };

  // Get selected language label
  const getSelectedLanguageLabel = () => {
    const selected = languageOptions.find(
      lang => lang.value === formData.language,
    );
    return selected ? selected.label : 'Select Customer Language';
  };

  // Get customer display name
  const getCustomerName = () => {
    if (customerData?.customer_name) {
      return customerData.customer_name;
    }
    if (formData.first_name || formData.last_name) {
      return `${formData.first_name} ${formData.last_name}`.trim();
    }
    return 'Unknown Customer';
  };

  // Validate form
  const validateForm = () => {
    const errors = [];

    if (!formData.first_name.trim() && !formData.customer_name.trim()) {
      errors.push('First name or customer name is required');
    }

    if (!formData.email.trim()) {
      errors.push('Email is required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }

    if (
      formData.phone_number &&
      !/^\+?[\d\s-()]+$/.test(formData.phone_number)
    ) {
      errors.push('Please enter a valid phone number');
    }

    return errors;
  };

  // Handle update customer
  const handleUpdate = async () => {
    try {
      // Validate form
      const errors = validateForm();
      if (errors.length > 0) {
        Alert.alert('Validation Error', errors.join('\n'));
        return;
      }

      setSaving(true);

      // Prepare customer data
      const updateData = {
        customer_id: customerId,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        customer_name: formData.customer_name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone_number: formData.phone_number.trim(),
        language: formData.language || 'en',
        default_address: formData.default_address.trim(),
        notes: formData.notes.trim(),
        status: formData.status,
      };

      console.log('Updating Customer:', updateData);

      const response = await updateCustomer(updateData);
      console.log('Update Response:', response);

      Alert.alert('Success', 'Customer updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error('Failed to update customer:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to update customer. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading customer data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Edit Customer</Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Customer Overview */}
        <View style={styles.section}>
          <View style={styles.customerOverview}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerInitials}>
                {getCustomerName().charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.customerOverviewInfo}>
              <Text style={styles.customerOverviewName}>
                {getCustomerName()}
              </Text>
              <Text style={styles.customerOverviewEmail}>
                {formData.email || 'No email'}
              </Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>
                  {formData.status?.toUpperCase() || 'ACTIVE'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Customer Information</Text>
          </View>

          {/* Customer Name (if exists) */}
          {customerData?.customer_name && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Customer Name</Text>
              <TextInput
                style={styles.textInput}
                value={formData.customer_name}
                onChangeText={text => handleInputChange('customer_name', text)}
                placeholder="Enter customer name"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
              />
            </View>
          )}

          {/* First Name & Last Name Row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>First Name</Text>
              <TextInput
                style={styles.textInput}
                value={formData.first_name}
                onChangeText={text => handleInputChange('first_name', text)}
                placeholder="Enter your First Name"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Last Name</Text>
              <TextInput
                style={styles.textInput}
                value={formData.last_name}
                onChangeText={text => handleInputChange('last_name', text)}
                placeholder="Enter your Last Name"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Language & Email Row */}
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.inputLabel}>Language</Text>
            <TouchableOpacity
              style={styles.pickerInput}
              onPress={() => setLanguageModalVisible(true)}>
              <Text
                style={[
                  styles.pickerText,
                  !formData.language && styles.placeholderText,
                ]}>
                {getSelectedLanguageLabel()}
              </Text>
              <ChevronDown color={colors.textSecondary} size={16} />
            </TouchableOpacity>
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.textInput}
              value={formData.email}
              onChangeText={text => handleInputChange('email', text)}
              placeholder="e.g. name@gmail.com"
              placeholderTextColor={colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.textInput}
              value={formData.phone_number}
              onChangeText={text => handleInputChange('phone_number', text)}
              placeholder="+92 300 1234567"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>

          {/* Status */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Status</Text>
            <View style={styles.statusContainer}>
              {['active', 'inactive', 'blocked'].map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    formData.status === status && styles.selectedStatus,
                  ]}
                  onPress={() => handleInputChange('status', status)}>
                  <Text
                    style={[
                      styles.statusOptionText,
                      formData.status === status && styles.selectedStatusText,
                    ]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Address Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Address Information</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Default Address</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.default_address}
              onChangeText={text => handleInputChange('default_address', text)}
              placeholder="Enter customer's address"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Additional Notes</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.notes}
              onChangeText={text => handleInputChange('notes', text)}
              placeholder="Any additional information about the customer"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={saving}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, saving && styles.disabledButton]}
          onPress={handleUpdate}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <>
              <Save color={colors.background} size={16} />
              <Text style={styles.submitButtonText}>Update</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Language Selection Modal */}
      <LanguageModal
        visible={languageModalVisible}
        onClose={() => setLanguageModalVisible(false)}
        selectedLanguage={formData.language}
        onLanguageSelect={handleLanguageSelect}
      />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
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
  headerTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  headerRight: {
    width: 40, // To balance the left button
  },

  scrollView: {
    flex: 1,
  },

  // Sections
  section: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },

  // Customer Overview
  customerOverview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  customerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInitials: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },
  customerOverviewInfo: {
    flex: 1,
  },
  customerOverviewName: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  customerOverviewEmail: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: 8,
    fontFamily: fonts.regular,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: colors.splashGreen + '20',
  },
  statusBadgeText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },

  // Form Elements
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: fontSizes.base,
    color: colors.text,
    backgroundColor: colors.background,
    fontFamily: fonts.regular,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },

  // Layout
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },

  // Picker Input
  pickerInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  pickerText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
    flex: 1,
  },
  placeholderText: {
    color: colors.textSecondary,
  },

  // Status Selection
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedStatus: {
    backgroundColor: colors.splashGreen + '20',
    borderColor: colors.splashGreen,
  },
  statusOptionText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.medium,
  },
  selectedStatusText: {
    color: colors.splashGreen,
    fontFamily: fonts.semiBold,
  },

  // Bottom Buttons
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.splashGreen,
    gap: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  languageList: {
    paddingHorizontal: 20,
  },
  languageOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedLanguageOption: {
    backgroundColor: colors.splashGreen + '10',
  },
  languageOptionText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  selectedLanguageOptionText: {
    color: colors.splashGreen,
    fontFamily: fonts.semiBold,
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 20,
  },
});

export default EditCustomerScreen;
