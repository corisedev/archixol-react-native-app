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
import {getServices} from '../../../api/client';
import {useNavigation} from '@react-navigation/native';
import {useContext} from 'react';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../context/BackendContext'; // adjust path as needed

// Import your icons here
import SearchIcon from '../../../assets/images/icons/company.png';
import FilterIcon from '../../../assets/images/icons/company.png';
import LocationIcon from '../../../assets/images/icons/location.png';
import StarIcon from '../../../assets/images/icons/company.png';
import ClockIcon from '../../../assets/images/icons/company.png';
import UserIcon from '../../../assets/images/icons/company.png';
import HeartIcon from '../../../assets/images/icons/company.png';

const {width} = Dimensions.get('window');

const ServicesScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const {backendUrl} = useContext(BackendContext);
  const BASE_IMAGE_URL = backendUrl || VITE_API_BASE_URL;
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState({min: 0, max: 50000});
  const [selectedRating, setSelectedRating] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Service categories
  const serviceCategories = [
    {id: 'all', name: 'All Services'},
    {id: 'plumbing', name: 'Plumbing'},
    {id: 'electrical', name: 'Electrical'},
    {id: 'painting', name: 'Painting'},
    {id: 'cleaning', name: 'Cleaning'},
    {id: 'carpentry', name: 'Carpentry'},
    {id: 'landscaping', name: 'Landscaping'},
    {id: 'hvac', name: 'HVAC'},
    {id: 'roofing', name: 'Roofing'},
  ];

  const getFullImageUrl = (relativePath) => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;
    return `${BASE_IMAGE_URL}${relativePath}`;
  };

  // Fetch services
  const fetchServices = useCallback(async () => {
    try {
      const response = await getServices();
      console.log('Services API Response:', response);
      if (response && response.services_list) {
        setServices(response.services_list);
        setFilteredServices(response.services_list);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
      Alert.alert('Error', 'Unable to load services. Please try again.');
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchServices();
      setLoading(false);
    };
    loadData();
  }, [fetchServices]);

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...services];

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        service =>
          service.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          service.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          service.location?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        service =>
          service.category?.toLowerCase() === selectedCategory.toLowerCase(),
      );
    }

    // Price range filter
    filtered = filtered.filter(service => {
      const price = parseFloat(service.price) || 0;
      return price >= priceRange.min && price <= priceRange.max;
    });

    // Rating filter
    if (selectedRating !== 'all') {
      const minRating = parseFloat(selectedRating);
      filtered = filtered.filter(service => {
        const rating = parseFloat(service.average_rating) || 0;
        return rating >= minRating;
      });
    }

    // Sort services
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return parseFloat(a.price || 0) - parseFloat(b.price || 0);
        case 'price_high':
          return parseFloat(b.price || 0) - parseFloat(a.price || 0);
        case 'rating':
          return (
            (parseFloat(b.average_rating) || 0) -
            (parseFloat(a.average_rating) || 0)
          );
        case 'reviews':
          return (
            (parseInt(b.no_of_reviews) || 0) - (parseInt(a.no_of_reviews) || 0)
          );
        case 'newest':
        default:
          return 0; // Keep original order
      }
    });

    setFilteredServices(filtered);
  }, [
    services,
    searchQuery,
    selectedCategory,
    priceRange,
    selectedRating,
    sortBy,
  ]);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPriceRange({min: 0, max: 50000});
    setSelectedRating('all');
    setSortBy('newest');
    setShowFilters(false);
  };

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  }, [fetchServices]);

  // Format currency
  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `Rs ${amount.toLocaleString()}`;
    }
    return `Rs ${amount || '0'}`;
  };

  // Get active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (selectedCategory !== 'all') count++;
    if (priceRange.min > 0 || priceRange.max < 50000) count++;
    if (selectedRating !== 'all') count++;
    if (sortBy !== 'newest') count++;
    return count;
  };

  // Navigate to service details
  const navigateToServiceDetails = service => {
    navigation.navigate('ServiceDetailsScreen', {
      serviceId: service.service_id,
      service: service, // Pass the service data for immediate display
    });
  };

  // Render service card
  const renderServiceCard = ({item: service}) => (
    <TouchableOpacity
      style={styles.serviceCard}
      activeOpacity={0.7}
      onPress={() => navigateToServiceDetails(service)}>
      <View style={styles.serviceImageContainer}>
        {getFullImageUrl(service.image) ? (
          <Image
            source={{uri: getFullImageUrl(service.image)}}
            style={styles.serviceImage}
            resizeMode="cover"
            onError={e => console.warn('❌ Image failed:', e.nativeEvent.error)}
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>🛠️</Text>
          </View>
        )}

        <TouchableOpacity style={styles.favoriteButton}>
          <Image source={HeartIcon} style={styles.favoriteIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.serviceInfo}>
        <View style={styles.serviceTitleRow}>
          <Text style={styles.serviceTitle} numberOfLines={1}>
            {service.title}
          </Text>
          <View style={styles.ratingBadge}>
            <Image source={StarIcon} style={styles.starIconSmall} />
            <Text style={styles.ratingBadgeText}>
              {service.average_rating || '0.0'}
            </Text>
          </View>
        </View>

        <Text style={styles.serviceCategory}>{service.category}</Text>

        <View style={styles.locationRow}>
          <Image source={LocationIcon} style={styles.locationIconSmall} />
          <Text style={styles.locationText} numberOfLines={1}>
            {service.location || 'Location not specified'}
          </Text>
        </View>

        <View style={styles.serviceFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.servicePrice}>
              {formatCurrency(service.price)}
            </Text>
            <Text style={styles.priceUnit}>starting from</Text>
          </View>

          <View style={styles.serviceMetrics}>
            <Text style={styles.reviewsCount}>
              ({service.no_of_reviews || 0} reviews)
            </Text>
          </View>
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
                {serviceCategories.map(category => (
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
                      max: parseInt(text) || 50000,
                    }))
                  }
                  keyboardType="numeric"
                  placeholder="50000"
                />
              </View>
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
              Apply Filters ({filteredServices.length} services)
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
        <Text style={styles.loadingText}>Loading services...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Services</Text>
            <Text style={styles.headerSubtitle}>
              Find professionals for your needs
            </Text>
          </View>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Image source={SearchIcon} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
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
          {filteredServices.length} services found
        </Text>
        {getActiveFiltersCount() > 0 && (
          <TouchableOpacity onPress={resetFilters}>
            <Text style={styles.clearFiltersText}>Clear filters</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Services Grid */}
      {filteredServices.length > 0 ? (
        <FlatList
          data={filteredServices}
          renderItem={renderServiceCard}
          keyExtractor={item =>
            item.service_id?.toString() || Math.random().toString()
          }
          numColumns={2}
          columnWrapperStyle={styles.serviceRow}
          contentContainerStyle={styles.servicesList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>🔍</Text>
          <Text style={styles.emptyStateTitle}>No services found</Text>
          <Text style={styles.emptyStateText}>
            Try adjusting your search or filters to find the services you're
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

  // Services List
  servicesList: {
    paddingHorizontal: 8,
    paddingBottom: 100,
  },
  serviceRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  serviceCard: {
    flex: 1,
    marginHorizontal: 8, // adds horizontal space between cards
    backgroundColor: colors.background,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  serviceImageContainer: {
    height: 120,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  serviceImage: {
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
    fontSize: 32,
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

  // Service Info
  serviceInfo: {
    padding: 12,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  serviceTitle: {
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
  serviceCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIconSmall: {
    width: 10,
    height: 10,
    marginRight: 4,
    tintColor: colors.textSecondary,
  },
  locationText: {
    fontSize: 11,
    color: colors.textSecondary,
    flex: 1,
  },
  serviceFooter: {
    flexDirection: 'column',
    gap: 4,
  },
  priceContainer: {
    alignItems: 'flex-start',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.splashGreen,
  },
  priceUnit: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  serviceMetrics: {
    alignItems: 'flex-start',
  },
  reviewsCount: {
    fontSize: 10,
    color: colors.textSecondary,
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

export default ServicesScreen;
