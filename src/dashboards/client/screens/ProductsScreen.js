import React, {useState, useEffect, useCallback} from 'react';
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
  FlatList,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {getProducts, getCategories, getBrands} from '../../../api/client';
import {useNavigation} from '@react-navigation/native';
import {useContext} from 'react';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../context/BackendContext';

// Import your icons here
import SearchIcon from '../../../assets/images/icons/company.png';
import FilterIcon from '../../../assets/images/icons/company.png';
import HeartIcon from '../../../assets/images/icons/company.png';
import CartIcon from '../../../assets/images/icons/company.png';
import StarIcon from '../../../assets/images/icons/company.png';

const {width} = Dimensions.get('window');

const ProductsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const {backendUrl} = useContext(BackendContext);
  const BASE_IMAGE_URL = backendUrl || VITE_API_BASE_URL;

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [priceRange, setPriceRange] = useState({min: 0, max: 100000});
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const getFullImageUrl = relativePath => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;
    return `${BASE_IMAGE_URL}${relativePath}`;
  };

  // Fetch all data
  const fetchProducts = useCallback(async () => {
    try {
      const response = await getProducts();
      console.log('Products API Response:', response);
      if (response && response.products_list) {
        setProducts(response.products_list);
        setFilteredProducts(response.products_list);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      Alert.alert('Error', 'Unable to load products. Please try again.');
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await getCategories();
      if (response && response.categories) {
        setCategories([
          {id: 'all', name: 'All Categories'},
          ...response.categories,
        ]);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const response = await getBrands();
      if (response && response.brands) {
        setBrands([{id: 'all', name: 'All Brands'}, ...response.brands]);
      }
    } catch (error) {
      console.error('Failed to load brands:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchCategories(), fetchBrands()]);
      setLoading(false);
    };
    loadData();
  }, [fetchProducts, fetchCategories, fetchBrands]);

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...products];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        product =>
          product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          product.brand?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        product => product.category_id === selectedCategory,
      );
    }

    // Brand filter
    if (selectedBrand !== 'all') {
      filtered = filtered.filter(product => product.brand_id === selectedBrand);
    }

    // Price range filter
    filtered = filtered.filter(product => {
      const price = parseFloat(product.price) || 0;
      return price >= priceRange.min && price <= priceRange.max;
    });

    // Availability filter
    if (availabilityFilter !== 'all') {
      if (availabilityFilter === 'available') {
        filtered = filtered.filter(product => product.in_stock === true);
      } else if (availabilityFilter === 'out_of_stock') {
        filtered = filtered.filter(product => product.in_stock === false);
      }
    }

    // Rating filter
    if (selectedRating !== 'all') {
      const minRating = parseFloat(selectedRating);
      filtered = filtered.filter(product => {
        const rating = parseFloat(product.rating) || 0;
        return rating >= minRating;
      });
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return parseFloat(a.price || 0) - parseFloat(b.price || 0);
        case 'price_high':
          return parseFloat(b.price || 0) - parseFloat(a.price || 0);
        case 'rating':
          return (parseFloat(b.rating) || 0) - (parseFloat(a.rating) || 0);
        case 'reviews':
          return (
            (parseInt(b.reviews_count) || 0) - (parseInt(a.reviews_count) || 0)
          );
        case 'newest':
        default:
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      }
    });

    setFilteredProducts(filtered);
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedBrand,
    priceRange,
    availabilityFilter,
    selectedRating,
    sortBy,
  ]);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setPriceRange({min: 0, max: 100000});
    setAvailabilityFilter('all');
    setSelectedRating('all');
    setSortBy('newest');
    setShowFilters(false);
  };

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchCategories(), fetchBrands()]);
    setRefreshing(false);
  }, [fetchProducts, fetchCategories, fetchBrands]);

  // Format currency
  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `Rs ${amount.toLocaleString()}`;
    }
    return `Rs ${amount || '0'}`;
  };

  // Calculate discount percentage
  const getDiscountPercentage = (original, current) => {
    if (original && current && original > current) {
      const discount = ((original - current) / original) * 100;
      return Math.round(discount);
    }
    return 0;
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedCategory !== 'all') count++;
    if (selectedBrand !== 'all') count++;
    if (priceRange.min > 0 || priceRange.max < 100000) count++;
    if (availabilityFilter !== 'all') count++;
    if (selectedRating !== 'all') count++;
    if (sortBy !== 'newest') count++;
    return count;
  };

  // Navigate to product details
  const navigateToProductDetails = product => {
    navigation.navigate('ProductDetailsScreen', {
      productId: product.product_id,
      product: product,
    });
  };

  // Handle add to cart
  const handleAddToCart = product => {
    if (!product.in_stock) {
      Alert.alert('Out of Stock', 'This product is currently out of stock.');
      return;
    }
    Alert.alert('Added to Cart', `${product.title} added to your cart.`);
  };

  // Render product card
  const renderProductCard = ({item: product}) => (
    <TouchableOpacity
      style={styles.productCard}
      activeOpacity={0.7}
      onPress={() => navigateToProductDetails(product)}>
      <View style={styles.productImageContainer}>
        {getFullImageUrl(product.image) ? (
          <Image
            source={{uri: getFullImageUrl(product.image)}}
            style={styles.productImage}
            resizeMode="cover"
            onError={e => console.warn('❌ Image failed:', e.nativeEvent.error)}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>📦</Text>
          </View>
        )}

        {!product.in_stock && (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}

        {getDiscountPercentage(product.original_price, product.price) > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              -{getDiscountPercentage(product.original_price, product.price)}%
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.favoriteButton}>
          <Image source={HeartIcon} style={styles.favoriteIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.productInfo}>
        <View style={styles.productTitleRow}>
          <Text style={styles.productTitle} numberOfLines={2}>
            {product.title}
          </Text>
          <View style={styles.ratingBadge}>
            <Image source={StarIcon} style={styles.starIconSmall} />
            <Text style={styles.ratingBadgeText}>
              {product.rating || '0.0'}
            </Text>
          </View>
        </View>

        <Text style={styles.productBrand}>{product.brand}</Text>

        <View style={styles.productFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>
              {formatCurrency(product.price)}
            </Text>
            {product.original_price &&
              product.original_price > product.price && (
                <Text style={styles.originalPrice}>
                  {formatCurrency(product.original_price)}
                </Text>
              )}
            <Text style={styles.reviewsCount}>
              ({product.reviews_count || 0} reviews)
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.addToCartButton,
              !product.in_stock && styles.disabledCartButton,
            ]}
            onPress={() => handleAddToCart(product)}
            disabled={!product.in_stock}>
            <Image source={CartIcon} style={styles.cartIcon} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render filter modal
  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet">
      <View style={styles.filterModal}>
        <View style={styles.filterHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.filterTitle}>Filters</Text>
          <TouchableOpacity onPress={resetFilters}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.filterContent}
          showsVerticalScrollIndicator={false}>
          {/* Categories */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Categories</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryRow}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory === category.id &&
                        styles.selectedCategoryChip,
                    ]}
                    onPress={() => setSelectedCategory(category.id)}>
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategory === category.id &&
                          styles.selectedCategoryChipText,
                      ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Brands */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Brands</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryRow}>
                {brands.map(brand => (
                  <TouchableOpacity
                    key={brand.id}
                    style={[
                      styles.categoryChip,
                      selectedBrand === brand.id && styles.selectedCategoryChip,
                    ]}
                    onPress={() => setSelectedBrand(brand.id)}>
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedBrand === brand.id &&
                          styles.selectedCategoryChipText,
                      ]}>
                      {brand.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Price Range */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Price Range</Text>
            <View style={styles.priceRangeContainer}>
              <View style={styles.priceInputContainer}>
                <Text style={styles.priceLabel}>Min (Rs)</Text>
                <TextInput
                  style={styles.priceInput}
                  value={priceRange.min.toString()}
                  onChangeText={text =>
                    setPriceRange(prev => ({...prev, min: parseInt(text) || 0}))
                  }
                  keyboardType="numeric"
                  placeholder="0"
                />
              </View>
              <Text style={styles.priceSeparator}>to</Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.priceLabel}>Max (Rs)</Text>
                <TextInput
                  style={styles.priceInput}
                  value={priceRange.max.toString()}
                  onChangeText={text =>
                    setPriceRange(prev => ({
                      ...prev,
                      max: parseInt(text) || 100000,
                    }))
                  }
                  keyboardType="numeric"
                  placeholder="100000"
                />
              </View>
            </View>
          </View>

          {/* Availability */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Availability</Text>
            <View style={styles.availabilityFilters}>
              {[
                {id: 'all', name: 'All Products'},
                {id: 'available', name: 'In Stock'},
                {id: 'out_of_stock', name: 'Out of Stock'},
              ].map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.availabilityFilter,
                    availabilityFilter === option.id &&
                      styles.selectedAvailabilityFilter,
                  ]}
                  onPress={() => setAvailabilityFilter(option.id)}>
                  <Text
                    style={[
                      styles.availabilityFilterText,
                      availabilityFilter === option.id &&
                        styles.selectedAvailabilityFilterText,
                    ]}>
                    {option.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Rating Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Minimum Rating</Text>
            <View style={styles.ratingFilters}>
              {[
                {id: 'all', name: 'All Ratings'},
                {id: '4', name: '4+ Stars'},
                {id: '3', name: '3+ Stars'},
                {id: '2', name: '2+ Stars'},
              ].map(rating => (
                <TouchableOpacity
                  key={rating.id}
                  style={[
                    styles.ratingFilter,
                    selectedRating === rating.id && styles.selectedRatingFilter,
                  ]}
                  onPress={() => setSelectedRating(rating.id)}>
                  <Text
                    style={[
                      styles.ratingFilterText,
                      selectedRating === rating.id &&
                        styles.selectedRatingFilterText,
                    ]}>
                    {rating.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort Options */}
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <View style={styles.sortOptions}>
              {[
                {id: 'newest', name: 'Newest First'},
                {id: 'price_low', name: 'Price: Low to High'},
                {id: 'price_high', name: 'Price: High to Low'},
                {id: 'rating', name: 'Highest Rated'},
                {id: 'reviews', name: 'Most Reviewed'},
              ].map(option => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.sortOption,
                    sortBy === option.id && styles.selectedSortOption,
                  ]}
                  onPress={() => setSortBy(option.id)}>
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === option.id && styles.selectedSortOptionText,
                    ]}>
                    {option.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Apply Button */}
        <View style={styles.filterFooter}>
          <TouchableOpacity
            style={styles.applyFiltersButton}
            onPress={() => setShowFilters(false)}>
            <Text style={styles.applyFiltersButtonText}>
              Apply Filters ({filteredProducts.length} products)
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

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
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Products</Text>
            <Text style={styles.headerSubtitle}>Discover amazing products</Text>
          </View>
          <TouchableOpacity style={styles.cartButton}>
            <Image source={CartIcon} style={styles.cartIcon} />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>0</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Image source={SearchIcon} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            getActiveFiltersCount() > 0 && styles.activeFilterButton,
          ]}
          onPress={() => setShowFilters(true)}>
          <Image
            source={FilterIcon}
            style={[
              styles.filterIcon,
              getActiveFiltersCount() > 0 && {tintColor: colors.background},
            ]}
          />
          {getActiveFiltersCount() > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {getActiveFiltersCount()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredProducts.length} products found
        </Text>
        {getActiveFiltersCount() > 0 && (
          <TouchableOpacity onPress={resetFilters}>
            <Text style={styles.clearFiltersText}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductCard}
          keyExtractor={item =>
            item.product_id?.toString() || Math.random().toString()
          }
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.productsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🔍</Text>
          <Text style={styles.emptyStateTitle}>No products found</Text>
          <Text style={styles.emptyStateText}>
            Try adjusting your search or filters to find the products you're
            looking for.
          </Text>
          {getActiveFiltersCount() > 0 && (
            <TouchableOpacity
              style={styles.resetFiltersButton}
              onPress={resetFilters}>
              <Text style={styles.resetFiltersButtonText}>Reset Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Filter Modal */}
      {renderFilterModal()}
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
    paddingVertical: 20,
    paddingTop: 40,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cartIcon: {
    width: 20,
    height: 20,
    tintColor: colors.text,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.splashGreen,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },

  // Search Section
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    width: 18,
    height: 18,
    marginRight: 12,
    tintColor: colors.textSecondary,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activeFilterButton: {
    backgroundColor: colors.splashGreen,
  },
  filterIcon: {
    width: 20,
    height: 20,
    tintColor: colors.text,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Results Header
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  clearFiltersText: {
    fontSize: 14,
    color: colors.splashGreen,
    fontWeight: '600',
  },

  // Products List
  productsList: {
    paddingHorizontal: 8,
    paddingBottom: 100,
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  productCard: {
    flex: 1,
    marginHorizontal: 8,
    backgroundColor: colors.background,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  productImageContainer: {
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    position: 'relative',
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
  placeholderText: {
    fontSize: 40,
  },
  outOfStockOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 6,
    alignItems: 'center',
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FF4444',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    width: 14,
    height: 14,
    tintColor: colors.textSecondary,
  },

  // Product Info
  productInfo: {
    padding: 12,
  },
  productTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.splashGreen + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  starIconSmall: {
    width: 10,
    height: 10,
    tintColor: colors.splashGreen,
    marginRight: 2,
  },
  ratingBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.splashGreen,
  },
  productBrand: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceContainer: {
    flex: 1,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.splashGreen,
  },
  originalPrice: {
    fontSize: 12,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  reviewsCount: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
  },
  addToCartButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.splashGreen + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledCartButton: {
    backgroundColor: colors.textSecondary + '20',
  },

  // Filter Modal
  filterModal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  cancelText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  resetText: {
    fontSize: 16,
    color: colors.splashGreen,
    fontWeight: '500',
  },
  filterContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  filterSection: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },

  // Categories
  categoryRow: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  categoryChip: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedCategoryChip: {
    backgroundColor: colors.splashGreen,
  },
  categoryChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  selectedCategoryChipText: {
    color: colors.background,
  },

  // Price Range
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInputContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    backgroundColor: '#F8F9FA',
  },
  priceSeparator: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 20,
  },

  // Availability Filters
  availabilityFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  availabilityFilter: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectedAvailabilityFilter: {
    backgroundColor: colors.splashGreen,
  },
  availabilityFilterText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  selectedAvailabilityFilterText: {
    color: colors.background,
  },

  // Rating Filters
  ratingFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ratingFilter: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectedRatingFilter: {
    backgroundColor: colors.splashGreen,
  },
  ratingFilterText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  selectedRatingFilterText: {
    color: colors.background,
  },

  // Sort Options
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectedSortOption: {
    backgroundColor: colors.splashGreen,
  },
  sortOptionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  selectedSortOptionText: {
    color: colors.background,
  },

  // Filter Footer
  filterFooter: {
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  applyFiltersButton: {
    backgroundColor: colors.splashGreen,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyFiltersButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  resetFiltersButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.splashGreen,
    borderRadius: 8,
  },
  resetFiltersButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },
});

export default ProductsScreen;
