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
  ScrollView,
} from 'react-native';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Package,
  X,
  ShoppingCart,
  PlusSquare,
  Boxes,
  FileText,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {
  getAllProducts,
  deleteProduct,
  searchProducts,
} from '../../../api/serviceSupplier';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useContext} from 'react';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../context/BackendContext';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';

const ProductListEmpty = ({query, navigation}) => {
  return (
    <View style={styles.emptyContainer}>
      <ShoppingCart color={colors.textSecondary} size={48} />
      <Text style={styles.emptyText}>
        {query ? 'No products found matching your search' : 'No products yet'}
      </Text>
      <Text style={styles.emptySubtext}>
        {query
          ? 'Try adjusting your search terms'
          : 'Add your first product to get started'}
      </Text>
      {!query && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => navigation.navigate('AddProductScreen')}>
          <Text style={styles.emptyButtonText}>Add Product</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const ProductsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const navigation = useNavigation();
  const {backendUrl} = useContext(BackendContext);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Get full image URL helper function
  const getFullImageUrl = relativePath => {
    if (!relativePath) {
      console.log('❌ No image path provided');
      return null;
    }

    if (relativePath.startsWith('http')) {
      console.log('✅ Full URL already:', relativePath);
      return relativePath;
    }

    const baseUrl = backendUrl || VITE_API_BASE_URL;
    // Remove leading slash if present and ensure proper concatenation
    const cleanPath = relativePath.startsWith('/')
      ? relativePath.substring(1)
      : relativePath;
    const fullUrl = `${baseUrl}/${cleanPath}`;

    console.log('🔗 Image URL constructed:', {
      relativePath,
      baseUrl,
      cleanPath,
      fullUrl,
    });

    return fullUrl;
  };

  // Apply filters
  const applyFilters = useCallback(
    (productList, statusFilter, categoryFilter) => {
      let filtered = [...productList];

      // Apply status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'low_stock') {
          filtered = filtered.filter(
            product => product.quantity < product.min_qty,
          );
        } else {
          filtered = filtered.filter(
            product => product.status === statusFilter,
          );
        }
      }

      // Apply category filter
      if (categoryFilter !== 'all') {
        filtered = filtered.filter(
          product => product.category === categoryFilter,
        );
      }

      setFilteredProducts(filtered);
    },
    [],
  );

  // Fetch products data
  const fetchProducts = useCallback(async () => {
    try {
      const response = await getAllProducts({
        page: 1,
        limit: 100, // Get all products
        sort_by: 'createdAt',
        sort_order: 'desc',
      });
      console.log('Products API Response:', response);

      if (response && response.products_list) {
        // Debug: Check first product's media
        if (
          response.products_list.length > 0 &&
          response.products_list[0].media
        ) {
          console.log(
            '🖼️ First product media:',
            response.products_list[0].media,
          );
        }

        setProducts(response.products_list);
        setFilteredProducts(response.products_list);

        // Extract unique categories
        const uniqueCategories = [
          ...new Set(
            response.products_list
              .map(product => product.category)
              .filter(category => category && category.trim() !== ''),
          ),
        ];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      Alert.alert('Error', 'Unable to load products. Please try again.');
    }
  }, []);

  // Initial data load and refresh on focus
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        await fetchProducts();
        setLoading(false);
      };
      loadData();
    }, [fetchProducts]),
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);
  }, [fetchProducts]);

  // Search products
  const handleSearch = useCallback(
    async query => {
      setSearchQuery(query);

      if (query.trim() === '') {
        // If search is empty, show filtered products based on current filter
        applyFilters(products, selectedFilter, selectedCategory);
        return;
      }

      try {
        const response = await searchProducts({query: query.trim()});
        if (response && response.product_list) {
          setFilteredProducts(response.product_list);
        }
      } catch (error) {
        console.error('Search failed:', error);
        // Fallback to local search
        const filtered = products.filter(
          product =>
            product.title?.toLowerCase().includes(query.toLowerCase()) ||
            product.description?.toLowerCase().includes(query.toLowerCase()) ||
            product.category?.toLowerCase().includes(query.toLowerCase()),
        );
        setFilteredProducts(filtered);
      }
    },
    [products, selectedFilter, selectedCategory, applyFilters],
  );

  // Handle filter change
  const handleFilterChange = (statusFilter, categoryFilter) => {
    setSelectedFilter(statusFilter);
    setSelectedCategory(categoryFilter);
    setFilterModalVisible(false);

    if (searchQuery.trim() === '') {
      applyFilters(products, statusFilter, categoryFilter);
    }
  };

  // Format currency
  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `PKR ${amount.toLocaleString()}`;
    }
    return `PKR ${amount || '0'}`;
  };

  // Get status color
  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'active':
        return colors.splashGreen;
      case 'draft':
        return '#FF9800';
      case 'archived':
        return '#F44336';
      default:
        return colors.textSecondary;
    }
  };

  // Get stock status
  const getStockStatus = (quantity, minQty) => {
    if (quantity === 0) {
      return {text: 'Out of Stock', color: '#F44336'};
    }
    if (quantity < minQty) {
      return {text: 'Low Stock', color: '#FF9800'};
    }
    return {text: 'In Stock', color: colors.splashGreen};
  };

  // Render product item with proper image handling
  const renderProductItem = ({item: product}) => {
    const stockStatus = getStockStatus(product.quantity, product.min_qty);
    const firstImage =
      product.media && product.media.length > 0 ? product.media[0] : null;

    console.log('🖼️ Rendering product:', product.title, 'Image:', firstImage);

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() =>
          navigation.navigate('ProductDetailScreen', {productId: product.id})
        }
        activeOpacity={0.7}>
        {/* Product Image */}
        <View style={styles.productImageContainer}>
          {firstImage ? (
            <Image
              source={{uri: getFullImageUrl(firstImage)}}
              style={styles.productImage}
              resizeMode="cover"
              onError={error => {
                console.warn('❌ Product image failed:', {
                  originalPath: firstImage,
                  fullUrl: getFullImageUrl(firstImage),
                  error: error.nativeEvent.error,
                });
              }}
              onLoad={() => {
                console.log(
                  '✅ Product image loaded:',
                  getFullImageUrl(firstImage),
                );
              }}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Package color={colors.textSecondary} size={40} />
            </View>
          )}

          {/* Stock Badge */}
          <View
            style={[
              styles.stockBadge,
              {backgroundColor: stockStatus.color + '20'},
            ]}>
            <Text style={[styles.stockBadgeText, {color: stockStatus.color}]}>
              {product.quantity}
            </Text>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text style={styles.productTitle} numberOfLines={2}>
              {product.title}
            </Text>
            <View
              style={[
                styles.statusBadge,
                {backgroundColor: getStatusColor(product.status) + '20'},
              ]}>
              <Text
                style={[
                  styles.statusBadgeText,
                  {color: getStatusColor(product.status)},
                ]}>
                {product.status?.toUpperCase()}
              </Text>
            </View>
          </View>

          {product.category && (
            <Text style={styles.productCategory}>{product.category}</Text>
          )}

          <View style={styles.productDetails}>
            <View style={styles.priceContainer}>
              <Text style={styles.productPrice}>
                {formatCurrency(product.price)}
              </Text>
              {product.compare_at_price > 0 &&
                product.compare_at_price > product.price && (
                  <Text style={styles.comparePrice}>
                    {formatCurrency(product.compare_at_price)}
                  </Text>
                )}
            </View>

            <View style={styles.stockContainer}>
              <Package color={colors.textSecondary} size={14} />
              <Text style={[styles.stockText, {color: stockStatus.color}]}>
                {stockStatus.text}
              </Text>
            </View>
          </View>

          <View style={styles.productMeta}>
            <Text style={styles.productMetaText}>
              Stock: {product.quantity} | Min: {product.min_qty}
            </Text>
            {product.vendor_name && (
              <Text style={styles.productMetaText}>
                Vendor: {product.vendor_name}
              </Text>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate('EditProductScreen', {productId: product.id})
            }>
            <Edit color={colors.text} size={16} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => {
              setSelectedProduct(product);
              setDeleteModalVisible(true);
            }}>
            <Trash2 color="#F44336" size={16} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Products</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('AddProductScreen')}>
          <Plus color={colors.background} size={20} />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search color={colors.textSecondary} size={16} />
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
          <Filter color={colors.textSecondary} size={18} />
        </TouchableOpacity>
      </View>

      {/* Filter Summary */}
      {(selectedFilter !== 'all' || selectedCategory !== 'all') && (
        <View style={styles.filterSummary}>
          <Text style={styles.filterSummaryText}>
            Showing {filteredProducts.length} products
            {selectedFilter !== 'all' &&
              ` • ${
                selectedFilter === 'low_stock' ? 'Low Stock' : selectedFilter
              }`}
            {selectedCategory !== 'all' && ` • ${selectedCategory}`}
          </Text>
          <TouchableOpacity onPress={() => handleFilterChange('all', 'all')}>
            <Text style={styles.clearFiltersText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Products List with Quick Actions */}
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Products List */}
        <View style={styles.productsList}>
          {filteredProducts.length === 0 ? (
            <ProductListEmpty query={searchQuery} navigation={navigation} />
          ) : (
            filteredProducts.map(product => (
              <View key={product.id.toString()}>
                {renderProductItem({item: product})}
              </View>
            ))
          )}
        </View>

        {/* Quick Actions Section */}
        <View style={styles.actionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          <View style={styles.actionsGrid}>
            {/* Add New Product */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('AddProductScreen')}>
              <View style={styles.quickActionIcon}>
                <PlusSquare color={colors.splashGreen} size={20} />
              </View>
              <Text style={styles.quickActionTitle}>Add Product</Text>
              <Text style={styles.quickActionDescription}>
                Add new inventory item
              </Text>
            </TouchableOpacity>

            {/* Collection */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('CollectionScreen')}>
              <View style={styles.quickActionIcon}>
                <ShoppingCart color={colors.splashGreen} size={20} />
              </View>
              <Text style={styles.quickActionTitle}>Collection</Text>
              <Text style={styles.quickActionDescription}>
                Manage collections
              </Text>
            </TouchableOpacity>

            {/* Purchase Order */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('PurchaseOrderScreen')}>
              <View style={styles.quickActionIcon}>
                <FileText color={colors.splashGreen} size={20} />
              </View>
              <Text style={styles.quickActionTitle}>Purchase Order</Text>
              <Text style={styles.quickActionDescription}>
                Manage PO requests
              </Text>
            </TouchableOpacity>

            {/* Inventory */}
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('InventoryScreen')}>
              <View style={styles.quickActionIcon}>
                <Boxes color={colors.splashGreen} size={20} />
              </View>
              <Text style={styles.quickActionTitle}>Inventory</Text>
              <Text style={styles.quickActionDescription}>
                Check product stock
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        selectedFilter={selectedFilter}
        setSelectedFilter={setSelectedFilter}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        categories={categories}
        handleFilterChange={handleFilterChange}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        itemName={selectedProduct?.title}
        itemType="Product"
        loading={deleting}
        onConfirm={async () => {
          if (!selectedProduct) {
            return;
          }
          try {
            setDeleting(true);
            await deleteProduct({product_id: selectedProduct.id});
            setDeleteModalVisible(false);
            setDeleting(false);
            Alert.alert('Deleted', 'Product deleted successfully');
            fetchProducts();
          } catch (error) {
            console.error('Delete failed:', error);
            Alert.alert('Error', 'Failed to delete product');
            setDeleting(false);
          }
        }}
      />
    </View>
  );
};

