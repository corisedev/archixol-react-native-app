import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Linking,
  RefreshControl,
} from 'react-native';
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Phone,
  Mail,
  MoreVertical,
  BadgeCheck,
  CreditCard,
  Package,
  ShoppingCart,
  ChevronRight,
  User,
  RefreshCcw,
  Pencil,
  Trash2,
  X,
} from 'lucide-react-native';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {
  getOrder,
  updateFulfillmentStatus,
  markAsPaid,
  markAsDelivered,
  deleteOrder, // Add this API function
} from '../../../api/serviceSupplier';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useContext} from 'react';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../context/BackendContext';

const OrderDetailScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [order, setOrder] = useState(null);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const {orderId} = route.params;
  const {backendUrl} = useContext(BackendContext);

  // Get full image URL helper function
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
    const fullUrl = `${baseUrl}/${cleanPath}`;

    console.log('🔗 Order Image URL:', {
      relativePath,
      baseUrl,
      cleanPath,
      fullUrl,
    });

    return fullUrl;
  };

  // Fetch order details
  const fetchOrderDetails = useCallback(async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const response = await getOrder({order_id: orderId});
      console.log('Order Detail API Response:', response);

      if (response && response.order) {
        setOrder(response.order);
      }
    } catch (error) {
      console.error('Failed to load order details:', error);
      Alert.alert('Error', 'Unable to load order details. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId, refreshing]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrderDetails();
  }, [fetchOrderDetails]);

  // Update order status
  const updateOrderStatus = async newStatus => {
    try {
      await updateFulfillmentStatus({
        order_id: orderId,
        status: newStatus,
      });

      setOrder(prev => ({...prev, status: newStatus}));
      Alert.alert('Success', `Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Status update failed:', error);
      Alert.alert('Error', 'Failed to update order status. Please try again.');
    }
  };

  // Mark as paid
  const markOrderAsPaid = async () => {
    try {
      await markAsPaid({order_id: orderId});
      setOrder(prev => ({...prev, payment_status: true}));
      Alert.alert('Success', 'Order marked as paid');
    } catch (error) {
      console.error('Mark as paid failed:', error);
      Alert.alert('Error', 'Failed to mark order as paid. Please try again.');
    }
  };

  const markOrderAsDelivered = async () => {
    try {
      await markAsDelivered({order_id: orderId});
      setOrder(prev => ({...prev, status: 'delivered', delivery_status: true}));
      Alert.alert('Success', 'Order marked as delivered');
    } catch (error) {
      console.error('Mark as delivered failed:', error);
      Alert.alert(
        'Error',
        'Failed to mark order as delivered. Please try again.',
      );
    }
  };

  // Handle order edit
  // Inside OrderDetailScreen
  const handleEditOrder = () => {
    setActionModalVisible(false);
    navigation.navigate('EditOrderScreen', {
      orderId: orderId,
      orderData: order,
    });
  };

  // Handle order delete
  const handleDeleteOrder = () => {
    setActionModalVisible(false);
    setDeleteModalVisible(true);
  };

  const onConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteOrder({order_id: orderId});
      setDeleteModalVisible(false);
      Alert.alert('Success', 'Order deleted successfully', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error) {
      console.error('Delete order failed:', error);
      Alert.alert('Error', 'Failed to delete order. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle phone call
  const handlePhoneCall = phoneNumber => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  // Handle email
  const handleEmail = email => {
    if (email) {
      Linking.openURL(`mailto:${email}`);
    }
  };

  // Format currency
  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `PKR ${amount.toLocaleString()}`;
    }
    return `PKR ${amount || '0'}`;
  };

  // Get status color with proper null/undefined handling
  const getStatusColor = status => {
    if (!status) {
      return colors.textSecondary;
    }

    const statusLower = String(status).toLowerCase();
    switch (statusLower) {
      case 'completed':
      case 'delivered':
        return colors.splashGreen;
      case 'processing':
      case 'shipped':
        return '#2196F3';
      case 'pending':
      case 'open':
        return '#FFC107';
      case 'cancelled':
      case 'returned':
        return '#F44336';
      default:
        return colors.textSecondary;
    }
  };

  // Get payment status color with proper handling
  const getPaymentStatusColor = status => {
    if (!status) {
      return colors.textSecondary;
    }

    if (typeof status === 'boolean') {
      return status ? colors.splashGreen : '#FFC107';
    }

    const statusLower = String(status).toLowerCase();
    switch (statusLower) {
      case 'paid':
      case 'true':
        return colors.splashGreen;
      case 'pending':
      case 'false':
        return '#FFC107';
      case 'failed':
      case 'refunded':
        return '#F44336';
      default:
        return colors.textSecondary;
    }
  };

  // Format date
  const formatDate = dateString => {
    if (!dateString) {
      return 'N/A';
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }

      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get order items based on API response structure
  const getOrderItems = orderObj => {
    if (!orderObj) {
      return [];
    }

    // Check different possible field names
    if (orderObj.products && Array.isArray(orderObj.products)) {
      return orderObj.products;
    }
    if (orderObj.items && Array.isArray(orderObj.items)) {
      return orderObj.items;
    }
    if (orderObj.order_items && Array.isArray(orderObj.order_items)) {
      return orderObj.order_items;
    }

    return [];
  };

  // Get order totals based on API response structure
  const getOrderTotals = orderObj => {
    if (!orderObj) {
      return {subtotal: 0, tax: 0, shipping: 0, discount: 0, total: 0};
    }

    const calculations = orderObj.calculations || {};

    return {
      subtotal: calculations.subtotal || orderObj.subtotal || 0,
      tax: calculations.totalTax || calculations.tax || orderObj.tax || 0,
      shipping: calculations.shipping || orderObj.shipping || 0,
      discount:
        calculations.totalDiscount ||
        calculations.discount ||
        orderObj.discount ||
        0,
      total:
        calculations.total ||
        orderObj.total ||
        orderObj.grand_total ||
        orderObj.bill_paid ||
        0,
    };
  };

  // Get customer info based on API response structure
  const getCustomerInfo = orderObj => {
    if (!orderObj) {
      return {name: 'Unknown', email: '', phone: ''};
    }

    const customer = orderObj.customer || {};

    return {
      name:
        customer.customer_name ||
        customer.name ||
        orderObj.customer_name ||
        'Unknown Customer',
      email: customer.email || orderObj.customer_email || '',
      phone:
        customer.phone_number ||
        customer.phone ||
        orderObj.customer_phone ||
        '',
    };
  };

  // Parse customer details from notes JSON
  const parseCustomerDetailsFromNotes = notes => {
    if (!notes) {
      return null;
    }

    try {
      const notesObj = JSON.parse(notes);
      return notesObj.customer_details || null;
    } catch (e) {
      console.log('Notes is not valid JSON:', e);
      return null;
    }
  };

  // Get shipping address based on API response structure
  const getShippingAddress = orderObj => {
    if (!orderObj) {
      return {
        full: '',
        street: '',
        city: '',
        state: '',
        country: '',
        postal_code: '',
      };
    }

    // First try to parse from notes
    const customerDetails = parseCustomerDetailsFromNotes(orderObj.notes);

    if (customerDetails) {
      return {
        full: orderObj.shipping_address || '',
        street: customerDetails.address || '',
        apartment: customerDetails.apartment || '',
        city: customerDetails.city || '',
        state: customerDetails.province || '',
        country: customerDetails.country || '',
        postal_code: customerDetails.postalCode || '',
      };
    }

    // Fallback to existing logic
    const shippingAddr = orderObj.shipping_address || orderObj.address || {};

    return {
      full: orderObj.shipping_address || '',
      street: shippingAddr.street || shippingAddr.address_line_1 || '',
      apartment: '',
      city: shippingAddr.city || '',
      state: shippingAddr.state || '',
      country: shippingAddr.country || '',
      postal_code: shippingAddr.postal_code || shippingAddr.zip_code || '',
    };
  };

  // Get billing address (same as shipping for now, but can be different)
  const getBillingAddress = orderObj => {
    if (!orderObj) {
      return null;
    }

    // For now, return same as shipping
    // In future, you can add separate billing address logic
    const customerDetails = parseCustomerDetailsFromNotes(orderObj.notes);

    if (customerDetails) {
      return {
        street: customerDetails.address || '',
        apartment: customerDetails.apartment || '',
        city: customerDetails.city || '',
        state: customerDetails.province || '',
        country: customerDetails.country || '',
        postal_code: customerDetails.postalCode || '',
      };
    }

    return getShippingAddress(orderObj);
  };

  // Get order tags
  const getOrderTags = orderObj => {
    if (!orderObj || !orderObj.tags) {
      return [];
    }

    return Array.isArray(orderObj.tags) ? orderObj.tags : [];
  };

  // Get order number based on API response structure
  const getOrderNumber = orderObj => {
    if (!orderObj) {
      return 'N/A';
    }

    return (
      orderObj.order_no ||
      orderObj.order_number ||
      `#${
        orderObj.id?.substring(0, 8) || orderObj._id?.substring(0, 8) || 'N/A'
      }`
    );
  };

  // Get payment status text
  const getPaymentStatusText = status => {
    if (typeof status === 'boolean') {
      return status ? 'PAID' : 'PENDING';
    }
    if (!status) {
      return 'UNKNOWN';
    }
    return String(status).toUpperCase();
  };

  // Get order status text
  const getOrderStatusText = status => {
    if (!status) {
      return 'UNKNOWN';
    }
    return String(status).toUpperCase();
  };

  // Loading state
  if (loading && !order) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Order not found</Text>
        <TouchableOpacity
          style={styles.backButtonIconWrapper}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={20} />
        </TouchableOpacity>
      </View>
    );
  }

  const statusColor = getStatusColor(order.status);
  const paymentColor = getPaymentStatusColor(order.payment_status);
  const orderItems = getOrderItems(order);
  const totals = getOrderTotals(order);
  const customer = getCustomerInfo(order);
  const shippingAddress = getShippingAddress(order);
  const billingAddress = getBillingAddress(order);
  const orderTags = getOrderTags(order);
  const orderNumber = getOrderNumber(order);
  const customerDetails = parseCustomerDetailsFromNotes(order.notes);

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
          <Text style={styles.headerTitle}>{orderNumber}</Text>
          <View style={[styles.headerStatus, {backgroundColor: statusColor}]}>
            <Text style={styles.headerStatusText}>
              {getOrderStatusText(order.status)}
            </Text>
          </View>
        </View>

        {/* Edit and More buttons */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setActionModalVisible(true)}>
            <MoreVertical color={colors.text} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Order Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryHeader}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <Text style={styles.orderTotal}>
              {formatCurrency(totals.total)}
            </Text>
          </View>

          <View style={styles.summaryDetails}>
            <View style={styles.summaryItem}>
              <CalendarDays color={colors.textSecondary} size={20} />
              <View>
                <Text style={styles.summaryLabel}>Order Date</Text>
                <Text style={styles.summaryValue}>
                  {formatDate(order.createdAt || order.placed_at)}
                </Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <BadgeCheck color={colors.textSecondary} size={20} />
              <View>
                <Text style={styles.summaryLabel}>Status</Text>
                <TouchableOpacity onPress={() => setStatusModalVisible(true)}>
                  <View style={styles.summaryStatusRow}>
                    <Text style={[styles.summaryValue, {color: statusColor}]}>
                      {getOrderStatusText(order.status)}
                    </Text>
                    <ChevronRight
                      color={statusColor}
                      size={16}
                      style={styles.chevronRight}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <CreditCard
                color={colors.textSecondary}
                size={20}
                style={styles.summaryIcon}
              />
              <View>
                <Text style={styles.summaryLabel}>Payment</Text>
                <Text style={[styles.summaryValue, {color: paymentColor}]}>
                  {getPaymentStatusText(order.payment_status)}
                </Text>
              </View>
            </View>

            <View style={styles.summaryItem}>
              <Package
                color={colors.textSecondary}
                size={20}
                style={styles.summaryIcon}
              />
              <View>
                <Text style={styles.summaryLabel}>Items</Text>
                <Text style={styles.summaryValue}>
                  {orderItems.length} product
                  {orderItems.length !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {order.channel && (
              <View style={styles.summaryItem}>
                <ShoppingCart
                  color={colors.textSecondary}
                  size={20}
                  style={styles.summaryIcon}
                />
                <View>
                  <Text style={styles.summaryLabel}>Channel</Text>
                  <Text style={styles.summaryValue}>{order.channel}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.customerSection}>
          <Text style={styles.sectionTitle}>Customer Information</Text>

          <View style={styles.customerCard}>
            <View style={styles.customerHeader}>
              <User color={colors.splashGreen} size={20} />
              <Text style={styles.customerName}>{customer.name}</Text>
            </View>

            {customer.email && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => handleEmail(customer.email)}>
                <Mail color={colors.splashGreen} size={16} />
                <Text style={styles.contactText}>{customer.email}</Text>
              </TouchableOpacity>
            )}

            {customer.phone && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => handlePhoneCall(customer.phone)}>
                <Phone color={colors.splashGreen} size={16} />
                <Text style={styles.contactText}>{customer.phone}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Shipping Address */}
        {(shippingAddress.full ||
          shippingAddress.street ||
          shippingAddress.city) && (
          <View style={styles.addressSection}>
            <Text style={styles.sectionTitle}>Shipping Address</Text>

            <View style={styles.addressCard}>
              <MapPin color={colors.splashGreen} size={20} />
              <View style={styles.addressContent}>
                {shippingAddress.full ? (
                  <Text style={styles.addressText}>{shippingAddress.full}</Text>
                ) : (
                  <>
                    {shippingAddress.street && (
                      <Text style={styles.addressText}>
                        {shippingAddress.street}
                        {shippingAddress.apartment &&
                          `, ${shippingAddress.apartment}`}
                      </Text>
                    )}
                    {shippingAddress.city && (
                      <Text style={styles.addressText}>
                        {shippingAddress.city}
                        {shippingAddress.state && `, ${shippingAddress.state}`}
                        {shippingAddress.postal_code &&
                          ` ${shippingAddress.postal_code}`}
                      </Text>
                    )}
                    {shippingAddress.country && (
                      <Text style={styles.addressText}>
                        {shippingAddress.country}
                      </Text>
                    )}
                  </>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Billing Address */}
        {billingAddress && (billingAddress.street || billingAddress.city) && (
          <View style={styles.addressSection}>
            <Text style={styles.sectionTitle}>Billing Address</Text>

            <View style={styles.addressCard}>
              <MapPin color={colors.splashGreen} size={20} />
              <View style={styles.addressContent}>
                {billingAddress.street && (
                  <Text style={styles.addressText}>
                    {billingAddress.street}
                    {billingAddress.apartment &&
                      `, ${billingAddress.apartment}`}
                  </Text>
                )}
                {billingAddress.city && (
                  <Text style={styles.addressText}>
                    {billingAddress.city}
                    {billingAddress.state && `, ${billingAddress.state}`}
                    {billingAddress.postal_code &&
                      ` ${billingAddress.postal_code}`}
                  </Text>
                )}
                {billingAddress.country && (
                  <Text style={styles.addressText}>
                    {billingAddress.country}
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Order Items */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Order Items</Text>

          {orderItems.map((item, index) => {
            // Get first image from media array if available
            const itemImage =
              item.media && item.media.length > 0 ? item.media[0] : null;

            return (
              <View key={index} style={styles.itemCard}>
                <View style={styles.itemImageContainer}>
                  {itemImage ? (
                    <Image
                      source={{uri: getFullImageUrl(itemImage)}}
                      style={styles.itemImage}
                      resizeMode="cover"
                      onError={error => {
                        console.warn('❌ Order item image failed:', {
                          originalPath: itemImage,
                          fullUrl: getFullImageUrl(itemImage),
                          error: error.nativeEvent.error,
                        });
                      }}
                      onLoad={() => {
                        console.log(
                          '✅ Order item image loaded:',
                          getFullImageUrl(itemImage),
                        );
                      }}
                    />
                  ) : (
                    <View style={styles.itemPlaceholder}>
                      <Package
                        color={colors.textSecondary}
                        size={20}
                        style={styles.summaryIcon}
                      />
                    </View>
                  )}
                </View>

                <View style={styles.itemDetails}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.title ||
                      item.product_name ||
                      item.name ||
                      'Unknown Product'}
                  </Text>

                  {item.category && (
                    <Text style={styles.itemCategory}>{item.category}</Text>
                  )}

                  <View style={styles.itemMeta}>
                    <Text style={styles.itemQuantity}>
                      Qty: {item.qty || item.quantity || 1}
                    </Text>
                    <Text style={styles.itemPrice}>
                      {formatCurrency(item.price || item.unit_price || 0)}
                    </Text>
                  </View>

                  <Text style={styles.itemTotal}>
                    Total:{' '}
                    {formatCurrency(
                      (item.price || item.unit_price || 0) *
                        (item.qty || item.quantity || 1),
                    )}
                  </Text>

                  {item.description && (
                    <Text style={styles.itemDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Payment Section - Styled like the image */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment</Text>

          <View style={styles.paymentCard}>
            {/* Subtotal */}
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Subtotal</Text>
              <Text style={styles.paymentValue} />
            </View>

            {/* Total (Including tax) */}
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Total (Including tax)</Text>
              <Text style={styles.paymentValue}>
                {formatCurrency(totals.total)}
              </Text>
            </View>

            {/* Shipping */}
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Shipping</Text>
              <Text style={styles.paymentValue}>
                {totals.shipping > 0
                  ? formatCurrency(totals.shipping)
                  : formatCurrency(0)}
              </Text>
            </View>

            {/* Total - highlighted */}
            <View style={[styles.paymentRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(totals.total)}
              </Text>
            </View>

            {/* Paid */}
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Paid</Text>
              <Text style={styles.paymentValue}>
                {order.payment_status
                  ? formatCurrency(totals.total)
                  : formatCurrency(0)}
              </Text>
            </View>

            {/* Balance */}
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Balance</Text>
              <Text style={styles.paymentValue}>
                {order.payment_status
                  ? formatCurrency(0)
                  : formatCurrency(totals.total)}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.paymentActions}>
            <TouchableOpacity style={styles.invoiceButton}>
              <Text style={styles.invoiceButtonText}>Send Invoice</Text>
            </TouchableOpacity>

            {!order.payment_status && (
              <TouchableOpacity
                style={styles.paidButton}
                onPress={markOrderAsPaid}>
                <Text style={styles.paidButtonText}>Paid</Text>
              </TouchableOpacity>
            )}

            {order.status !== 'delivered' && (
              <TouchableOpacity
                style={styles.deliveredButton}
                onPress={markOrderAsDelivered}>
                <Text style={styles.deliveredButtonText}>Delivered</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tags Section */}
        <View style={styles.tagsSection}>
          <Text style={styles.sectionTitle}>Tags</Text>

          {orderTags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {orderTags.map((tag, index) => (
                <View key={index} style={styles.tagChip}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noTagsText}>No Order Tags</Text>
          )}
        </View>

        {/* Order Notes - Enhanced JSON parsing */}
        {order.notes && (
          <View style={styles.notesSection}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.notesCard}>
              {customerDetails ? (
                <View style={styles.customerDetailsContainer}>
                  <Text style={styles.customerDetailsTitle}>
                    Customer Details:
                  </Text>

                  {customerDetails.firstName && customerDetails.lastName && (
                    <Text style={styles.customerDetailItem}>
                      <Text style={styles.customerDetailLabel}>Name: </Text>
                      {customerDetails.firstName} {customerDetails.lastName}
                    </Text>
                  )}

                  {customerDetails.email && (
                    <Text style={styles.customerDetailItem}>
                      <Text style={styles.customerDetailLabel}>Email: </Text>
                      {customerDetails.email}
                    </Text>
                  )}

                  {customerDetails.phone && (
                    <Text style={styles.customerDetailItem}>
                      <Text style={styles.customerDetailLabel}>Phone: </Text>
                      {customerDetails.phone}
                    </Text>
                  )}

                  {customerDetails.address && (
                    <Text style={styles.customerDetailItem}>
                      <Text style={styles.customerDetailLabel}>Address: </Text>
                      {customerDetails.address}
                    </Text>
                  )}

                  {customerDetails.apartment && (
                    <Text style={styles.customerDetailItem}>
                      <Text style={styles.customerDetailLabel}>
                        Apartment:{' '}
                      </Text>
                      {customerDetails.apartment}
                    </Text>
                  )}

                  {customerDetails.city && (
                    <Text style={styles.customerDetailItem}>
                      <Text style={styles.customerDetailLabel}>City: </Text>
                      {customerDetails.city}
                    </Text>
                  )}

                  {customerDetails.country && (
                    <Text style={styles.customerDetailItem}>
                      <Text style={styles.customerDetailLabel}>Country: </Text>
                      {customerDetails.country}
                    </Text>
                  )}

                  {customerDetails.province && (
                    <Text style={styles.customerDetailItem}>
                      <Text style={styles.customerDetailLabel}>Province: </Text>
                      {customerDetails.province}
                    </Text>
                  )}

                  {customerDetails.postalCode && (
                    <Text style={styles.customerDetailItem}>
                      <Text style={styles.customerDetailLabel}>
                        Postal Code:{' '}
                      </Text>
                      {customerDetails.postalCode}
                    </Text>
                  )}

                  {customerDetails.shippingMethod && (
                    <Text style={styles.customerDetailItem}>
                      <Text style={styles.customerDetailLabel}>
                        Shipping Method:{' '}
                      </Text>
                      {customerDetails.shippingMethod}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.notesText}>{order.notes}</Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {order.status !== 'delivered' && order.status !== 'cancelled' && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setStatusModalVisible(true)}>
            <Text style={styles.primaryButtonText}>Update Status</Text>
          </TouchableOpacity>
        )}

        {!order.payment_status && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={markOrderAsPaid}>
            <Text style={styles.secondaryButtonText}>Mark as Paid</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Update Modal */}
      <Modal
        visible={statusModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.statusModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Order Status</Text>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <X
                  color={colors.textSecondary}
                  size={20}
                  style={styles.modalCloseText}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.statusOptions}>
              {[
                'pending',
                'processing',
                'shipped',
                'delivered',
                'cancelled',
              ].map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    order.status === status && styles.currentStatusOption,
                  ]}
                  onPress={() => {
                    setStatusModalVisible(false);
                    if (status !== order.status) {
                      updateOrderStatus(status);
                    }
                  }}
                  disabled={order.status === status}>
                  <View
                    style={[
                      styles.statusDot,
                      {backgroundColor: getStatusColor(status)},
                    ]}
                  />
                  <Text
                    style={[
                      styles.statusOptionText,
                      order.status === status && styles.currentStatusText,
                    ]}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                  {order.status === status && (
                    <Text style={styles.currentBadge}>Current</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Action Modal */}
      <Modal
        visible={actionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setActionModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.actionModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Actions</Text>
              <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                <X
                  color={colors.textSecondary}
                  size={20}
                  style={styles.modalCloseText}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={() => {
                setActionModalVisible(false);
                setStatusModalVisible(true);
              }}>
              <RefreshCcw
                color={colors.text}
                size={20}
                style={styles.actionIcon}
              />
              <Text style={styles.actionText}>Update Status</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={handleEditOrder}>
              <Pencil color={colors.text} size={20} style={styles.actionIcon} />
              <Text style={styles.actionText}>Edit Order</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={handleDeleteOrder}>
              <Trash2 color="#F44336" size={20} style={styles.actionIcon} />
              <Text style={[styles.actionText, styles.deleteActionText]}>
                Delete Order
              </Text>
            </TouchableOpacity>

            {!order.payment_status && (
              <TouchableOpacity
                style={styles.actionOption}
                onPress={() => {
                  setActionModalVisible(false);
                  markOrderAsPaid();
                }}>
                <Text style={styles.actionIcon}>💳</Text>
                <Text style={styles.actionText}>Mark as Paid</Text>
              </TouchableOpacity>
            )}

            {(order.status === 'shipped' || order.status === 'processing') && (
              <TouchableOpacity
                style={styles.actionOption}
                onPress={() => {
                  setActionModalVisible(false);
                  markOrderAsDelivered();
                }}>
                <Text style={styles.actionIcon}>✅</Text>
                <Text style={styles.actionText}>Mark as Delivered</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={onConfirmDelete}
        itemName={orderNumber}
        itemType="Order"
        loading={deleteLoading}
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
  errorText: {
    fontSize: fontSizes.xl,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: fonts.medium,
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
  headerIcon: {
    width: 20,
    height: 20,
    tintColor: colors.text,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  headerStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  headerStatusText: {
    color: colors.background,
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editButtonText: {
    color: colors.background,
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
  },
  backButtonIconWrapper: {
    backgroundColor: '#F0F0F0',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  backButtonIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    tintColor: colors.text,
  },
  moreIcon: {
    fontSize: 20,
    color: colors.text,
    transform: [{rotate: '90deg'}],
    fontFamily: fonts.regular,
  },

  scrollContainer: {
    flex: 1,
  },

  // Sections
  summarySection: {
    backgroundColor: colors.background,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  customerSection: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  addressSection: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemsSection: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  paymentSection: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tagsSection: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  notesSection: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 16,
  },

  // Summary
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderTotal: {
    fontSize: fontSizes['3xl'],
    fontFamily: fonts.bold,
    color: colors.splashGreen,
  },
  summaryDetails: {
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    width: 20,
    height: 20,
    tintColor: colors.textSecondary,
  },
  summaryLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: 2,
    fontFamily: fonts.regular,
  },
  summaryValue: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  summaryStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Customer
  customerCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  customerIcon: {
    width: 24,
    height: 24,
    tintColor: colors.splashGreen,
  },
  customerName: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  contactIcon: {
    width: 16,
    height: 16,
    tintColor: colors.textSecondary,
  },
  contactText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },

  // Address
  addressCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  addressIcon: {
    width: 20,
    height: 20,
    tintColor: colors.splashGreen,
    marginTop: 2,
  },
  addressContent: {
    flex: 1,
  },
  addressText: {
    fontSize: fontSizes.base,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 4,
    fontFamily: fonts.regular,
  },

  // Items
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  itemImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemPlaceholder: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemPlaceholderText: {
    fontSize: 20,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: 6,
    textTransform: 'capitalize',
    fontFamily: fonts.regular,
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  itemPrice: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  itemTotal: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
    textAlign: 'right',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
    fontFamily: fonts.regular,
  },

  // Payment Section - Like the image
  paymentCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  paymentLabel: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  paymentValue: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  totalRow: {
    backgroundColor: colors.splashGreen + '10',
    marginHorizontal: -16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 8,
    borderBottomWidth: 0,
  },
  totalLabel: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  totalValue: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.splashGreen,
  },
  paymentActions: {
    flexDirection: 'row',
    gap: 12,
  },
  invoiceButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: colors.splashGreen,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  invoiceButtonText: {
    color: colors.splashGreen,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
  },
  paidButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  paidButtonText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
  },
  deliveredButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  deliveredButtonText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: colors.splashGreen + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.splashGreen + '40',
  },
  tagText: {
    fontSize: fontSizes.sm,
    color: colors.splashGreen,
    fontFamily: fonts.medium,
  },
  noTagsText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontStyle: 'italic',
    fontFamily: fonts.regular,
  },

  // Notes - Enhanced for JSON
  notesCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  notesText: {
    fontSize: fontSizes.base,
    color: colors.text,
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  customerDetailsContainer: {
    gap: 8,
  },
  customerDetailsTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 8,
  },
  customerDetailItem: {
    fontSize: fontSizes.base,
    color: colors.text,
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  customerDetailLabel: {
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },

  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.splashGreen,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  statusModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '70%',
  },
  actionModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
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
  modalCloseText: {
    fontSize: 20,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Status Options
  statusOptions: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    gap: 12,
  },
  currentStatusOption: {
    backgroundColor: '#F8F9FA',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusOptionText: {
    flex: 1,
    fontSize: fontSizes.lg,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  currentStatusText: {
    fontFamily: fonts.semiBold,
  },
  currentBadge: {
    fontSize: fontSizes.sm,
    color: colors.splashGreen,
    fontFamily: fonts.semiBold,
    backgroundColor: colors.splashGreen + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  chevronRight: {
    marginLeft: 4,
  },

  // Action Options
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionText: {
    fontSize: fontSizes.lg,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  deleteActionText: {
    color: '#F44336',
  },
});

export default OrderDetailScreen;
