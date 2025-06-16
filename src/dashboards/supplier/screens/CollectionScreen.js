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
  ShoppingCart,
  ChevronRight,
  Search,
  Filter,
  RefreshCcw,
  Pencil,
  Trash2,
  X,
  Grid3X3,
  List,
} from 'lucide-react-native';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {
  getAllCollections,
  deleteCollection,
} from '../../../api/serviceSupplier';
import {useNavigation} from '@react-navigation/native';
import {useContext} from 'react';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../context/BackendContext';

const CollectionScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [collections, setCollections] = useState([]);
  const [filteredCollections, setFilteredCollections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const navigation = useNavigation();
  const {backendUrl} = useContext(BackendContext);

  // Transform slug to title helper function
  const transformSlugToTitle = slug => {
    if (!slug) return '';
    return slug
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

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

  // Fetch collections
  const fetchCollections = useCallback(async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const response = await getAllCollections();
      console.log('Collections API Response:', response);

      if (response && response.collections) {
        // Transform collections to include products count
        const transformedCollections = response.collections.map(collection => ({
          ...collection,
          productsCount: collection.product_list
            ? collection.product_list.length
            : 0,
        }));

        setCollections(transformedCollections);
        setFilteredCollections(transformedCollections);
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
      Alert.alert('Error', 'Unable to load collections. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCollections();
  }, [fetchCollections]);

  // Search functionality
  const handleSearch = useCallback(
    query => {
      setSearchQuery(query);
      if (!query.trim()) {
        setFilteredCollections(collections);
      } else {
        const filtered = collections.filter(
          collection =>
            collection.title?.toLowerCase().includes(query.toLowerCase()) ||
            collection.description?.toLowerCase().includes(query.toLowerCase()),
        );
        setFilteredCollections(filtered);
      }
    },
    [collections],
  );

  // Handle collection actions
  const handleCollectionAction = collection => {
    setSelectedCollection(collection);
    setActionModalVisible(true);
  };

  // Handle edit collection
  const handleEditCollection = () => {
    setActionModalVisible(false);
    navigation.navigate('EditCollectionScreen', {
      collectionId: selectedCollection.id,
      collectionData: selectedCollection,
    });
  };

  // Handle delete collection
  const handleDeleteCollection = () => {
    setActionModalVisible(false);
    setDeleteModalVisible(true);
  };

  const onConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteCollection({collection_id: selectedCollection.id});
      setDeleteModalVisible(false);
      Alert.alert('Success', 'Collection deleted successfully');
      await fetchCollections(); // Refresh the list
    } catch (error) {
      console.error('Delete collection failed:', error);
      Alert.alert('Error', 'Failed to delete collection. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle view collection details
  const handleViewCollection = collection => {
    navigation.navigate('CollectionDetailScreen', {
      collectionId: collection.id,
      collectionData: collection,
    });
  };

  // Render collection conditions
  const renderCollectionConditions = collection => {
    if (
      collection.collection_type === 'smart' &&
      collection.smart_conditions?.length > 0
    ) {
      return collection.smart_conditions.slice(0, 2).map((condition, index) => (
        <Text key={index} style={styles.conditionText} numberOfLines={1}>
          {transformSlugToTitle(condition.field)}:{' '}
          {transformSlugToTitle(condition.operator)} {condition.value}
        </Text>
      ));
    }
    return <Text style={styles.conditionText}>Manual Collection</Text>;
  };

  // Render collection item for grid view
  const renderCollectionGridItem = ({item}) => {
    const collectionImage = item.collection_images?.[0] || null;

    return (
      <TouchableOpacity
        style={styles.gridCard}
        onPress={() => handleViewCollection(item)}
        activeOpacity={0.7}>
        <View style={styles.gridImageContainer}>
          {collectionImage ? (
            <Image
              source={{uri: getFullImageUrl(collectionImage)}}
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
            onPress={() => handleCollectionAction(item)}>
            <MoreVertical color={colors.text} size={16} />
          </TouchableOpacity>
        </View>

        <View style={styles.gridContent}>
          <Text style={styles.gridTitle} numberOfLines={2}>
            {item.title || 'Untitled Collection'}
          </Text>

          <View style={styles.gridMeta}>
            <Text style={styles.gridProductCount}>
              {item.productsCount} product{item.productsCount !== 1 ? 's' : ''}
            </Text>
            <View
              style={[
                styles.typeChip,
                {
                  backgroundColor:
                    item.collection_type === 'smart'
                      ? colors.splashGreen + '20'
                      : '#FFC107' + '20',
                },
              ]}>
              <Text
                style={[
                  styles.typeText,
                  {
                    color:
                      item.collection_type === 'smart'
                        ? colors.splashGreen
                        : '#FFC107',
                  },
                ]}>
                {item.collection_type === 'smart' ? 'Smart' : 'Manual'}
              </Text>
            </View>
          </View>

          <View style={styles.gridConditions}>
            {renderCollectionConditions(item)}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render collection item for list view
  const renderCollectionListItem = ({item}) => {
    const collectionImage = item.collection_images?.[0] || null;

    return (
      <TouchableOpacity
        style={styles.listCard}
        onPress={() => handleViewCollection(item)}
        activeOpacity={0.7}>
        <View style={styles.listImageContainer}>
          {collectionImage ? (
            <Image
              source={{uri: getFullImageUrl(collectionImage)}}
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
              {item.title || 'Untitled Collection'}
            </Text>
            <TouchableOpacity
              style={styles.listActionButton}
              onPress={() => handleCollectionAction(item)}>
              <MoreVertical color={colors.text} size={16} />
            </TouchableOpacity>
          </View>

          <Text style={styles.listProductCount}>
            {item.productsCount} product{item.productsCount !== 1 ? 's' : ''}
          </Text>

          <View style={styles.listConditions}>
            {renderCollectionConditions(item)}
          </View>

          <View style={styles.listFooter}>
            <View
              style={[
                styles.typeChip,
                {
                  backgroundColor:
                    item.collection_type === 'smart'
                      ? colors.splashGreen + '20'
                      : '#FFC107' + '20',
                },
              ]}>
              <Text
                style={[
                  styles.typeText,
                  {
                    color:
                      item.collection_type === 'smart'
                        ? colors.splashGreen
                        : '#FFC107',
                  },
                ]}>
                {item.collection_type === 'smart' ? 'Smart' : 'Manual'}
              </Text>
            </View>
            <ChevronRight color={colors.textSecondary} size={16} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading && collections.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading collections...</Text>
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
          <Text style={styles.headerTitle}>Collections</Text>
          <Text style={styles.headerSubtitle}>
            {filteredCollections.length} collection
            {filteredCollections.length !== 1 ? 's' : ''}
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
            onPress={() => navigation.navigate('CreateCollectionScreen')}>
            <Plus color={colors.text} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color={colors.textSecondary} size={20} />
          <Text style={styles.searchInput}>Search collections...</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      {/* Collections List/Grid */}
      {filteredCollections.length === 0 ? (
        <View style={[styles.container, styles.centered]}>
          <Package color={colors.textSecondary} size={48} />
          <Text style={styles.emptyTitle}>No Collections Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try adjusting your search'
              : 'Create your first collection to get started'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => navigation.navigate('CreateCollectionScreen')}>
              <Text style={styles.createButtonText}>Create Collection</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredCollections}
          renderItem={
            viewMode === 'grid'
              ? renderCollectionGridItem
              : renderCollectionListItem
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
              <Text style={styles.modalTitle}>Collection Actions</Text>
              <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={() => {
                setActionModalVisible(false);
                handleViewCollection(selectedCollection);
              }}>
              <Package
                color={colors.text}
                size={20}
                style={styles.actionIcon}
              />
              <Text style={styles.actionText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={handleEditCollection}>
              <Pencil color={colors.text} size={20} style={styles.actionIcon} />
              <Text style={styles.actionText}>Edit Collection</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={handleDeleteCollection}>
              <Trash2 color="#F44336" size={20} style={styles.actionIcon} />
              <Text style={[styles.actionText, styles.deleteActionText]}>
                Delete Collection
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
        itemName={selectedCollection?.title || 'this collection'}
        itemType="Collection"
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
  gridContent: {
    padding: 12,
  },
  gridTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 6,
  },
  gridMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridProductCount: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  gridConditions: {
    gap: 2,
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
  listProductCount: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 6,
  },
  listConditions: {
    marginBottom: 8,
    gap: 2,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Common Styles
  typeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
  },
  conditionText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
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

export default CollectionScreen;
