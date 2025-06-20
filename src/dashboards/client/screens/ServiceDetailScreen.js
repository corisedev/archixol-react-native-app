import React, {useState, useCallback, useContext, useRef} from 'react';
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
  Linking,
} from 'react-native';
import {
  ArrowLeft,
  Heart,
  Bookmark,
  Phone,
  Star,
  MapPin,
  Briefcase,
  CheckCircle,
  DollarSign,
  Clock,
  HardHat,
  ListChecks,
  Share2,
  MessageCircle,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {getService} from '../../../api/client';
import {useNavigation, useFocusEffect, useRoute} from '@react-navigation/native';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../context/BackendContext';

const {width: screenWidth} = Dimensions.get('window');

// Transform slug to title function
const transformSlugToTitle = (slug) => {
  if (!slug) return '';
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Image Gallery Component
const ImageGallery = ({images}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef(null);
  const {backendUrl} = useContext(BackendContext);
  const BASE_IMAGE_URL = backendUrl || VITE_API_BASE_URL;

  const getFullImageUrl = relativePath => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;
    return `${BASE_IMAGE_URL}${relativePath}`;
  };

  const handleScroll = event => {
    const contentOffset = event.nativeEvent.contentOffset;
    const imageIndex = Math.round(contentOffset.x / screenWidth);
    setActiveIndex(imageIndex);
  };

  if (!images || images.length === 0) {
    return (
      <View style={styles.noImagesContainer}>
        <Text style={styles.noImagesText}>No images available</Text>
      </View>
    );
  }

  return (
    <View style={styles.imageGalleryContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}>
        {images.map((image, index) => (
          <Image
            key={index}
            source={{uri: getFullImageUrl(image)}}
            style={styles.serviceMainImage}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
      
      {images.length > 1 && (
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
        fill={i < fullStars ? "#FFA500" : "transparent"}
      />
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

// Expandable Section Component
const ExpandableSection = ({title, children, icon}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.expandableSection}>
      <TouchableOpacity
        style={styles.expandableHeader}
        onPress={() => setIsExpanded(!isExpanded)}>
        <View style={styles.expandableHeaderLeft}>
          {icon}
          <Text style={styles.expandableHeaderTitle}>{title}</Text>
        </View>
        <Text style={styles.expandableIcon}>{isExpanded ? '−' : '+'}</Text>
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.expandableContent}>{children}</View>
      )}
    </View>
  );
};

// Stats Card Component
const StatsCard = ({service}) => {
  const stats = [
    {
      icon: <ListChecks color={colors.splashGreen} size={20} />,
      label: 'Total Requests',
      value: service?.total_job_requests || 0,
    },
    {
      icon: <CheckCircle color={colors.splashGreen} size={20} />,
      label: 'Completed Jobs',
      value: service?.total_jobs_completed || 0,
    },
    {
      icon: <Clock color={colors.splashGreen} size={20} />,
      label: 'Pending Jobs',
      value: service?.total_pending_jobs || 0,
    },
  ];

  return (
    <View style={styles.statsCard}>
      <Text style={styles.statsCardTitle}>Service Stats</Text>
      {stats.map((stat, index) => (
        <View key={index} style={styles.statRow}>
          <View style={styles.statLeft}>
            {stat.icon}
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

// Features List Component
const FeaturesList = ({features}) => {
  if (!features || features.length === 0) return null;

  return (
    <View style={styles.featuresContainer}>
      {features.map((feature, index) => (
        <View key={index} style={styles.featureRow}>
          <CheckCircle color={colors.splashGreen} size={16} />
          <Text style={styles.featureText}>
            {typeof feature === 'string' ? feature : feature.feature}
          </Text>
        </View>
      ))}
    </View>
  );
};

// FAQ Component
const FAQSection = ({faqs}) => {
  if (!faqs || faqs.length === 0) return null;

  return (
    <View style={styles.faqContainer}>
      {faqs.map((faq, index) => (
        <ExpandableSection
          key={index}
          title={faq.question}
          icon={<MessageCircle color={colors.splashGreen} size={16} />}>
          <Text style={styles.faqAnswer}>{faq.answer}</Text>
        </ExpandableSection>
      ))}
    </View>
  );
};

// Tags Component
const TagsList = ({tags}) => {
  if (!tags || tags.length === 0) return null;

  return (
    <View style={styles.tagsContainer}>
      <Text style={styles.tagsTitle}>Tags</Text>
      <View style={styles.tagsWrapper}>
        {tags.map((tag, index) => (
          <View key={index} style={styles.tagBadge}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Main Service Detail Screen
const ServiceDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {serviceId} = route.params;

  // State
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  // Format price
  const formatPrice = price => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0,
    }).format(price || 0);
  };

  // Fetch service details
  const fetchService = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getService({service_id: serviceId});
      
      if (response && response.service) {
        setService(response.service);
      }
    } catch (error) {
      console.error('Failed to load service:', error);
      Alert.alert('Error', 'Unable to load service details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [serviceId]);

  // Load service on screen focus
  useFocusEffect(
    useCallback(() => {
      fetchService();
    }, [fetchService]),
  );

  // Handle contact
  const handleContact = () => {
    Alert.alert(
      'Contact Service Provider',
      `Contact ${service.title} for more information.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Call Now', onPress: () => console.log('Call service provider')},
        {text: 'Message', onPress: () => console.log('Message service provider')},
      ],
    );
  };

  // Handle share
  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out ${service.title} - ${service.about_service || service.description}`,
        title: service.title,
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to share service');
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading service...</Text>
      </View>
    );
  }

  // Error state
  if (!service) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Service not found</Text>
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
        
        <Text style={styles.headerTitle}>Service Details</Text>
        
        <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
          <Share2 color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Service Images */}
        <ImageGallery images={service.images} />

        {/* Service Info */}
        <View style={styles.serviceInfoContainer}>
          {/* Category Badge */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {transformSlugToTitle(service.category) || 'Service'}
            </Text>
          </View>

          {/* Title and Price */}
          <Text style={styles.serviceTitle}>{service.title}</Text>
          
          {service.price > 0 && (
            <View style={styles.priceContainer}>
              <DollarSign color={colors.splashGreen} size={20} />
              <Text style={styles.priceText}>
                Starts from {formatPrice(service.price)}
              </Text>
            </View>
          )}

          {/* Rating */}
          <Rating 
            rating={service.average_rating || service.rating || 0} 
            ratingCount={service.no_of_reviews || 0} 
          />

          {/* Service Meta Info */}
          <View style={styles.serviceMetaContainer}>
            <View style={styles.metaItem}>
              <MapPin color={colors.splashGreen} size={16} />
              <Text style={styles.metaText}>
                {service.location || 'Location not specified'}
              </Text>
            </View>
            
            <View style={styles.metaItem}>
              <Briefcase color={colors.splashGreen} size={16} />
              <Text style={styles.metaText}>
                {transformSlugToTitle(service.category) || 'Service'}
              </Text>
            </View>
            
            <View style={styles.metaItem}>
              <HardHat color={colors.splashGreen} size={16} />
              <Text style={styles.metaText}>
                {service.total_jobs_completed || 0} jobs completed
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleContact}>
              <Phone color={colors.background} size={20} />
              <Text style={styles.contactButtonText}>Contact Now</Text>
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

        {/* About Service */}
        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About this Service</Text>
          <Text style={styles.aboutText}>
            {service.about_service || service.description || 'No description provided.'}
          </Text>
        </View>

        {/* Features */}
        {service.features && service.features.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <FeaturesList features={service.features} />
          </View>
        )}

        {/* Service Stats */}
        <StatsCard service={service} />

        {/* Tags */}
        {service.tags && service.tags.length > 0 && (
          <View style={styles.section}>
            <TagsList tags={service.tags} />
          </View>
        )}

        {/* FAQs */}
        {service.faqs && service.faqs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            <FAQSection faqs={service.faqs} />
          </View>
        )}

        {/* Bottom padding */}
        <View style={styles.bottomPadding} />
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

  // Image Gallery
  imageGalleryContainer: {
    position: 'relative',
  },
  serviceMainImage: {
    width: screenWidth,
    height: screenWidth * 0.6,
    backgroundColor: '#F5F5F5',
  },
  noImagesContainer: {
    width: screenWidth,
    height: screenWidth * 0.6,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImagesText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
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

  // Service Info
  serviceInfoContainer: {
    padding: 16,
  },
  categoryBadge: {
    backgroundColor: colors.splashGreen + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  categoryBadgeText: {
    color: colors.splashGreen,
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    textTransform: 'capitalize',
  },
  serviceTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 12,
    lineHeight: 28,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  priceText: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
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

  // Service Meta
  serviceMetaContainer: {
    marginBottom: 20,
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
    textTransform: 'capitalize',
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.splashGreen,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  contactButtonText: {
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

  // Sections
  section: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 16,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 16,
  },

  // About Section
  aboutSection: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 16,
  },
  aboutText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
    lineHeight: 22,
  },

  // Features
  featuresContainer: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
    lineHeight: 20,
  },

  // Stats Card
  statsCard: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 16,
  },
  statsCardTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statLabel: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  statBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statValue: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.semiBold,
  },

  // Tags
  tagsContainer: {
    gap: 12,
  },
  tagsTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.medium,
  },

  // Expandable Sections
  expandableSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 8,
  },
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  expandableHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  expandableHeaderTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    flex: 1,
  },
  expandableIcon: {
    fontSize: fontSizes.lg,
    color: colors.splashGreen,
    fontFamily: fonts.bold,
  },
  expandableContent: {
    paddingBottom: 12,
    paddingLeft: 24,
  },

  // FAQ
  faqContainer: {
    gap: 8,
  },
  faqAnswer: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    lineHeight: 20,
  },

  // Bottom padding
  bottomPadding: {
    height: 32,
  },
});

export default ServiceDetailScreen;