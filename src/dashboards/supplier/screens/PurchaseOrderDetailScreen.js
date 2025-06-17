import React, {useState, useEffect} from 'react';
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
  Share,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Package,
  Calendar,
  Truck,
  Hash,
  MapPin,
  CreditCard,
  FileText,
  Edit,
  Download,
  Printer,
  Check,
  X,
  MoreVertical,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {getPurchaseOrder, markAsReceived} from '../../../api/serviceSupplier';
import {useNavigation} from '@react-navigation/native';

const PurchaseOrderDetailScreen = ({route}) => {
  const navigation = useNavigation();
  const {purchaseOrderId, purchaseOrderData} = route.params;

  // State
  const [purchaseOrder, setPurchaseOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);

  // Transform slug to title helper
  const transformSlugToTitle = slug => {
    if (!slug) return 'N/A';
    return slug
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format currency helper
  const formatCurrency = amount => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date helper
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get status color
  const getStatusColor = received => {
    return received ? colors.splashGreen : '#F44336';
  };

  useEffect(() => {
    const fetchPurchaseOrderData = async () => {
      setLoading(true);
      try {
        // If we have data from route params, use it, otherwise fetch
        if (purchaseOrderData) {
          setPurchaseOrder(purchaseOrderData);
        } else {
          const response = await getPurchaseOrder({
            purchase_order_id: purchaseOrderId,
          });
          if (response && response.purchase_order) {
            setPurchaseOrder(response.purchase_order);
          }
        }
      } catch (error) {
        console.error('Failed to fetch purchase order:', error);
        Alert.alert('Error', 'Failed to load purchase order data');
      } finally {
        setLoading(false);
      }
    };
    fetchPurchaseOrderData();
  }, [purchaseOrderData, purchaseOrderId]);

  // Handle mark as received
  const handleMarkAsReceived = async () => {
    setActionLoading(true);
    try {
      await markAsReceived({
        po_no: purchaseOrder.po_no,
        received_status: true,
      });

      // Update local state
      setPurchaseOrder({
        ...purchaseOrder,
        received_status: true,
      });

      Alert.alert('Success', 'Purchase order marked as received');
    } catch (error) {
      console.error('Failed to mark as received:', error);
      Alert.alert('Error', 'Failed to update status. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle edit
  const handleEdit = () => {
    navigation.navigate('EditPurchaseOrderScreen', {
      purchaseOrderId: purchaseOrder.purchase_order_id || purchaseOrderId,
      purchaseOrderData: purchaseOrder,
    });
  };

  // Handle share/export
  const handleShare = async () => {
    try {
      const shareContent = `Purchase Order #${purchaseOrder.po_no}\n\nVendor: ${
        purchaseOrder.vendor_name
      }\nTotal: ${formatCurrency(purchaseOrder.calculations?.total)}\nStatus: ${
        purchaseOrder.received_status ? 'Received' : 'Not Received'
      }\nEstimated Arrival: ${formatDate(purchaseOrder.estimated_arrival)}`;

      await Share.share({
        message: shareContent,
        title: `Purchase Order #${purchaseOrder.po_no}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Render action modal
  const renderActionModal = () => (
    <Modal
      visible={showActionModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowActionModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.actionModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Purchase Order Actions</Text>
            <TouchableOpacity onPress={() => setShowActionModal(false)}>
              <X color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.actionOption}
            onPress={() => {
              setShowActionModal(false);
              handleEdit();
            }}>
            <Edit color={colors.text} size={20} style={styles.actionIcon} />
            <Text style={styles.actionText}>Edit Purchase Order</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionOption}
            onPress={() => {
              setShowActionModal(false);
              handleShare();
            }}>
            <Download color={colors.text} size={20} style={styles.actionIcon} />
            <Text style={styles.actionText}>Share/Export</Text>
          </TouchableOpacity>

          {!purchaseOrder?.received_status && (
            <TouchableOpacity
              style={styles.actionOption}
              onPress={() => {
                setShowActionModal(false);
                handleMarkAsReceived();
              }}>
              <Check
                color={colors.splashGreen}
                size={20}
                style={styles.actionIcon}
              />
              <Text style={[styles.actionText, {color: colors.splashGreen}]}>
                Mark as Received
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );

  // Loading state
  if (loading) {
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Purchase Order</Text>
          <Text style={styles.headerSubtitle}>#{purchaseOrder.po_no}</Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowActionModal(true)}>
          <MoreVertical color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.orderNumber}>#{purchaseOrder.po_no}</Text>
              <Text style={styles.createdDate}>
                Created: {formatDate(purchaseOrder.created_at)}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    getStatusColor(purchaseOrder.received_status) + '20',
                },
              ]}>
              <Text
                style={[
                  styles.statusText,
                  {color: getStatusColor(purchaseOrder.received_status)},
                ]}>
                {purchaseOrder.received_status ? 'Received' : 'Not Received'}
              </Text>
            </View>
          </View>
        </View>

        {/* Key Information */}
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>Key Information</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Calendar color={colors.textSecondary} size={16} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Expected Delivery</Text>
                <Text style={styles.infoValue}>
                  {formatDate(purchaseOrder.estimated_arrival)}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Hash color={colors.textSecondary} size={16} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Reference Number</Text>
                <Text style={styles.infoValue}>
                  {purchaseOrder.reference_number || 'N/A'}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <CreditCard color={colors.textSecondary} size={16} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Total Amount</Text>
                <Text style={[styles.infoValue, styles.totalAmount]}>
                  {formatCurrency(purchaseOrder.calculations?.total)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* General Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General Details</Text>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Vendor</Text>
              <Text style={styles.detailValue}>
                {purchaseOrder.vendor_name}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Destination</Text>
              <Text style={styles.detailValue}>
                {purchaseOrder.destination}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Currency</Text>
              <Text style={styles.detailValue}>
                {purchaseOrder.supplier_currency}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Payment Terms</Text>
              <Text style={styles.detailValue}>
                {transformSlugToTitle(purchaseOrder.payment_terms)}
              </Text>
            </View>

            {purchaseOrder.tags && purchaseOrder.tags.length > 0 && (
              <View style={[styles.detailItem, styles.fullWidth]}>
                <Text style={styles.detailLabel}>Tags</Text>
                <View style={styles.tagsContainer}>
                  {purchaseOrder.tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Shipping Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Shipping Details</Text>

          <View style={styles.shippingGrid}>
            <View style={styles.shippingItem}>
              <Truck color={colors.textSecondary} size={16} />
              <View style={styles.shippingContent}>
                <Text style={styles.detailLabel}>Shipping Carrier</Text>
                <Text style={styles.detailValue}>
                  {transformSlugToTitle(purchaseOrder.shipping_carrier)}
                </Text>
              </View>
            </View>

            <View style={styles.shippingItem}>
              <Hash color={colors.textSecondary} size={16} />
              <View style={styles.shippingContent}>
                <Text style={styles.detailLabel}>Tracking Number</Text>
                <Text style={styles.detailValue}>
                  {purchaseOrder.tracking_number || 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ordered Products</Text>

          <View style={styles.productsContainer}>
            {purchaseOrder.products?.map((product, index) => (
              <View key={product.id || index} style={styles.productCard}>
                {product.media && product.media[0] && (
                  <Image
                    source={{uri: product.media[0]}}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.productDetails}>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.title || 'Unnamed Product'}
                  </Text>
                  <Text style={styles.productPrice}>
                    {formatCurrency(product.price)} each
                  </Text>
                  <View style={styles.productMeta}>
                    <Text style={styles.productQuantity}>
                      Qty: {product.qty || product.quantity || 1}
                    </Text>
                    <Text style={styles.productTotal}>
                      Total:{' '}
                      {formatCurrency(
                        (product.price || 0) *
                          (product.qty || product.quantity || 1),
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Notes */}
        {purchaseOrder.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes to Supplier</Text>
            <View style={styles.notesContainer}>
              <Text style={styles.notesText}>{purchaseOrder.notes}</Text>
            </View>
          </View>
        )}

        {/* Cost Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>Cost Summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(purchaseOrder.calculations?.subtotal)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(purchaseOrder.calculations?.totalTax)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Shipping</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(purchaseOrder.calculations?.shipping || 0)}
            </Text>
          </View>

          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>
              {formatCurrency(purchaseOrder.calculations?.total)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleEdit}>
            <Edit color={colors.text} size={16} />
            <Text style={styles.secondaryButtonText}>Edit</Text>
          </TouchableOpacity>

          {!purchaseOrder.received_status && (
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleMarkAsReceived}
              disabled={actionLoading}>
              {actionLoading ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <>
                  <Check color={colors.background} size={16} />
                  <Text style={styles.primaryButtonText}>Mark as Received</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Action Modal */}
      {renderActionModal()}
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
    justifyContent: 'space-between',
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
    alignItems: 'center',
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

  // Status Card
  statusCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  createdDate: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
  },

  // Info Section
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 16,
  },
  infoGrid: {
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  infoValue: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.medium,
    marginTop: 2,
  },
  totalAmount: {
    color: colors.splashGreen,
    fontFamily: fonts.semiBold,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  detailsGrid: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  fullWidth: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    flex: 1,
  },
  detailValue: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.medium,
    flex: 1,
    textAlign: 'right',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    backgroundColor: colors.splashGreen + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: fontSizes.xs,
    color: colors.splashGreen,
    fontFamily: fonts.medium,
  },

  // Shipping
  shippingGrid: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: 16,
  },
  shippingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  shippingContent: {
    flex: 1,
  },

  // Products
  productsContainer: {
    gap: 12,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    gap: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 4,
  },
  productPrice: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 6,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productQuantity: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.medium,
  },
  productTotal: {
    fontSize: fontSizes.sm,
    color: colors.splashGreen,
    fontFamily: fonts.semiBold,
  },

  // Notes
  notesContainer: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  notesText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
    lineHeight: 20,
  },

  // Summary
  summaryCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F0F0F0',
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

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
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

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
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
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
});

export default PurchaseOrderDetailScreen;
