import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  FlatList,
} from 'react-native';
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Package,
  Truck,
  ChevronRight,
  Search,
  Filter,
  Calendar,
  Hash,
  Pencil,
  Trash2,
  X,
  Grid3X3,
  List,
  Eye,
} from 'lucide-react-native';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {
  getAllPurchaseOrders,
  deletePurchaseOrder,
} from '../../../api/serviceSupplier';
import {useNavigation} from '@react-navigation/native';

const PurchaseOrderScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [filteredPurchaseOrders, setFilteredPurchaseOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'
  const navigation = useNavigation();

  // Transform slug to title helper function
  const transformSlugToTitle = slug => {
    if (!slug) return '';
    return slug
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format currency helper function
  const formatCurrency = amount => {
    if (!amount) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date helper function
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status color helper function
  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#FFC107';
      case 'received':
        return colors.splashGreen;
      case 'cancelled':
        return '#F44336';
      case 'shipped':
        return '#2196F3';
      default:
        return colors.textSecondary;
    }
  };

  // Fetch purchase orders
  const fetchPurchaseOrders = useCallback(async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const response = await getAllPurchaseOrders();
      console.log('Purchase Orders API Response:', response);

      if (response && response.purchase_orders) {
        setPurchaseOrders(response.purchase_orders);
        setFilteredPurchaseOrders(response.purchase_orders);
      }
    } catch (error) {
      console.error('Failed to load purchase orders:', error);
      Alert.alert('Error', 'Unable to load purchase orders. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  // Search functionality
  const handleSearch = useCallback(
    query => {
      setSearchQuery(query);
      if (!query.trim()) {
        setFilteredPurchaseOrders(purchaseOrders);
      } else {
        const filtered = purchaseOrders.filter(
          order =>
            order.po_no?.toLowerCase().includes(query.toLowerCase()) ||
            order.reference_number
              ?.toLowerCase()
              .includes(query.toLowerCase()) ||
            order.shipping_carrier
              ?.toLowerCase()
              .includes(query.toLowerCase()) ||
            order.tracking_number?.toLowerCase().includes(query.toLowerCase()),
        );
        setFilteredPurchaseOrders(filtered);
      }
    },
    [purchaseOrders],
  );

  // Handle purchase order actions
  const handlePurchaseOrderAction = order => {
    setSelectedPurchaseOrder(order);
    setActionModalVisible(true);
  };

  // Handle view purchase order
  const handleViewPurchaseOrder = () => {
    setActionModalVisible(false);
    navigation.navigate('PurchaseOrderDetailScreen', {
      purchaseOrderId: selectedPurchaseOrder.purchase_order_id,
      purchaseOrderData: selectedPurchaseOrder,
    });
  };

  // Handle edit purchase order
  const handleEditPurchaseOrder = () => {
    setActionModalVisible(false);
    navigation.navigate('EditPurchaseOrderScreen', {
      purchaseOrderId: selectedPurchaseOrder.purchase_order_id,
      purchaseOrderData: selectedPurchaseOrder,
    });
  };

  // Handle delete purchase order
  const handleDeletePurchaseOrder = () => {
    setActionModalVisible(false);
    setDeleteModalVisible(true);
  };

  const onConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await deletePurchaseOrder({
        purchase_order_id: selectedPurchaseOrder.purchase_order_id,
      });
      setDeleteModalVisible(false);
      Alert.alert('Success', 'Purchase order deleted successfully');
      await fetchPurchaseOrders(); // Refresh the list
    } catch (error) {
      console.error('Delete purchase order failed:', error);
      Alert.alert(
        'Error',
        'Failed to delete purchase order. Please try again.',
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle view purchase order details
  const handleViewOrder = order => {
    navigation.navigate('PurchaseOrderDetailScreen', {
      purchaseOrderId: order.purchase_order_id,
      purchaseOrderData: order,
    });
  };

  // Render purchase order item for grid view
  const renderPurchaseOrderGridItem = ({item}) => {
    const total = item.calculations?.total || 0;
    const status = item.status || 'pending';

    return (
      <TouchableOpacity
        style={styles.gridCard}
        onPress={() => handleViewOrder(item)}
        activeOpacity={0.7}>
        <View style={styles.gridHeader}>
          <View style={styles.gridOrderInfo}>
            <Text style={styles.gridOrderNumber} numberOfLines={1}>
              #{item.po_no}
            </Text>
            <Text style={styles.gridReferenceNumber} numberOfLines={1}>
              Ref: {item.reference_number}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.gridActionButton}
            onPress={() => handlePurchaseOrderAction(item)}>
            <MoreVertical color={colors.text} size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.gridContent}>
          <View style={styles.gridRow}>
            <Text style={styles.gridLabel}>Carrier:</Text>
            <Text style={styles.gridValue} numberOfLines={1}>
              {transformSlugToTitle(item.shipping_carrier) || 'N/A'}
            </Text>
          </View>

          <View style={styles.gridRow}>
            <Text style={styles.gridLabel}>Tracking:</Text>
            <Text style={styles.gridValue} numberOfLines={1}>
              {item.tracking_number || 'N/A'}
            </Text>
          </View>

          <View style={styles.gridRow}>
            <Text style={styles.gridLabel}>Arrival:</Text>
            <Text style={styles.gridValue} numberOfLines={1}>
              {formatDate(item.estimated_arrival)}
            </Text>
          </View>

          <View style={styles.gridFooter}>
            <View
              style={[
                styles.statusChip,
                {backgroundColor: getStatusColor(status) + '20'},
              ]}>
              <Text
                style={[styles.statusText, {color: getStatusColor(status)}]}>
                {transformSlugToTitle(status)}
              </Text>
            </View>
            <Text style={styles.gridTotal}>{formatCurrency(total)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render purchase order item for list view
  const renderPurchaseOrderListItem = ({item}) => {
    const total = item.calculations?.total || 0;
    const status = item.status || 'pending';

    return (
      <TouchableOpacity
        style={styles.listCard}
        onPress={() => handleViewOrder(item)}
        activeOpacity={0.7}>
        <View style={styles.listHeader}>
          <View style={styles.listOrderInfo}>
            <Text style={styles.listOrderNumber} numberOfLines={1}>
              #{item.po_no}
            </Text>
            <Text style={styles.listReferenceNumber} numberOfLines={1}>
              Ref: {item.reference_number}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.listActionButton}
            onPress={() => handlePurchaseOrderAction(item)}>
            <MoreVertical color={colors.text} size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.listContent}>
          <View style={styles.listRow}>
            <Truck color={colors.textSecondary} size={16} />
            <Text style={styles.listLabel}>Carrier:</Text>
            <Text style={styles.listValue} numberOfLines={1}>
              {transformSlugToTitle(item.shipping_carrier) || 'N/A'}
            </Text>
          </View>

          <View style={styles.listRow}>
            <Hash color={colors.textSecondary} size={16} />
            <Text style={styles.listLabel}>Tracking:</Text>
            <Text style={styles.listValue} numberOfLines={1}>
              {item.tracking_number || 'N/A'}
            </Text>
          </View>

          <View style={styles.listRow}>
            <Calendar color={colors.textSecondary} size={16} />
            <Text style={styles.listLabel}>Est. Arrival:</Text>
            <Text style={styles.listValue} numberOfLines={1}>
              {formatDate(item.estimated_arrival)}
            </Text>
          </View>
        </View>

        <View style={styles.listFooter}>
          <View
            style={[
              styles.statusChip,
              {backgroundColor: getStatusColor(status) + '20'},
            ]}>
            <Text style={[styles.statusText, {color: getStatusColor(status)}]}>
              {transformSlugToTitle(status)}
            </Text>
          </View>
          <View style={styles.listFooterRight}>
            <Text style={styles.listTotal}>{formatCurrency(total)}</Text>
            <ChevronRight color={colors.textSecondary} size={16} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading && purchaseOrders.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading purchase orders...</Text>
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
          <Text style={styles.headerTitle}>Purchase Orders</Text>
          <Text style={styles.headerSubtitle}>
            {filteredPurchaseOrders.length} order
            {filteredPurchaseOrders.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? (
              <List color={colors.text} size={20} />
            ) : (
              <Grid3X3 color={colors.text} size={20} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('CreatePurchaseOrderScreen')}>
            <Plus color={colors.text} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color={colors.textSecondary} size={20} />
          <Text style={styles.searchInput}>Search purchase orders...</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      {/* Purchase Orders List/Grid */}
      {filteredPurchaseOrders.length === 0 ? (
        <View style={[styles.container, styles.centered]}>
          <Package color={colors.textSecondary} size={48} />
          <Text style={styles.emptyTitle}>No Purchase Orders Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try adjusting your search'
              : 'Create your first purchase order to get started'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreatePurchaseOrderScreen')}>
              <Text style={styles.createButtonText}>Create Purchase Order</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredPurchaseOrders}
          renderItem={
            viewMode === 'grid'
              ? renderPurchaseOrderGridItem
              : renderPurchaseOrderListItem
          }
          keyExtractor={item => item.purchase_order_id?.toString()}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode} // Force re-render when view mode changes
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : null}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Action Modal */}
      <Modal
        visible={actionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setActionModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.actionModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Purchase Order Actions</Text>
              <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={handleViewPurchaseOrder}>
              <Eye color={colors.text} size={20} style={styles.actionIcon} />
              <Text style={styles.actionText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={handleEditPurchaseOrder}>
              <Pencil color={colors.text} size={20} style={styles.actionIcon} />
              <Text style={styles.actionText}>Edit Order</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={handleDeletePurchaseOrder}>
              <Trash2 color="#F44336" size={20} style={styles.actionIcon} />
              <Text style={[styles.actionText, styles.deleteActionText]}>
                Delete Order
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={onConfirmDelete}
        itemName={selectedPurchaseOrder?.po_no || 'this purchase order'}
        itemType="Purchase Order"
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List Container
  listContainer: {
    padding: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
  },

  // Grid View Styles
  gridCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 16,
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gridOrderInfo: {
    flex: 1,
  },
  gridOrderNumber: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  gridReferenceNumber: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  gridActionButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContent: {
    gap: 8,
  },

  gridLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  gridValue: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.regular,
    flex: 1,
    textAlign: 'right',
  },
  gridFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  gridTotal: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },

  // List View Styles
  listCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 12,
    padding: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  listOrderInfo: {
    flex: 1,
  },
  listOrderNumber: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  listReferenceNumber: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  listActionButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    gap: 8,
    marginBottom: 12,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    minWidth: 60,
  },
  listValue: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.regular,
    flex: 1,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  listFooterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listTotal: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },

  // Common Styles
  statusChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
  },

  // Empty State
  emptyTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
    fontFamily: fonts.regular,
  },
  createButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
  },

  // Modals
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
    fontSize: fontSizes.xl,
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
    fontSize: fontSizes.lg,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  deleteActionText: {
    color: '#F44336',
  },
});

export default PurchaseOrderScreen;
