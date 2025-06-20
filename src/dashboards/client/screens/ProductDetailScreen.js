import {useState, useCallback, useContext, useRef} from 'react';
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
  Share,
} from 'react-native';
import {
  ArrowLeft,
  Heart,
  Bookmark,
  ShoppingBag,
  Star,
  Plus,
  Minus,
  Share2,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {getProduct} from '../../../api/client';
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../context/BackendContext';

const {width: screenWidth} = Dimensions.get('window');

// Image Carousel Component
const ImageCarousel = ({images}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const {backendUrl} = useContext(BackendContext);
  const BASE_IMAGE_URL = backendUrl || VITE_API_BASE_URL;

  const getFullImageUrl = relativePath => {
    if (!relativePath) {
      return null;
    }
    if (relativePath.startsWith('http')) {
      return relativePath;
    }
    return `${BASE_IMAGE_URL}${relativePath}`;
  };

  const handleScroll = event => {
    const contentOffset = event.nativeEvent.contentOffset;
    const imageIndex = Math.round(contentOffset.x / screenWidth);
    setActiveIndex(imageIndex);
  };

  return (
    <View style={styles.imageCarouselContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}>
        {images?.map((image, index) => (
          <Image
            key={index}
            source={{uri: getFullImageUrl(image)}}
            style={styles.productMainImage}
            resizeMode="cover"
          />
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      {images?.length > 1 && (
        <View style={styles.paginationContainer}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === activeIndex && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// Quantity Input Component
const QuantityInput = ({quantity, onChange, min = 1, max = 99}) => {
  const handleDecrease = () => {
    if (quantity > min) {
      onChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < max) {
      onChange(quantity + 1);
    }
  };

  return (
    <View style={styles.quantityContainer}>
      <Text style={styles.quantityLabel}>Quantity</Text>
      <View style={styles.quantityControls}>
        <TouchableOpacity
          style={[
            styles.quantityButton,
            quantity <= min && styles.quantityButtonDisabled,
          ]}
          onPress={handleDecrease}
          disabled={quantity <= min}>
          <Minus
            color={quantity <= min ? colors.textSecondary : colors.text}
            size={16}
          />
        </TouchableOpacity>

        <View style={styles.quantityDisplay}>
          <Text style={styles.quantityText}>{quantity}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.quantityButton,
            quantity >= max && styles.quantityButtonDisabled,
          ]}
          onPress={handleIncrease}
          disabled={quantity >= max}>
          <Plus
            color={quantity >= max ? colors.textSecondary : colors.text}
            size={16}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Rating Component
const Rating = ({rating, ratingCount}) => {
  const stars = [];
  const fullStars = Math.floor(rating);

  for (let i = 0; i < 5; i++) {
    stars.push(
      <Star
        key={i}
        size={16}
        color="#FFA500"
        fill={i < fullStars ? '#FFA500' : 'transparent'}
      />,
    );
  }

  return (
    <View style={styles.ratingContainer}>
      <View style={styles.starsContainer}>{stars}</View>
      <Text style={styles.ratingText}>
        {rating} ({ratingCount} reviews)
      </Text>
    </View>
  );
};

// Tab Component
const TabSection = ({activeTab, setActiveTab, product}) => {
  const tabs = [
    {id: 'description', label: 'Description'},
    {id: 'specifications', label: 'Specifications'},
    {id: 'reviews', label: 'Reviews'},
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'description':
        return (
          <Text style={styles.tabContentText}>
            {product?.description ||
              product?.meta_description ||
              'No description available.'}
          </Text>
        );
      case 'specifications':
        return (
          <View style={styles.specificationsContainer}>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Brand:</Text>
              <Text style={styles.specValue}>{product?.brand || 'N/A'}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Category:</Text>
              <Text style={styles.specValue}>{product?.category || 'N/A'}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specLabel}>Stock:</Text>
              <Text style={styles.specValue}>{product?.stock || 'N/A'}</Text>
            </View>
          </View>
        );
      case 'reviews':
        return (
          <View style={styles.reviewsContainer}>
            <Text style={styles.noReviewsText}>No reviews yet</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.tabSection}>
      <View style={styles.tabHeaders}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabHeader,
              activeTab === tab.id && styles.tabHeaderActive,
            ]}
            onPress={() => setActiveTab(tab.id)}>
            <Text
              style={[
                styles.tabHeaderText,
                activeTab === tab.id && styles.tabHeaderTextActive,
              ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.tabContent}>{renderTabContent()}</View>
    </View>
  );
};

// Main Product Detail Screen
const ProductDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {productId} = route.params;

  // State
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState('description');

  // Format price
  const formatPrice = price => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  // Fetch product details
  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getProduct({product_id: productId});

      if (response && response.product) {
        setProduct(response.product);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      Alert.alert('Error', 'Unable to load product details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Load product on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchProduct();
    }, [fetchProduct]),
  );

  // Handle add to cart
  const handleAddToCart = () => {
    // Add to cart logic here
    Alert.alert(
      'Added to Cart',
      `${product.title} has been added to your cart.`,
    );
  };

  // Handle share
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${product.title} - ${formatPrice(
          product.discounted_price || product.price,
        )}`,
        title: product.title,
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to share product');
    }
  };

  // Calculate discount percentage
  const discountPercentage = product?.discounted_price
    ? Math.round(
        ((product.price - product.discounted_price) / product.price) * 100,
      )
    : 0;

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading product...</Text>
      </View>
    );
  }

  // Error state
  if (!product) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Product not found</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
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

        <Text style={styles.headerTitle}>Product Details</Text>

        <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
          <Share2 color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        {/* Product Images */}
        <ImageCarousel images={product.images} />

        {/* Product Info */}
        <View style={styles.productInfoContainer}>
          {/* Category */}
          <Text style={styles.productCategory}>{product.category}</Text>

          {/* Title */}
          <Text style={styles.productTitle}>{product.title}</Text>

          {/* Rating */}
          <Rating rating={product.rating || 4} ratingCount={399} />

          {/* Price */}
          <View style={styles.priceContainer}>
            {product.discounted_price ? (
              <>
                <Text style={styles.discountedPrice}>
                  {formatPrice(product.discounted_price)}
                </Text>
                <Text style={styles.originalPrice}>
                  {formatPrice(product.price)}
                </Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    -{discountPercentage}%
                  </Text>
                </View>
              </>
            ) : (
              <Text style={styles.productPrice}>
                {formatPrice(product.price)}
              </Text>
            )}
          </View>

          {/* Description */}
          <Text style={styles.productDescription}>
            {product.meta_description}
          </Text>

          {/* Quantity Selector */}
          <QuantityInput quantity={quantity} onChange={setQuantity} />

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.addToCartButton}
              onPress={handleAddToCart}>
              <ShoppingBag color={colors.background} size={20} />
              <Text style={styles.addToCartText}>Add to Cart</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => setIsFavorite(!isFavorite)}>
              <Heart
                color={isFavorite ? colors.splashGreen : colors.text}
                fill={isFavorite ? colors.splashGreen : 'transparent'}
                size={20}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bookmarkButton}
              onPress={() => setIsBookmarked(!isBookmarked)}>
              <Bookmark
                color={isBookmarked ? colors.splashGreen : colors.text}
                fill={isBookmarked ? colors.splashGreen : 'transparent'}
                size={20}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs Section */}
        <TabSection
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          product={product}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
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
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },

  // Image Carousel
  imageCarouselContainer: {
    position: 'relative',
  },
  productMainImage: {
    width: screenWidth,
    height: screenWidth,
    backgroundColor: '#F5F5F5',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  paginationDotActive: {
    backgroundColor: colors.splashGreen,
  },

  // Product Info
  productInfoContainer: {
    padding: 16,
  },
  productCategory: {
    fontSize: fontSizes.sm,
    color: colors.splashGreen,
    fontFamily: fonts.medium,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  productTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 12,
    lineHeight: 28,
  },
  productDescription: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    lineHeight: 22,
    marginBottom: 20,
  },

  // Rating
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Price
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  discountedPrice: {
    fontSize: fontSizes.xxl,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  originalPrice: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  productPrice: {
    fontSize: fontSizes.xxl,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  discountBadge: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: colors.background,
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
  },

  // Quantity
  quantityContainer: {
    marginBottom: 24,
  },
  quantityLabel: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  quantityButtonDisabled: {
    backgroundColor: '#F5F5F5',
  },
  quantityDisplay: {
    width: 60,
    height: 40,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  quantityText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  addToCartButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.splashGreen,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  addToCartText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
  },
  favoriteButton: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  bookmarkButton: {
    width: 48,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },

  // Tabs
  tabSection: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  tabHeaders: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    marginBottom: 20,
  },
  tabHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabHeaderActive: {
    borderBottomColor: colors.splashGreen,
  },
  tabHeaderText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  tabHeaderTextActive: {
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },
  tabContent: {
    minHeight: 100,
  },
  tabContentText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
    lineHeight: 22,
  },

  // Specifications
  specificationsContainer: {
    gap: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  specLabel: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  specValue: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  // Reviews
  reviewsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noReviewsText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
});

export default ProductDetailScreen;
