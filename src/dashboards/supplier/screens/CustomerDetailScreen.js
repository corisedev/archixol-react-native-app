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
  MoreVertical,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  MapPin,
  User,
  Package,
  DollarSign,
  FileText,
  X,
  ShoppingBag,
  TrendingUp,
  Clock,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {
  getCustomer,
  deleteCustomer,
  getAllOrders,
} from '../../../api/serviceSupplier';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useContext} from 'react';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../context/BackendContext';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';

const CustomerDetailScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const {customerId} = route.params;
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
    return `${baseUrl}/${cleanPath}`;
  };

  // Fetch customer details
  const fetchCustomerDetails = useCallback(async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const response = await getCustomer({customer_id: customerId});
      console.log('Customer Detail API Response:', response);

      if (response && response.customer) {
        setCustomer(response.customer);

        // Fetch customer's orders
        await fetchCustomerOrders(response.customer);
      }
    } catch (error) {
      console.error('Failed to load customer details:', error);
      Alert.alert(
        'Error',
        'Unable to load customer details. Please try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customerId, refreshing, fetchCustomerOrders]);

  // Fetch customer orders
  const fetchCustomerOrders = useCallback(
    async customerData => {
      try {
        const ordersResponse = await getAllOrders({
          page: 1,
          limit: 50,
          customer_id: customerId,
        });

        if (ordersResponse && ordersResponse.orders_list) {
          setCustomerOrders(ordersResponse.orders_list);
        } else if (ordersResponse && ordersResponse.orders) {
          setCustomerOrders(ordersResponse.orders);
        }
      } catch (error) {
        console.error('Failed to load customer orders:', error);
        // Don't show error for orders, it's secondary data
      }
    },
    [customerId],
  );

  useEffect(() => {
    fetchCustomerDetails();
  }, [fetchCustomerDetails]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCustomerDetails();
  }, [fetchCustomerDetails]);

  // Handle delete customer
  const confirmDeleteCustomer = async () => {
    try {
      setDeleteLoading(true);
      await deleteCustomer({customer_id: customerId});
      Alert.alert('Success', 'Customer deleted successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Delete failed:', error);
      Alert.alert('Error', 'Failed to delete customer. Please try again.');
    } finally {
      setDeleteLoading(false);
      setDeleteModalVisible(false);
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

  // Format date
  const formatDate = dateString => {
    if (!dateString) {
      return 'N/A';
    }
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
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

  // Get customer display name
  const getCustomerName = customerObj => {
    if (!customerObj) {
      return 'Unknown Customer';
    }
    if (customerObj.customer_name) {
      return customerObj.customer_name;
    }
    if (customerObj.first_name || customerObj.last_name) {
      return `${customerObj.first_name || ''} ${
        customerObj.last_name || ''
      }`.trim();
    }
    return 'Unknown Customer';
  };

  // Get customer initials
  const getCustomerInitials = customerObj => {
    const name = getCustomerName(customerObj);
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  // Get customer address
  const getCustomerAddress = customerObj => {
    if (!customerObj) {
      return '';
    }

    if (customerObj.default_address) {
      return customerObj.default_address;
    }

    const addressParts = [];
    if (customerObj.address) { addressParts.push(customerObj.address); }
    if (customerObj.apartment) { addressParts.push(customerObj.apartment); }
    if (customerObj.city) { addressParts.push(customerObj.city); }
    if (customerObj.province || customerObj.state) {
      addressParts.push(customerObj.province || customerObj.state);
    }
    if (customerObj.country) { addressParts.push(customerObj.country); }
    if (customerObj.postal_code) { addressParts.push(customerObj.postal_code); }

    return addressParts.join(', ') || 'No address provided';
  };

  // Calculate customer stats
  const getCustomerStats = () => {
    const totalOrders = customerOrders.length;
    const totalSpent = customerOrders.reduce((sum, order) => {
      return (
        sum +
        (order.total || order.calculations?.total || order.grand_total || 0)
      );
    }, 0);

    return {
      totalOrders,
      totalSpent,
      averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0,
    };
  };

  // Get order status color
  const getOrderStatusColor = status => {
    if (!status) {
      return colors.textSecondary;
    }

    const statusLower = String(status).toLowerCase();
    switch (statusLower) {
      case 'completed':
      case 'delivered':
      case 'fulfilled':
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

  // Get customer status color
  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'active':
        return colors.splashGreen;
      case 'inactive':
        return '#FF9800';
      case 'blocked':
        return '#F44336';
      default:
        return colors.textSecondary;
    }
  };

  // Loading state
  if (loading && !customer) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading customer details...</Text>
      </View>
    );
  }

  if (!customer) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Customer not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.background} size={16} />
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const customerName = getCustomerName(customer);
  const customerInitials = getCustomerInitials(customer);
  const customerAddress = getCustomerAddress(customer);
  const stats = getCustomerStats();
  const statusColor = getStatusColor(customer.status);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Customer Details</Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setActionModalVisible(true)}>
          <MoreVertical color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Customer Profile */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.customerAvatar}>
              <Text style={styles.customerInitials}>{customerInitials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.customerName}>{customerName}</Text>
              <Text style={styles.customerEmail}>{customer.email}</Text>
              <View
                style={[
                  styles.statusBadge,
                  {backgroundColor: statusColor + '20'},
                ]}>
                <Text style={[styles.statusBadgeText, {color: statusColor}]}>
                  {customer.status?.toUpperCase() || 'ACTIVE'}
                </Text>
              </View>
            </View>
          </View>

          {customerAddress && customerAddress !== 'No address provided' && (
            <View style={styles.addressPreview}>
              <MapPin color={colors.textSecondary} size={16} />
              <Text style={styles.addressPreviewText}>{customerAddress}</Text>
            </View>
          )}
        </View>

        {/* Customer Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsHeader}>
            <TrendingUp color={colors.text} size={20} />
            <Text style={styles.statsTitle}>Customer Statistics</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <DollarSign color={colors.splashGreen} size={20} />
              <Text style={styles.statLabel}>Total Spent</Text>
              <Text style={styles.statValue}>
                {formatCurrency(stats.totalSpent)}
              </Text>
            </View>

            <View style={styles.statCard}>
              <ShoppingBag color={colors.splashGreen} size={20} />
              <Text style={styles.statLabel}>Total Orders</Text>
              <Text style={styles.statValue}>{stats.totalOrders}</Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.contactSection}>
          <View style={styles.sectionHeader}>
            <User color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Contact Information</Text>
          </View>

          {customer.email && (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => handleEmail(customer.email)}>
              <Mail color={colors.textSecondary} size={16} />
              <Text style={styles.contactText}>{customer.email}</Text>
            </TouchableOpacity>
          )}

          {(customer.phone_number || customer.phone) && (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() =>
                handlePhoneCall(customer.phone_number || customer.phone)
              }>
              <Phone color={colors.textSecondary} size={16} />
              <Text style={styles.contactText}>
                {customer.phone_number || customer.phone}
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.contactItem}>
            <Calendar color={colors.textSecondary} size={16} />
            <Text style={styles.contactText}>
              Customer since {formatDate(customer.createdAt)}
            </Text>
          </View>

          <View style={styles.notificationCard}>
            <Text style={styles.notificationText}>
              Will receive notifications in{' '}
              {customer.language === 'ur' ? 'Urdu' : 'English'}.
            </Text>
          </View>
        </View>

        {/* Default Address */}
        {customerAddress && customerAddress !== 'No address provided' && (
          <View style={styles.addressSection}>
            <View style={styles.sectionHeader}>
              <MapPin color={colors.text} size={20} />
              <Text style={styles.sectionTitle}>Default Address</Text>
            </View>

            <View style={styles.addressCard}>
              <Text style={styles.addressName}>{customerName}</Text>
              <Text style={styles.addressText}>{customerAddress}</Text>
              {(customer.phone_number || customer.phone) && (
                <Text style={styles.addressPhone}>
                  {customer.phone_number || customer.phone}
                </Text>
              )}
            </View>
          </View>
        )}

        {/* Recent Orders */}
        {customerOrders.length > 0 && (
          <View style={styles.ordersSection}>
            <View style={styles.sectionHeader}>
              <Package color={colors.text} size={20} />
              <Text style={styles.sectionTitle}>Recent Orders</Text>
            </View>

            {customerOrders.slice(0, 3).map((order, index) => (
              <TouchableOpacity
                key={order.id || order._id || index}
                style={styles.orderCard}
                onPress={() =>
                  navigation.navigate('OrderDetailScreen', {
                    orderId: order.id || order._id,
                  })
                }>
                <View style={styles.orderHeader}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderNumber}>
                      {order.order_no ||
                        order.order_number ||
                        `#${(order.id || order._id)?.substring(0, 8)}`}
                    </Text>
                    <View style={styles.orderBadges}>
                      <View style={[styles.orderStatusBadge, styles.paidBadge]}>
                        <Text style={styles.badgeText}>PAID</Text>
                      </View>
                      <View
                        style={[
                          styles.orderStatusBadge,
                          {
                            backgroundColor:
                              getOrderStatusColor(order.status) + '20',
                          },
                        ]}>
                        <Text
                          style={[
                            styles.badgeText,
                            {color: getOrderStatusColor(order.status)},
                          ]}>
                          {order.status
                            ? String(order.status).toUpperCase()
                            : 'UNKNOWN'}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.orderTotal}>
                    {formatCurrency(
                      order.total ||
                        order.calculations?.total ||
                        order.grand_total ||
                        0,
                    )}
                  </Text>
                </View>

                <View style={styles.orderMeta}>
                  <Clock color={colors.textSecondary} size={12} />
                  <Text style={styles.orderDate}>
                    {formatDate(order.createdAt || order.placed_at)}
                  </Text>
                </View>

                {/* Order Items */}
                {order.products && order.products.length > 0 && (
                  <View style={styles.orderItems}>
                    {order.products.slice(0, 2).map((item, itemIndex) => (
                      <View key={itemIndex} style={styles.orderItem}>
                        <View style={styles.itemImageContainer}>
                          {item.media && item.media.length > 0 ? (
                            <Image
                              source={{uri: getFullImageUrl(item.media[0])}}
                              style={styles.itemImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.itemPlaceholder}>
                              <Package color={colors.textSecondary} size={16} />
                            </View>
                          )}
                        </View>

                        <View style={styles.itemDetails}>
                          <Text style={styles.itemName} numberOfLines={1}>
                            {item.title ||
                              item.product_name ||
                              'Unknown Product'}
                          </Text>
                          <Text style={styles.itemPrice}>
                            {formatCurrency(item.price || 0)} ×{' '}
                            {item.qty || item.quantity || 1}
                          </Text>
                        </View>

                        <Text style={styles.itemTotal}>
                          {formatCurrency(
                            (item.price || 0) *
                              (item.qty || item.quantity || 1),
                          )}
                        </Text>
                      </View>
                    ))}

                    {order.products.length > 2 && (
                      <Text style={styles.moreItemsText}>
                        +{order.products.length - 2} more items
                      </Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {customerOrders.length > 3 && (
              <TouchableOpacity style={styles.viewAllOrdersButton}>
                <Text style={styles.viewAllOrdersText}>
                  View All {customerOrders.length} Orders
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Notes */}
        <View style={styles.notesSection}>
          <View style={styles.sectionHeader}>
            <FileText color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Notes</Text>
          </View>
          <Text style={styles.notesText}>
            {customer.notes || 'No additional notes for this customer.'}
          </Text>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Action Modal */}
      <Modal
        visible={actionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setActionModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.actionModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customer Actions</Text>
              <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={() => {
                setActionModalVisible(false);
                navigation.navigate('EditCustomerScreen', {customerId});
              }}>
              <Edit color={colors.text} size={20} />
              <Text style={styles.actionText}>Edit Customer</Text>
            </TouchableOpacity>

            {(customer.phone_number || customer.phone) && (
              <TouchableOpacity
                style={styles.actionOption}
                onPress={() => {
                  setActionModalVisible(false);
                  handlePhoneCall(customer.phone_number || customer.phone);
                }}>
                <Phone color={colors.text} size={20} />
                <Text style={styles.actionText}>Call Customer</Text>
              </TouchableOpacity>
            )}

            {customer.email && (
              <TouchableOpacity
                style={styles.actionOption}
                onPress={() => {
                  setActionModalVisible(false);
                  handleEmail(customer.email);
                }}>
                <Mail color={colors.text} size={20} />
                <Text style={styles.actionText}>Email Customer</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionOption, styles.deleteAction]}
              onPress={() => {
                setActionModalVisible(false);
                setDeleteModalVisible(true);
              }}>
              <Trash2 color="#F44336" size={20} />
              <Text style={[styles.actionText, styles.deleteActionText]}>
                Delete Customer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={confirmDeleteCustomer}
        itemType="Customer"
        itemName={getCustomerName(customer)}
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  backButtonText: {
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
  headerTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },

  scrollContainer: {
    flex: 1,
  },

  // Profile Section
  profileSection: {
    backgroundColor: colors.background,
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  customerInitials: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.semiBold,
    color: colors.background,
  },
  profileInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  customerEmail: {
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
  },
  statusBadgeText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
  },
  addressPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  addressPreviewText: {
    flex: 1,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    fontFamily: fonts.regular,
  },

  // Stats Section
  statsSection: {
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
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  statsTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  statValue: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: 'center',
  },

  // Sections
  contactSection: {
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
  ordersSection: {
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

  // Contact Information
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
    gap: 12,
  },
  contactText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  notificationCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  notificationText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Address
  addressCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
  },
  addressName: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 8,
  },
  addressText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 4,
    fontFamily: fonts.regular,
  },
  addressPhone: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Orders
  orderCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 8,
  },
  orderBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  paidBadge: {
    backgroundColor: colors.splashGreen + '20',
  },
  badgeText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },
  orderTotal: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  orderDate: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Order Items
  orderItems: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 6,
    overflow: 'hidden',
    marginRight: 12,
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
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  itemTotal: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  moreItemsText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: fonts.regular,
  },
  viewAllOrdersButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllOrdersText: {
    fontSize: fontSizes.sm,
    color: colors.splashGreen,
    fontFamily: fonts.semiBold,
  },

  // Notes
  notesText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    fontFamily: fonts.regular,
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
  deleteAction: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  actionText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  deleteActionText: {
    color: '#F44336',
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 20,
  },
});

export default CustomerDetailScreen;
