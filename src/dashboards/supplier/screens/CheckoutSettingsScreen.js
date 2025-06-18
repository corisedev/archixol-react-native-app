import React, {useState, useCallback, useContext, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  ArrowLeft,
  Save,
  Users,
  CreditCard,
  DollarSign,
  Percent,
  Building,
  MapPin,
  Phone,
  Check,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {BackendContext} from '../../../context/BackendContext';
import {
  getCheckoutSettings,
  updateCheckoutSettings,
} from '../../../api/serviceSupplier';

const CheckoutSettingsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    address_line: 'optional',
    company_name: 'optional',
    fullname: 'first_and_last_name_required',
    is_custom_tip: false,
    is_tipping_checkout: false,
    shipping_address_phone_number: 'optional',
    tip_fixed_amount: [],
    tip_percentage: [],
    tip_type: 'percentage',
  });

  const navigation = useNavigation();
  const {backendUrl} = useContext(BackendContext);

  const percentageTipPreset = ['5', '10', '15'];
  const fixedAmountTipPreset = ['150', '300', '600'];

  // Fetch checkout settings
  const fetchCheckoutSettings = useCallback(async () => {
    try {
      const response = await getCheckoutSettings();
      console.log('Checkout settings:', response);

      if (response && response.data) {
        setFormData(prevFormData => ({
          ...prevFormData,
          ...response.data,
        }));
      }
    } catch (error) {
      console.error('Failed to load checkout settings:', error);
      Alert.alert(
        'Error',
        'Unable to load checkout settings. Please try again.',
      );
    }
  }, []);

  // Initial data load
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        await fetchCheckoutSettings();
        setLoading(false);
      };
      loadData();
    }, [fetchCheckoutSettings]),
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCheckoutSettings();
    setRefreshing(false);
  }, [fetchCheckoutSettings]);

  // Update form field
  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Handle tip type changes
    if (field === 'tip_type') {
      if (value === 'percentage') {
        setFormData(prev => ({
          ...prev,
          tip_percentage: percentageTipPreset,
          tip_fixed_amount: [],
        }));
      } else if (value === 'fixed_amount') {
        setFormData(prev => ({
          ...prev,
          tip_fixed_amount: fixedAmountTipPreset,
          tip_percentage: [],
        }));
      }
    }

    // Handle tipping checkout toggle
    if (field === 'is_tipping_checkout' && !value) {
      setFormData(prev => ({
        ...prev,
        tip_percentage: [],
        tip_fixed_amount: [],
        is_custom_tip: false,
      }));
    }
  };

  // Handle save
  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await updateCheckoutSettings(formData);

      if (response && response.success !== false) {
        Alert.alert('Success', 'Checkout settings updated successfully');
        await fetchCheckoutSettings();
      }
    } catch (error) {
      console.error('Failed to update checkout settings:', error);
      Alert.alert(
        'Error',
        'Failed to update checkout settings. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  // Render radio group
  const renderRadioGroup = (title, field, options, IconComponent) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldLabelContainer}>
          <IconComponent color={colors.textSecondary} size={16} />
          <Text style={styles.fieldLabel}>{title}</Text>
        </View>
      </View>
      <View style={styles.radioContainer}>
        {options.map((option, index) => (
          <TouchableOpacity
            key={index}
            style={styles.radioOption}
            onPress={() => updateField(field, option.value)}
            activeOpacity={0.7}>
            <View style={styles.radioOptionContent}>
              <View
                style={[
                  styles.radioButton,
                  formData[field] === option.value &&
                    styles.radioButtonSelected,
                ]}>
                {formData[field] === option.value && (
                  <Check color={colors.background} size={14} />
                )}
              </View>
              <Text style={styles.radioOptionLabel}>{option.label}</Text>
              {option.recommended && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>Recommended</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render checkbox
  const renderCheckbox = (title, description, field) => (
    <TouchableOpacity
      style={styles.checkboxContainer}
      onPress={() => updateField(field, !formData[field])}
      activeOpacity={0.7}>
      <View
        style={[styles.checkbox, formData[field] && styles.checkboxSelected]}>
        {formData[field] && <Check color={colors.background} size={14} />}
      </View>
      <View style={styles.checkboxContent}>
        <Text style={styles.checkboxTitle}>{title}</Text>
        {description && (
          <Text style={styles.checkboxDescription}>{description}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // Render tip presets
  const renderTipPresets = () => {
    if (!formData.is_tipping_checkout) return null;

    const isPercentage = formData.tip_type === 'percentage';
    const presets = isPercentage ? percentageTipPreset : fixedAmountTipPreset;

    return (
      <View style={styles.presetsContainer}>
        <Text style={styles.presetsTitle}>
          {isPercentage ? 'Percentage (Preset)' : 'Fixed amount (Preset)'}
        </Text>
        <Text style={styles.presetsDescription}>
          Set three preset {isPercentage ? 'percentage' : 'amount'} options for
          customers to choose from
        </Text>
        <View style={styles.presetsGrid}>
          {presets.map((preset, index) => (
            <View key={index} style={styles.presetItem}>
              <Text style={styles.presetText}>
                {isPercentage ? `${preset}%` : `$${preset}`}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading checkout settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header - Same as SettingsScreen */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Checkout Settings</Text>
          <Text style={styles.headerSubtitle}>
            Configure checkout preferences
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Save color={colors.background} size={20} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Customer Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <Text style={styles.sectionDescription}>
            Configure the information collected from customers during checkout
          </Text>
          <View style={styles.sectionContent}>
            {renderRadioGroup(
              'Full name',
              'fullname',
              [
                {value: 'last_name_required', label: 'Only require last name'},
                {
                  value: 'first_and_last_name_required',
                  label: 'Require first and last name',
                },
              ],
              Users,
            )}

            <View style={styles.separator} />

            {renderRadioGroup(
              'Company name',
              'company_name',
              [
                {value: 'not_include', label: "Don't include"},
                {value: 'optional', label: 'Optional', recommended: true},
                {value: 'required', label: 'Required'},
              ],
              Building,
            )}

            <View style={styles.separator} />

            {renderRadioGroup(
              'Address line 2 (apartment, unit, etc.)',
              'address_line',
              [
                {value: 'not_include', label: "Don't include"},
                {value: 'optional', label: 'Optional', recommended: true},
                {value: 'required', label: 'Required'},
              ],
              MapPin,
            )}

            <View style={styles.separator} />

            {renderRadioGroup(
              'Shipping address phone number',
              'shipping_address_phone_number',
              [
                {value: 'not_include', label: "Don't include"},
                {value: 'optional', label: 'Optional'},
                {value: 'required', label: 'Required'},
              ],
              Phone,
            )}
          </View>
        </View>

        {/* Tipping Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipping</Text>
          <Text style={styles.sectionDescription}>
            Configure tipping options for customers during checkout
          </Text>
          <View style={styles.sectionContent}>
            {renderCheckbox(
              'Enable tipping at checkout',
              'Allow customers to add a tip during checkout',
              'is_tipping_checkout',
            )}

            {formData.is_tipping_checkout && (
              <>
                <View style={styles.separator} />

                <View style={styles.fieldContainer}>
                  <View style={styles.fieldHeader}>
                    <View style={styles.fieldLabelContainer}>
                      <CreditCard color={colors.textSecondary} size={16} />
                      <Text style={styles.fieldLabel}>Tipping Type</Text>
                    </View>
                  </View>
                  <View style={styles.radioContainer}>
                    {[
                      {
                        value: 'percentage',
                        label: 'Percentage based',
                        icon: Percent,
                      },
                      {
                        value: 'fixed_amount',
                        label: 'Fixed amount',
                        icon: DollarSign,
                      },
                    ].map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.radioOption}
                        onPress={() => updateField('tip_type', option.value)}
                        activeOpacity={0.7}>
                        <View style={styles.radioOptionContent}>
                          <View
                            style={[
                              styles.radioButton,
                              formData.tip_type === option.value &&
                                styles.radioButtonSelected,
                            ]}>
                            {formData.tip_type === option.value && (
                              <Check color={colors.background} size={14} />
                            )}
                          </View>
                          <option.icon color={colors.textSecondary} size={16} />
                          <Text style={styles.radioOptionLabel}>
                            {option.label}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {renderTipPresets()}

                <View style={styles.separator} />

                {renderCheckbox(
                  'Allow custom fixed tip amount',
                  null,
                  'is_custom_tip',
                )}
              </>
            )}
          </View>
        </View>
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

  // Header - Same as SettingsScreen
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
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
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
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  // Fields
  fieldContainer: {
    marginBottom: 16,
  },
  fieldHeader: {
    marginBottom: 12,
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

  // Radio Group
  radioContainer: {
    gap: 8,
  },
  radioOption: {
    marginBottom: 4,
  },
  radioOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    backgroundColor: colors.splashGreen,
    borderColor: colors.splashGreen,
  },
  radioOptionLabel: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
    flex: 1,
  },
  recommendedBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  recommendedText: {
    fontSize: fontSizes.xs,
    color: '#1976D2',
    fontFamily: fonts.semiBold,
  },

  // Checkbox
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxSelected: {
    backgroundColor: colors.splashGreen,
    borderColor: colors.splashGreen,
  },
  checkboxContent: {
    flex: 1,
  },
  checkboxTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 2,
  },
  checkboxDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Tip Presets
  presetsContainer: {
    marginTop: 12,
    marginBottom: 16,
  },
  presetsTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  presetsDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  presetItem: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },
});

export default CheckoutSettingsScreen;
