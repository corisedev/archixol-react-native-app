import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
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
  Building,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Search,
  Filter,
  Edit,
  Trash2,
  X,
  Grid3X3,
  List,
  Eye,
} from 'lucide-react-native';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {getAllVendors, deleteVendor} from '../../../api/serviceSupplier';
import {useNavigation} from '@react-navigation/native';

const VendorScreen = () => {
  const navigation = useNavigation();

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'grid' or 'list'

  // Transform slug to title helper
  const transformSlugToTitle = slug => {
    if (!slug) return 'N/A';
    return slug
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get business type color
  const getBusinessTypeColor = type => {
    const colors = {
      general_contractor: '#4CAF50',
      specialty_contractor: '#2196F3',
      material_supplier: '#FF9800',
      equipment_lessor: '#9C27B0',
      construction_consultant: '#607D8B',
    };
    return colors[type] || '#757575';
  };

  // Fetch vendors
  const fetchVendors = useCallback(async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const response = await getAllVendors();
      console.log('Vendors API Response:', response);

      if (response && response.vendors) {
        setVendors(response.vendors);
        setFilteredVendors(response.vendors);
      }
    } catch (error) {
      console.error('Failed to load vendors:', error);
      Alert.alert('Error', 'Unable to load vendors. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVendors();
  }, [fetchVendors]);

  // Search functionality
  const handleSearch = useCallback(
    query => {
      setSearchQuery(query);
      if (!query.trim()) {
        setFilteredVendors(vendors);
      } else {
        const filtered = vendors.filter(
          vendor =>
            vendor.vendor_name?.toLowerCase().includes(query.toLowerCase()) ||
            vendor.email?.toLowerCase().includes(query.toLowerCase()) ||
            vendor.phone_number?.toLowerCase().includes(query.toLowerCase()) ||
            vendor.city?.toLowerCase().includes(query.toLowerCase()) ||
            vendor.country?.toLowerCase().includes(query.toLowerCase()),
        );
        setFilteredVendors(filtered);
      }
    },
    [vendors],
  );

  // Handle vendor actions
  const handleVendorAction = vendor => {
    setSelectedVendor(vendor);
    setActionModalVisible(true);
  };

  // Handle view vendor
  const handleViewVendor = () => {
    setActionModalVisible(false);
    navigation.navigate('VendorDetailScreen', {
      vendorId: selectedVendor.id,
      vendorData: selectedVendor,
    });
  };

  // Handle edit vendor
  const handleEditVendor = () => {
    setActionModalVisible(false);
    navigation.navigate('EditVendorScreen', {
      vendorId: selectedVendor.id,
      vendorData: selectedVendor,
    });
  };

  // Handle delete vendor
  const handleDeleteVendor = () => {
    setActionModalVisible(false);
    setDeleteModalVisible(true);
  };

  const onConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteVendor({vendor_id: selectedVendor.id});
      setDeleteModalVisible(false);
      Alert.alert('Success', 'Vendor deleted successfully');
      await fetchVendors(); // Refresh the list
    } catch (error) {
      console.error('Delete vendor failed:', error);
      Alert.alert('Error', 'Failed to delete vendor. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle view vendor details
  const handleViewVendorDetails = vendor => {
    navigation.navigate('VendorDetailScreen', {
      vendorId: vendor.id,
      vendorData: vendor,
    });
  };

  // Render vendor item for grid view
  const renderVendorGridItem = ({item}) => (
    <TouchableOpacity
      style={styles.gridCard}
      onPress={() => handleViewVendorDetails(item)}
      activeOpacity={0.7}>
      <View style={styles.gridHeader}>
        <View style={styles.gridVendorInfo}>
          <Building color={colors.splashGreen} size={20} />
          <Text style={styles.gridVendorName} numberOfLines={1}>
            {item.vendor_name}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.gridActionButton}
          onPress={() => handleVendorAction(item)}>
          <MoreVertical color={colors.text} size={16} />
        </TouchableOpacity>
      </View>

      <View style={styles.gridContent}>
        {item.business_type && (
          <View style={styles.gridRow}>
            <View
              style={[
                styles.businessTypeChip,
                {
                  backgroundColor:
                    getBusinessTypeColor(item.business_type) + '20',
                },
              ]}>
              <Text
                style={[
                  styles.businessTypeText,
                  {color: getBusinessTypeColor(item.business_type)},
                ]}>
                {transformSlugToTitle(item.business_type)}
              </Text>
            </View>
          </View>
        )}

        {item.phone_number && (
          <View style={styles.gridRow}>
            <Phone color={colors.textSecondary} size={14} />
            <Text style={styles.gridValue} numberOfLines={1}>
              {item.phone_number}
            </Text>
          </View>
        )}

        {item.email && (
          <View style={styles.gridRow}>
            <Mail color={colors.textSecondary} size={14} />
            <Text style={styles.gridValue} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
        )}

        <View style={styles.gridLocation}>
          <MapPin color={colors.textSecondary} size={14} />
          <Text style={styles.gridValue} numberOfLines={1}>
            {item.city && item.country
              ? `${item.city}, ${item.country}`
              : item.city || item.country || 'Location not specified'}
          </Text>
        </View>

        <View style={styles.gridFooter}>
          <Text style={styles.gridOrderCount}>
            {item.purchased_product || 0} orders
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render vendor item for list view
  const renderVendorListItem = ({item}) => (
    <TouchableOpacity
      style={styles.listCard}
      onPress={() => handleViewVendorDetails(item)}
      activeOpacity={0.7}>
      <View style={styles.listHeader}>
        <View style={styles.listVendorInfo}>
          <View style={styles.listVendorNameRow}>
            <Building color={colors.splashGreen} size={18} />
            <Text style={styles.listVendorName} numberOfLines={1}>
              {item.vendor_name}
            </Text>
          </View>
          {item.business_type && (
            <View
              style={[
                styles.businessTypeChip,
                {
                  backgroundColor:
                    getBusinessTypeColor(item.business_type) + '20',
                },
              ]}>
              <Text
                style={[
                  styles.businessTypeText,
                  {color: getBusinessTypeColor(item.business_type)},
                ]}>
                {transformSlugToTitle(item.business_type)}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.listActionButton}
          onPress={() => handleVendorAction(item)}>
          <MoreVertical color={colors.text} size={16} />
        </TouchableOpacity>
      </View>

      <View style={styles.listContent}>
        {item.phone_number && (
          <View style={styles.listRow}>
            <Phone color={colors.textSecondary} size={16} />
            <Text style={styles.listValue}>{item.phone_number}</Text>
          </View>
        )}

        {item.email && (
          <View style={styles.listRow}>
            <Mail color={colors.textSecondary} size={16} />
            <Text style={styles.listValue} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
        )}

        <View style={styles.listRow}>
          <MapPin color={colors.textSecondary} size={16} />
          <Text style={styles.listValue} numberOfLines={1}>
            {item.city && item.country
              ? `${item.city}, ${item.country}`
              : item.city || item.country || 'Location not specified'}
          </Text>
        </View>
      </View>

      <View style={styles.listFooter}>
        <Text style={styles.listOrderCount}>
          {item.purchased_product || 0} orders
        </Text>
        <ChevronRight color={colors.textSecondary} size={16} />
      </View>
    </TouchableOpacity>
  );

  // Render action modal
  const renderActionModal = () => (
    <Modal
      visible={actionModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setActionModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.actionModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Vendor Actions</Text>
            <TouchableOpacity onPress={() => setActionModalVisible(false)}>
              <X color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.actionOption}
            onPress={handleViewVendor}>
            <Eye color={colors.text} size={20} style={styles.actionIcon} />
            <Text style={styles.actionText}>View Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionOption}
            onPress={handleEditVendor}>
            <Edit color={colors.text} size={20} style={styles.actionIcon} />
            <Text style={styles.actionText}>Edit Vendor</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionOption}
            onPress={handleDeleteVendor}>
            <Trash2 color="#F44336" size={20} style={styles.actionIcon} />
            <Text style={[styles.actionText, styles.deleteActionText]}>
              Delete Vendor
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  // Loading state
  if (loading && vendors.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading vendors...</Text>
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
          <Text style={styles.headerTitle}>Vendors</Text>
          <Text style={styles.headerSubtitle}>
            {filteredVendors.length} vendor
            {filteredVendors.length !== 1 ? 's' : ''}
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
            onPress={() => navigation.navigate('CreateVendorScreen')}>
            <Plus color={colors.text} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color={colors.textSecondary} size={20} />
          <Text style={styles.searchInput}>Search vendors...</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      {/* Vendors List/Grid */}
      {filteredVendors.length === 0 ? (
        <View style={[styles.container, styles.centered]}>
          <Building color={colors.textSecondary} size={48} />
          <Text style={styles.emptyTitle}>No Vendors Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try adjusting your search'
              : 'Add your first vendor to get started'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateVendorScreen')}>
              <Text style={styles.createButtonText}>Add Vendor</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredVendors}
          renderItem={
            viewMode === 'grid' ? renderVendorGridItem : renderVendorListItem
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
      {renderActionModal()}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={onConfirmDelete}
        itemName={selectedVendor?.vendor_name || 'this vendor'}
        itemType="Vendor"
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
  gridVendorInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gridVendorName: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    flex: 1,
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

  gridValue: {
    fontSize: fontSizes.xs,
    color: colors.text,
    fontFamily: fonts.regular,
    flex: 1,
  },
  gridLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gridFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  gridOrderCount: {
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
    padding: 16,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  listVendorInfo: {
    flex: 1,
    gap: 8,
  },
  listVendorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listVendorName: {
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
  listContent: {
    gap: 8,
    marginBottom: 12,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  listOrderCount: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Common Styles
  businessTypeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  businessTypeText: {
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
    fontSize: fontSizes.lg,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  deleteActionText: {
    color: '#F44336',
  },
});

export default VendorScreen;
