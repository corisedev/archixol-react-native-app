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
  RefreshControl,
  FlatList,
} from 'react-native';
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  Package,
  MapPin,
  ChevronRight,
  Search,
  Filter,
  Pencil,
  Trash2,
  X,
  Grid3X3,
  List,
  Eye,
  Star,
} from 'lucide-react-native';
import DeleteConfirmationModal from '../../components/modals/DeleteConfirmationModal';
import {colors} from '../../../../utils/colors';
import {fonts, fontSizes} from '../../../../utils/fonts';
import {getAllServices, deleteService} from '../../../../api/serviceProvider';
import {useNavigation} from '@react-navigation/native';
import {useContext} from 'react';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../../context/BackendContext';

const ServicesScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'inactive', 'all'
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const navigation = useNavigation();
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
    const fullUrl = `${baseUrl}/${cleanPath}`;

    return fullUrl;
  };

  // Fetch services
  const fetchServices = useCallback(async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const response = await getAllServices();
      console.log('Services API Response:', response);

      if (response && response.services_list) {
        setServices(response.services_list);
        filterServices(response.services_list, activeTab, searchQuery);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
      Alert.alert('Error', 'Unable to load services. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing, activeTab, searchQuery, filterServices]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  // Filter services based on status and search
  const filterServices = useCallback((servicesList, tab, query) => {
    let filtered = servicesList;

    // Filter by status
    if (tab === 'active') {
      filtered = filtered.filter(service => service.service_status === true);
    } else if (tab === 'inactive') {
      filtered = filtered.filter(service => service.service_status === false);
    }

    // Filter by search query
    if (query.trim()) {
      filtered = filtered.filter(
        service =>
          service.service_title?.toLowerCase().includes(query.toLowerCase()) ||
          service.service_description
            ?.toLowerCase()
            .includes(query.toLowerCase()) ||
          service.service_location
            ?.toLowerCase()
            .includes(query.toLowerCase()) ||
          service.service_tags?.some(tag =>
            tag.toLowerCase().includes(query.toLowerCase()),
          ),
      );
    }

    setFilteredServices(filtered);
  }, []);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchServices();
  }, [fetchServices]);

  // Search functionality

  // Tab change
  const handleTabChange = useCallback(
    tab => {
      setActiveTab(tab);
      filterServices(services, tab, searchQuery);
    },
    [services, searchQuery, filterServices],
  );

  // Handle service actions
  const handleServiceAction = service => {
    setSelectedService(service);
    setActionModalVisible(true);
  };

  // Handle edit service
  const handleEditService = () => {
    setActionModalVisible(false);
    navigation.navigate('EditServiceScreen', {
      serviceId: selectedService.id,
      serviceData: selectedService,
    });
  };

  // Handle delete service
  const handleDeleteService = () => {
    setActionModalVisible(false);
    setDeleteModalVisible(true);
  };

  const onConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteService({service_id: selectedService.id});
      setDeleteModalVisible(false);
      Alert.alert('Success', 'Service deleted successfully');
      await fetchServices(); // Refresh the list
    } catch (error) {
      console.error('Delete service failed:', error);
      Alert.alert('Error', 'Failed to delete service. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle view service details
  const handleViewService = service => {
    navigation.navigate('ServiceDetailScreen', {
      serviceId: service.id,
      serviceData: service,
    });
  };

  // Render service tags
  const renderServiceTags = service => {
    if (!service.service_tags || service.service_tags.length === 0) {
      return <Text style={styles.noTagsText}>No tags</Text>;
    }

    return service.service_tags.slice(0, 2).map((tag, index) => (
      <Text key={index} style={styles.tagText} numberOfLines={1}>
        {tag}
      </Text>
    ));
  };

  // Render rating
  const renderRating = rating => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);

    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          size={12}
          color={i < fullStars ? '#FFD700' : colors.textSecondary}
          fill={i < fullStars ? '#FFD700' : 'transparent'}
        />,
      );
    }

    return (
      <View style={styles.ratingContainer}>
        <View style={styles.starsContainer}>{stars}</View>
        <Text style={styles.ratingText}>
          {rating ? rating.toFixed(1) : '0.0'}
        </Text>
      </View>
    );
  };

  // Render service item for grid view
  const renderServiceGridItem = ({item}) => {
    const serviceImage =
      item.service_images && item.service_images[0]
        ? item.service_images[0]
        : null;

    return (
      <TouchableOpacity
        style={styles.gridCard}
        onPress={() => {
          console.log('➡️ Navigating to detail for:', item);
          handleViewService(item);
        }}
        activeOpacity={0.7}>
        <View style={styles.gridImageContainer}>
          {serviceImage ? (
            <Image
              source={{uri: getFullImageUrl(serviceImage)}}
              style={styles.gridImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.gridPlaceholder}>
              <Package color={colors.textSecondary} size={24} />
            </View>
          )}
          <TouchableOpacity
            style={styles.gridActionButton}
            onPress={() => handleServiceAction(item)}>
            <MoreVertical color={colors.text} size={16} />
          </TouchableOpacity>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: item.service_status
                  ? colors.splashGreen + '20'
                  : '#F44336' + '20',
              },
            ]}>
            <Text
              style={[
                styles.statusText,
                {
                  color: item.service_status ? colors.splashGreen : '#F44336',
                },
              ]}>
              {item.service_status ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <View style={styles.gridContent}>
          <Text style={styles.gridTitle} numberOfLines={2}>
            {item.service_title || 'Untitled Service'}
          </Text>

          {item.service_location && (
            <View style={styles.locationContainer}>
              <MapPin color={colors.textSecondary} size={12} />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.service_location}
              </Text>
            </View>
          )}

          {renderRating(item.rating)}

          <View style={styles.gridTags}>{renderServiceTags(item)}</View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render service item for list view
  const renderServiceListItem = ({item}) => {
    const serviceImage =
      item.service_images && item.service_images[0]
        ? item.service_images[0]
        : null;

    return (
      <TouchableOpacity
        style={styles.listCard}
        onPress={() => handleViewService(item)}
        activeOpacity={0.7}>
        <View style={styles.listImageContainer}>
          {serviceImage ? (
            <Image
              source={{uri: getFullImageUrl(serviceImage)}}
              style={styles.listImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.listPlaceholder}>
              <Package color={colors.textSecondary} size={20} />
            </View>
          )}
        </View>

        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle} numberOfLines={1}>
              {item.service_title || 'Untitled Service'}
            </Text>
            <TouchableOpacity
              style={styles.listActionButton}
              onPress={() => handleServiceAction(item)}>
              <MoreVertical color={colors.text} size={16} />
            </TouchableOpacity>
          </View>

          {item.service_location && (
            <View style={styles.locationContainer}>
              <MapPin color={colors.textSecondary} size={12} />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.service_location}
              </Text>
            </View>
          )}

          {renderRating(item.rating)}

          <View style={styles.listTags}>{renderServiceTags(item)}</View>

          <View style={styles.listFooter}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: item.service_status
                    ? colors.splashGreen + '20'
                    : '#F44336' + '20',
                },
              ]}>
              <Text
                style={[
                  styles.statusText,
                  {
                    color: item.service_status ? colors.splashGreen : '#F44336',
                  },
                ]}>
                {item.service_status ? 'Active' : 'Inactive'}
              </Text>
            </View>
            <ChevronRight color={colors.textSecondary} size={16} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Get tab counts
  const getTabCounts = () => {
    const activeCount = services.filter(s => s.service_status === true).length;
    const inactiveCount = services.filter(
      s => s.service_status === false,
    ).length;
    const allCount = services.length;

    return {active: activeCount, inactive: inactiveCount, all: allCount};
  };

  const tabCounts = getTabCounts();

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

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Services</Text>
          <Text style={styles.headerSubtitle}>
            {filteredServices.length} service
            {filteredServices.length !== 1 ? 's' : ''}
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
            onPress={() => navigation.navigate('AddServiceScreen')}>
            <Plus color={colors.text} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color={colors.textSecondary} size={20} />
          <Text style={styles.searchInput}>Search services...</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => handleTabChange('all')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'all' && styles.activeTabText,
              ]}>
              All ({tabCounts.all})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.activeTab]}
            onPress={() => handleTabChange('active')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'active' && styles.activeTabText,
              ]}>
              Active ({tabCounts.active})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'inactive' && styles.activeTab]}
            onPress={() => handleTabChange('inactive')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'inactive' && styles.activeTabText,
              ]}>
              Inactive ({tabCounts.inactive})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Services List/Grid */}
      {filteredServices.length === 0 ? (
        <View style={[styles.container, styles.centered]}>
          <Package color={colors.textSecondary} size={48} />
          <Text style={styles.emptyTitle}>No Services Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try adjusting your search'
              : 'Create your first service to get started'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('AddServiceScreen')}>
              <Text style={styles.createButtonText}>Create Service</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredServices}
          renderItem={
            viewMode === 'grid' ? renderServiceGridItem : renderServiceListItem
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
              <Text style={styles.modalTitle}>Service Actions</Text>
              <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={() => {
                setActionModalVisible(false);
                handleViewService(selectedService);
              }}>
              <Eye color={colors.text} size={20} style={styles.actionIcon} />
              <Text style={styles.actionText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={handleEditService}>
              <Pencil color={colors.text} size={20} style={styles.actionIcon} />
              <Text style={styles.actionText}>Edit Service</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={handleDeleteService}>
              <Trash2 color="#F44336" size={20} style={styles.actionIcon} />
              <Text style={[styles.actionText, styles.deleteActionText]}>
                Delete Service
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
        itemName={selectedService?.service_title || 'this service'}
        itemType="Service"
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

  // Tabs
  tabsContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F8F9FA',
  },
  activeTab: {
    backgroundColor: colors.splashGreen,
  },
  tabText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },
  activeTabText: {
    color: colors.background,
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
  },
  gridImageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridPlaceholder: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridActionButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
  },
  gridContent: {
    padding: 12,
  },
  gridTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  locationText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  gridTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
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
  listImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  listImage: {
    width: '100%',
    height: '100%',
  },
  listPlaceholder: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
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
  listTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    gap: 4,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Common Styles
  tagText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  noTagsText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontStyle: 'italic',
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

export default ServicesScreen;
