import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Switch,
} from 'react-native';
import {
  ArrowLeft,
  Calendar,
  Percent,
  DollarSign,
  Tag,
  Users,
  ShoppingCart,
  Clock,
  Save,
  Plus,
  X,
  ChevronDown,
} from 'lucide-react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {createDiscount} from '../../../api/serviceSupplier';
import {useNavigation, useRoute} from '@react-navigation/native';

const CreateDiscountScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Get discount type from route params or default
  const discountType = route.params?.type || 'moneyOffProduct';

  const [loading, setLoading] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showDiscountTypeModal, setShowDiscountTypeModal] = useState(false);
  const [showValueTypeModal, setShowValueTypeModal] = useState(false);
  const [showAppliesToModal, setShowAppliesToModal] = useState(false);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [showMinRequirementModal, setShowMinRequirementModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    // Basic Info
    discount_type: 'code', // 'code' or 'automatic'
    title: '',
    code: '',
    discount_category: discountType,

    // Discount Value
    discount_value_type: 'percentage', // 'percentage' or 'fixed_amount'
    discount_value: '',
    appliesTo: 'collections', // 'collections' or 'products'
    sale_items: [],

    // Dates
    start_datetime: new Date(),
    is_end_date: false,
    end_datetime: null,

    // Eligibility
    eligibility: 'all_customers', // 'all_customers' or 'specific_customers'
    customer_list: [],

    // Minimum Requirements
    min_purchase_req: 'no_req', // 'no_req', 'min_amount_req', 'min_items_req'
    min_amount_value: '',
    min_items_value: '1',

    // Usage Limits
    is_max_limit: false,
    max_total_uses: '1',
    one_per_customer: false,

    // Buy X Get Y (for buyXgetY type)
    customer_buy_spend: 'min_item_qty',
    buy_spend_quantity: '1',
    buy_spend_amount: '',
    buy_spend_any_item_from: 'products',
    buy_spend_sale_items: [],
    gets_quantity: '1',
    gets_any_item_from: 'products',
    gets_sale_items: [],
    discounted_value: 'free',
    percentage: '',
    amount_off_each: '',
    is_max_users_per_order: false,
    max_users: '1',
  });

  // Get discount type title and description
  const getDiscountTypeInfo = () => {
    const types = {
      moneyOffProduct: {
        title: 'Amount off products',
        description: 'Product discount',
      },
      buyXgetY: {
        title: 'Buy X get Y',
        description: 'Product discount',
      },
      moneyOffOrder: {
        title: 'Amount off order',
        description: 'Order discount',
      },
      shipping: {
        title: 'Free shipping',
        description: 'Shipping discount',
      },
    };
    return types[discountType] || {title: 'Discount', description: 'Discount'};
  };

  const discountTypeInfo = getDiscountTypeInfo();

  // Generate random discount code
  const generateDiscountCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a discount title');
      return;
    }

    if (formData.discount_type === 'code' && !formData.code.trim()) {
      Alert.alert('Error', 'Please enter a discount code');
      return;
    }

    if (!formData.discount_value || formData.discount_value <= 0) {
      Alert.alert('Error', 'Please enter a valid discount value');
      return;
    }

    setLoading(true);
    try {
      // Prepare data for API
      const submitData = {
        ...formData,
        discount_value: parseFloat(formData.discount_value),
        min_amount_value: formData.min_amount_value
          ? parseFloat(formData.min_amount_value)
          : 0,
        min_items_value: formData.min_items_value
          ? parseInt(formData.min_items_value)
          : 1,
        max_total_uses: formData.max_total_uses
          ? parseInt(formData.max_total_uses)
          : 1,
        buy_spend_quantity: formData.buy_spend_quantity
          ? parseInt(formData.buy_spend_quantity)
          : 1,
        buy_spend_amount: formData.buy_spend_amount
          ? parseFloat(formData.buy_spend_amount)
          : 0,
        gets_quantity: formData.gets_quantity
          ? parseInt(formData.gets_quantity)
          : 1,
        percentage: formData.percentage ? parseFloat(formData.percentage) : 0,
        amount_off_each: formData.amount_off_each
          ? parseFloat(formData.amount_off_each)
          : 0,
        max_users: formData.max_users ? parseInt(formData.max_users) : 1,
      };

      await createDiscount(submitData);
      Alert.alert('Success', 'Discount created successfully', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error) {
      console.error('Create discount error:', error);
      Alert.alert('Error', 'Failed to create discount. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = date => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const OptionModal = ({
    visible,
    onClose,
    title,
    options,
    selectedValue,
    onSelect,
  }) => (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.optionModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionItem,
                selectedValue === option.value && styles.selectedOption,
              ]}
              onPress={() => {
                onSelect(option.value);
                onClose();
              }}>
              <Text
                style={[
                  styles.optionText,
                  selectedValue === option.value && styles.selectedOptionText,
                ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Create Discount</Text>
          <Text style={styles.headerSubtitle}>
            {discountTypeInfo.description}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.headerButton, {backgroundColor: colors.splashGreen}]}
          onPress={handleSubmit}
          disabled={loading}>
          <Save color={colors.background} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Discount Type & Code Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{discountTypeInfo.title}</Text>
            <Text style={styles.sectionSubtitle}>
              {discountTypeInfo.description}
            </Text>
          </View>

          {/* Discount Type Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                formData.discount_type === 'code' && styles.toggleActive,
              ]}
              onPress={() => updateFormData('discount_type', 'code')}>
              <Text
                style={[
                  styles.toggleText,
                  formData.discount_type === 'code' && styles.toggleActiveText,
                ]}>
                Discount Code
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                formData.discount_type === 'automatic' && styles.toggleActive,
              ]}
              onPress={() => updateFormData('discount_type', 'automatic')}>
              <Text
                style={[
                  styles.toggleText,
                  formData.discount_type === 'automatic' &&
                    styles.toggleActiveText,
                ]}>
                Automatic
              </Text>
            </TouchableOpacity>
          </View>

          {/* Code/Title Input */}
          {formData.discount_type === 'code' ? (
            <View style={styles.inputGroup}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>Discount Code</Text>
                <TouchableOpacity
                  onPress={() =>
                    updateFormData('code', generateDiscountCode())
                  }>
                  <Text style={styles.generateButton}>Generate</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.textInput}
                value={formData.code}
                onChangeText={value => updateFormData('code', value)}
                placeholder="Enter discount code"
                autoCapitalize="characters"
              />
              <Text style={styles.inputDescription}>
                Customers must enter this code at checkout
              </Text>
            </View>
          ) : (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Title</Text>
              <TextInput
                style={styles.textInput}
                value={formData.title}
                onChangeText={value => updateFormData('title', value)}
                placeholder="Enter discount title"
              />
              <Text style={styles.inputDescription}>
                Customers will see this in their cart and at checkout
              </Text>
            </View>
          )}
        </View>

        {/* Discount Value Section */}
        {discountType !== 'buyXgetY' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Discount Value</Text>

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.selectButton, {flex: 2}]}
                onPress={() => setShowValueTypeModal(true)}>
                <Text style={styles.selectButtonText}>
                  {formData.discount_value_type === 'percentage'
                    ? 'Percentage'
                    : 'Fixed Amount'}
                </Text>
                <ChevronDown color={colors.textSecondary} size={20} />
              </TouchableOpacity>

              <TextInput
                style={[styles.textInput, {flex: 1, marginLeft: 12}]}
                value={formData.discount_value}
                onChangeText={value => updateFormData('discount_value', value)}
                placeholder={
                  formData.discount_value_type === 'percentage' ? '%' : 'PKR'
                }
                keyboardType="numeric"
              />
            </View>

            {discountType !== 'moneyOffOrder' && (
              <>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowAppliesToModal(true)}>
                  <Text style={styles.selectButtonText}>
                    {formData.appliesTo === 'collections'
                      ? 'Collections'
                      : 'Products'}
                  </Text>
                  <ChevronDown color={colors.textSecondary} size={20} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.addButton}>
                  <Plus color={colors.splashGreen} size={20} />
                  <Text style={styles.addButtonText}>
                    Add specific {formData.appliesTo}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Buy X Get Y Section */}
        {discountType === 'buyXgetY' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Buy X Get Y</Text>
            {/* Add Buy X Get Y specific fields here */}
            <Text style={styles.comingSoon}>
              Buy X Get Y configuration coming soon...
            </Text>
          </View>
        )}

        {/* Minimum Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minimum Requirements</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowMinRequirementModal(true)}>
            <Text style={styles.selectButtonText}>
              {formData.min_purchase_req === 'no_req'
                ? 'No minimum requirements'
                : formData.min_purchase_req === 'min_amount_req'
                ? 'Minimum purchase amount'
                : 'Minimum quantity of items'}
            </Text>
            <ChevronDown color={colors.textSecondary} size={20} />
          </TouchableOpacity>

          {formData.min_purchase_req === 'min_amount_req' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Minimum amount (PKR)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.min_amount_value}
                onChangeText={value =>
                  updateFormData('min_amount_value', value)
                }
                placeholder="Enter minimum amount"
                keyboardType="numeric"
              />
            </View>
          )}

          {formData.min_purchase_req === 'min_items_req' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Minimum quantity</Text>
              <TextInput
                style={styles.textInput}
                value={formData.min_items_value}
                onChangeText={value => updateFormData('min_items_value', value)}
                placeholder="Enter minimum quantity"
                keyboardType="numeric"
              />
            </View>
          )}
        </View>

        {/* Eligibility Section */}
        {formData.discount_type === 'code' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Eligibility</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowEligibilityModal(true)}>
              <Text style={styles.selectButtonText}>
                {formData.eligibility === 'all_customers'
                  ? 'All customers'
                  : 'Specific customers'}
              </Text>
              <ChevronDown color={colors.textSecondary} size={20} />
            </TouchableOpacity>

            {formData.eligibility === 'specific_customers' && (
              <TouchableOpacity style={styles.addButton}>
                <Plus color={colors.splashGreen} size={20} />
                <Text style={styles.addButtonText}>Add specific customers</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Usage Limits */}
        {formData.discount_type === 'code' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Usage Limits</Text>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Limit number of times this discount can be used
              </Text>
              <Switch
                value={formData.is_max_limit}
                onValueChange={value => updateFormData('is_max_limit', value)}
                trackColor={{
                  false: colors.textSecondary + '30',
                  true: colors.splashGreen + '30',
                }}
                thumbColor={
                  formData.is_max_limit
                    ? colors.splashGreen
                    : colors.textSecondary
                }
              />
            </View>

            {formData.is_max_limit && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Maximum uses</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.max_total_uses}
                  onChangeText={value =>
                    updateFormData('max_total_uses', value)
                  }
                  placeholder="Enter maximum uses"
                  keyboardType="numeric"
                />
              </View>
            )}

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Limit to one use per customer
              </Text>
              <Switch
                value={formData.one_per_customer}
                onValueChange={value =>
                  updateFormData('one_per_customer', value)
                }
                trackColor={{
                  false: colors.textSecondary + '30',
                  true: colors.splashGreen + '30',
                }}
                thumbColor={
                  formData.one_per_customer
                    ? colors.splashGreen
                    : colors.textSecondary
                }
              />
            </View>
          </View>
        )}

        {/* Active Dates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Dates</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Start Date and Time</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}>
              <Calendar color={colors.textSecondary} size={20} />
              <Text style={styles.dateButtonText}>
                {formatDate(formData.start_datetime)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Set end date</Text>
            <Switch
              value={formData.is_end_date}
              onValueChange={value => updateFormData('is_end_date', value)}
              trackColor={{
                false: colors.textSecondary + '30',
                true: colors.splashGreen + '30',
              }}
              thumbColor={
                formData.is_end_date ? colors.splashGreen : colors.textSecondary
              }
            />
          </View>

          {formData.is_end_date && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>End Date and Time</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}>
                <Calendar color={colors.textSecondary} size={20} />
                <Text style={styles.dateButtonText}>
                  {formData.end_datetime
                    ? formatDate(formData.end_datetime)
                    : 'Select end date'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{height: 20}} />
      </ScrollView>

      {/* Date Pickers */}
      <DateTimePickerModal
        isVisible={showStartDatePicker}
        mode="datetime"
        onConfirm={date => {
          updateFormData('start_datetime', date);
          setShowStartDatePicker(false);
        }}
        onCancel={() => setShowStartDatePicker(false)}
        date={formData.start_datetime}
      />

      <DateTimePickerModal
        isVisible={showEndDatePicker}
        mode="datetime"
        onConfirm={date => {
          updateFormData('end_datetime', date);
          setShowEndDatePicker(false);
        }}
        onCancel={() => setShowEndDatePicker(false)}
        date={formData.end_datetime || new Date()}
      />

      {/* Option Modals */}
      <OptionModal
        visible={showValueTypeModal}
        onClose={() => setShowValueTypeModal(false)}
        title="Discount Value Type"
        selectedValue={formData.discount_value_type}
        onSelect={value => updateFormData('discount_value_type', value)}
        options={[
          {label: 'Percentage', value: 'percentage'},
          {label: 'Fixed Amount', value: 'fixed_amount'},
        ]}
      />

      <OptionModal
        visible={showAppliesToModal}
        onClose={() => setShowAppliesToModal(false)}
        title="Applies To"
        selectedValue={formData.appliesTo}
        onSelect={value => updateFormData('appliesTo', value)}
        options={[
          {label: 'Collections', value: 'collections'},
          {label: 'Products', value: 'products'},
        ]}
      />

      <OptionModal
        visible={showEligibilityModal}
        onClose={() => setShowEligibilityModal(false)}
        title="Eligibility"
        selectedValue={formData.eligibility}
        onSelect={value => updateFormData('eligibility', value)}
        options={[
          {label: 'All customers', value: 'all_customers'},
          {label: 'Specific customers', value: 'specific_customers'},
        ]}
      />

      <OptionModal
        visible={showMinRequirementModal}
        onClose={() => setShowMinRequirementModal(false)}
        title="Minimum Requirements"
        selectedValue={formData.min_purchase_req}
        onSelect={value => updateFormData('min_purchase_req', value)}
        options={[
          {label: 'No minimum requirements', value: 'no_req'},
          {label: 'Minimum purchase amount', value: 'min_amount_req'},
          {label: 'Minimum quantity of items', value: 'min_items_req'},
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  toggleActive: {
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  toggleText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  toggleActiveText: {
    color: colors.text,
    fontFamily: fonts.semiBold,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
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
    fontFamily: fonts.regular,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputDescription: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 4,
  },
  generateButton: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  selectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.background,
    marginBottom: 12,
  },
  selectButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.splashGreen,
    borderRadius: 8,
    borderStyle: 'dashed',
    marginBottom: 12,
  },
  addButtonText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
    marginLeft: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.regular,
    color: colors.text,
    flex: 1,
    marginRight: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  dateButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
    marginLeft: 8,
  },
  comingSoon: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '70%',
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
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  optionItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  selectedOption: {
    backgroundColor: colors.splashGreen + '10',
  },
  optionText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  selectedOptionText: {
    color: colors.splashGreen,
    fontFamily: fonts.semiBold,
  },
});

export default CreateDiscountScreen;
