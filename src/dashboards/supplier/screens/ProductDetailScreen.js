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
  Dimensions,
  Modal,
  RefreshControl,
} from 'react-native';
import {
  ArrowLeft,
  Package,
  MapPin,
  User,
  Tag,
  Folder,
  MoreVertical,
  X,
  RefreshCcw,
  Trash2,
  Edit,
  Heart,
  TrendingUp,
  BarChart3,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {
  getProduct,
  deleteProduct,
  updateProduct,
} from '../../../api/serviceSupplier';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useContext} from 'react';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../context/BackendContext';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';

const {width} = Dimensions.get('window');

const ProductDetailScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [product, setProduct] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [actionsModalVisible, setActionsModalVisible] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const navigation = useNavigation();
  const route = useRoute();
  const {productId} = route.params;
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
    return `${baseUrl}/${cleanPath}`;
  };

  // Fetch product details
  const fetchProductDetails = useCallback(async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      const response = await getProduct({product_id: productId});
      console.log('Product Detail API Response:', response);

      if (response && response.product) {
        setProduct(response.product);
      }
    } catch (error) {
      console.error('Failed to load product details:', error);
      Alert.alert('Error', 'Unable to load product details. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [productId, refreshing]);

  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProductDetails();
  }, [fetchProductDetails]);

  // Handle delete product
  const handleDeleteProduct = () => {
    setDeleteModalVisible(true);
  };

  // Handle status toggle
  const handleStatusToggle = async () => {
    const newStatus = product.status === 'active' ? 'draft' : 'active';

    Alert.alert('Change Status', `Change product status to ${newStatus}?`, [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            await updateProduct({
              product_id: productId,
              status: newStatus,
            });
            setProduct(prev => ({...prev, status: newStatus}));
            Alert.alert('Success', `Product status changed to ${newStatus}`);
          } catch (error) {
            console.error('Status update failed:', error);
            Alert.alert('Error', 'Failed to update status. Please try again.');
          }
        },
      },
    ]);
  };

  // Handle favorite toggle
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
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

  // Calculate discount percentage
  const getDiscountPercentage = () => {
    if (product?.compare_at_price && product?.price) {
      const discount =
        ((product.compare_at_price - product.price) /
          product.compare_at_price) *
        100;
      return Math.round(discount);
    }
    return 0;
  };

  // Render image gallery
  const renderImageGallery = () => {
    const images =
      product?.media && product.media.length > 0 ? product.media : [];

    if (images.length === 0) {
      return (
        <View style={styles.placeholderImageContainer}>
          <Package color={colors.textSecondary} size={80} />
          <Text style={styles.placeholderImageSubtext}>No image available</Text>
        </View>
      );
    }

    return (
      <View style={styles.imageGallery}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={event => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(index);
          }}>
          {images.map((image, index) => (
            <TouchableOpacity
              key={index}
              style={styles.imageContainer}
              onPress={() => setImageModalVisible(true)}>
              <Image
                source={{uri: getFullImageUrl(image)}}
                style={styles.productImage}
                resizeMode="cover"
                onError={() => {
                  console.warn('Image failed to load:', image);
                }}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {images.length > 1 && (
          <View style={styles.imageIndicators}>
            {images.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.imageIndicator,
                  currentImageIndex === index && styles.activeImageIndicator,
                ]}
              />
            ))}
          </View>
        )}

        {getDiscountPercentage() > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{getDiscountPercentage()}%</Text>
          </View>
        )}

        <View
          style={[
            styles.statusBadge,
            {backgroundColor: getStatusColor(product.status)},
          ]}>
          <Text style={styles.statusBadgeText}>
            {product.status?.toUpperCase()}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={toggleFavorite}>
          <Heart
            color={isFavorite ? '#FF4444' : colors.textSecondary}
            size={20}
            fill={isFavorite ? '#FF4444' : 'none'}
          />
        </TouchableOpacity>
      </View>
    );
  };

  // Loading state
  if (loading && !product) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.background} size={20} />
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stockStatus = getStockStatus(product.quantity, product.min_qty);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>
          Product Details
        </Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setActionsModalVisible(true)}>
          <MoreVertical color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        {renderImageGallery()}

        {/* Product Info Card */}
        <View style={styles.productInfoCard}>
          <View style={styles.productTitleRow}>
            <View style={styles.titleSection}>
              <Text style={styles.productTitle}>{product.title}</Text>
              <Text style={styles.productBrand}>
                {product.vendor_name || 'No Brand'}
              </Text>
            </View>
            <View style={styles.stockSection}>
              <Text
                style={[
                  styles.stockStatus,
                  {
                    color: stockStatus.color,
                    backgroundColor: stockStatus.color + '20',
                  },
                ]}>
                {stockStatus.text}
              </Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.currentPrice}>
                {formatCurrency(product.price)}
              </Text>
              {product.compare_at_price &&
                product.compare_at_price > product.price && (
                  <Text style={styles.originalPrice}>
                    {formatCurrency(product.compare_at_price)}
                  </Text>
                )}
              {getDiscountPercentage() > 0 && (
                <Text style={styles.discountPercentage}>
                  {getDiscountPercentage()}% OFF
                </Text>
              )}
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.quickStats}>
            <View style={styles.statItem}>
              <Package color={colors.splashGreen} size={20} />
              <View>
                <Text style={styles.statLabel}>Current Stock</Text>
                <Text style={styles.statNumber}>{product.quantity}</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <BarChart3 color={colors.splashGreen} size={20} />
              <View>
                <Text style={styles.statLabel}>Min Stock</Text>
                <Text style={styles.statNumber}>{product.min_qty}</Text>
              </View>
            </View>

            {product.margin > 0 && (
              <View style={styles.statItem}>
                <TrendingUp color={colors.splashGreen} size={20} />
                <View>
                  <Text style={styles.statLabel}>Margin</Text>
                  <Text
                    style={[styles.statNumber, {color: colors.splashGreen}]}>
                    {product.margin.toFixed(1)}%
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        {product.description && (
          <View style={styles.descriptionCard}>
            <Text style={styles.sectionTitle}>Product Description</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>
        )}

        {/* Product Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Product Details</Text>

          {product.category && (
            <View style={styles.detailItem}>
              <Tag color={colors.textSecondary} size={20} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>
                  {product.category.replace(/_/g, ' ').toUpperCase()}
                </Text>
              </View>
            </View>
          )}

          {product.vendor_name && (
            <View style={styles.detailItem}>
              <User color={colors.textSecondary} size={20} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Vendor</Text>
                <Text style={styles.detailValue}>{product.vendor_name}</Text>
              </View>
            </View>
          )}

          {product.address && (
            <View style={styles.detailItem}>
              <MapPin color={colors.textSecondary} size={20} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>{product.address}</Text>
              </View>
            </View>
          )}

          {product.region && (
            <View style={styles.detailItem}>
              <MapPin color={colors.textSecondary} size={20} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Region</Text>
                <Text style={styles.detailValue}>{product.region}</Text>
              </View>
            </View>
          )}

          {product.search_tags && product.search_tags.length > 0 && (
            <View style={styles.detailItem}>
              <Tag color={colors.textSecondary} size={20} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Tags</Text>
                <View style={styles.tagsContainer}>
                  {product.search_tags.map((tag, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {product.search_collection &&
            product.search_collection.length > 0 && (
              <View style={styles.detailItem}>
                <Folder color={colors.textSecondary} size={20} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Collections</Text>
                  <Text style={styles.detailValue}>
                    {product.search_collection.join(', ')}
                  </Text>
                </View>
              </View>
            )}
        </View>

        {/* Pricing & Inventory */}
        <View style={styles.pricingCard}>
          <Text style={styles.sectionTitle}>Pricing & Inventory</Text>

          <View style={styles.pricingGrid}>
            <View style={styles.pricingItem}>
              <Text style={styles.pricingLabel}>Selling Price</Text>
              <Text style={styles.pricingValue}>
                {formatCurrency(product.price)}
              </Text>
            </View>

            {product.cost_per_item > 0 && (
              <View style={styles.pricingItem}>
                <Text style={styles.pricingLabel}>Cost Price</Text>
                <Text style={styles.pricingValue}>
                  {formatCurrency(product.cost_per_item)}
                </Text>
              </View>
            )}

            {product.profit > 0 && (
              <View style={styles.pricingItem}>
                <Text style={styles.pricingLabel}>Profit</Text>
                <Text
                  style={[styles.pricingValue, {color: colors.splashGreen}]}>
                  {formatCurrency(product.profit)}
                </Text>
              </View>
            )}

            {product.margin > 0 && (
              <View style={styles.pricingItem}>
                <Text style={styles.pricingLabel}>Margin</Text>
                <Text
                  style={[styles.pricingValue, {color: colors.splashGreen}]}>
                  {product.margin.toFixed(1)}%
                </Text>
              </View>
            )}

            <View style={styles.pricingItem}>
              <Text style={styles.pricingLabel}>Current Stock</Text>
              <Text style={styles.pricingValue}>{product.quantity}</Text>
            </View>

            <View style={styles.pricingItem}>
              <Text style={styles.pricingLabel}>Min Stock</Text>
              <Text style={styles.pricingValue}>{product.min_qty}</Text>
            </View>
          </View>
        </View>

        {/* Product Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Product Status</Text>
            <TouchableOpacity
              style={[
                styles.statusToggle,
                {backgroundColor: getStatusColor(product.status)},
              ]}
              onPress={handleStatusToggle}>
              <Text style={styles.statusToggleText}>
                {product.status?.toUpperCase()}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Track Quantity</Text>
            <Text style={styles.settingValue}>
              {product.track_quantity ? 'Yes' : 'No'}
            </Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Continue when out of stock</Text>
            <Text style={styles.settingValue}>
              {product.continue_out_of_stock ? 'Yes' : 'No'}
            </Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Physical Product</Text>
            <Text style={styles.settingValue}>
              {product.physical_product ? 'Yes' : 'No'}
            </Text>
          </View>

          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Tax</Text>
            <Text style={styles.settingValue}>
              {product.tax ? 'Yes' : 'No'}
            </Text>
          </View>

          {product.weight && parseFloat(product.weight) > 0 && (
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Weight</Text>
              <Text style={styles.settingValue}>
                {product.weight} {product.units || 'kg'}
              </Text>
            </View>
          )}

          {product.hs_code && (
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>HS Code</Text>
              <Text style={styles.settingValue}>{product.hs_code}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}>
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setImageModalVisible(false)}>
            <X color={colors.background} size={20} />
          </TouchableOpacity>

          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={event => {
              const newIndex = Math.round(
                event.nativeEvent.contentOffset.x / width,
              );
              setCurrentImageIndex(newIndex);
            }}>
            {product.media.map((image, index) => (
              <Image
                key={index}
                source={{uri: getFullImageUrl(image)}}
                style={styles.modalImage}
                resizeMode="contain"
              />
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Actions Modal */}
      <Modal
        visible={actionsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setActionsModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.actionsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Product Actions</Text>
              <TouchableOpacity onPress={() => setActionsModalVisible(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={() => {
                setActionsModalVisible(false);
                navigation.navigate('EditProductScreen', {
                  productId: product.id,
                });
              }}>
              <Edit color={colors.text} size={20} />
              <Text style={styles.actionText}>Edit Product</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={() => {
                setActionsModalVisible(false);
                handleStatusToggle();
              }}>
              <RefreshCcw color={colors.text} size={20} />
              <Text style={styles.actionText}>Toggle Status</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionOption, styles.deleteAction]}
              onPress={() => {
                setActionsModalVisible(false);
                handleDeleteProduct();
              }}>
              <Trash2 color="#F44336" size={20} />
              <Text style={[styles.actionText, styles.deleteActionText]}>
                Delete Product
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        itemName={product?.title}
        loading={deleting}
        itemType="Product"
        onConfirm={async () => {
          setDeleting(true);
          try {
            await deleteProduct({product_id: productId});
            setDeleting(false);
            setDeleteModalVisible(false);
            Alert.alert('Deleted', 'Product deleted successfully');
            navigation.goBack();
          } catch (error) {
            console.error('❌ Delete failed:', error);
            Alert.alert('Error', 'Failed to delete product. Please try again.');
            setDeleting(false);
          }
        }}
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
  headerTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },

  scrollView: {
    flex: 1,
  },

  // Image Gallery
  imageGallery: {
    height: 300,
    position: 'relative',
  },
  imageContainer: {
    width: width,
    height: 300,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImageContainer: {
    height: 300,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderImageSubtext: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    marginTop: 8,
    fontFamily: fonts.regular,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  activeImageIndicator: {
    backgroundColor: colors.splashGreen,
  },
  discountBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: colors.background,
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
  },
  favoriteButton: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Product Info Card
  productInfoCard: {
    backgroundColor: colors.background,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
    marginRight: 16,
  },
  productTitle: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  productBrand: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  stockSection: {
    alignItems: 'flex-end',
  },
  stockStatus: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  currentPrice: {
    fontSize: fontSizes['3xl'],
    fontFamily: fonts.bold,
    color: colors.splashGreen,
  },
  originalPrice: {
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    fontFamily: fonts.regular,
  },
  discountPercentage: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
    color: '#FF4444',
    backgroundColor: '#FF444420',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    gap: 24,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  statNumber: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: 2,
    fontFamily: fonts.regular,
  },

  // Cards
  descriptionCard: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsCard: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pricingCard: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingsCard: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: fontSizes.base,
    color: colors.text,
    lineHeight: 24,
    fontFamily: fonts.regular,
  },

  // Detail Items
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: 4,
    fontFamily: fonts.regular,
  },
  detailValue: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.medium,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.splashGreen + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: fontSizes.xs,
    color: colors.splashGreen,
    fontFamily: fonts.medium,
  },

  // Pricing Grid
  pricingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  pricingItem: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    width: '47%',
  },
  pricingLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: 4,
    fontFamily: fonts.regular,
  },
  pricingValue: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },

  // Settings
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLabel: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  settingValue: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },
  statusToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusToggleText: {
    color: colors.background,
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
  },

  // Back Button (for error state)
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 8,
  },
  backButtonText: {
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
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: width,
    height: width,
  },
  actionsModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
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
  deleteAction: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
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
export default ProductDetailScreen;
