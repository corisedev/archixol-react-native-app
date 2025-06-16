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
  Package,
  User,
  MapPin,
  DollarSign,
  Calendar,
  Tag,
  FileText,
  ChevronDown,
  X,
  Plus,
  Minus,
  Trash2,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {
  getOrder,
  updateOrder,
  getAllProducts,
} from '../../../api/serviceSupplier';
import {useNavigation, useRoute} from '@react-navigation/native';

// Status options
const statusOptions = [
  {label: 'Pending', value: 'pending'},
  {label: 'Processing', value: 'processing'},
  {label: 'Shipped', value: 'shipped'},
  {label: 'Delivered', value: 'delivered'},
  {label: 'Cancelled', value: 'cancelled'},
];

// Payment status options
const paymentStatusOptions = [
  {label: 'Pending', value: false},
  {label: 'Paid', value: true},
];

// Status Selection Modal Component
const StatusModal = ({
  visible,
  onClose,
  title,
  options,
  selectedValue,
  onSelect,
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="slide"
    onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <X color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.optionsList}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.option,
                selectedValue === option.value && styles.selectedOption,
              ]}
              onPress={() => onSelect(option)}>
              <Text
                style={[
                  styles.optionText,
                  selectedValue === option.value && styles.selectedOptionText,
                ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const EditOrderScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {orderId, orderData} = route.params;

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  // Order data
  const [order, setOrder] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    status: '',
    payment_status: false,
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    shipping_address: '',
    billing_address: '',
    notes: '',
    items: [],
    subtotal: 0,
    tax: 0,
    shipping: 0,
    discount: 0,
    total: 0,
  });

  // Fetch order data
  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getOrder({order_id: orderId});
      console.log('Edit Order API Response:', response);

      if (response && response.order) {
        const orderData = response.order;
        setOrder(orderData);

        // Parse customer details from notes if available
        let customerDetails = null;
        try {
          if (orderData.notes) {
            const notesObj = JSON.parse(orderData.notes);
            customerDetails = notesObj.customer_details || null;
          }
        } catch (e) {
          console.log('Notes parsing failed:', e);
        }

        // Get order items
        const items =
          orderData.products || orderData.items || orderData.order_items || [];

        // Get order totals
        const calculations = orderData.calculations || {};
        const subtotal = calculations.subtotal || orderData.subtotal || 0;
        const tax =
          calculations.totalTax || calculations.tax || orderData.tax || 0;
        const shipping = calculations.shipping || orderData.shipping || 0;
        const discount =
          calculations.totalDiscount ||
          calculations.discount ||
          orderData.discount ||
          0;
        const total =
          calculations.total || orderData.total || orderData.grand_total || 0;

        // Set form data
        setFormData({
          status: orderData.status || 'pending',
          payment_status: orderData.payment_status || false,
          customer_name:
            customerDetails?.firstName && customerDetails?.lastName
              ? `${customerDetails.firstName} ${customerDetails.lastName}`
              : orderData.customer_name || orderData.customer?.name || '',
          customer_email:
            customerDetails?.email ||
            orderData.customer_email ||
            orderData.customer?.email ||
            '',
          customer_phone:
            customerDetails?.phone ||
            orderData.customer_phone ||
            orderData.customer?.phone ||
            '',
          shipping_address:
            orderData.shipping_address ||
            (customerDetails?.address
              ? `${customerDetails.address}${
                  customerDetails.apartment
                    ? `, ${customerDetails.apartment}`
                    : ''
                }, ${customerDetails.city || ''}, ${
                  customerDetails.province || ''
                } ${customerDetails.postalCode || ''}, ${
                  customerDetails.country || ''
                }`
                  .replace(/,\s*,/g, ',')
                  .replace(/,\s*$/, '')
              : ''),
          billing_address:
            orderData.billing_address || orderData.shipping_address || '',
          notes:
            typeof orderData.notes === 'string'
              ? orderData.notes
              : JSON.stringify(orderData.notes || {}),
          items: items.map(item => ({
            id: item.id || item._id,
            title:
              item.title || item.product_name || item.name || 'Unknown Product',
            price: parseFloat(item.price || item.unit_price || 0),
            quantity: parseInt(item.qty || item.quantity || 1),
            total:
              parseFloat(item.price || item.unit_price || 0) *
              parseInt(item.qty || item.quantity || 1),
          })),
          subtotal,
          tax,
          shipping,
          discount,
          total,
        });
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
      Alert.alert('Error', 'Unable to load order data. Please try again.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [orderId, navigation]);

  useEffect(() => {
    if (orderData) {
      // If order data is passed from params, use it
      setOrder(orderData);
      setLoading(false);
      // You can parse orderData here similar to fetchOrder
    } else {
      fetchOrder();
    }
  }, [fetchOrder, orderData]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Recalculate totals if items change
    if (field === 'items') {
      calculateTotals(value);
    }
  };

  // Calculate order totals
  const calculateTotals = items => {
    const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
    const tax = subtotal * 0.1; // 10% tax (adjust as needed)
    const total = subtotal + tax + formData.shipping - formData.discount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax,
      total,
    }));
  };

  // Handle status selection
  const handleStatusSelect = option => {
    setFormData(prev => ({
      ...prev,
      status: option.value,
    }));
    setStatusModalVisible(false);
  };

  // Handle payment status selection
  const handlePaymentSelect = option => {
    setFormData(prev => ({
      ...prev,
      payment_status: option.value,
    }));
    setPaymentModalVisible(false);
  };

  // Get status label
  const getStatusLabel = value => {
    const option = statusOptions.find(opt => opt.value === value);
    return option ? option.label : 'Select Status';
  };

  // Get payment status label
  const getPaymentStatusLabel = value => {
    const option = paymentStatusOptions.find(opt => opt.value === value);
    return option ? option.label : 'Select Status';
  };

  // Update item quantity
  const updateItemQuantity = (index, change) => {
    const newItems = [...formData.items];
    const newQuantity = Math.max(1, newItems[index].quantity + change);
    newItems[index].quantity = newQuantity;
    newItems[index].total = newItems[index].price * newQuantity;

    handleInputChange('items', newItems);
  };

  // Update item price
  const updateItemPrice = (index, newPrice) => {
    const newItems = [...formData.items];
    const price = parseFloat(newPrice) || 0;
    newItems[index].price = price;
    newItems[index].total = price * newItems[index].quantity;

    handleInputChange('items', newItems);
  };

  // Remove item
  const removeItem = index => {
    const newItems = formData.items.filter((_, i) => i !== index);
    handleInputChange('items', newItems);
  };

  // Format currency
  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `PKR ${amount.toLocaleString()}`;
    }
    return `PKR ${amount || '0'}`;
  };

  // Validate form
  const validateForm = () => {
    const errors = [];

    if (!formData.customer_name.trim()) {
      errors.push('Customer name is required');
    }

    if (!formData.customer_email.trim()) {
      errors.push('Customer email is required');
    } else if (!/\S+@\S+\.\S+/.test(formData.customer_email)) {
      errors.push('Please enter a valid email address');
    }

    if (formData.items.length === 0) {
      errors.push('At least one item is required');
    }

    return errors;
  };

  // Handle save order
  const handleSave = async () => {
    try {
      // Validate form
      const errors = validateForm();
      if (errors.length > 0) {
        Alert.alert('Validation Error', errors.join('\n'));
        return;
      }

      setSaving(true);

      // Prepare order data
      const updateData = {
        order_id: orderId,
        status: formData.status,
        payment_status: formData.payment_status,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email,
        customer_phone: formData.customer_phone,
        shipping_address: formData.shipping_address,
        billing_address: formData.billing_address,
        notes: formData.notes,
        products: formData.items.map(item => ({
          id: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          total: item.total,
        })),
        calculations: {
          subtotal: formData.subtotal,
          tax: formData.tax,
          shipping: formData.shipping,
          discount: formData.discount,
          total: formData.total,
        },
        total: formData.total,
      };

      console.log('Updating Order:', updateData);

      const response = await updateOrder(updateData);
      console.log('Update Response:', response);

      Alert.alert('Success', 'Order updated successfully!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error('Failed to update order:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to update order. Please try again.',
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
        <Text style={styles.loadingText}>Loading order data...</Text>
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

        <Text style={styles.headerTitle}>Edit Order</Text>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.disabledBtn]}
          onPress={handleSave}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <>
              <Save color={colors.background} size={16} />
              <Text style={styles.saveBtnText}>Update</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Order Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Order Status</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Order Status</Text>
              <TouchableOpacity
                style={styles.pickerInput}
                onPress={() => setStatusModalVisible(true)}>
                <Text
                  style={[
                    styles.pickerText,
                    !formData.status && styles.placeholderText,
                  ]}>
                  {getStatusLabel(formData.status)}
                </Text>
                <ChevronDown color={colors.textSecondary} size={16} />
              </TouchableOpacity>
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Payment Status</Text>
              <TouchableOpacity
                style={styles.pickerInput}
                onPress={() => setPaymentModalVisible(true)}>
                <Text
                  style={[
                    styles.pickerText,
                    formData.payment_status === null && styles.placeholderText,
                  ]}>
                  {getPaymentStatusLabel(formData.payment_status)}
                </Text>
                <ChevronDown color={colors.textSecondary} size={16} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Customer Information</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Customer Name</Text>
            <TextInput
              style={styles.textInput}
              value={formData.customer_name}
              onChangeText={text => handleInputChange('customer_name', text)}
              placeholder="Enter customer name"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.textInput}
                value={formData.customer_email}
                onChangeText={text => handleInputChange('customer_email', text)}
                placeholder="customer@email.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.textInput}
                value={formData.customer_phone}
                onChangeText={text => handleInputChange('customer_phone', text)}
                placeholder="+92 300 1234567"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />
            </View>
          </View>
        </View>

        {/* Shipping & Billing */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Addresses</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Shipping Address</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.shipping_address}
              onChangeText={text => handleInputChange('shipping_address', text)}
              placeholder="Enter shipping address"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Billing Address</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.billing_address}
              onChangeText={text => handleInputChange('billing_address', text)}
              placeholder="Enter billing address (leave empty to use shipping address)"
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Order Items</Text>
          </View>

          {formData.items.map((item, index) => (
            <View key={index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.title}</Text>
                <TouchableOpacity
                  style={styles.removeItemButton}
                  onPress={() => removeItem(index)}>
                  <Trash2 color="#F44336" size={16} />
                </TouchableOpacity>
              </View>

              <View style={styles.itemControls}>
                <View style={styles.quantityControls}>
                  <Text style={styles.controlLabel}>Quantity</Text>
                  <View style={styles.quantityRow}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateItemQuantity(index, -1)}>
                      <Minus color={colors.text} size={16} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateItemQuantity(index, 1)}>
                      <Plus color={colors.text} size={16} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.priceControls}>
                  <Text style={styles.controlLabel}>Unit Price</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={item.price.toString()}
                    onChangeText={text => updateItemPrice(index, text)}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.totalControls}>
                  <Text style={styles.controlLabel}>Total</Text>
                  <Text style={styles.itemTotal}>
                    {formatCurrency(item.total)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Order Totals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <DollarSign color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Order Totals</Text>
          </View>

          <View style={styles.totalsCard}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(formData.subtotal)}
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <TextInput
                style={styles.totalInput}
                value={formData.tax.toString()}
                onChangeText={text =>
                  handleInputChange('tax', parseFloat(text) || 0)
                }
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Shipping</Text>
              <TextInput
                style={styles.totalInput}
                value={formData.shipping.toString()}
                onChangeText={text =>
                  handleInputChange('shipping', parseFloat(text) || 0)
                }
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <TextInput
                style={styles.totalInput}
                value={formData.discount.toString()}
                onChangeText={text =>
                  handleInputChange('discount', parseFloat(text) || 0)
                }
                placeholder="0.00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(formData.total)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Order Notes</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.notes}
              onChangeText={text => handleInputChange('notes', text)}
              placeholder="Add any additional notes about this order"
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

      {/* Status Selection Modals */}
      <StatusModal
        visible={statusModalVisible}
        onClose={() => setStatusModalVisible(false)}
        title="Select Order Status"
        options={statusOptions}
        selectedValue={formData.status}
        onSelect={handleStatusSelect}
      />

      <StatusModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        title="Select Payment Status"
        options={paymentStatusOptions}
        selectedValue={formData.payment_status}
        onSelect={handlePaymentSelect}
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
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
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

  // Order Items
  itemCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    flex: 1,
  },
  removeItemButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF3F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemControls: {
    flexDirection: 'row',
    gap: 16,
  },
  quantityControls: {
    flex: 1,
  },
  priceControls: {
    flex: 1,
  },
  totalControls: {
    flex: 1,
  },
  controlLabel: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  quantityText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    minWidth: 30,
    textAlign: 'center',
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: fontSizes.sm,
    color: colors.text,
    backgroundColor: colors.background,
    fontFamily: fonts.regular,
  },
  itemTotal: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
    paddingVertical: 8,
  },

  // Order Totals
  totalsCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  totalLabel: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
    flex: 1,
  },
  totalValue: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  totalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: fontSizes.sm,
    color: colors.text,
    backgroundColor: colors.background,
    fontFamily: fonts.regular,
    width: 80,
    textAlign: 'right',
  },
  grandTotalRow: {
    backgroundColor: colors.splashGreen + '10',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 8,
    borderBottomWidth: 0,
  },
  grandTotalLabel: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  grandTotalValue: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.splashGreen,
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
  optionsList: {
    paddingHorizontal: 20,
  },
  option: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedOption: {
    backgroundColor: colors.splashGreen + '10',
  },
  optionText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  selectedOptionText: {
    color: colors.splashGreen,
    fontFamily: fonts.semiBold,
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 100,
  },
});

export default EditOrderScreen;