const FilterModal = ({
  visible,
  onClose,
  selectedFilter,
  setSelectedFilter,
  selectedCategory,
  setSelectedCategory,
  categories,
  handleFilterChange,
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="slide"
    onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Filter Products</Text>
          <TouchableOpacity onPress={onClose}>
            <X color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        {/* Status Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Status</Text>
          {['all', 'active', 'draft', 'low_stock'].map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterOption,
                selectedFilter === filter && styles.selectedFilterOption,
              ]}
              onPress={() => setSelectedFilter(filter)}>
              <Text
                style={[
                  styles.filterOptionText,
                  selectedFilter === filter && styles.selectedFilterOptionText,
                ]}>
                {filter === 'all'
                  ? 'All Products'
                  : filter === 'low_stock'
                  ? 'Low Stock'
                  : filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Category</Text>
          <TouchableOpacity
            style={[
              styles.filterOption,
              selectedCategory === 'all' && styles.selectedFilterOption,
            ]}
            onPress={() => setSelectedCategory('all')}>
            <Text
              style={[
                styles.filterOptionText,
                selectedCategory === 'all' && styles.selectedFilterOptionText,
              ]}>
              All Categories
            </Text>
          </TouchableOpacity>

          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterOption,
                selectedCategory === category && styles.selectedFilterOption,
              ]}
              onPress={() => setSelectedCategory(category)}>
              <Text
                style={[
                  styles.filterOptionText,
                  selectedCategory === category &&
                    styles.selectedFilterOptionText,
                ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={styles.modalButton}
            onPress={() =>
              handleFilterChange(selectedFilter, selectedCategory)
            }>
            <Text style={styles.modalButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: fontSizes['3xl'],
    fontFamily: fonts.bold,
    color: colors.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search and Filter
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
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filter Summary
  filterSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#E8F5E9',
  },
  filterSummaryText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  clearFiltersText: {
    fontSize: fontSizes.sm,
    color: colors.splashGreen,
    fontFamily: fonts.semiBold,
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
  },

  // Products List
  productsList: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  productCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
  },

  // Product Image
  productImageContainer: {
    height: 200,
    position: 'relative',
    backgroundColor: '#F5F5F5',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stockBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockBadgeText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
  },

  // Product Info
  productInfo: {
    padding: 16,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productTitle: {
    flex: 1,
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
  },
  productCategory: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'capitalize',
    fontFamily: fonts.regular,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.splashGreen,
    marginRight: 8,
  },
  comparePrice: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    fontFamily: fonts.regular,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
  },
  productMeta: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  productMetaText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: 4,
    fontFamily: fonts.regular,
  },

  // Action Buttons
  actionButtons: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  deleteButton: {
    backgroundColor: '#FFF3F3',
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: fonts.regular,
  },
  emptyButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
  },

  // Quick Actions
  actionsSection: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 130,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: '47%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 3,
    textAlign: 'center',
  },
  quickActionDescription: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: fonts.regular,
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
  filterSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
  },
  filterOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedFilterOption: {
    backgroundColor: colors.splashGreen + '20',
  },
  filterOptionText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  selectedFilterOptionText: {
    color: colors.splashGreen,
    fontFamily: fonts.semiBold,
  },
  modalButtons: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalButton: {
    backgroundColor: colors.splashGreen,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
  },
});

export default ProductsScreen;
