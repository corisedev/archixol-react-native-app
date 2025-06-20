import {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Linking,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {
  getOrderDetails,
  cancelOrder,
  requestReturnOrder,
} from '../../../api/client';
import {useNavigation, useRoute} from '@react-navigation/native';

// Icons
import {
  ArrowLeft,
  Package,
  Truck,
  CreditCard,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  RotateCcw,
  Building2,
} from 'lucide-react-native';

const OrderDetailScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({
    cancel: false,
    return: false,
  });

  const navigation = useNavigation();
  const route = useRoute();

  const {orderId, order: orderProp} = route.params || {};

  console.log('🔍 Route params:', {orderId, orderProp});

  // Fetch order details with better error handling
  const fetchOrderDetails = useCallback(async () => {
    try {
      setError(null);

      // If order data is passed via navigation, use it initially
      if (orderProp && !orderId) {
        console.log('📋 Using order from navigation props');
        setOrder(orderProp);
        return;
      }

      // Determine the correct order ID to use
      let orderIdToUse = orderId;
      if (!orderIdToUse && orderProp) {
        orderIdToUse = orderProp.order_id || orderProp._id || orderProp.id;
      }

      if (!orderIdToUse) {
        throw new Error('Order ID is required');
      }

      console.log('🔄 Fetching order details for ID:', orderIdToUse);

      const response = await getOrderDetails(orderIdToUse);
      console.log('📦 Order details response:', response);

      // Handle different response structures
      let orderData = null;

      if (response?.order) {
        orderData = response.order;
      } else if (response?.data) {
        orderData = response.data;
      } else if (response?.order_details) {
        orderData = response.order_details;
      } else if (response && typeof response === 'object') {
        // If response itself is the order data
        orderData = response;
      }

      if (!orderData) {
        throw new Error('Order not found in response');
      }

      console.log('✅ Setting order data:', orderData);
      setOrder(orderData);
    } catch (err) {
      console.error('❌ Failed to load order details:', err);
      setError(err.message || 'Failed to load order details');
    }
  }, [orderId, orderProp]);

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchOrderDetails();
      setLoading(false);
    };
    loadData();
  }, [fetchOrderDetails]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrderDetails();
    setRefreshing(false);
  }, [fetchOrderDetails]);

  // Safe data extraction helpers
  const getOrderId = () => {
    return (
      order?.order_no ||
      order?.order_number ||
      order?.order_id?.substring(0, 8) ||
      order?._id?.substring(0, 8) ||
      'Unknown'
    );
  };

  const getOrderItems = () => {
    return order?.items || order?.order_items || order?.products || [];
  };

  const getOrderTotal = () => {
    return (
      order?.total ||
      order?.total_amount ||
      order?.grand_total ||
      order?.subtotal ||
      0
    );
  };

  const getOrderStatus = () => {
    return order?.status || order?.order_status || 'pending';
  };

  const getOrderDate = () => {
    return (
      order?.created_at ||
      order?.placed_at ||
      order?.order_date ||
      order?.date_created ||
      new Date().toISOString()
    );
  };

  const getCustomerName = () => {
    if (order?.firstName && order?.lastName) {
      return `${order.firstName} ${order.lastName}`;
    }
    if (order?.customer_name) {
      return order.customer_name;
    }
    if (order?.name) {
      return order.name;
    }
    if (order?.customer?.name) {
      return order.customer.name;
    }
    return 'Unknown Customer';
  };

  const getShippingAddress = () => {
    return {
      name: getCustomerName(),
      address: order?.address || order?.shipping_address?.address || '',
      apartment: order?.apartment || order?.shipping_address?.apartment || '',
      city: order?.city || order?.shipping_address?.city || '',
      province:
        order?.province || order?.state || order?.shipping_address?.state || '',
      country: order?.country || order?.shipping_address?.country || '',
      postalCode:
        order?.postalCode ||
        order?.postal_code ||
        order?.shipping_address?.postal_code ||
        '',
      phone: order?.phone || order?.shipping_address?.phone || '',
      email: order?.email || order?.customer?.email || '',
    };
  };

  // Helper functions
  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `PKR ${amount.toLocaleString()}`;
    }
    return `PKR ${amount || '0'}`;
  };

  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return colors.splashGreen;
      case 'pending':
      case 'processing':
        return '#F59E0B';
      case 'cancelled':
      case 'rejected':
        return '#EF4444';
      case 'shipped':
        return '#3B82F6';
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = status => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return CheckCircle;
      case 'pending':
      case 'processing':
        return Clock;
      case 'cancelled':
      case 'rejected':
        return XCircle;
      case 'shipped':
        return Truck;
      default:
        return Package;
    }
  };

  const formatDate = dateString => {
    if (!dateString) {
      return 'No date';
    }
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (dateError) {
      return dateString;
    }
  };

  // Action handlers
  const handleCancelOrder = async () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This action cannot be undone.',
      [
        {
          text: 'No, Keep Order',
          style: 'cancel',
        },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(prev => ({...prev, cancel: true}));

              // Get the correct order ID
              const orderIdToCancel = order?.order_id || order?._id || orderId;
              console.log('🚫 Cancelling order ID:', orderIdToCancel);

              const response = await cancelOrder({order_id: orderIdToCancel});
              console.log('✅ Cancel order response:', response);

              Alert.alert(
                'Success',
                response?.message || 'Order cancelled successfully',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Refresh order data
                      fetchOrderDetails();
                    },
                  },
                ],
              );
            } catch (err) {
              console.error('❌ Cancel order error:', err);
              Alert.alert(
                'Error',
                err?.response?.data?.message ||
                  err?.message ||
                  'Failed to cancel order. Please try again.',
              );
            } finally {
              setActionLoading(prev => ({...prev, cancel: false}));
            }
          },
        },
      ],
    );
  };

  const handleRequestReturn = async () => {
    Alert.alert(
      'Request Return',
      'Do you want to request a return for this order?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Request Return',
          onPress: async () => {
            try {
              setActionLoading(prev => ({...prev, return: true}));

              // Get the correct order ID
              const orderIdToReturn = order?.order_id || order?._id || orderId;
              console.log(
                '🔄 Requesting return for order ID:',
                orderIdToReturn,
              );

              const response = await requestReturnOrder({
                order_id: orderIdToReturn,
              });
              console.log('✅ Return request response:', response);

              Alert.alert(
                'Success',
                response?.message || 'Return request submitted successfully',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Refresh order data
                      fetchOrderDetails();
                    },
                  },
                ],
              );
            } catch (err) {
              console.error('❌ Return request error:', err);
              Alert.alert(
                'Error',
                err?.response?.data?.message ||
                  err?.message ||
                  'Failed to submit return request. Please try again.',
              );
            } finally {
              setActionLoading(prev => ({...prev, return: false}));
            }
          },
        },
      ],
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Contact Support',
      'Choose how you would like to contact support:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Call Support',
          onPress: () => Linking.openURL('tel:+923001234567'),
        },
        {
          text: 'Email Support',
          onPress: () => Linking.openURL('mailto:support@yourapp.com'),
        },
        {
          text: 'WhatsApp',
          onPress: () => Linking.openURL('whatsapp://send?phone=923001234567'),
        },
      ],
    );
  };

  // Check if order can be cancelled
  const canCancelOrder = () => {
    const status = getOrderStatus().toLowerCase();
    return !['cancelled', 'delivered', 'completed', 'shipped'].includes(status);
  };

  // Check if order can be returned
  const canReturnOrder = () => {
    const status = getOrderStatus().toLowerCase();
    return ['delivered', 'completed'].includes(status);
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Order Details</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={[styles.centered, styles.flex1]}>
          <AlertCircle color={colors.textSecondary} size={48} />
          <Text style={styles.errorTitle}>Failed to load order details</Text>
          <Text style={styles.errorDescription}>
            {error || "We couldn't load the order details. Please try again."}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchOrderDetails}>
            <RefreshCw color={colors.background} size={16} />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const orderStatus = getOrderStatus();
  const StatusIcon = getStatusIcon(orderStatus);
  const statusColor = getStatusColor(orderStatus);
  const orderItems = getOrderItems();
  const shippingInfo = getShippingAddress();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Order Summary Card */}
        <View style={styles.orderSummaryCard}>
          <View style={styles.orderHeader}>
            <View style={styles.orderTitleSection}>
              <View style={styles.orderIdContainer}>
                <Package color={colors.splashGreen} size={20} />
                <Text style={styles.orderTitle}>Order #{getOrderId()}</Text>
              </View>
              <Text style={styles.orderDate}>
                Placed on {formatDate(getOrderDate())}
              </Text>
            </View>
            <View style={styles.statusContainer}>
              <View style={styles.statusBadge}>
                <StatusIcon color={statusColor} size={16} />
                <Text style={[styles.statusText, {color: statusColor}]}>
                  {orderStatus?.charAt(0).toUpperCase() + orderStatus?.slice(1)}
                </Text>
              </View>
              {order?.payment_status && (
                <View style={styles.paymentStatusBadge}>
                  <Text style={styles.paymentStatusText}>
                    Payment:{' '}
                    {order.payment_status?.charAt(0).toUpperCase() +
                      order.payment_status?.slice(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Order Items */}
          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>Order Items</Text>
            {orderItems.length > 0 ? (
              orderItems.map((item, index) => (
                <View key={index} style={styles.orderItem}>
                  <Image
                    source={{
                      uri:
                        item?.image ||
                        item?.product_image ||
                        'https://via.placeholder.com/80',
                    }}
                    style={styles.itemImage}
                  />
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item?.name ||
                        item?.title ||
                        item?.product_name ||
                        'Unknown Item'}
                    </Text>
                    {item?.description && (
                      <Text style={styles.itemDescription} numberOfLines={1}>
                        {item.description}
                      </Text>
                    )}
                    <Text style={styles.itemCategory}>
                      Category: {item?.category || 'General'}
                    </Text>
                  </View>
                  <View style={styles.itemPricing}>
                    <Text style={styles.itemPrice}>
                      {formatCurrency(item?.price || item?.amount || 0)}
                    </Text>
                    <Text style={styles.itemQuantity}>
                      Qty: {item?.quantity || 1}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noItems}>No items found</Text>
            )}
          </View>

          {/* Supplier Info */}
          {order?.supplier_name && (
            <View style={styles.supplierSection}>
              <View style={styles.supplierInfo}>
                <Building2 color={colors.splashGreen} size={18} />
                <Text style={styles.supplierText}>
                  Supplier:{' '}
                  <Text style={styles.supplierName}>{order.supplier_name}</Text>
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Shipping Information Card */}
        <View style={styles.shippingCard}>
          <View style={styles.cardHeader}>
            <Truck color={colors.splashGreen} size={20} />
            <Text style={styles.cardTitle}>Shipping & Delivery</Text>
          </View>

          <View style={styles.shippingContent}>
            <View style={styles.addressSection}>
              <View style={styles.addressHeader}>
                <MapPin color={colors.textSecondary} size={16} />
                <Text style={styles.addressTitle}>Shipping Address</Text>
              </View>
              <View style={styles.addressDetails}>
                <Text style={styles.addressName}>{shippingInfo.name}</Text>
                {shippingInfo.address && (
                  <Text style={styles.addressLine}>{shippingInfo.address}</Text>
                )}
                {shippingInfo.apartment && (
                  <Text style={styles.addressLine}>
                    {shippingInfo.apartment}
                  </Text>
                )}
                {shippingInfo.city && (
                  <Text style={styles.addressLine}>
                    {shippingInfo.city}
                    {shippingInfo.province ? `, ${shippingInfo.province}` : ''}
                  </Text>
                )}
                {shippingInfo.country && (
                  <Text style={styles.addressLine}>
                    {shippingInfo.country}
                    {shippingInfo.postalCode
                      ? `, ${shippingInfo.postalCode}`
                      : ''}
                  </Text>
                )}
                {shippingInfo.phone && (
                  <View style={styles.contactInfo}>
                    <Phone color={colors.textSecondary} size={14} />
                    <Text style={styles.contactText}>{shippingInfo.phone}</Text>
                  </View>
                )}
                {shippingInfo.email && (
                  <View style={styles.contactInfo}>
                    <Mail color={colors.textSecondary} size={14} />
                    <Text style={styles.contactText}>{shippingInfo.email}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Payment Summary Card */}
        <View style={styles.paymentCard}>
          <View style={styles.cardHeader}>
            <CreditCard color={colors.splashGreen} size={20} />
            <Text style={styles.cardTitle}>Payment Summary</Text>
          </View>

          <View style={styles.paymentContent}>
            <View style={styles.paymentSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Subtotal ({orderItems.length} items)
                </Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(order?.subtotal || getOrderTotal())}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(order?.shipping || order?.shipping_cost || 0)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(order?.tax || 0)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryTotal}>Total</Text>
                <Text style={styles.summaryTotalValue}>
                  {formatCurrency(getOrderTotal())}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsCard}>
          <View style={styles.cardHeader}>
            <Package color={colors.splashGreen} size={20} />
            <Text style={styles.cardTitle}>Order Actions</Text>
          </View>

          <View style={styles.actionsContent}>
            {/* Contact Support Button - Always available */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleContactSupport}>
              <MessageSquare color={colors.splashGreen} size={18} />
              <Text style={styles.actionButtonText}>Contact Support</Text>
            </TouchableOpacity>

            {/* Return Button - Only for delivered/completed orders */}
            {canReturnOrder() && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleRequestReturn}
                disabled={actionLoading.return}>
                <RotateCcw color={colors.splashGreen} size={18} />
                <Text style={styles.actionButtonText}>
                  {actionLoading.return ? 'Requesting...' : 'Request Return'}
                </Text>
                {actionLoading.return && (
                  <ActivityIndicator size="small" color={colors.splashGreen} />
                )}
              </TouchableOpacity>
            )}

            {/* Cancel Button - Only for pending/processing orders */}
            {canCancelOrder() && (
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancelOrder}
                disabled={actionLoading.cancel}>
                <XCircle color="#EF4444" size={18} />
                <Text
                  style={[styles.actionButtonText, styles.cancelButtonText]}>
                  {actionLoading.cancel ? 'Cancelling...' : 'Cancel Order'}
                </Text>
                {actionLoading.cancel && (
                  <ActivityIndicator size="small" color="#EF4444" />
                )}
              </TouchableOpacity>
            )}

            {/* Order Status Message */}
            {orderStatus.toLowerCase() === 'cancelled' && (
              <View style={styles.statusMessage}>
                <XCircle color="#EF4444" size={20} />
                <Text style={styles.statusMessageText}>
                  This order has been cancelled
                </Text>
              </View>
            )}

            {orderStatus.toLowerCase() === 'delivered' && (
              <View style={[styles.statusMessage, styles.deliveredMessage]}>
                <CheckCircle color={colors.splashGreen} size={20} />
                <Text
                  style={[
                    styles.statusMessageText,
                    styles.deliveredMessageText,
                  ]}>
                  Order delivered successfully
                </Text>
              </View>
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
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  flex1: {
    flex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Header Styles
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },

  // Error State Styles
  errorTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorDescription: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    marginHorizontal: 32,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
  },

  // Order Summary Card Styles
  orderSummaryCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  orderTitleSection: {
    marginBottom: 12,
  },
  orderIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  orderTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  orderDate: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  statusContainer: {
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
  },
  paymentStatusBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  paymentStatusText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  // Items Section Styles
  itemsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
  },
  itemDetails: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  itemDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  itemCategory: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  noItems: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    textAlign: 'center',
    paddingVertical: 20,
  },
  itemPricing: {
    alignItems: 'flex-end',
    gap: 4,
  },
  itemPrice: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.splashGreen,
  },
  itemQuantity: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Supplier Section Styles
  supplierSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  supplierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supplierText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  supplierName: {
    fontFamily: fonts.medium,
    color: colors.text,
  },

  // Card Common Styles
  shippingCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  paymentCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionsCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cardTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  // Shipping Content Styles
  shippingContent: {
    gap: 16,
  },
  addressSection: {
    gap: 8,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  addressTitle: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  addressDetails: {
    gap: 2,
  },
  addressName: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  addressLine: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  contactText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Payment Content Styles
  paymentContent: {
    gap: 16,
  },
  paymentSummary: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  summaryDivider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
  summaryTotal: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  summaryTotalValue: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.splashGreen,
  },

  // Actions Content Styles
  actionsContent: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0F0F0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.splashGreen,
    minHeight: 50,
  },
  actionButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.splashGreen,
  },
  cancelButton: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  cancelButtonText: {
    color: '#EF4444',
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  statusMessageText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: '#EF4444',
  },
  deliveredMessage: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  deliveredMessageText: {
    color: colors.splashGreen,
  },
});

export default OrderDetailScreen;
