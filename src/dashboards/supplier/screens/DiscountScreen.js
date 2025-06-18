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
  Percent,
  Tag,
  ChevronRight,
  Search,
  Filter,
  Pencil,
  Trash2,
  X,
  Grid3X3,
  List,
  Calendar,
  DollarSign,
} from 'lucide-react-native';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {getAllDiscounts, deleteDiscount} from '../../../api/serviceSupplier';
import {useNavigation} from '@react-navigation/native';
// Removed date-fns import - using native JS formatting

const DiscountScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [discounts, setDiscounts] = useState([]);
  const [filteredDiscounts, setFilteredDiscounts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);
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

  // Format date helper
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return (
        date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) +
        ' at ' +
        date.toLocaleString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })
      );
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Format discount value
  const formatDiscountValue = discount => {
    const isPercentage = discount?.discount_value_type === 'percentage';
    if (isPercentage) {
      return `${discount.discount_value}%`;
    } else {
      return `$${discount.discount_value}`;
    }
  };

  // Check if discount is active
  const isDiscountActive = discount => {
    const now = new Date();
    const startDate = new Date(discount.start_datetime);
    const endDate = discount.end_datetime
      ? new Date(discount.end_datetime)
      : null;

    if (endDate) {
      return now >= startDate && now <= endDate;
    }
    return now >= startDate;
  };

  // Get discount status
  const getDiscountStatus = discount => {
    const now = new Date();
    const startDate = new Date(discount.start_datetime);
    const endDate = discount.end_datetime
      ? new Date(discount.end_datetime)
      : null;

    if (now < startDate) {
      return {status: 'scheduled', color: '#FFC107', text: 'Scheduled'};
    } else if (endDate && now > endDate) {
      return {status: 'expired', color: '#F44336', text: 'Expired'};
    } else {
      return {status: 'active', color: colors.splashGreen, text: 'Active'};
    }
  };

  // Fetch discounts
  const fetchDiscounts = useCallback(async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const response = await getAllDiscounts();
      console.log('Discounts API Response:', response);

      if (response && response.discount_list) {
        setDiscounts(response.discount_list);
        setFilteredDiscounts(response.discount_list);
      }
    } catch (error) {
      console.error('Failed to load discounts:', error);
      Alert.alert('Error', 'Unable to load discounts. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDiscounts();
  }, [fetchDiscounts]);

  // Search functionality
  const handleSearch = useCallback(
    query => {
      setSearchQuery(query);
      if (!query.trim()) {
        setFilteredDiscounts(discounts);
      } else {
        const filtered = discounts.filter(
          discount =>
            discount.title?.toLowerCase().includes(query.toLowerCase()) ||
            discount.code?.toLowerCase().includes(query.toLowerCase()) ||
            discount.discount_category
              ?.toLowerCase()
              .includes(query.toLowerCase()),
        );
        setFilteredDiscounts(filtered);
      }
    },
    [discounts],
  );

  // Handle discount actions
  const handleDiscountAction = discount => {
    setSelectedDiscount(discount);
    setActionModalVisible(true);
  };

  // Handle edit discount
  const handleEditDiscount = () => {
    setActionModalVisible(false);
    navigation.navigate('EditDiscountScreen', {
      discountId: selectedDiscount.id,
      discountData: selectedDiscount,
    });
  };

  // Handle delete discount
  const handleDeleteDiscount = () => {
    setActionModalVisible(false);
    setDeleteModalVisible(true);
  };

  const onConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteDiscount({discount_id: selectedDiscount.id});
      setDeleteModalVisible(false);
      Alert.alert('Success', 'Discount deleted successfully');
      await fetchDiscounts(); // Refresh the list
    } catch (error) {
      console.error('Delete discount failed:', error);
      Alert.alert('Error', 'Failed to delete discount. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle view discount details
  const handleViewDiscount = discount => {
    navigation.navigate('DiscountDetailScreen', {
      discountId: discount.id,
      discountData: discount,
    });
  };

  // Render discount item for grid view
  const renderDiscountGridItem = ({item}) => {
    const discountStatus = getDiscountStatus(item);

    return (
      <TouchableOpacity
        style={styles.gridCard}
        onPress={() => handleViewDiscount(item)}
        activeOpacity={0.7}>
        <View style={styles.gridHeader}>
          <View style={styles.gridIconContainer}>
            {item.discount_value_type === 'percentage' ? (
              <Percent color={colors.splashGreen} size={20} />
            ) : (
              <DollarSign color={colors.splashGreen} size={20} />
            )}
          </View>
          <TouchableOpacity
            style={styles.gridActionButton}
            onPress={() => handleDiscountAction(item)}>
            <MoreVertical color={colors.text} size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.gridContent}>
          <Text style={styles.gridTitle} numberOfLines={2}>
            {item.title || 'Untitled Discount'}
          </Text>

          <Text style={styles.gridCode} numberOfLines={1}>
            Code: {item.code || '--'}
          </Text>

          <View style={styles.gridValueContainer}>
            <Text style={styles.gridValue}>{formatDiscountValue(item)}</Text>
            <View
              style={[
                styles.statusChip,
                {backgroundColor: discountStatus.color + '20'},
              ]}>
              <Text style={[styles.statusText, {color: discountStatus.color}]}>
                {discountStatus.text}
              </Text>
            </View>
          </View>

          <Text style={styles.gridCategory}>
            {transformSlugToTitle(item.discount_category || 'general')}
          </Text>

          <Text style={styles.gridDate}>
            Ends: {formatDate(item.end_datetime)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render discount item for list view
  const renderDiscountListItem = ({item}) => {
    const discountStatus = getDiscountStatus(item);

    return (
      <TouchableOpacity
        style={styles.listCard}
        onPress={() => handleViewDiscount(item)}
        activeOpacity={0.7}>
        <View style={styles.listIconContainer}>
          {item.discount_value_type === 'percentage' ? (
            <Percent color={colors.splashGreen} size={24} />
          ) : (
            <DollarSign color={colors.splashGreen} size={24} />
          )}
        </View>

        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle} numberOfLines={1}>
              {item.title || 'Untitled Discount'}
            </Text>
            <TouchableOpacity
              style={styles.listActionButton}
              onPress={() => handleDiscountAction(item)}>
              <MoreVertical color={colors.text} size={16} />
            </TouchableOpacity>
          </View>

          <Text style={styles.listCode}>Code: {item.code || '--'}</Text>

          <View style={styles.listMeta}>
            <Text style={styles.listValue}>{formatDiscountValue(item)}</Text>
            <Text style={styles.listCategory}>
              {transformSlugToTitle(item.discount_category || 'general')}
            </Text>
          </View>

          <View style={styles.listFooter}>
            <Text style={styles.listDate}>
              Ends: {formatDate(item.end_datetime)}
            </Text>
            <View
              style={[
                styles.statusChip,
                {backgroundColor: discountStatus.color + '20'},
              ]}>
              <Text style={[styles.statusText, {color: discountStatus.color}]}>
                {discountStatus.text}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading && discounts.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading discounts...</Text>
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
          <Text style={styles.headerTitle}>Discounts</Text>
          <Text style={styles.headerSubtitle}>
            {filteredDiscounts.length} discount
            {filteredDiscounts.length !== 1 ? 's' : ''}
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
            onPress={() => navigation.navigate('CreateDiscountScreen')}>
            <Plus color={colors.text} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color={colors.textSecondary} size={20} />
          <Text style={styles.searchInput}>Search discounts...</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      {/* Discounts List/Grid */}
      {filteredDiscounts.length === 0 ? (
        <View style={[styles.container, styles.centered]}>
          <Tag color={colors.textSecondary} size={48} />
          <Text style={styles.emptyTitle}>No Discounts Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try adjusting your search'
              : 'Create your first discount to get started'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateDiscountScreen')}>
              <Text style={styles.createButtonText}>Create Discount</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredDiscounts}
          renderItem={
            viewMode === 'grid'
              ? renderDiscountGridItem
              : renderDiscountListItem
          }
          keyExtractor={item => item.id?.toString()}
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
              <Text style={styles.modalTitle}>Discount Actions</Text>
              <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={() => {
                setActionModalVisible(false);
                handleViewDiscount(selectedDiscount);
              }}>
              <Tag color={colors.text} size={20} style={styles.actionIcon} />
              <Text style={styles.actionText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={handleEditDiscount}>
              <Pencil color={colors.text} size={20} style={styles.actionIcon} />
              <Text style={styles.actionText}>Edit Discount</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={handleDeleteDiscount}>
              <Trash2 color="#F44336" size={20} style={styles.actionIcon} />
              <Text style={[styles.actionText, styles.deleteActionText]}>
                Delete Discount
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
        itemName={selectedDiscount?.title || 'this discount'}
        itemType="Discount"
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
    alignItems: 'center',
    marginBottom: 12,
  },
  gridIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.splashGreen + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContent: {
    gap: 6,
  },
  gridTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  gridCode: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  gridValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  gridValue: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.splashGreen,
  },
  gridCategory: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  gridDate: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
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
    flexDirection: 'row',
    padding: 12,
  },
  listIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.splashGreen + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  listContent: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    flex: 1,
  },
  listActionButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listCode: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 4,
  },
  listMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  listValue: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.splashGreen,
  },
  listCategory: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listDate: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
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

export default DiscountScreen;
