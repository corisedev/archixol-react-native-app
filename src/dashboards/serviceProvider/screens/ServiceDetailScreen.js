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
  Dimensions,
  StatusBar,
} from 'react-native';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Eye,
  ShoppingCart,
  MessageSquare,
  Star,
  Tag,
  CheckCircle,
  MapPin,
  Clock,
  DollarSign,
  Share2,
  Heart,
  MoreVertical,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import DeleteConfirmationModal from '../components/modals/DeleteConfirmationModal';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {
  getService,
  deleteService,
  toggleServiceStatus,
} from '../../../api/serviceSupplier';
import {useRoute, useNavigation} from '@react-navigation/native';
import {useContext} from 'react';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../context/BackendContext';

const {width: screenWidth} = Dimensions.get('window');

const ServiceDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {backendUrl} = useContext(BackendContext);

  const [loading, setLoading] = useState(false);
  const [service, setService] = useState(route.params?.serviceData || null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  const serviceId = route.params?.serviceId || service?.id;

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

  // Fetch service details if not provided
  const fetchServiceDetails = useCallback(async () => {
    if (!serviceId) {
      Alert.alert('Error', 'Service ID not found');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const response = await getService(serviceId);

      if (response && response.service) {
        setService(response.service);
      }
    } catch (error) {
      console.error('Failed to load service details:', error);
      Alert.alert('Error', 'Unable to load service details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [serviceId, navigation]);

  useEffect(() => {
    if (!service && serviceId) {
      fetchServiceDetails();
    }
  }, [service, serviceId, fetchServiceDetails]);

  // Handle edit service
  const handleEditService = () => {
    setActionModalVisible(false);
    navigation.navigate('EditServiceScreen', {
      serviceId: service.id,
      serviceData: service,
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
      await deleteService({service_id: service.id});
      setDeleteModalVisible(false);
      Alert.alert('Success', 'Service deleted successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Delete service failed:', error);
      Alert.alert('Error', 'Failed to delete service. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle toggle service status
  const handleToggleStatus = async () => {
    try {
      const newStatus = !service.service_status;
      await toggleServiceStatus(service.id, newStatus);

      setService(prev => ({
        ...prev,
        service_status: newStatus,
      }));

      Alert.alert(
        'Success',
        `Service ${newStatus ? 'activated' : 'deactivated'} successfully`,
      );
    } catch (error) {
      console.error('Toggle status failed:', error);
      Alert.alert(
        'Error',
        'Failed to update service status. Please try again.',
      );
    }
  };

  // Handle share service
  const handleShare = () => {
    // Implement share functionality
    Alert.alert('Share', 'Share functionality will be implemented here');
  };

  // Handle favorite toggle
  const handleFavoriteToggle = () => {
    setIsFavorited(!isFavorited);
  };

  // Open image gallery
  const openImageGallery = (index = 0) => {
    setCurrentImageIndex(index);
    setImageModalVisible(true);
  };

  // Navigate gallery images
  const navigateImage = direction => {
    const images = service?.service_images || [];
    if (direction === 'next') {
      setCurrentImageIndex(prev => (prev >= images.length - 1 ? 0 : prev + 1));
    } else {
      setCurrentImageIndex(prev => (prev <= 0 ? images.length - 1 : prev - 1));
    }
  };

  // Render rating stars
  const renderRating = rating => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);

    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
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

  // Render service features
  const renderServiceFeatures = () => {
    if (!service?.service_feature || service.service_feature.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Features</Text>
        {service.service_feature.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <CheckCircle color={colors.splashGreen} size={16} />
            <Text style={styles.featureText}>{feature.feature}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Render service process
  const renderServiceProcess = () => {
    if (!service?.service_process || service.service_process.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Process</Text>
        {service.service_process.map((process, index) => (
          <View key={index} style={styles.processItem}>
            <View style={styles.processNumber}>
              <Text style={styles.processNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.processText}>{process.step}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Render service FAQs
  const renderServiceFAQs = () => {
    if (!service?.service_faqs || service.service_faqs.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {service.service_faqs.map((faq, index) => (
          <View key={index} style={styles.faqItem}>
            <Text style={styles.faqQuestion}>{faq.question}</Text>
            <Text style={styles.faqAnswer}>{faq.answer}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Render service tags
  const renderServiceTags = () => {
    if (!service?.service_tags || service.service_tags.length === 0) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Service Tags</Text>
        <View style={styles.tagsContainer}>
          {service.service_tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading && !service) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading service details...</Text>
      </View>
    );
  }

  if (!service) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Service not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const serviceImages = service.service_images || [];

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.background} size={24} />
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton} onPress={handleShare}>
            <Share2 color={colors.background} size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleFavoriteToggle}>
            <Heart
              color={isFavorited ? '#FF6B6B' : colors.background}
              size={20}
              fill={isFavorited ? '#FF6B6B' : 'transparent'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setActionModalVisible(true)}>
            <MoreVertical color={colors.background} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        {/* Service Images */}
        <View style={styles.imageContainer}>
          {serviceImages.length > 0 ? (
            <TouchableOpacity onPress={() => openImageGallery(0)}>
              <Image
                source={{uri: getFullImageUrl(serviceImages[0])}}
                style={styles.mainImage}
                resizeMode="cover"
              />
              {serviceImages.length > 1 && (
                <View style={styles.imageCount}>
                  <Text style={styles.imageCountText}>
                    +{serviceImages.length - 1}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>No Image</Text>
            </View>
          )}
        </View>

        {/* Service Info */}
        <View style={styles.contentContainer}>
          {/* Title and Status */}
          <View style={styles.titleContainer}>
            <Text style={styles.serviceTitle}>{service.service_title}</Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: service.service_status
                    ? colors.splashGreen + '20'
                    : '#F44336' + '20',
                },
              ]}>
              <Text
                style={[
                  styles.statusText,
                  {
                    color: service.service_status
                      ? colors.splashGreen
                      : '#F44336',
                  },
                ]}>
                {service.service_status ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          {/* Service Stats */}
          <View style={styles.statsContainer}>
            {renderRating(service.rating)}

            <View style={styles.statItem}>
              <Eye color={colors.splashGreen} size={16} />
              <Text style={styles.statText}>0 Views</Text>
            </View>

            <View style={styles.statItem}>
              <ShoppingCart color={colors.splashGreen} size={16} />
              <Text style={styles.statText}>0 Orders</Text>
            </View>

            <View style={styles.statItem}>
              <MessageSquare color={colors.splashGreen} size={16} />
              <Text style={styles.statText}>0% Conversion</Text>
            </View>
          </View>

          {/* Location and Category */}
          <View style={styles.metaContainer}>
            {service.service_location && (
              <View style={styles.metaItem}>
                <MapPin color={colors.textSecondary} size={16} />
                <Text style={styles.metaText}>{service.service_location}</Text>
              </View>
            )}

            {service.service_category && (
              <View style={styles.metaItem}>
                <Tag color={colors.textSecondary} size={16} />
                <Text style={styles.metaText}>
                  {service.service_category.replace('_', ' ')}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>
              {service.service_description || 'No description available'}
            </Text>
          </View>

          {/* Service Features */}
          {renderServiceFeatures()}

          {/* Service Process */}
          {renderServiceProcess()}

          {/* Service FAQs */}
          {renderServiceFAQs()}

          {/* Service Tags */}
          {renderServiceTags()}

          {/* Client Reviews */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Client Reviews</Text>
            <Text style={styles.noReviewsText}>No reviews yet.</Text>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={handleEditService}>
          <Edit color={colors.background} size={20} />
          <Text style={styles.actionButtonText}>Edit Service</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.statusButton]}
          onPress={handleToggleStatus}>
          <Text style={styles.actionButtonText}>
            {service.service_status ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
      </View>

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
              onPress={handleEditService}>
              <Edit color={colors.text} size={20} style={styles.actionIcon} />
              <Text style={styles.actionText}>Edit Service</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={handleToggleStatus}>
              <CheckCircle
                color={colors.text}
                size={20}
                style={styles.actionIcon}
              />
              <Text style={styles.actionText}>
                {service.service_status ? 'Deactivate' : 'Activate'} Service
              </Text>
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

      {/* Image Gallery Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}>
        <View style={styles.galleryModalOverlay}>
          <View style={styles.galleryHeader}>
            <TouchableOpacity onPress={() => setImageModalVisible(false)}>
              <X color={colors.background} size={24} />
            </TouchableOpacity>
            <Text style={styles.galleryTitle}>
              {currentImageIndex + 1} of {serviceImages.length}
            </Text>
          </View>

          {serviceImages.length > 0 && (
            <View style={styles.galleryContainer}>
              <Image
                source={{
                  uri: getFullImageUrl(serviceImages[currentImageIndex]),
                }}
                style={styles.galleryImage}
                resizeMode="contain"
              />

              {serviceImages.length > 1 && (
                <>
                  <TouchableOpacity
                    style={[styles.galleryNavButton, styles.galleryNavLeft]}
                    onPress={() => navigateImage('prev')}>
                    <ChevronLeft color={colors.background} size={24} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.galleryNavButton, styles.galleryNavRight]}
                    onPress={() => navigateImage('next')}>
                    <ChevronRight color={colors.background} size={24} />
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={onConfirmDelete}
        itemName={service?.service_title || 'this service'}
        itemType="Service"
        loading={deleteLoading}
      />
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
    textAlign: 'center',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
  },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: StatusBar.currentHeight + 16,
    paddingBottom: 16,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  // Images
  imageContainer: {
    height: 250,
    backgroundColor: '#E0E0E0',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0E0E0',
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
  },
  imageCount: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCountText: {
    color: colors.background,
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
  },

  // Content
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceTitle: {
    flex: 1,
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Meta
  metaContainer: {
    gap: 8,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    textTransform: 'capitalize',
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
    lineHeight: 24,
  },

  // Features
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  featureText: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },

  // Process
  processItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  processNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processNumberText: {
    color: colors.background,
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
  },
  processText: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
    lineHeight: 20,
  },

  // FAQs
  faqItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  faqQuestion: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 6,
  },
  faqAnswer: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    lineHeight: 20,
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
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

  // Reviews
  noReviewsText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    fontStyle: 'italic',
  },

  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  editButton: {
    backgroundColor: colors.splashGreen,
  },
  statusButton: {
    backgroundColor: colors.textSecondary,
  },
  actionButtonText: {
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

  // Gallery Modal
  galleryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: StatusBar.currentHeight + 16,
    paddingBottom: 16,
  },
  galleryTitle: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
  },
  galleryContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryImage: {
    width: screenWidth,
    height: '80%',
  },
  galleryNavButton: {
    position: 'absolute',
    top: '50%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  galleryNavLeft: {
    left: 20,
  },
  galleryNavRight: {
    right: 20,
  },

  bottomSpacing: {
    height: 20,
  },
});
export default ServiceDetailScreen;
