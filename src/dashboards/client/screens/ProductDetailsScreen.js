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
  Modal,
  TextInput,
  Dimensions,
  Linking,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {getProduct} from '../../../api/client';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useContext} from 'react';
import {BackendContext} from '../../../context/BackendContext';
import {VITE_API_BASE_URL} from '@env';

// Import your icons
import LocationIcon from '../../../assets/images/icons/location.png';
import StarIcon from '../../../assets/images/icons/company.png';
import HeartIcon from '../../../assets/images/icons/company.png';
import CartIcon from '../../../assets/images/icons/company.png';
import ShareIcon from '../../../assets/images/icons/company.png';
import ShippingIcon from '../../../assets/images/icons/company.png';
import WarrantyIcon from '../../../assets/images/icons/company.png';
import ReturnIcon from '../../../assets/images/icons/company.png';

const {width} = Dimensions.get('window');

const ProductDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {productId, product: initialProduct} = route.params;

  // State
  const [loading, setLoading] = useState(!initialProduct);
  const [refreshing, setRefreshing] = useState(false);
  const [productDetails, setProductDetails] = useState(initialProduct || null);
  const [showCartModal, setShowCartModal] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const {backendUrl} = useContext(BackendContext);
  const BASE_IMAGE_URL = backendUrl || VITE_API_BASE_URL;

  // Fetch product details
  const fetchProductDetails = useCallback(async () => {
    try {
      if (!initialProduct) {
        setLoading(true);
      }
      const response = await getProduct({product_id: productId});
      console.log('Product Details Response:', response);
      setProductDetails(response.product || response);

      // Set default variant if available
      if (response.product?.variants && response.product.variants.length > 0) {
        setSelectedVariant(response.product.variants[0]);
      }
    } catch (error) {
      console.error('Failed to load product details:', error);
      Alert.alert('Error', 'Unable to load product details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [productId, initialProduct]);

  const getFullImageUrl = relativePath => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;
    return `${BASE_IMAGE_URL}${relativePath}`;
  };

  // Initial load
  useEffect(() => {
    if (!initialProduct) {
      fetchProductDetails();
    }
  }, [fetchProductDetails, initialProduct]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProductDetails();
    setRefreshing(false);
  }, [fetchProductDetails]);

  // Format currency
  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `Rs ${amount.toLocaleString()}`;
    }
    return `Rs ${amount || '0'}`;
  };

  // Calculate discount percentage
  const getDiscountPercentage = () => {
    if (productDetails?.original_price && productDetails?.price) {
      const discount =
        ((productDetails.original_price - productDetails.price) /
          productDetails.original_price) *
        100;
      return Math.round(discount);
    }
    return 0;
  };

  // Handle add to cart
  const handleAddToCart = () => {
    if (!productDetails.in_stock) {
      Alert.alert('Out of Stock', 'This product is currently out of stock.');
      return;
    }

    setShowCartModal(true);
  };

  // Handle buy now
  const handleBuyNow = () => {
    if (!productDetails.in_stock) {
      Alert.alert('Out of Stock', 'This product is currently out of stock.');
      return;
    }

    Alert.alert('Buy Now', 'Would you like to proceed to checkout?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Continue',
        onPress: () => {
          // Navigate to checkout screen
          Alert.alert('Success', 'Redirecting to checkout...');
        },
      },
    ]);
  };

  // Handle add to cart confirmation
  const confirmAddToCart = () => {
    Alert.alert(
      'Added to Cart',
      `${quantity} ${quantity === 1 ? 'item' : 'items'} added to your cart.`,
    );
    setShowCartModal(false);
    setQuantity(1);
  };

  // Handle favorite toggle
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    Alert.alert(
      isFavorite ? 'Removed from Favorites' : 'Added to Favorites',
      isFavorite
        ? 'Product removed from your favorites.'
        : 'Product added to your favorites.',
    );
  };

  // Handle share
  const handleShare = () => {
    Alert.alert('Share Product', 'Share this product with friends and family.');
  };

  // Render image gallery
  const renderImageGallery = () => {
    const images = productDetails?.images || [];
    if (images.length === 0) {
      return (
        <View style={styles.placeholderImageContainer}>
          <Text style={styles.placeholderImageText}>📦</Text>
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
            setActiveImageIndex(index);
          }}>
          {images.map((image, index) => (
            <TouchableOpacity
              key={index}
              style={styles.imageContainer}
              onPress={() => setShowImageModal(true)}>
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
                  activeImageIndex === index && styles.activeImageIndicator,
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

        {!productDetails.in_stock && (
          <View style={styles.outOfStockBadge}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={toggleFavorite}>
          <Image
            source={HeartIcon}
            style={[styles.favoriteIcon, isFavorite && {tintColor: '#FF4444'}]}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Image source={ShareIcon} style={styles.shareIcon} />
        </TouchableOpacity>
      </View>
    );
  };

  // Render product variants
  const renderVariants = () => {
    const variants = productDetails?.variants || [];
    if (variants.length === 0) return null;

    return (
      <View style={styles.variantsCard}>
        <Text style={styles.sectionTitle}>Available Options</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.variantsContainer}>
            {variants.map((variant, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.variantChip,
                  selectedVariant?.id === variant.id &&
                    styles.selectedVariantChip,
                ]}
                onPress={() => setSelectedVariant(variant)}>
                <Text
                  style={[
                    styles.variantText,
                    selectedVariant?.id === variant.id &&
                      styles.selectedVariantText,
                  ]}>
                  {variant.name}
                </Text>
                {variant.price && (
                  <Text
                    style={[
                      styles.variantPrice,
                      selectedVariant?.id === variant.id &&
                        styles.selectedVariantPrice,
                    ]}>
                    {formatCurrency(variant.price)}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Render specifications
  const renderSpecifications = () => {
    const specs = productDetails?.specifications || [];
    if (specs.length === 0) return null;

    return (
      <View style={styles.specificationsCard}>
        <Text style={styles.sectionTitle}>Specifications</Text>
        <View style={styles.specificationsContainer}>
          {specs.map((spec, index) => (
            <View key={index} style={styles.specificationItem}>
              <Text style={styles.specificationLabel}>{spec.label}</Text>
              <Text style={styles.specificationValue}>{spec.value}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render features
  const renderFeatures = () => {
    const features = productDetails?.features || [];
    if (features.length === 0) return null;

    return (
      <View style={styles.featuresCard}>
        <Text style={styles.sectionTitle}>Key Features</Text>
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Text style={styles.featureBullet}>•</Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render shipping info
  const renderShippingInfo = () => (
    <View style={styles.shippingCard}>
      <Text style={styles.sectionTitle}>Shipping & Returns</Text>
      <View style={styles.shippingInfoContainer}>
        <View style={styles.shippingInfoItem}>
          <Image source={ShippingIcon} style={styles.shippingIcon} />
          <View style={styles.shippingInfoText}>
            <Text style={styles.shippingInfoTitle}>Free Shipping</Text>
            <Text style={styles.shippingInfoSubtitle}>
              On orders over Rs 2,000
            </Text>
          </View>
        </View>

        <View style={styles.shippingInfoItem}>
          <Image source={ReturnIcon} style={styles.shippingIcon} />
          <View style={styles.shippingInfoText}>
            <Text style={styles.shippingInfoTitle}>Easy Returns</Text>
            <Text style={styles.shippingInfoSubtitle}>
              30-day return policy
            </Text>
          </View>
        </View>

        <View style={styles.shippingInfoItem}>
          <Image source={WarrantyIcon} style={styles.shippingIcon} />
          <View style={styles.shippingInfoText}>
            <Text style={styles.shippingInfoTitle}>Warranty</Text>
            <Text style={styles.shippingInfoSubtitle}>
              {productDetails?.warranty || '1 year warranty'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  // Loading state
  if (loading && !productDetails) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading product details...</Text>
      </View>
    );
  }

  if (!productDetails) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <TouchableOpacity style={styles.cartHeaderButton}>
          <Image source={CartIcon} style={styles.cartHeaderIcon} />
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

        {/* Product Info */}
        <View style={styles.productInfoCard}>
          <View style={styles.productTitleRow}>
            <View style={styles.titleSection}>
              <Text style={styles.productTitle}>{productDetails.title}</Text>
              <Text style={styles.productBrand}>{productDetails.brand}</Text>
            </View>
            <View style={styles.stockSection}>
              <Text
                style={[
                  styles.stockStatus,
                  !productDetails.in_stock && styles.outOfStockStatus,
                ]}>
                {productDetails.in_stock ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>
          </View>

          <View style={styles.ratingRow}>
            <View style={styles.ratingContainer}>
              <Image source={StarIcon} style={styles.starIcon} />
              <Text style={styles.ratingText}>
                {productDetails.rating || '0.0'}
              </Text>
              <Text style={styles.reviewsText}>
                ({productDetails.reviews_count || 0} reviews)
              </Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <View style={styles.priceContainer}>
              <Text style={styles.currentPrice}>
                {formatCurrency(selectedVariant?.price || productDetails.price)}
              </Text>
              {productDetails.original_price &&
                productDetails.original_price > productDetails.price && (
                  <Text style={styles.originalPrice}>
                    {formatCurrency(productDetails.original_price)}
                  </Text>
                )}
              {getDiscountPercentage() > 0 && (
                <Text style={styles.discountPercentage}>
                  {getDiscountPercentage()}% OFF
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Variants */}
        {renderVariants()}

        {/* Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.sectionTitle}>Product Description</Text>
          <Text style={styles.descriptionText}>
            {productDetails.description || 'No description available.'}
          </Text>
        </View>

        {/* Features */}
        {renderFeatures()}

        {/* Specifications */}
        {renderSpecifications()}

        {/* Shipping Info */}
        {renderShippingInfo()}

        {/* Seller Info */}
        <View style={styles.sellerCard}>
          <Text style={styles.sectionTitle}>Sold By</Text>
          <View style={styles.sellerInfo}>
            <View style={styles.sellerAvatar}>
              <Text style={styles.sellerAvatarText}>
                {productDetails.seller_name?.charAt(0)?.toUpperCase() || 'S'}
              </Text>
            </View>
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerName}>
                {productDetails.seller_name || 'Seller'}
              </Text>
              <Text style={styles.sellerRating}>
                ⭐ {productDetails.seller_rating || '4.5'} seller rating
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          disabled={!productDetails.in_stock}>
          <Image source={CartIcon} style={styles.actionIcon} />
          <Text style={styles.addToCartButtonText}>Add to Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.buyNowButton,
            !productDetails.in_stock && styles.disabledButton,
          ]}
          onPress={handleBuyNow}
          disabled={!productDetails.in_stock}>
          <Text style={styles.buyNowButtonText}>Buy Now</Text>
        </TouchableOpacity>
      </View>

      {/* Add to Cart Modal */}
      <Modal visible={showCartModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.cartModal}>
            <Text style={styles.modalTitle}>Add to Cart</Text>

            <View style={styles.quantitySection}>
              <Text style={styles.quantityLabel}>Quantity:</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Text style={styles.quantityButtonText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.quantityText}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(quantity + 1)}>
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalPrice}>
                {formatCurrency(
                  (selectedVariant?.price || productDetails.price) * quantity,
                )}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCartModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmAddToCart}>
                <Text style={styles.modalConfirmText}>Add to Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  errorText: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
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
  backBtn: {
    padding: 8,
  },
  backBtnText: {
    color: colors.splashGreen,
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  cartHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartHeaderIcon: {
    width: 20,
    height: 20,
    tintColor: colors.text,
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
  placeholderImageText: {
    fontSize: 80,
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
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeImageIndicator: {
    backgroundColor: colors.background,
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
    fontSize: 12,
    fontWeight: '600',
  },
  outOfStockBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  outOfStockText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteIcon: {
    width: 20,
    height: 20,
    tintColor: colors.textSecondary,
  },
  shareButton: {
    position: 'absolute',
    top: 16,
    right: 64,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareIcon: {
    width: 18,
    height: 18,
    tintColor: colors.textSecondary,
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
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  stockSection: {
    alignItems: 'flex-end',
  },
  stockStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.splashGreen,
    backgroundColor: colors.splashGreen + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  outOfStockStatus: {
    color: '#FF4444',
    backgroundColor: '#FF444420',
  },
  ratingRow: {
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    width: 16,
    height: 16,
    tintColor: '#FFD700',
    marginRight: 6,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 8,
  },
  reviewsText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.splashGreen,
  },
  originalPrice: {
    fontSize: 16,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  discountPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF4444',
    backgroundColor: '#FF444420',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },

  // Variants Card
  variantsCard: {
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
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  variantsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  variantChip: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
  },
  selectedVariantChip: {
    backgroundColor: colors.splashGreen,
  },
  variantText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  selectedVariantText: {
    color: colors.background,
  },
  variantPrice: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  selectedVariantPrice: {
    color: colors.background,
  },

  // Description Card
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
  descriptionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },

  // Features Card
  featuresCard: {
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
  featuresContainer: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureBullet: {
    fontSize: 16,
    color: colors.splashGreen,
    marginRight: 8,
    marginTop: 2,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },

  // Specifications Card
  specificationsCard: {
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
  specificationsContainer: {
    gap: 12,
  },
  specificationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  specificationLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  specificationValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },

  // Shipping Card
  shippingCard: {
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
  shippingInfoContainer: {
    gap: 16,
  },
  shippingInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shippingIcon: {
    width: 24,
    height: 24,
    tintColor: colors.splashGreen,
    marginRight: 12,
  },
  shippingInfoText: {
    flex: 1,
  },
  shippingInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  shippingInfoSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Seller Card
  sellerCard: {
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
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  sellerAvatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.background,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sellerRating: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Bottom Actions
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.splashGreen + '20',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  buyNowButton: {
    flex: 1.5,
    backgroundColor: colors.splashGreen,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  actionIcon: {
    width: 18,
    height: 18,
    tintColor: colors.splashGreen,
  },
  addToCartButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.splashGreen,
  },
  buyNowButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },

  // Cart Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cartModal: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  quantitySection: {
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 12,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  quantityText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    minWidth: 30,
    textAlign: 'center',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.splashGreen,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    alignItems: 'center',
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.background,
  },

  // Back Button (for error state)
  backButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  backButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProductDetailsScreen;
