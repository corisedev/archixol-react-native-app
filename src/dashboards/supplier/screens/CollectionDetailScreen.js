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
  MoreVertical,
  Package,
  ChevronRight,
  Pencil,
  Trash2,
  X,
  Calendar,
  Layers,
  Grid3X3,
  List,
  Eye,
} from 'lucide-react-native';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {getCollection, deleteCollection} from '../../../api/serviceSupplier';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useContext} from 'react';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../context/BackendContext';

const CollectionDetailScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [collection, setCollection] = useState(null);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  const navigation = useNavigation();
  const route = useRoute();
  const {collectionId, collectionData} = route.params;
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

  // Fetch collection details
  const fetchCollectionDetails = useCallback(async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      let response;
      if (collectionData) {
        // If we have collection data from route params, use it
        response = {collection: collectionData};
      } else {
        // Otherwise fetch from API
        response = await getCollection({collection_id: collectionId});
      }

      console.log('Collection Detail API Response:', response);

      if (response && response.collection) {
        setCollection(response.collection);
      }
    } catch (error) {
      console.error('Failed to load collection details:', error);
      Alert.alert(
        'Error',
        'Unable to load collection details. Please try again.',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [collectionId, collectionData, refreshing]);

  useEffect(() => {
    fetchCollectionDetails();
  }, [fetchCollectionDetails]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCollectionDetails();
  }, [fetchCollectionDetails]);

  // Handle collection edit
  const handleEditCollection = () => {
    setActionModalVisible(false);
    navigation.navigate('EditCollectionScreen', {
      collectionId: collection.id,
      collectionData: collection,
    });
  };

  // Handle collection delete
  const handleDeleteCollection = () => {
    setActionModalVisible(false);
    setDeleteModalVisible(true);
  };

  const onConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteCollection({collection_id: collection.id});
      setDeleteModalVisible(false);
      Alert.alert('Success', 'Collection deleted successfully', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
    } catch (error) {
      console.error('Delete collection failed:', error);
      Alert.alert('Error', 'Failed to delete collection. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Format date
  const formatDate = dateString => {
    if (!dateString) {
      return 'N/A';
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }

      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get collection products
  const getCollectionProducts = collectionObj => {
    if (!collectionObj) {
      return [];
    }

    // Check different possible field names
    if (collectionObj.products && Array.isArray(collectionObj.products)) {
      return collectionObj.products;
    }
    if (
      collectionObj.product_list &&
      Array.isArray(collectionObj.product_list)
    ) {
      return collectionObj.product_list;
    }

    return [];
  };

  // Get collection type badge color
  const getCollectionTypeColor = type => {
    switch (type?.toLowerCase()) {
      case 'smart':
        return colors.splashGreen;
      case 'manual':
        return '#2196F3';
      default:
        return colors.textSecondary;
    }
  };

  // Render collection conditions
  const renderCollectionConditions = collection => {
    if (
      collection.collection_type === 'smart' &&
      collection.smart_conditions?.length > 0
    ) {
      return (
        <View style={styles.conditionsContainer}>
          <Text style={styles.subsectionTitle}>Smart Collection Rules</Text>
          <Text style={styles.conditionsOperator}>
            Products must match:{' '}
            {collection.smart_operator === 'all'
              ? 'All conditions'
              : 'Any condition'}
          </Text>

          {collection.smart_conditions.map((condition, index) => (
            <View key={index} style={styles.conditionItem}>
              <Text style={styles.conditionText}>
                <Text style={styles.conditionField}>
                  {transformSlugToTitle(condition.field)}
                </Text>{' '}
                {transformSlugToTitle(condition.operator)}{' '}
                <Text style={styles.conditionValue}>"{condition.value}"</Text>
              </Text>
            </View>
          ))}
        </View>
      );
    }
    return null;
  };

  // Render product item for grid view
  const renderProductGridItem = ({item}) => {
    const productImage = item.media?.[0] || item.image || null;

    return (
      <TouchableOpacity
        style={styles.gridProductCard}
        onPress={() =>
          navigation.navigate('ProductDetailScreen', {productId: item.id})
        }
        activeOpacity={0.7}>
        <View style={styles.gridProductImageContainer}>
          {productImage ? (
            <Image
              source={{uri: getFullImageUrl(productImage)}}
              style={styles.gridProductImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.gridProductPlaceholder}>
              <Package color={colors.textSecondary} size={24} />
            </View>
          )}
        </View>

        <View style={styles.gridProductContent}>
          <Text style={styles.gridProductTitle} numberOfLines={2}>
            {item.title || 'Untitled Product'}
          </Text>

          <Text style={styles.gridProductPrice}>PKR {item.price || '0'}</Text>

          {item.category && (
            <Text style={styles.gridProductCategory} numberOfLines={1}>
              {item.category}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render product item for list view
  const renderProductListItem = ({item}) => {
    const productImage = item.media?.[0] || item.image || null;

    return (
      <TouchableOpacity
        style={styles.listProductCard}
        onPress={() =>
          navigation.navigate('ProductDetailScreen', {productId: item.id})
        }
        activeOpacity={0.7}>
        <View style={styles.listProductImageContainer}>
          {productImage ? (
            <Image
              source={{uri: getFullImageUrl(productImage)}}
              style={styles.listProductImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.listProductPlaceholder}>
              <Package color={colors.textSecondary} size={20} />
            </View>
          )}
        </View>

        <View style={styles.listProductContent}>
          <Text style={styles.listProductTitle} numberOfLines={1}>
            {item.title || 'Untitled Product'}
          </Text>

          {item.category && (
            <Text style={styles.listProductCategory}>{item.category}</Text>
          )}

          <Text style={styles.listProductPrice}>PKR {item.price || '0'}</Text>
        </View>

        <ChevronRight color={colors.textSecondary} size={16} />
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading && !collection) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading collection details...</Text>
      </View>
    );
  }

  if (!collection) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Collection not found</Text>
        <TouchableOpacity
          style={styles.backButtonIconWrapper}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color="#000" size={20} />
        </TouchableOpacity>
      </View>
    );
  }

  const collectionProducts = getCollectionProducts(collection);
  const typeColor = getCollectionTypeColor(collection.collection_type);

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
          <Text style={styles.headerTitle}>{collection.title}</Text>
          <View
            style={[
              styles.headerTypeBadge,
              {backgroundColor: typeColor + '20'},
            ]}>
            <Text style={[styles.headerTypeBadgeText, {color: typeColor}]}>
              {collection.collection_type?.toUpperCase()}
            </Text>
          </View>
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
            onPress={() => setActionModalVisible(true)}>
            <MoreVertical color={colors.text} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Collection Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryHeader}>
            {collection.collection_images &&
              collection.collection_images.length > 0 && (
                <View style={styles.collectionImageContainer}>
                  <Image
                    source={{
                      uri: getFullImageUrl(collection.collection_images[0]),
                    }}
                    style={styles.collectionImage}
                    resizeMode="cover"
                  />
                </View>
              )}

            <View style={styles.summaryContent}>
              <Text style={styles.collectionTitle}>{collection.title}</Text>
              {collection.description && (
                <Text style={styles.collectionDescription} numberOfLines={3}>
                  {collection.description}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Package color={colors.textSecondary} size={20} />
              <View>
                <Text style={styles.statLabel}>Products</Text>
                <Text style={styles.statValue}>
                  {collectionProducts.length}
                </Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <Layers color={colors.textSecondary} size={20} />
              <View>
                <Text style={styles.statLabel}>Type</Text>
                <Text style={[styles.statValue, {color: typeColor}]}>
                  {collection.collection_type?.charAt(0).toUpperCase() +
                    collection.collection_type?.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Smart Collection Rules */}
        {collection.collection_type === 'smart' && (
          <View style={styles.rulesSection}>
            {renderCollectionConditions(collection)}
          </View>
        )}

        {/* SEO Information */}
        {(collection.page_title ||
          collection.meta_description ||
          collection.url_handle) && (
          <View style={styles.seoSection}>
            <Text style={styles.sectionTitle}>SEO Information</Text>

            {collection.page_title && (
              <View style={styles.seoItem}>
                <Text style={styles.seoLabel}>Page Title</Text>
                <Text style={styles.seoValue}>{collection.page_title}</Text>
              </View>
            )}

            {collection.meta_description && (
              <View style={styles.seoItem}>
                <Text style={styles.seoLabel}>Meta Description</Text>
                <Text style={styles.seoValue}>
                  {collection.meta_description}
                </Text>
              </View>
            )}

            {collection.url_handle && (
              <View style={styles.seoItem}>
                <Text style={styles.seoLabel}>URL Handle</Text>
                <Text style={styles.seoValue}>{collection.url_handle}</Text>
              </View>
            )}
          </View>
        )}

        {/* Products Section */}
        <View style={styles.productsSection}>
          <View style={styles.productsSectionHeader}>
            <Text style={styles.sectionTitle}>
              Products ({collectionProducts.length})
            </Text>

            {collectionProducts.length > 0 && (
              <TouchableOpacity
                style={styles.viewModeButton}
                onPress={() =>
                  setViewMode(viewMode === 'grid' ? 'list' : 'grid')
                }>
                {viewMode === 'grid' ? (
                  <List color={colors.text} size={18} />
                ) : (
                  <Grid3X3 color={colors.text} size={18} />
                )}
              </TouchableOpacity>
            )}
          </View>

          {collectionProducts.length === 0 ? (
            <View style={styles.emptyProductsState}>
              <Package color={colors.textSecondary} size={48} />
              <Text style={styles.emptyProductsTitle}>No Products</Text>
              <Text style={styles.emptyProductsSubtitle}>
                {collection.collection_type === 'smart'
                  ? 'No products match the collection rules'
                  : 'No products have been added to this collection'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={collectionProducts}
              renderItem={
                viewMode === 'grid'
                  ? renderProductGridItem
                  : renderProductListItem
              }
              keyExtractor={item => item.id?.toString()}
              numColumns={viewMode === 'grid' ? 2 : 1}
              key={viewMode} // Force re-render when view mode changes
              columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : null}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </ScrollView>

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

            <TouchableOpacity
              style={styles.actionOption}
              onPress={() => {
                setActionModalVisible(false);
                // Navigate to products screen with this collection filter
                navigation.navigate('ProductsScreen', {
                  collectionFilter: collection.id,
                });
              }}>
              <Eye color={colors.text} size={20} style={styles.actionIcon} />
              <Text style={styles.actionText}>View All Products</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={onConfirmDelete}
        itemName={collection.title}
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
  errorText: {
    fontSize: fontSizes.xl,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: fonts.medium,
  },
  backButtonIconWrapper: {
    backgroundColor: '#F0F0F0',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
    flex: 1,
  },
  headerTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  headerTypeBadgeText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Scroll Container
  scrollContainer: {
    flex: 1,
  },

  // Summary Section
  summarySection: {
    backgroundColor: colors.background,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  collectionImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
  },
  collectionImage: {
    width: '100%',
    height: '100%',
  },
  summaryContent: {
    flex: 1,
  },
  collectionTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  collectionDescription: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: 2,
    fontFamily: fonts.regular,
  },
  statValue: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },

  // Rules Section
  rulesSection: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  conditionsContainer: {
    gap: 12,
  },
  conditionsOperator: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 8,
  },
  conditionItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  conditionText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  conditionField: {
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },
  conditionValue: {
    fontFamily: fonts.medium,
    color: colors.text,
  },

  // SEO Section
  seoSection: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  seoItem: {
    marginBottom: 12,
  },
  seoLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  seoValue: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },

  // Products Section
  productsSection: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  productsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  subsectionTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
  },
  viewModeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Grid View Products
  gridRow: {
    justifyContent: 'space-between',
  },
  gridProductCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 12,
    flex: 1,
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  gridProductImageContainer: {
    width: '100%',
    height: 100,
    backgroundColor: '#E0E0E0',
  },
  gridProductImage: {
    width: '100%',
    height: '100%',
  },
  gridProductPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridProductContent: {
    padding: 12,
  },
  gridProductTitle: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  gridProductPrice: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.splashGreen,
    marginBottom: 4,
  },
  gridProductCategory: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // List View Products
  listProductCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  listProductImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
  },
  listProductImage: {
    width: '100%',
    height: '100%',
  },
  listProductPlaceholder: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listProductContent: {
    flex: 1,
  },
  listProductTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 2,
  },
  listProductCategory: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: 4,
    fontFamily: fonts.regular,
  },
  listProductPrice: {
    fontSize: fontSizes.base,
    fontFamily: fonts.bold,
    color: colors.splashGreen,
  },

  // Empty Products State
  emptyProductsState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyProductsTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginTop: 8,
  },
  emptyProductsSubtitle: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: fonts.regular,
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

export default CollectionDetailScreen;
