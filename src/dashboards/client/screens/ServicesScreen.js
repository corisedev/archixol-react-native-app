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
  MapPin,
  X,
  Bookmark,
  Phone,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {getServices} from '../../../api/client';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import ServiceImage from '../../../assets/images/CommercialPlumbing.jpg';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../context/BackendContext';

const {width: screenWidth} = Dimensions.get('window');
const cardWidth = (screenWidth - 48) / 2;

// Transform slug to title function
const transformSlugToTitle = slug => {
  if (!slug) return '';
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Service Card Component
const ServiceCard = ({service, onPress, onContact, viewMode = 'grid'}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
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
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;
    return `${BASE_IMAGE_URL}${relativePath}`;
  };

  const handleContact = () => {
    onContact(service);
  };

  if (viewMode === 'list') {
    return (
      <TouchableOpacity
        style={styles.listServiceCard}
        onPress={() => onPress(service)}>
        <Image
          source={{uri: getFullImageUrl(service.image)}}
          style={styles.listServiceImage}
          resizeMode="cover"
          onError={e =>
            console.warn('❌ Image load error:', e.nativeEvent.error)
          }
          defaultSource={ServiceImage}
        />

        <View style={styles.listServiceInfo}>
          <View style={styles.listServiceHeader}>
            <Text style={styles.listServiceCategory}>
              {transformSlugToTitle(service.category)}
            </Text>
            <TouchableOpacity onPress={() => setIsFavorite(!isFavorite)}>
              <Heart
                color={isFavorite ? colors.splashGreen : colors.textSecondary}
                fill={isFavorite ? colors.splashGreen : 'transparent'}
                size={18}
              />
            </TouchableOpacity>
          </View>

          <Text style={styles.listServiceTitle} numberOfLines={2}>
            {service.title}
          </Text>

          <View style={styles.listServiceRating}>
            <Star color="#FFA500" fill="#FFA500" size={14} />
            <Text style={styles.ratingText}>
              {service.rating || 0} ({service.no_of_reviews || 0} reviews)
            </Text>
          </View>

          <Text style={styles.listServiceDescription} numberOfLines={2}>
            {service.description}
          </Text>

          <View style={styles.listServiceLocation}>
            <MapPin color={colors.textSecondary} size={14} />
            <Text style={styles.locationText}>{service.location}</Text>
          </View>

          <View style={styles.listServicePricing}>
            <Text style={styles.listServicePrice}>
              {formatPrice(service.price)}
            </Text>
          </View>
        </View>

        <View style={styles.listServiceActions}>
          <TouchableOpacity
            style={styles.listContactButton}
            onPress={handleContact}>
            <Phone color={colors.background} size={16} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.listBookmarkButton}
            onPress={() => setIsBookmarked(!isBookmarked)}>
            <Bookmark
              color={isBookmarked ? colors.splashGreen : colors.textSecondary}
              fill={isBookmarked ? colors.splashGreen : 'transparent'}
              size={16}
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.serviceCard, {width: cardWidth}]}
      onPress={() => onPress(service)}>
      <View style={styles.serviceImageContainer}>
        <Image
          source={{uri: getFullImageUrl(service.image)}}
          style={styles.serviceImage}
          resizeMode="cover"
          onError={e =>
            console.warn('❌ Image load error:', e.nativeEvent.error)
          }
          defaultSource={ServiceImage}
        />

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

      <View style={styles.serviceInfo}>
        <View style={styles.serviceCategoryRow}>
          <Text style={styles.serviceCategory}>
            {transformSlugToTitle(service.category)}
          </Text>
          <TouchableOpacity onPress={() => setIsBookmarked(!isBookmarked)}>
            <Bookmark
              color={isBookmarked ? colors.splashGreen : colors.textSecondary}
              fill={isBookmarked ? colors.splashGreen : 'transparent'}
              size={14}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.serviceTitle} numberOfLines={2}>
          {service.title}
        </Text>

        <View style={styles.serviceRating}>
          <Star color="#FFA500" fill="#FFA500" size={12} />
          <Text style={styles.ratingText}>
            {service.rating || 0} ({service.no_of_reviews || 0})
          </Text>
        </View>

        <Text style={styles.serviceDescription} numberOfLines={2}>
          {service.description}
        </Text>

        <View style={styles.serviceLocation}>
          <MapPin color={colors.textSecondary} size={12} />
          <Text style={styles.locationText} numberOfLines={1}>
            {service.location}
          </Text>
        </View>

        <View style={styles.servicePricing}>
          <Text style={styles.servicePrice}>{formatPrice(service.price)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.contactButton} onPress={handleContact}>
        <Phone color={colors.background} size={16} />
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
  locations,
}) => {
  const [selectedFilters, setSelectedFilters] = useState(filters);

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'categories' || filterType === 'locations') {
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
      locations: [],
      priceRange: [0, 50000],
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
            <Text style={styles.modalTitle}>Filter Services</Text>
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
                    {transformSlugToTitle(category)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Locations */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Locations</Text>
              {locations.map(location => (
                <TouchableOpacity
                  key={location}
                  style={[
                    styles.filterOption,
                    (selectedFilters.locations || []).includes(location) &&
                      styles.selectedFilterOption,
                  ]}
                  onPress={() => handleFilterChange('locations', location)}>
                  <Text
                    style={[
                      styles.filterOptionText,
                      (selectedFilters.locations || []).includes(location) &&
                        styles.selectedFilterOptionText,
                    ]}>
                    {location}
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

// Main Services Screen
const ServicesScreen = () => {
  const navigation = useNavigation();

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
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
    locations: [],
    priceRange: [0, 50000],
    rating: 0,
    sortBy: 'newest',
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    filtered: 0,
  });

  // Extract categories and locations
  const categories = [
    ...new Set(services.map(s => s.category).filter(Boolean)),
  ];
  const locations = [...new Set(services.map(s => s.location).filter(Boolean))];

  // Apply filters
  const applyFilters = useCallback(
    (newFilters, servicesList = services) => {
      let filtered = servicesList.filter(service => {
        const matchSearch =
          !newFilters.search ||
          service.title
            ?.toLowerCase()
            .includes(newFilters.search.toLowerCase()) ||
          service.category
            ?.toLowerCase()
            .includes(newFilters.search.toLowerCase()) ||
          service.location
            ?.toLowerCase()
            .includes(newFilters.search.toLowerCase());

        const matchCategory =
          !newFilters.categories?.length ||
          newFilters.categories.includes(service.category);

        const matchLocation =
          !newFilters.locations?.length ||
          newFilters.locations.includes(service.location);

        const price = service.price || 0;
        const matchPrice =
          price >= newFilters.priceRange[0] &&
          price <= newFilters.priceRange[1];

        const matchRating =
          !newFilters.rating || (service.rating || 0) >= newFilters.rating;

        return (
          matchSearch &&
          matchCategory &&
          matchLocation &&
          matchPrice &&
          matchRating
        );
      });

      // Apply sorting
      if (newFilters.sortBy) {
        filtered = [...filtered].sort((a, b) => {
          switch (newFilters.sortBy) {
            case 'price-low':
              return (a.price || 0) - (b.price || 0);
            case 'price-high':
              return (b.price || 0) - (a.price || 0);
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

      setFilteredServices(filtered);
      setStats(prev => ({
        ...prev,
        filtered: filtered.length,
      }));
    },
    [services],
  );

  // Fetch services
  const fetchServices = useCallback(
    async (page = 1, reset = false) => {
      try {
        if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await getServices({
          page: page,
          limit: 20,
        });

        if (response && response.services_list) {
          const newServices =
            reset || page === 1
              ? response.services_list
              : [...services, ...response.services_list];

          setServices(newServices);
          applyFilters(filters, newServices);

          setCurrentPage(page);
          setHasNextPage(response.pagination?.hasNextPage || false);

          setStats(prev => ({
            ...prev,
            total: response.pagination?.totalServices || newServices.length,
          }));
        }
      } catch (error) {
        console.error('Failed to load services:', error);
        Alert.alert('Error', 'Unable to load services. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [services, filters, applyFilters],
  );

  // Initial load
  useFocusEffect(
    useCallback(() => {
      fetchServices(1, true);
    }, [fetchServices]),
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchServices(1, true);
    setRefreshing(false);
  }, [fetchServices]);

  // Load more
  const loadMore = useCallback(() => {
    if (hasNextPage && !loadingMore && !loading) {
      fetchServices(currentPage + 1);
    }
  }, [hasNextPage, loadingMore, loading, currentPage, fetchServices]);

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

  // Handle service press
  const handleServicePress = service => {
    navigation.navigate('ServiceDetailScreen', {
      serviceId: service.service_id,
    });
  };

  // Handle contact
  const handleContact = service => {
    Alert.alert(
      'Contact Service Provider',
      `Contact ${service.title} for more information.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Call Now', onPress: () => console.log('Call service provider')},
      ],
    );
  };

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Phone color={colors.textSecondary} size={64} />
      <Text style={styles.emptyStateTitle}>No Services Found</Text>
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
            locations: [],
            priceRange: [0, 50000],
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
      {!hasNextPage && filteredServices.length > 0 && (
        <Text style={styles.endOfListText}>No more services</Text>
      )}
    </View>
  );

  // Render service item
  const renderServiceItem = ({item}) => (
    <ServiceCard
      service={item}
      onPress={handleServicePress}
      onContact={handleContact}
      viewMode={viewMode}
    />
  );

  // Loading state
  if (loading && services.length === 0) {
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
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Services</Text>
          <Text style={styles.headerSubtitle}>
            {stats.filtered} of {stats.total} services
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
            placeholder="Search services..."
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

      {/* Services List */}
      <FlatList
        data={filteredServices}
        keyExtractor={item => item.service_id?.toString()}
        renderItem={renderServiceItem}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={`${viewMode}-${cardWidth}`}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderListFooter}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={[
          styles.servicesList,
          filteredServices.length === 0 && styles.emptyContainer,
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
        locations={locations}
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

  // Services List
  servicesList: {
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

  // Service Card (Grid)
  serviceCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  serviceImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  serviceImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 4,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: fontSizes.xs,
    color: colors.splashGreen,
    fontFamily: fonts.medium,
  },
  serviceTitle: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
    minHeight: 32,
  },
  serviceRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  serviceDescription: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 6,
    lineHeight: 16,
  },
  serviceLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  locationText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    flex: 1,
  },
  servicePricing: {
    marginBottom: 8,
  },
  servicePrice: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  contactButton: {
    backgroundColor: colors.splashGreen,
    borderRadius: 20,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },

  // Service Card (List)
  listServiceCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listServiceImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    marginRight: 12,
  },
  listServiceInfo: {
    flex: 1,
  },
  listServiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listServiceCategory: {
    fontSize: fontSizes.xs,
    color: colors.splashGreen,
    fontFamily: fonts.medium,
  },
  listServiceTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  listServiceRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  listServiceDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 6,
    lineHeight: 18,
  },
  listServiceLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  listServicePricing: {
    marginBottom: 4,
  },
  listServicePrice: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  listServiceActions: {
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  listContactButton: {
    backgroundColor: colors.splashGreen,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listBookmarkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
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

export default ServicesScreen;
