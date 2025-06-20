import {useState, useCallback, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
  Modal,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import {
  ArrowLeft,
  Search,
  Filter,
  Grid,
  List,
  Star,
  Heart,
  ShoppingCart,
  X,
  Plus,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {getProducts} from '../../../api/client';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import ProductImage from '../../../assets/images/CommercialPlumbing.jpg';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../context/BackendContext';

const {width: screenWidth} = Dimensions.get('window');
const cardWidth = (screenWidth - 48) / 2;

// Product Card Component
const ProductCard = ({product, onPress, onAddToCart, viewMode = 'grid'}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [quantity] = useState(1);
  const {backendUrl} = useContext(BackendContext);
  const BASE_IMAGE_URL = backendUrl || VITE_API_BASE_URL;

  const formatPrice = price => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  const getFullImageUrl = relativePath => {
    if (!relativePath) {
      return null;
    }
    if (relativePath.startsWith('http')) {
      return relativePath;
    }
    return `${BASE_IMAGE_URL}${relativePath}`;
  };

  const discountPercentage = product.discounted_price
    ? Math.round(
        ((product.price - product.discounted_price) / product.price) * 100,
      )
    : 0;

  const handleAddToCart = () => {
    onAddToCart({
      ...product,
      quantity: quantity,
      finalPrice: product.discounted_price || product.price,
    });
  };

  if (viewMode === 'list') {
    return (
      <TouchableOpacity
        style={styles.listProductCard}
        onPress={() => onPress(product)}>
        <Image
          source={{uri: getFullImageUrl(product.image)}}
          style={styles.listProductImage}
          resizeMode="cover"
          onError={e =>
            console.warn('❌ Image load error:', e.nativeEvent.error)
          }
          defaultSource={ProductImage}
        />

        <View style={styles.listProductInfo}>
          <View style={styles.listProductHeader}>
            <Text style={styles.listProductCategory}>{product.category}</Text>
            <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)}>
              <Heart
                color={isFavorite ? colors.splashGreen : colors.textSecondary}
                fill={isFavorite ? colors.splashGreen : 'transparent'}
                size={18}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.listProductTitle} numberOfLines={2}>
            {product.title}
          </Text>

          <Text style={styles.listProductBrand}>{product.brand}</Text>

          <View style={styles.listProductRating}>
            <Star color="#FFA500" fill="#FFA500" size={14} />
            <Text style={styles.ratingText}>{product.rating || 0}</Text>
          </View>

          <View style={styles.listProductPricing}>
            {product.discounted_price ? (
              <>
                <Text style={styles.listDiscountedPrice}>
                  {formatPrice(product.discounted_price)}
                </Text>
                <Text style={styles.listOriginalPrice}>
                  {formatPrice(product.price)}
                </Text>
                <View style={styles.listDiscountBadge}>
                  <Text style={styles.discountText}>
                    -{discountPercentage}%
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.listProductPrice}>
                {formatPrice(product.price)}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.listAddToCartButton}
          onPress={handleAddToCart}>
          <ShoppingCart color={colors.background} size={16} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.productCard, {width: cardWidth}]}
      onPress={() => onPress(product)}>
      <View style={styles.productImageContainer}>
        <Image
          source={{uri: getFullImageUrl(product.image)}}
          style={styles.productImage}
          resizeMode="cover"
          onError={e =>
            console.warn('❌ Image load error:', e.nativeEvent.error)
          }
          defaultSource={ProductImage}
        />

        {product.discounted_price && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discountPercentage}%</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={() => setIsFavorite(!isFavorite)}>
          <Heart
            color={isFavorite ? colors.splashGreen : colors.background}
            fill={isFavorite ? colors.splashGreen : 'transparent'}
            size={16}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productCategory}>{product.category}</Text>
        <Text style={styles.productTitle} numberOfLines={2}>
          {product.title}
        </Text>

        <View style={styles.productMeta}>
          <Text style={styles.productBrand}>{product.brand}</Text>
          <View style={styles.productRating}>
            <Star color="#FFA500" fill="#FFA500" size={12} />
            <Text style={styles.ratingText}>{product.rating || 0}</Text>
          </View>
        </View>

        <View style={styles.productPricing}>
          {product.discounted_price ? (
            <View style={styles.discountedPricing}>
              <Text style={styles.discountedPrice}>
                {formatPrice(product.discounted_price)}
              </Text>
              <Text style={styles.originalPrice}>
                {formatPrice(product.price)}
              </Text>
            </View>
          ) : (
            <Text style={styles.productPrice}>
              {formatPrice(product.price)}
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.addToCartButton}
        onPress={handleAddToCart}>
        <Plus color={colors.background} size={16} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// Filter Modal Component
const FilterModal = ({
  visible,
  onClose,
  filters,
  onApplyFilters,
  categories,
  brands,
}) => {
  const [selectedFilters, setSelectedFilters] = useState(filters);

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'categories' || filterType === 'brands') {
      const current = selectedFilters[filterType] || [];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];

      setSelectedFilters(prev => ({
        ...prev,
        [filterType]: updated,
      }));
    } else {
      setSelectedFilters(prev => ({
        ...prev,
        [filterType]: value,
      }));
    }
  };

  const handleApply = () => {
    onApplyFilters(selectedFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      search: '',
      categories: [],
      brands: [],
      priceRange: [0, 100000],
      rating: 0,
      sortBy: 'newest',
    };
    setSelectedFilters(resetFilters);
    onApplyFilters(resetFilters);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.filterModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Products</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterOptions}>
            {/* Categories */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Categories</Text>
              {categories.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.filterOption,
                    (selectedFilters.categories || []).includes(category) &&
                      styles.selectedFilterOption,
                  ]}
                  onPress={() => handleFilterChange('categories', category)}>
                  <Text
                    style={[
                      styles.filterOptionText,
                      (selectedFilters.categories || []).includes(category) &&
                        styles.selectedFilterOptionText,
                    ]}>
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Brands */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Brands</Text>
              {brands.map(brand => (
                <TouchableOpacity
                  key={brand}
                  style={[
                    styles.filterOption,
                    (selectedFilters.brands || []).includes(brand) &&
                      styles.selectedFilterOption,
                  ]}
                  onPress={() => handleFilterChange('brands', brand)}>
                  <Text
                    style={[
                      styles.filterOptionText,
                      (selectedFilters.brands || []).includes(brand) &&
                        styles.selectedFilterOptionText,
                    ]}>
                    {brand}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Rating Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
              {[5, 4, 3, 2, 1].map(rating => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.filterOption,
                    selectedFilters.rating === rating &&
                      styles.selectedFilterOption,
                  ]}
                  onPress={() =>
                    handleFilterChange(
                      'rating',
                      selectedFilters.rating === rating ? 0 : rating,
                    )
                  }>
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedFilters.rating === rating &&
                        styles.selectedFilterOptionText,
                    ]}>
                    {rating} ⭐ & above
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sort By */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              {[
                {label: 'Newest First', value: 'newest'},
                {label: 'Price: Low to High', value: 'price-low'},
                {label: 'Price: High to Low', value: 'price-high'},
                {label: 'Highest Rated', value: 'rating'},
                {label: 'Name A-Z', value: 'name'},
              ].map(option => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.filterOption,
                    selectedFilters.sortBy === option.value &&
                      styles.selectedFilterOption,
                  ]}
                  onPress={() => handleFilterChange('sortBy', option.value)}>
                  <Text
                    style={[
                      styles.filterOptionText,
                      selectedFilters.sortBy === option.value &&
                        styles.selectedFilterOptionText,
                    ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Main Products Screen
const ProductsScreen = () => {
  const navigation = useNavigation();

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    categories: [],
    brands: [],
    priceRange: [0, 100000],
    rating: 0,
    sortBy: 'newest',
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    filtered: 0,
  });

  // Extract categories and brands
  const categories = [
    ...new Set(products.map(p => p.category).filter(Boolean)),
  ];
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];

  // Apply filters
  const applyFilters = useCallback(
    (newFilters, productsList = products) => {
      let filtered = productsList.filter(product => {
        const matchSearch =
          !newFilters.search ||
          product.title
            ?.toLowerCase()
            .includes(newFilters.search.toLowerCase()) ||
          product.brand
            ?.toLowerCase()
            .includes(newFilters.search.toLowerCase()) ||
          product.category
            ?.toLowerCase()
            .includes(newFilters.search.toLowerCase());

        const matchCategory =
          !newFilters.categories?.length ||
          newFilters.categories.includes(product.category);

        const matchBrand =
          !newFilters.brands?.length ||
          newFilters.brands.includes(product.brand);

        const price = product.discounted_price || product.price || 0;
        const matchPrice =
          price >= newFilters.priceRange[0] &&
          price <= newFilters.priceRange[1];

        const matchRating =
          !newFilters.rating || (product.rating || 0) >= newFilters.rating;

        return (
          matchSearch &&
          matchCategory &&
          matchBrand &&
          matchPrice &&
          matchRating
        );
      });

      // Apply sorting
      if (newFilters.sortBy) {
        filtered = [...filtered].sort((a, b) => {
          switch (newFilters.sortBy) {
            case 'price-low':
              return (
                (a.discounted_price || a.price || 0) -
                (b.discounted_price || b.price || 0)
              );
            case 'price-high':
              return (
                (b.discounted_price || b.price || 0) -
                (a.discounted_price || a.price || 0)
              );
            case 'rating':
              return (b.rating || 0) - (a.rating || 0);
            case 'name':
              return (a.title || '').localeCompare(b.title || '');
            case 'newest':
            default:
              return new Date(b.created_at || 0) - new Date(a.created_at || 0);
          }
        });
      }

      setFilteredProducts(filtered);
      setStats(prev => ({
        ...prev,
        filtered: filtered.length,
      }));
    },
    [products],
  );

  // Fetch products
  const fetchProducts = useCallback(
    async (page = 1, reset = false) => {
      try {
        if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await getProducts({
          page: page,
          limit: 20,
        });

        if (response && response.products_list) {
          const newProducts =
            reset || page === 1
              ? response.products_list
              : [...products, ...response.products_list];

          setProducts(newProducts);
          applyFilters(filters, newProducts);

          setCurrentPage(page);
          setHasNextPage(response.pagination?.hasNextPage || false);

          setStats(prev => ({
            ...prev,
            total: response.pagination?.totalProducts || newProducts.length,
          }));
        }
      } catch (error) {
        console.error('Failed to load products:', error);
        Alert.alert('Error', 'Unable to load products. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [products, filters, applyFilters],
  );

  // Initial load
  useFocusEffect(
    useCallback(() => {
      fetchProducts(1, true);
    }, [fetchProducts]),
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts(1, true);
    setRefreshing(false);
  }, [fetchProducts]);

  // Load more
  const loadMore = useCallback(() => {
    if (hasNextPage && !loadingMore && !loading) {
      fetchProducts(currentPage + 1);
    }
  }, [hasNextPage, loadingMore, loading, currentPage, fetchProducts]);

  // Handle search
  const handleSearch = text => {
    setSearchQuery(text);
    const newFilters = {...filters, search: text};
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  // Handle filter apply
  const handleApplyFilters = newFilters => {
    setFilters(newFilters);
    applyFilters(newFilters);
    setSearchQuery(newFilters.search || '');
  };

  // Handle product press
  const handleProductPress = product => {
    navigation.navigate('ProductDetailScreen', {
      productId: product.product_id,
    });
  };

  // Handle add to cart
  const handleAddToCart = product => {
    // Add to cart logic here
    Alert.alert(
      'Added to Cart',
      `${product.title} has been added to your cart.`,
    );
  };

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <ShoppingCart color={colors.textSecondary} size={64} />
      <Text style={styles.emptyStateTitle}>No Products Found</Text>
      <Text style={styles.emptyStateDescription}>
        Try adjusting your filters or search terms to find what you're looking
        for.
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() =>
          handleApplyFilters({
            search: '',
            categories: [],
            brands: [],
            priceRange: [0, 100000],
            rating: 0,
            sortBy: 'newest',
          })
        }>
        <Text style={styles.emptyStateButtonText}>Clear Filters</Text>
      </TouchableOpacity>
    </View>
  );

  // List footer
  const renderListFooter = () => (
    <View style={styles.listFooter}>
      {loadingMore && (
        <ActivityIndicator size="small" color={colors.splashGreen} />
      )}
      {!hasNextPage && filteredProducts.length > 0 && (
        <Text style={styles.endOfListText}>No more products</Text>
      )}
    </View>
  );

  // Render product item
  const renderProductItem = ({item}) => (
    <ProductCard
      product={item}
      onPress={handleProductPress}
      onAddToCart={handleAddToCart}
      viewMode={viewMode}
    />
  );

  // Loading state
  if (loading && products.length === 0) {
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
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Products</Text>
          <Text style={styles.headerSubtitle}>
            {stats.filtered} of {stats.total} products
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? (
              <List color={colors.text} size={18} />
            ) : (
              <Grid color={colors.text} size={18} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => setFilterModalVisible(true)}>
            <Filter color={colors.text} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search color={colors.textSecondary} size={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={colors.textSecondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <X color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.product_id?.toString()}
        renderItem={renderProductItem}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={`${viewMode}-${cardWidth}`} // Force re-render when viewMode or screen size changes
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderListFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={[
          styles.productsList,
          filteredProducts.length === 0 && styles.emptyContainer,
        ]}
        columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : null}
        showsVerticalScrollIndicator={false}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        categories={categories}
        brands={brands}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
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
  headerCenter: {
    flex: 1,
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
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
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

  // Products List
  productsList: {
    padding: 16,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  // Product Card (Grid)
  productCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    // width will be set dynamically
  },
  productImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: colors.background,
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 4,
  },
  productInfo: {
    flex: 1,
  },
  productCategory: {
    fontSize: fontSizes.xs,
    color: colors.splashGreen,
    fontFamily: fonts.medium,
    marginBottom: 4,
  },
  productTitle: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
    minHeight: 32,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productBrand: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  productRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  productPricing: {
    marginBottom: 8,
  },
  discountedPricing: {
    flexDirection: 'column',
    gap: 2,
  },
  discountedPrice: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  originalPrice: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  productPrice: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  addToCartButton: {
    backgroundColor: colors.splashGreen,
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },

  // Product Card (List)
  listProductCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  listProductImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginRight: 12,
  },
  listProductInfo: {
    flex: 1,
  },
  listProductHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listProductCategory: {
    fontSize: fontSizes.xs,
    color: colors.splashGreen,
    fontFamily: fonts.medium,
  },
  listProductTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  listProductBrand: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 4,
  },
  listProductRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  listProductPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  listDiscountedPrice: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  listOriginalPrice: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  listProductPrice: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  listDiscountBadge: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  listAddToCartButton: {
    backgroundColor: colors.splashGreen,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    textAlign: 'center',
    paddingHorizontal: 32,
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
  },

  // List Footer
  listFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endOfListText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
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
  filterOptions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F8F8F8',
  },
  selectedFilterOption: {
    backgroundColor: colors.splashGreen + '20',
    borderWidth: 1,
    borderColor: colors.splashGreen,
  },
  filterOptionText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  selectedFilterOptionText: {
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },
  filterActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.splashGreen,
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.splashGreen,
    borderRadius: 8,
  },
  applyButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },
});

export default ProductsScreen;
