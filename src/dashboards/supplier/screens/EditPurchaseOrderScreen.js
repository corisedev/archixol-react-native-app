import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Plus,
  Package,
  Search,
  X,
  Calendar,
  Truck,
  Hash,
  Tag,
  FileText,
  Check,
  ChevronDown,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {
  getPurchaseOrder,
  updatePurchaseOrder,
  getAllVendors,
  searchProducts,
} from '../../../api/serviceSupplier';
import {useNavigation} from '@react-navigation/native';

const EditPurchaseOrderScreen = ({route}) => {
  const navigation = useNavigation();
  const {purchaseOrderId, purchaseOrderData} = route.params;

  // Data State
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    vendor_id: '',
    vendor_name: '',
    payment_terms: '',
    destination: '',
    supplier_currency: 'USD',
    estimated_arrival: new Date(),
    shipping_carrier: '',
    tracking_number: '',
    reference_number: '',
    tags: [],
    notes: '',
  });

  // UI State
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showPaymentTermsModal, setShowPaymentTermsModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showCarrierModal, setShowCarrierModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);

  // Product Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Vendors State
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);

  // Tag State
  const [tagInput, setTagInput] = useState('');

  // Options
  const paymentTerms = [
    {label: 'Net 30', value: 'net_30'},
    {label: 'Net 60', value: 'net_60'},
    {label: 'Net 90', value: 'net_90'},
    {label: 'Cash on Delivery', value: 'cod'},
    {label: 'Prepaid', value: 'prepaid'},
  ];

  const currencies = [
    {label: 'USD ($)', value: 'USD'},
    {label: 'EUR (€)', value: 'EUR'},
    {label: 'GBP (£)', value: 'GBP'},
    {label: 'JPY (¥)', value: 'JPY'},
  ];

  const shippingCarriers = [
    {label: 'FedEx', value: 'fedex'},
    {label: 'UPS', value: 'ups'},
    {label: 'DHL', value: 'dhl'},
    {label: 'USPS', value: 'usps'},
    {label: 'Other', value: 'other'},
  ];

  // Format currency helper
  const formatCurrency = amount => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: formData.supplier_currency,
    }).format(amount);
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = selectedProducts.reduce(
      (sum, product) => sum + product.price * product.quantity,
      0,
    );
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    return {subtotal, tax, total};
  };

  const totals = calculateTotals();

  // Fetch purchase order data
  const fetchPurchaseOrderData = React.useCallback(async () => {
    setDataLoading(true);
    try {
      // If we have data from route params, use it, otherwise fetch
      if (purchaseOrderData) {
        loadPurchaseOrderData(purchaseOrderData);
      } else {
        const response = await getPurchaseOrder({
          purchase_order_id: purchaseOrderId,
        });
        if (response && response.purchase_order) {
          loadPurchaseOrderData(response.purchase_order);
        }
      }
    } catch (error) {
      console.error('Failed to fetch purchase order:', error);
      Alert.alert('Error', 'Failed to load purchase order data');
    } finally {
      setDataLoading(false);
    }
  }, [purchaseOrderData, purchaseOrderId]);

  // Load purchase order data into form
  const loadPurchaseOrderData = data => {
    setPurchaseOrder(data);

    setFormData({
      vendor_id: data.vendor_id || data.vendor?.id || '',
      vendor_name: data.vendor_name || data.vendor?.vendor_name || '',
      payment_terms: data.payment_terms || '',
      destination: data.destination || '',
      supplier_currency: data.supplier_currency || 'USD',
      estimated_arrival: data.estimated_arrival
        ? new Date(data.estimated_arrival)
        : new Date(),
      shipping_carrier: data.shipping_carrier || '',
      tracking_number: data.tracking_number || '',
      reference_number: data.reference_number || '',
      tags: data.tags || [],
      notes: data.notes || '',
    });

    // Load products
    if (data.products && data.products.length > 0) {
      setSelectedProducts(
        data.products.map(product => ({
          ...product,
          quantity: product.quantity || 1,
        })),
      );
    }
  };

  // Fetch vendors
  const fetchVendors = async () => {
    setVendorsLoading(true);
    try {
      const response = await getAllVendors();
      setVendors(response.vendors || []);
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
      Alert.alert('Error', 'Failed to load vendors');
    } finally {
      setVendorsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrderData();
    fetchVendors();
  }, [fetchPurchaseOrderData]);

  // Search products
  const handleProductSearch = async query => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await searchProducts({query});
      setSearchResults(response.products || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Add product to order
  const addProductToOrder = product => {
    const existingProduct = selectedProducts.find(p => p.id === product.id);

    if (existingProduct) {
      setSelectedProducts(
        selectedProducts.map(p =>
          p.id === product.id ? {...p, quantity: p.quantity + 1} : p,
        ),
      );
    } else {
      setSelectedProducts([...selectedProducts, {...product, quantity: 1}]);
    }

    setShowProductModal(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Remove product from order
  const removeProductFromOrder = productId => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  // Update product quantity
  const updateProductQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeProductFromOrder(productId);
      return;
    }

    setSelectedProducts(
      selectedProducts.map(p => (p.id === productId ? {...p, quantity} : p)),
    );
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = tagToRemove => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };

  // Handle date change
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({...formData, estimated_arrival: selectedDate});
    }
  };

  // Validate form
  const validateForm = () => {
    if (!formData.vendor_id) {
      Alert.alert('Error', 'Please select a vendor');
      return false;
    }
    if (!formData.destination) {
      Alert.alert('Error', 'Please enter destination');
      return false;
    }
    if (selectedProducts.length === 0) {
      Alert.alert('Error', 'Please add at least one product');
      return false;
    }
    return true;
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const purchaseOrderData = {
        purchase_order_id: purchaseOrderId,
        ...formData,
        products: selectedProducts,
        calculations: {
          subtotal: totals.subtotal,
          totalTax: totals.tax,
          total: totals.total,
          taxPercentage: 10,
        },
      };

      await updatePurchaseOrder(purchaseOrderData);
      Alert.alert('Success', 'Purchase order updated successfully', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error) {
      console.error('Failed to update purchase order:', error);
      Alert.alert(
        'Error',
        'Failed to update purchase order. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Render vendor selection modal
  const renderVendorModal = () => (
    <Modal
      visible={showVendorModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowVendorModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Vendor</Text>
            <TouchableOpacity onPress={() => setShowVendorModal(false)}>
              <X color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          {vendorsLoading ? (
            <ActivityIndicator color={colors.splashGreen} size="large" />
          ) : (
            <ScrollView style={styles.modalList}>
              {vendors.map(vendor => (
                <TouchableOpacity
                  key={vendor.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setFormData({
                      ...formData,
                      vendor_id: vendor.id,
                      vendor_name: vendor.vendor_name,
                    });
                    setShowVendorModal(false);
                  }}>
                  <Text style={styles.modalItemText}>{vendor.vendor_name}</Text>
                  {formData.vendor_id === vendor.id && (
                    <Check color={colors.splashGreen} size={20} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  // Render option selection modal
  const renderOptionModal = (
    visible,
    onClose,
    options,
    selectedValue,
    onSelect,
    title,
  ) => (
    <Modal
      visible={visible}
      transparent
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

          <ScrollView style={styles.modalList}>
            {options.map(option => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalItem}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}>
                <Text style={styles.modalItemText}>{option.label}</Text>
                {selectedValue === option.value && (
                  <Check color={colors.splashGreen} size={20} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  // Render product search modal
  const renderProductModal = () => (
    <Modal
      visible={showProductModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowProductModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, {height: '80%'}]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Products</Text>
            <TouchableOpacity onPress={() => setShowProductModal(false)}>
              <X color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Search color={colors.textSecondary} size={20} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search products..."
                value={searchQuery}
                onChangeText={text => {
                  setSearchQuery(text);
                  handleProductSearch(text);
                }}
              />
            </View>
          </View>

          {searchLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.splashGreen} size="large" />
            </View>
          ) : (
            <ScrollView style={styles.modalList}>
              {searchResults.map(product => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.productItem}
                  onPress={() => addProductToOrder(product)}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.title}</Text>
                    <Text style={styles.productPrice}>
                      {formatCurrency(product.price)}
                    </Text>
                  </View>
                  <Plus color={colors.splashGreen} size={20} />
                </TouchableOpacity>
              ))}
              {searchQuery && !searchLoading && searchResults.length === 0 && (
                <Text style={styles.noResultsText}>No products found</Text>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  // Loading state
  if (dataLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading purchase order...</Text>
      </View>
    );
  }

  // Error state
  if (!purchaseOrder) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Package color={colors.textSecondary} size={48} />
        <Text style={styles.errorTitle}>Purchase Order Not Found</Text>
        <Text style={styles.errorSubtitle}>
          Unable to load purchase order data. Please try again.
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
          <Text style={styles.headerTitle}>Edit Purchase Order</Text>
          <Text style={styles.headerSubtitle}>
            #{purchaseOrder.po_no || purchaseOrderId}
          </Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Vendor Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vendor Information</Text>
          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setShowVendorModal(true)}>
            <Text
              style={[
                styles.selectText,
                !formData.vendor_name && styles.placeholder,
              ]}>
              {formData.vendor_name || 'Select Vendor'}
            </Text>
            <ChevronDown color={colors.textSecondary} size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setShowPaymentTermsModal(true)}>
            <Text
              style={[
                styles.selectText,
                !formData.payment_terms && styles.placeholder,
              ]}>
              {paymentTerms.find(p => p.value === formData.payment_terms)
                ?.label || 'Payment Terms (Optional)'}
            </Text>
            <ChevronDown color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Destination & Currency */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Destination</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter destination address"
              value={formData.destination}
              onChangeText={text =>
                setFormData({...formData, destination: text})
              }
            />
          </View>

          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setShowCurrencyModal(true)}>
            <Text style={styles.selectText}>
              {
                currencies.find(c => c.value === formData.supplier_currency)
                  ?.label
              }
            </Text>
            <ChevronDown color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Shipment Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipment Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Estimated Arrival</Text>
            <TouchableOpacity
              style={styles.dateField}
              onPress={() => setShowDatePicker(true)}>
              <Calendar color={colors.textSecondary} size={20} />
              <Text style={styles.dateText}>
                {formData.estimated_arrival.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.selectField}
            onPress={() => setShowCarrierModal(true)}>
            <Text
              style={[
                styles.selectText,
                !formData.shipping_carrier && styles.placeholder,
              ]}>
              {shippingCarriers.find(c => c.value === formData.shipping_carrier)
                ?.label || 'Select Shipping Carrier'}
            </Text>
            <ChevronDown color={colors.textSecondary} size={20} />
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tracking Number</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter tracking number"
              value={formData.tracking_number}
              onChangeText={text =>
                setFormData({...formData, tracking_number: text})
              }
            />
          </View>
        </View>

        {/* Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Products</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowProductModal(true)}>
              <Plus color={colors.background} size={16} />
              <Text style={styles.addButtonText}>Add Product</Text>
            </TouchableOpacity>
          </View>

          {selectedProducts.length === 0 ? (
            <View style={styles.emptyProducts}>
              <Package color={colors.textSecondary} size={48} />
              <Text style={styles.emptyProductsText}>No products added</Text>
              <Text style={styles.emptyProductsSubtext}>
                Tap "Add Product" to get started
              </Text>
            </View>
          ) : (
            <View style={styles.productsList}>
              {selectedProducts.map(product => (
                <View key={product.id} style={styles.productCard}>
                  <View style={styles.productDetails}>
                    <Text style={styles.productName}>{product.title}</Text>
                    <Text style={styles.productPrice}>
                      {formatCurrency(product.price)} each
                    </Text>
                  </View>

                  <View style={styles.quantityControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() =>
                        updateProductQuantity(product.id, product.quantity - 1)
                      }>
                      <Text style={styles.quantityButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{product.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() =>
                        updateProductQuantity(product.id, product.quantity + 1)
                      }>
                      <Text style={styles.quantityButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeProductFromOrder(product.id)}>
                    <X color="#F44336" size={16} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Additional Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Reference Number</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter reference number"
              value={formData.reference_number}
              onChangeText={text =>
                setFormData({...formData, reference_number: text})
              }
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tags</Text>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder="Add tag"
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
              />
              <TouchableOpacity style={styles.tagAddButton} onPress={addTag}>
                <Plus color={colors.splashGreen} size={16} />
              </TouchableOpacity>
            </View>

            {formData.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {formData.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity onPress={() => removeTag(tag)}>
                      <X color={colors.background} size={12} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes to Supplier</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Enter notes"
              value={formData.notes}
              onChangeText={text => setFormData({...formData, notes: text})}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Cost Summary */}
        {selectedProducts.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Cost Summary</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totals.subtotal)}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax (10%)</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totals.tax)}
              </Text>
            </View>

            <View style={[styles.summaryRow, styles.summaryTotal]}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>
                {formatCurrency(totals.total)}
              </Text>
            </View>

            <Text style={styles.itemCount}>
              {selectedProducts.length} item
              {selectedProducts.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Submit Buttons */}
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
              <Text style={styles.primaryButtonText}>
                Update Purchase Order
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.estimated_arrival}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Modals */}
      {renderVendorModal()}
      {renderOptionModal(
        showPaymentTermsModal,
        () => setShowPaymentTermsModal(false),
        paymentTerms,
        formData.payment_terms,
        value => setFormData({...formData, payment_terms: value}),
        'Select Payment Terms',
      )}
      {renderOptionModal(
        showCurrencyModal,
        () => setShowCurrencyModal(false),
        currencies,
        formData.supplier_currency,
        value => setFormData({...formData, supplier_currency: value}),
        'Select Currency',
      )}
      {renderOptionModal(
        showCarrierModal,
        () => setShowCarrierModal(false),
        shippingCarriers,
        formData.shipping_carrier,
        value => setFormData({...formData, shipping_carrier: value}),
        'Select Shipping Carrier',
      )}
      {renderProductModal()}
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
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 16,
  },
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
    fontFamily: fonts.regular,
    backgroundColor: colors.background,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.background,
    marginBottom: 16,
  },
  selectText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  placeholder: {
    color: colors.textSecondary,
  },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.background,
    gap: 8,
  },
  dateText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: {
    color: colors.background,
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
  },
  emptyProducts: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  emptyProductsText: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.medium,
    color: colors.text,
    marginTop: 16,
  },
  emptyProductsSubtext: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  productsList: {
    gap: 12,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  productPrice: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  quantityText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.text,
    marginHorizontal: 12,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: 4,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    backgroundColor: colors.background,
  },
  tagAddButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.splashGreen + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tagText: {
    color: colors.background,
    fontSize: fontSizes.xs,
    fontFamily: fonts.medium,
  },
  summaryCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  summaryTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
  },
  summaryTotal: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: colors.splashGreen,
  },
  summaryTotalLabel: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  summaryTotalValue: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },
  itemCount: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
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
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  modalList: {
    flex: 1,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  modalItemText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  productInfo: {
    flex: 1,
  },
  noResultsText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    paddingVertical: 32,
  },
});

export default EditPurchaseOrderScreen;
