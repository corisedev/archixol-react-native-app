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
  TextInput,
  FlatList,
} from 'react-native';
import {
  X,
  Save,
  DollarSign,
  Calculator,
  Hash,
  Package,
  Edit3,
  Check,
  TrendingUp,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {BackendContext} from '../../../context/BackendContext';
import {
  getTaxDetails,
  updateTaxDetails,
  applyCustomTax,
} from '../../../api/serviceSupplier';

const TaxDutiesScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [taxProducts, setTaxProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [formData, setFormData] = useState({
    is_auto_apply_tax: false,
    default_tax_rate: '',
    reg_number: '',
  });

  const navigation = useNavigation();
  const {backendUrl} = useContext(BackendContext);

  // Fetch tax details
  const fetchTaxDetails = useCallback(async () => {
    try {
      const response = await getTaxDetails();
      console.log('Tax details:', response);

      if (response) {
        if (response.tax_data) {
          setFormData({
            is_auto_apply_tax: response.tax_data.is_auto_apply_tax || false,
            default_tax_rate: response.tax_data.default_tax_rate || '',
            reg_number: response.tax_data.reg_number || '',
          });
        }

        if (response.tax_products) {
          setTaxProducts(response.tax_products);
        }
      }
    } catch (error) {
      console.error('Failed to load tax details:', error);
      Alert.alert('Error', 'Unable to load tax details. Please try again.');
    }
  }, []);

  // Initial data load
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        await fetchTaxDetails();
        setLoading(false);
      };
      loadData();
    }, [fetchTaxDetails]),
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTaxDetails();
    setRefreshing(false);
  }, [fetchTaxDetails]);

  // Update form field
  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle save tax settings
  const handleSaveTaxSettings = async () => {
    try {
      setSaving(true);
      const response = await updateTaxDetails(formData);

      if (response && response.success !== false) {
        Alert.alert('Success', 'Tax settings updated successfully');
        await fetchTaxDetails();
      }
    } catch (error) {
      console.error('Failed to update tax settings:', error);
      Alert.alert('Error', 'Failed to update tax settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle edit product tax
  const handleEditProductTax = product => {
    setEditingProduct(product.product_id);
    setEditValue((product.custom_tax || product.tax_rate || '').toString());
  };

  // Handle save product tax
  const handleSaveProductTax = async productId => {
    try {
      const response = await applyCustomTax({
        product_id: productId,
        custom_tax: editValue,
      });

      if (response && response.success !== false) {
        Alert.alert('Success', 'Tax rate updated successfully');
        setEditingProduct(null);
        setEditValue('');
        await fetchTaxDetails();
      }
    } catch (error) {
      console.error('Failed to update product tax:', error);
      Alert.alert('Error', 'Failed to update tax rate. Please try again.');
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditValue('');
  };

  // Transform category slug to title
  const transformSlugToTitle = slug => {
    if (!slug) return '';
    return slug
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Render tax switch
  const renderTaxSwitch = () => (
    <TouchableOpacity
      style={styles.switchContainer}
      onPress={() =>
        updateField('is_auto_apply_tax', !formData.is_auto_apply_tax)
      }
      activeOpacity={0.7}>
      <View style={styles.switchContent}>
        <View style={styles.switchLabelContainer}>
          <Text style={styles.switchLabel}>
            Automatically calculate and apply taxes to all products
          </Text>
        </View>
        <View
          style={[
            styles.switch,
            formData.is_auto_apply_tax && styles.switchActive,
          ]}>
          <View
            style={[
              styles.switchThumb,
              formData.is_auto_apply_tax && styles.switchThumbActive,
            ]}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

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
      />
      {description && (
        <Text style={styles.fieldDescription}>{description}</Text>
      )}
    </View>
  );

  // Product separator component (moved out of render)
  const ProductSeparator = () => <View style={styles.productSeparator} />;

  // Render product item
  const renderProductItem = ({item}) => {
    const isEditing = editingProduct === item.product_id;
    const taxValue = item.custom_tax || item.tax_rate || '0';

    return (
      <View style={styles.productItem}>
        <View style={styles.productInfo}>
          <Text style={styles.productTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.productCategory}>
            {transformSlugToTitle(item.category)}
          </Text>
        </View>

        <View style={styles.productTaxContainer}>
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={editValue}
                onChangeText={setEditValue}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => handleSaveProductTax(item.product_id)}
                activeOpacity={0.7}>
                <Check color={colors.background} size={16} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEdit}
                activeOpacity={0.7}>
                <X color={colors.textSecondary} size={16} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.displayContainer}>
              <Text style={styles.taxValue}>{taxValue}%</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditProductTax(item)}
                activeOpacity={0.7}>
                <Edit3 color={colors.textSecondary} size={16} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading tax settings...</Text>
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
        <Text style={styles.headerTitle}>Tax & Duties</Text>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveTaxSettings}
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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Default Tax Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default Tax Settings</Text>
          <Text style={styles.sectionDescription}>
            Configure your default tax settings that will apply to all products.
            You can override these settings for individual products below.
          </Text>
          <View style={styles.sectionContent}>
            {/* Auto Apply Tax */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Apply Tax Automatically</Text>
              {renderTaxSwitch()}
            </View>

            <View style={styles.separator} />

            {/* Default Tax Rate */}
            {renderInputField(
              'Default Sales Tax Rate',
              'default_tax_rate',
              Calculator,
              '%',
              'numeric',
              'This is the general sales tax rate applied to all products unless specifically overridden.',
            )}

            <View style={styles.separator} />

            {/* Tax Registration Number */}
            {renderInputField(
              'Tax Registration Number',
              'reg_number',
              Hash,
              'Enter registration number',
              'default',
              'Your tax identification number that will appear on invoices.',
            )}
          </View>
        </View>

        {/* Product Tax Overrides Section */}
        {taxProducts && taxProducts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product Tax Overrides</Text>
            <Text style={styles.sectionDescription}>
              Set custom tax rates for individual products. These will override the default tax rate.
            </Text>
            <FlatList
              data={taxProducts}
              renderItem={renderProductItem}
              keyExtractor={item => item.product_id.toString()}
              scrollEnabled={false}
              ItemSeparatorComponent={ProductSeparator}
            />
          </View>
        )}

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

  // Switch
  switchContainer: {
    marginTop: 8,
  },
  switchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  switch: {
    width: 52,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: colors.splashGreen,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },

  // Products
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  productInfo: {
    flex: 1,
    marginRight: 12,
  },
  productTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 2,
  },
  productCategory: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  productTaxContainer: {
    minWidth: 120,
  },
  displayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taxValue: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
    borderWidth: 1,
    borderColor: colors.splashGreen,
    width: 60,
    textAlign: 'center',
  },

  cancelButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productSeparator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: -16,
    marginVertical: 8,
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 16,
  },

  // Bottom spacing
  bottomSpacing: {
    height: 100,
  },
});

export default TaxDutiesScreen;
