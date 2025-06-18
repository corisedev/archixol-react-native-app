import {useState, useCallback, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {
  Store,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Package,
  Clock,
  Hash,
  ArrowLeft,
  Save,
  Camera,
  ChevronDown,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {BackendContext} from '../../../context/BackendContext';
import {
  getSupplierStoreDetails,
  addSupplierStoreDetails,
} from '../../../api/serviceSupplier';
import {VITE_API_BASE_URL} from '@env';

const StoreDetailsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [, setStoreData] = useState({});
  const [formData, setFormData] = useState({
    logo: '',
    store_name: '',
    phone_number: '',
    email: '',
    address: '',
    display_currency: 'USD',
    unit_system: 'metric',
    weight_unit: 'kg',
    time_zone: '',
    prefix: '',
    suffix: '',
  });

  const navigation = useNavigation();
  const {backendUrl} = useContext(BackendContext);

  // Currency options
  const currencies = [
    {code: 'USD', name: 'US Dollar', symbol: '$'},
    {code: 'PKR', name: 'Pakistani Rupee', symbol: '₨'},
    {code: 'EUR', name: 'Euro', symbol: '€'},
    {code: 'GBP', name: 'British Pound', symbol: '£'},
  ];

  // Unit system options
  const unitSystems = [
    {value: 'metric', label: 'Metric System'},
    {value: 'imperial', label: 'Imperial System'},
  ];

  // Weight units based on system
  const getWeightUnits = system => {
    if (system === 'metric') {
      return [
        {value: 'kg', label: 'Kilograms (kg)'},
        {value: 'g', label: 'Grams (g)'},
      ];
    }
    return [
      {value: 'lb', label: 'Pounds (lb)'},
      {value: 'oz', label: 'Ounces (oz)'},
    ];
  };

  // Time zones (simplified list)
  const timeZones = [
    {value: 'UTC', label: 'UTC (Coordinated Universal Time)'},
    {value: 'America/New_York', label: 'Eastern Time (US & Canada)'},
    {value: 'America/Chicago', label: 'Central Time (US & Canada)'},
    {value: 'America/Denver', label: 'Mountain Time (US & Canada)'},
    {value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)'},
    {value: 'Asia/Karachi', label: 'Pakistan Standard Time'},
    {value: 'Europe/London', label: 'Greenwich Mean Time'},
  ];

  // Get full image URL
  const getFullImageUrl = relativePath => {
    if (!relativePath) {
      return null;
    }
    if (relativePath.startsWith('http')) {
      return relativePath;
    }

    const baseUrl = backendUrl || VITE_API_BASE_URL;
    const cleanPath = relativePath.startsWith('/')
      ? relativePath.substring(1)
      : relativePath;
    return `${baseUrl}/${cleanPath}`;
  };

  // Fetch store details
  const fetchStoreDetails = useCallback(async () => {
    try {
      const response = await getSupplierStoreDetails();
      console.log('Store details:', response);

      if (response && response.store_data) {
        setStoreData(response.store_data);
        setFormData({
          ...response.store_data,
          weight_unit:
            response.store_data.weight_unit ||
            (response.store_data.unit_system === 'metric' ? 'kg' : 'lb'),
        });
      }
    } catch (error) {
      console.error('Failed to load store details:', error);
      Alert.alert('Error', 'Unable to load store details. Please try again.');
    }
  }, []);

  // Initial data load
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        await fetchStoreDetails();
        setLoading(false);
      };
      loadData();
    }, [fetchStoreDetails]),
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStoreDetails();
    setRefreshing(false);
  }, [fetchStoreDetails]);

  // Update form field
  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Auto-update weight unit when unit system changes
    if (field === 'unit_system') {
      setFormData(prev => ({
        ...prev,
        weight_unit: value === 'metric' ? 'kg' : 'lb',
      }));
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!formData.store_name?.trim()) {
      Alert.alert('Error', 'Store name is required');
      return;
    }

    if (!formData.email?.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    try {
      setSaving(true);
      const response = await addSupplierStoreDetails(formData);

      if (response && response.success !== false) {
        Alert.alert('Success', 'Store details updated successfully');
        await fetchStoreDetails();
      }
    } catch (error) {
      console.error('Failed to update store details:', error);
      Alert.alert('Error', 'Failed to update store details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle logo selection
  const handleLogoSelection = () => {
    Alert.alert('Change Store Logo', 'Choose an option', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Camera', onPress: () => console.log('Camera selected')},
      {text: 'Gallery', onPress: () => console.log('Gallery selected')},
    ]);
  };

  // Render picker
  const renderPicker = (label, value, options, field, IconComponent) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldLabelContainer}>
          <IconComponent color={colors.textSecondary} size={16} />
          <Text style={styles.fieldLabel}>{label}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => {
          Alert.alert(`Select ${label}`, '', [
            {text: 'Cancel', style: 'cancel'},
            ...options.map(option => ({
              text: option.label || option.name,
              onPress: () => updateField(field, option.value || option.code),
            })),
          ]);
        }}>
        <Text style={styles.pickerText}>
          {options.find(opt => (opt.value || opt.code) === value)?.label ||
            options.find(opt => (opt.value || opt.code) === value)?.name ||
            'Select...'}
        </Text>
        <ChevronDown color={colors.textSecondary} size={20} />
      </TouchableOpacity>
    </View>
  );

  // Render input field
  const renderInputField = (
    label,
    field,
    IconComponent,
    placeholder,
    keyboardType = 'default',
    multiline = false,
  ) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldLabelContainer}>
          <IconComponent color={colors.textSecondary} size={16} />
          <Text style={styles.fieldLabel}>{label}</Text>
        </View>
      </View>
      <TextInput
        style={[styles.fieldInput, multiline && styles.multilineInput]}
        value={formData[field] || ''}
        onChangeText={value => updateField(field, value)}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading store details...</Text>
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
          <Text style={styles.headerTitle}>Store Details</Text>
          <Text style={styles.headerSubtitle}>
            Manage your store information
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
        {/* Store Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Details</Text>
          <View style={styles.sectionContent}>
            {/* Store Logo */}
            <View style={styles.fieldContainer}>
              <View style={styles.fieldHeader}>
                <Text style={styles.fieldLabel}>Store Logo</Text>
              </View>
              <TouchableOpacity
                style={styles.logoContainer}
                onPress={handleLogoSelection}>
                {formData.logo ? (
                  <Image
                    source={{uri: getFullImageUrl(formData.logo)}}
                    style={styles.logoImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.logoPlaceholder}>
                    <Store color={colors.textSecondary} size={32} />
                    <Text style={styles.logoPlaceholderText}>Upload Logo</Text>
                  </View>
                )}
                <View style={styles.cameraOverlay}>
                  <Camera color={colors.background} size={16} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Store Name and Phone */}
            <View style={styles.twoColumnContainer}>
              <View style={styles.halfWidth}>
                {renderInputField(
                  'Store Name',
                  'store_name',
                  Store,
                  'e.g. Archixol',
                )}
              </View>
              <View style={styles.halfWidth}>
                {renderInputField(
                  'Phone Number',
                  'phone_number',
                  Phone,
                  'e.g. 0000-0000000',
                  'phone-pad',
                )}
              </View>
            </View>

            {/* Email */}
            {renderInputField(
              'Email Address',
              'email',
              Mail,
              'e.g. john_doe@archixol.com',
              'email-address',
            )}

            {/* Address */}
            {renderInputField(
              'Store Address',
              'address',
              MapPin,
              'e.g. Shop No. 123, Street No. 2, City A, Postal Code 12345',
              'default',
              true,
            )}
          </View>
        </View>

        {/* Store Defaults Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Store Defaults</Text>
          <View style={styles.sectionContent}>
            {/* Display Currency */}
            {renderPicker(
              'Supplier Currency',
              formData.display_currency,
              currencies,
              'display_currency',
              DollarSign,
            )}

            {/* Unit System and Weight Unit */}
            <View style={styles.twoColumnContainer}>
              <View style={styles.halfWidth}>
                {renderPicker(
                  'Unit System',
                  formData.unit_system,
                  unitSystems,
                  'unit_system',
                  Package,
                )}
              </View>
              <View style={styles.halfWidth}>
                {renderPicker(
                  'Default Weight Unit',
                  formData.weight_unit,
                  getWeightUnits(formData.unit_system),
                  'weight_unit',
                  Package,
                )}
              </View>
            </View>

            {/* Time Zone */}
            {renderPicker(
              'Time Zone',
              formData.time_zone,
              timeZones,
              'time_zone',
              Clock,
            )}
          </View>
        </View>

        {/* Order ID Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order ID</Text>
          <Text style={styles.sectionDescription}>
            Shown on the order page, customer pages, and customer order
            notifications to identify order
          </Text>
          <View style={styles.sectionContent}>
            <View style={styles.twoColumnContainer}>
              <View style={styles.halfWidth}>
                {renderInputField('Prefix', 'prefix', Hash, 'Optional')}
                <Text style={styles.helpText}>
                  Your order ID will appear as #1001, #1002, #1003 ...
                </Text>
              </View>
              <View style={styles.halfWidth}>
                {renderInputField('Suffix', 'suffix', Hash, 'Optional')}
              </View>
            </View>
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
    marginBottom: 20,
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
    fontSize: fontSizes.sm,
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
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },

  // Picker
  pickerButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pickerText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },

  // Logo
  logoContainer: {
    alignSelf: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  logoImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  logoPlaceholderText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 4,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },

  // Layout
  twoColumnContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },

  // Help text
  helpText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 4,
  },
});

export default StoreDetailsScreen;
