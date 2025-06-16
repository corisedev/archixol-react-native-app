import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  TextInput,
  FlatList,
  Modal,
  Platform,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {getInventory} from '../../../api/serviceSupplier';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useContext} from 'react';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../context/BackendContext';

// Import your icons here
import SearchIcon from '../../../assets/images/icons/search.png';
import FilterIcon from '../../../assets/images/icons/filter.png';
import ExportIcon from '../../../assets/images/icons/export.png';
import SortIcon from '../../../assets/images/icons/sort.png';
import ProductIcon from '../../../assets/images/icons/product.png';

const InventoryScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filter states
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, low_stock, out_of_stock
  const [sortBy, setSortBy] = useState('product_name'); // product_name, quantity, committed, available
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

  const navigation = useNavigation();
  const {backendUrl} = useContext(BackendContext);

  // Get full image URL helper function
  const getFullImageUrl = relativePath => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;

    const baseUrl = backendUrl || VITE_API_BASE_URL;
    const cleanPath = relativePath.startsWith('/')
      ? relativePath.substring(1)
      : relativePath;
    return `${baseUrl}/${cleanPath}`;
  };

  // Fetch inventory data
  const fetchInventory = useCallback(
    async (page = 1) => {
      try {
        const params = {
          page,
          limit: rowsPerPage,
          ...(selectedFilter === 'low_stock' && {low_stock: true}),
          ...(selectedFilter === 'out_of_stock' && {out_of_stock: true}),
        };

        const response = await getInventory(params);
        console.log('Inventory API Response:', response);

        if (response) {
          const inventoryData = response.inventory || response.products || [];
          setInventory(inventoryData);
          setFilteredInventory(inventoryData);
          setTotalPages(response.total_pages || 1);
          setCurrentPage(page);
        }
      } catch (error) {
        console.error('Failed to load inventory:', error);
        Alert.alert('Error', 'Unable to load inventory. Please try again.');
      }
    },
    [rowsPerPage, selectedFilter],
  );

  // Initial data load and refresh on focus
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        await fetchInventory(1);
        setLoading(false);
      };
      loadData();
    }, [fetchInventory]),
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInventory(currentPage);
    setRefreshing(false);
  }, [fetchInventory, currentPage]);

  // Search inventory
  const handleSearch = useCallback(
    query => {
      setSearchQuery(query);

      if (query.trim() === '') {
        setFilteredInventory(inventory);
        return;
      }

      const filtered = inventory.filter(
        item =>
          item.title?.toLowerCase().includes(query.toLowerCase()) ||
          item.product_name?.toLowerCase().includes(query.toLowerCase()) ||
          item.sku?.toLowerCase().includes(query.toLowerCase()),
      );
      setFilteredInventory(filtered);
    },
    [inventory],
  );

  // Apply sorting
  const applySorting = useCallback((data, sortBy, sortOrder) => {
    const sorted = [...data].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'product_name':
          aValue = (a.title || a.product_name || '').toLowerCase();
          bValue = (b.title || b.product_name || '').toLowerCase();
          break;
        case 'current_quantity':
          aValue = a.quantity || a.current_quantity || 0;
          bValue = b.quantity || b.current_quantity || 0;
          break;
        case 'committed':
          aValue = a.committed || 0;
          bValue = b.committed || 0;
          break;
        case 'available':
          aValue = a.available || a.quantity - (a.committed || 0) || 0;
          bValue = b.available || b.quantity - (b.committed || 0) || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    setFilteredInventory(sorted);
  }, []);

  // Handle sorting
  const handleSort = (column, order) => {
    setSortBy(column);
    setSortOrder(order);
    setSortModalVisible(false);
    applySorting(filteredInventory, column, order);
  };

  // Handle filter change
  const handleFilterChange = filter => {
    setSelectedFilter(filter);
    setFilterModalVisible(false);
    setCurrentPage(1);
    fetchInventory(1);
  };

  // Handle pagination
  const handlePageChange = page => {
    if (page >= 1 && page <= totalPages) {
      fetchInventory(page);
    }
  };

  // Handle rows per page change
  const handleRowsPerPageChange = rows => {
    setRowsPerPage(rows);
    setCurrentPage(1);
    fetchInventory(1);
  };

  // Export CSV (placeholder)
  const handleExportCSV = () => {
    Alert.alert(
      'Export CSV',
      'CSV export functionality will be implemented soon.',
    );
  };

  // Get inventory status
  const getInventoryStatus = item => {
    const quantity = item.quantity || item.current_quantity || 0;
    const minQuantity = item.min_qty || item.minimum_quantity || 0;
    const committed = item.committed || 0;
    const available = item.available || quantity - committed;

    if (!item.track_quantity) {
      return {
        status: 'Not tracked',
        color: colors.textSecondary,
        available: 'Not tracked',
        committed: 'Not tracked',
      };
    }

    if (quantity === 0) {
      return {
        status: 'Out of stock',
        color: '#F44336',
        available: available.toString(),
        committed: committed.toString(),
      };
    }

    if (quantity <= minQuantity) {
      return {
        status: 'Low stock',
        color: '#FF9800',
        available: available.toString(),
        committed: committed.toString(),
      };
    }

    return {
      status: 'In stock',
      color: colors.splashGreen,
      available: available.toString(),
      committed: committed.toString(),
    };
  };

  // Render inventory card
  const renderInventoryCard = ({item}) => {
    const status = getInventoryStatus(item);
    const productName = item.title || item.product_name || 'Unknown Product';
    const firstImage =
      item.media && item.media.length > 0 ? item.media[0] : null;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          navigation.navigate('ProductDetailScreen', {
            productId: item.id || item._id,
          })
        }
        activeOpacity={0.7}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardImageContainer}>
            {firstImage ? (
              <Image
                source={{uri: getFullImageUrl(firstImage)}}
                style={styles.cardImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.cardPlaceholderImage}>
                <Image
                  source={ProductIcon}
                  style={styles.cardPlaceholderIcon}
                />
              </View>
            )}
          </View>

          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {productName}
            </Text>
            {item.sku && <Text style={styles.cardSku}>SKU: {item.sku}</Text>}
            <View style={styles.statusBadge}>
              <View
                style={[styles.statusDot, {backgroundColor: status.color}]}
              />
              <Text style={[styles.statusText, {color: status.color}]}>
                {status.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <View style={styles.cardItem}>
              <Text style={styles.cardLabel}>Current Quantity</Text>
              <Text style={[styles.cardValue, {color: status.color}]}>
                {item.track_quantity
                  ? item.quantity || item.current_quantity || 0
                  : 'Not tracked'}
              </Text>
            </View>

            <View style={styles.cardItem}>
              <Text style={styles.cardLabel}>Committed</Text>
              <Text style={styles.cardValue}>{status.committed}</Text>
            </View>
          </View>

          <View style={styles.cardRow}>
            <View style={styles.cardItem}>
              <Text style={styles.cardLabel}>Available</Text>
              <Text style={[styles.cardValue, styles.availableValue]}>
                {status.available}
              </Text>
            </View>

            <View style={styles.cardItem}>
              <Text style={styles.cardLabel}>Min. Quantity</Text>
              <Text style={styles.cardValue}>
                {item.min_qty || item.minimum_quantity || 'Not set'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render pagination
  const renderPagination = () => (
    <View style={styles.paginationContainer}>
      <Text style={styles.paginationText}>
        Showing {(currentPage - 1) * rowsPerPage + 1} of {inventory.length}{' '}
        items
      </Text>

      <View style={styles.paginationControls}>
        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === 1 && styles.disabledButton,
          ]}
          onPress={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}>
          <Text
            style={[
              styles.paginationButtonText,
              currentPage === 1 && styles.disabledText,
            ]}>
            Previous
          </Text>
        </TouchableOpacity>

        <Text style={styles.pageInfo}>
          {currentPage} of {totalPages}
        </Text>

        <TouchableOpacity
          style={[
            styles.paginationButton,
            currentPage === totalPages && styles.disabledButton,
          ]}
          onPress={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}>
          <Text
            style={[
              styles.paginationButtonText,
              currentPage === totalPages && styles.disabledText,
            ]}>
            Next
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Filter Modal
  const FilterModal = () => (
    <Modal
      visible={filterModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setFilterModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Inventory</Text>
            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Stock Status</Text>
            {[
              {label: 'All Products', value: 'all'},
              {label: 'Low Stock', value: 'low_stock'},
              {label: 'Out of Stock', value: 'out_of_stock'},
            ].map(filter => (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.filterOption,
                  selectedFilter === filter.value &&
                    styles.selectedFilterOption,
                ]}
                onPress={() => handleFilterChange(filter.value)}>
                <Text
                  style={[
                    styles.filterOptionText,
                    selectedFilter === filter.value &&
                      styles.selectedFilterOptionText,
                  ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  // Sort Modal
  const SortModal = () => (
    <Modal
      visible={sortModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setSortModalVisible(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort Inventory</Text>
            <TouchableOpacity onPress={() => setSortModalVisible(false)}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sort By</Text>
            {[
              {
                label: 'Product Name (A-Z)',
                sortBy: 'product_name',
                order: 'asc',
              },
              {
                label: 'Product Name (Z-A)',
                sortBy: 'product_name',
                order: 'desc',
              },
              {
                label: 'Quantity (Low to High)',
                sortBy: 'current_quantity',
                order: 'asc',
              },
              {
                label: 'Quantity (High to Low)',
                sortBy: 'current_quantity',
                order: 'desc',
              },
              {
                label: 'Available (Low to High)',
                sortBy: 'available',
                order: 'asc',
              },
              {
                label: 'Available (High to Low)',
                sortBy: 'available',
                order: 'desc',
              },
            ].map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.filterOption,
                  sortBy === option.sortBy &&
                    sortOrder === option.order &&
                    styles.selectedFilterOption,
                ]}
                onPress={() => handleSort(option.sortBy, option.order)}>
                <Text
                  style={[
                    styles.filterOptionText,
                    sortBy === option.sortBy &&
                      sortOrder === option.order &&
                      styles.selectedFilterOptionText,
                  ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inventory</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setSortModalVisible(true)}>
            <Image source={SortIcon} style={styles.headerIcon} />
            <Text style={styles.headerButtonText}>Sort</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExportCSV}>
            <Image source={ExportIcon} style={styles.exportIcon} />
            <Text style={styles.exportButtonText}>Export CSV</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Image source={SearchIcon} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}>
          <Image source={FilterIcon} style={styles.filterIcon} />
        </TouchableOpacity>
      </View>

      {/* Cards List */}
      <FlatList
        data={filteredInventory}
        renderItem={renderInventoryCard}
        keyExtractor={item => (item.id || item._id).toString()}
        contentContainerStyle={styles.cardsList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Image source={ProductIcon} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'No inventory found matching your search'
                : 'No inventory items'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Products will appear here when added'}
            </Text>
          </View>
        )}
        ListFooterComponent={() =>
          inventory.length > 0 ? renderPagination() : null
        }
      />

      {/* Modals */}
      <FilterModal />
      <SortModal />
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
    fontSize: 16,
    color: colors.textSecondary,
  },

  // Header
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: colors.background,
    gap: 6,
  },
  headerIcon: {
    width: 16,
    height: 16,
    tintColor: colors.text,
  },
  headerButtonText: {
    fontSize: 14,
    color: colors.text,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: colors.splashGreen,
    gap: 6,
  },
  exportIcon: {
    width: 16,
    height: 16,
    tintColor: colors.background,
  },
  exportButtonText: {
    fontSize: 14,
    color: colors.background,
    fontWeight: '600',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    width: 16,
    height: 16,
    marginRight: 8,
    tintColor: colors.textSecondary,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    width: 18,
    height: 18,
    tintColor: colors.textSecondary,
  },

  // Cards List
  cardsList: {
    padding: 16,
    paddingBottom: 100,
  },

  // Card Styles
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 12,
  },
  cardImageContainer: {
    marginRight: 12,
  },
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  cardPlaceholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPlaceholderIcon: {
    width: 30,
    height: 30,
    tintColor: colors.textSecondary,
  },
  cardTitleContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  cardSku: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  cardBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  cardLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  availableValue: {
    color: colors.splashGreen,
  },

  // Pagination
  paginationContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  paginationText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: colors.splashGreen,
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  paginationButtonText: {
    fontSize: 14,
    color: colors.background,
    fontWeight: '500',
  },
  disabledText: {
    color: colors.textSecondary,
  },
  pageInfo: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    tintColor: colors.textSecondary,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 0,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalCloseText: {
    fontSize: 20,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  filterSection: {
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  selectedFilterOption: {
    backgroundColor: colors.splashGreen,
  },
  filterOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedFilterOptionText: {
    color: colors.background,
    fontWeight: '500',
  },
});

export default InventoryScreen;
