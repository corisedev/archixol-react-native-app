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
import {getService} from '../../../api/client';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useContext} from 'react';
import {BackendContext} from '../../../context/BackendContext';
import {VITE_API_BASE_URL} from '@env';
// Import your icons
import LocationIcon from '../../../assets/images/icons/location.png';
import StarIcon from '../../../assets/images/icons/company.png';
import HeartIcon from '../../../assets/images/icons/company.png';
import PhoneIcon from '../../../assets/images/icons/company.png';
import MessageIcon from '../../../assets/images/icons/company.png';
import ShareIcon from '../../../assets/images/icons/company.png';

const {width} = Dimensions.get('window');

const ServiceDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {serviceId, service: initialService} = route.params;

  // State
  const [loading, setLoading] = useState(!initialService);
  const [refreshing, setRefreshing] = useState(false);
  const [serviceDetails, setServiceDetails] = useState(initialService || null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const {backendUrl} = useContext(BackendContext);
  const BASE_IMAGE_URL = backendUrl || VITE_API_BASE_URL;

  // Fetch service details
  const fetchServiceDetails = useCallback(async () => {
    try {
      if (!initialService) {
        setLoading(true);
      }
      const response = await getService({service_id: serviceId});
      console.log('Service Details Response:', response);
      setServiceDetails(response.service || response);
    } catch (error) {
      console.error('Failed to load service details:', error);
      Alert.alert('Error', 'Unable to load service details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [serviceId, initialService]);

  const getFullImageUrl = relativePath => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;
    return `${BASE_IMAGE_URL}${relativePath}`;
  };

  // Initial load
  useEffect(() => {
    if (!initialService) {
      fetchServiceDetails();
    }
  }, [fetchServiceDetails, initialService]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchServiceDetails();
    setRefreshing(false);
  }, [fetchServiceDetails]);

  // Format currency
  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `Rs ${amount.toLocaleString()}`;
    }
    return `Rs ${amount || '0'}`;
  };

  // Handle phone call
  const handleCall = phoneNumber => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert(
        'No Phone Number',
        'Phone number not available for this service provider.',
      );
    }
  };

  // Handle message
  const handleSendMessage = () => {
    if (!message.trim()) {
      Alert.alert('Empty Message', 'Please enter a message to send.');
      return;
    }

    // Here you would implement the actual message sending logic
    Alert.alert(
      'Message Sent',
      'Your message has been sent to the service provider.',
    );
    setMessage('');
    setShowMessageModal(false);
  };

  // Handle booking
  const handleBookService = () => {
    Alert.alert('Book Service', 'Would you like to book this service?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Book Now',
        onPress: () => {
          // Navigate to booking screen or implement booking logic
          Alert.alert(
            'Booking Confirmed',
            'Your booking request has been sent!',
          );
        },
      },
    ]);
  };

  // Render image gallery
  const renderImageGallery = () => {
    const images = serviceDetails?.images || [];
    if (images.length === 0) {
      return (
        <View style={styles.placeholderImageContainer}>
          <Text style={styles.placeholderImageText}>🛠️</Text>
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
                style={styles.serviceImage}
                resizeMode="cover"
                onError={() => {
                  console.warn('Fallback triggered, image not loaded:', image);
                  setServiceDetails(prev => ({
                    ...prev,
                    images: prev.images.map((img, i) =>
                      i === index ? '/images/default_service.png' : img,
                    ),
                  }));
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

        <TouchableOpacity style={styles.favoriteButton}>
          <Image source={HeartIcon} style={styles.favoriteIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareButton}>
          <Image source={ShareIcon} style={styles.shareIcon} />
        </TouchableOpacity>
      </View>
    );
  };

  // Render features
  const renderFeatures = () => {
    const features = serviceDetails?.features || [];
    if (features.length === 0) return null;

    return (
      <View style={styles.featuresCard}>
        <Text style={styles.sectionTitle}>Service Features</Text>
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

  // Render FAQs
  const renderFAQs = () => {
    const faqs = serviceDetails?.faqs || [];
    if (faqs.length === 0) return null;

    return (
      <View style={styles.faqsCard}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqs.map((faq, index) => (
          <View key={index} style={styles.faqItem}>
            <Text style={styles.faqQuestion}>{faq.question}</Text>
            <Text style={styles.faqAnswer}>{faq.answer}</Text>
          </View>
        ))}
      </View>
    );
  };

  // Loading state
  if (loading && !serviceDetails) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading service details...</Text>
      </View>
    );
  }

  if (!serviceDetails) {
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Service Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        {renderImageGallery()}

        {/* Service Info */}
        <View style={styles.serviceInfoCard}>
          <View style={styles.serviceTitleRow}>
            <View style={styles.titleSection}>
              <Text style={styles.serviceTitle}>{serviceDetails.title}</Text>
              <Text style={styles.serviceCategory}>
                {serviceDetails.category}
              </Text>
            </View>
            <View style={styles.priceSection}>
              <Text style={styles.servicePrice}>
                {formatCurrency(serviceDetails.price)}
              </Text>
              <Text style={styles.priceUnit}>starting from</Text>
            </View>
          </View>

          <View style={styles.ratingRow}>
            <View style={styles.ratingContainer}>
              <Image source={StarIcon} style={styles.starIcon} />
              <Text style={styles.ratingText}>
                {serviceDetails.average_rating || '0.0'}
              </Text>
              <Text style={styles.reviewsText}>
                ({serviceDetails.no_of_reviews || 0} reviews)
              </Text>
            </View>
          </View>

          <View style={styles.locationRow}>
            <Image source={LocationIcon} style={styles.locationIcon} />
            <Text style={styles.locationText}>
              {serviceDetails.location || 'Location not specified'}
            </Text>
          </View>
        </View>

        {/* Provider Info */}
        <View style={styles.providerCard}>
          <Text style={styles.sectionTitle}>Service Provider</Text>
          <View style={styles.providerInfo}>
            <View style={styles.providerAvatar}>
              <Text style={styles.avatarText}>
                {serviceDetails.provider_name?.charAt(0)?.toUpperCase() || 'P'}
              </Text>
            </View>
            <View style={styles.providerDetails}>
              <Text style={styles.providerName}>
                {serviceDetails.provider_name || 'Service Provider'}
              </Text>
              <Text style={styles.providerStats}>
                {serviceDetails.total_jobs_completed || 0} jobs completed
              </Text>
              {serviceDetails.website && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(serviceDetails.website)}>
                  <Text style={styles.websiteLink}>
                    {serviceDetails.website}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.sectionTitle}>About This Service</Text>
          <Text style={styles.descriptionText}>
            {serviceDetails.description ||
              serviceDetails.about_service ||
              'No description available.'}
          </Text>
        </View>

        {/* Features */}
        {renderFeatures()}

        {/* FAQs */}
        {renderFAQs()}

        {/* Tags */}
        {serviceDetails.tags && serviceDetails.tags.length > 0 && (
          <View style={styles.tagsCard}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsContainer}>
              {serviceDetails.tags.map((tag, index) => (
                <View key={index} style={styles.tagChip}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => setShowContactModal(true)}>
          <Image source={PhoneIcon} style={styles.actionIcon} />
          <Text style={styles.contactButtonText}>Contact</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.messageButton}
          onPress={() => setShowMessageModal(true)}>
          <Image source={MessageIcon} style={styles.actionIcon} />
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bookButton} onPress={handleBookService}>
          <Text style={styles.bookButtonText}>Book Service</Text>
        </TouchableOpacity>
      </View>

      {/* Contact Modal */}
      <Modal visible={showContactModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.contactModal}>
            <Text style={styles.modalTitle}>Contact Service Provider</Text>
            <View style={styles.contactOptions}>
              <TouchableOpacity
                style={styles.contactOption}
                onPress={() => {
                  setShowContactModal(false);
                  handleCall(serviceDetails.phone);
                }}>
                <Image source={PhoneIcon} style={styles.contactOptionIcon} />
                <Text style={styles.contactOptionText}>Call Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactOption}
                onPress={() => {
                  setShowContactModal(false);
                  setShowMessageModal(true);
                }}>
                <Image source={MessageIcon} style={styles.contactOptionIcon} />
                <Text style={styles.contactOptionText}>Send Message</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowContactModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Message Modal */}
      <Modal
        visible={showMessageModal}
        animationType="slide"
        presentationStyle="pageSheet">
        <View style={styles.messageModal}>
          <View style={styles.messageModalHeader}>
            <TouchableOpacity onPress={() => setShowMessageModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.messageModalTitle}>Send Message</Text>
            <TouchableOpacity onPress={handleSendMessage}>
              <Text style={styles.sendText}>Send</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.messageContent}>
            <Text style={styles.messageToText}>
              To: {serviceDetails.provider_name || 'Service Provider'}
            </Text>
            <TextInput
              style={styles.messageInput}
              placeholder="Type your message here..."
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
            />
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
  placeholder: {
    width: 50,
  },

  scrollView: {
    flex: 1,
  },

  // Image Gallery
  imageGallery: {
    height: 250,
    position: 'relative',
  },
  imageContainer: {
    width: width,
    height: 250,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImageContainer: {
    height: 250,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderImageText: {
    fontSize: 64,
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

  // Service Info Card
  serviceInfoCard: {
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
  serviceTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
    marginRight: 16,
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  priceSection: {
    alignItems: 'flex-end',
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.splashGreen,
  },
  priceUnit: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
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
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 16,
    height: 16,
    tintColor: colors.textSecondary,
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },

  // Provider Card
  providerCard: {
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
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.background,
  },
  providerDetails: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  providerStats: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  websiteLink: {
    fontSize: 14,
    color: colors.splashGreen,
    textDecorationLine: 'underline',
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

  // FAQs Card
  faqsCard: {
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
  faqItem: {
    marginBottom: 16,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Tags Card
  tagsCard: {
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: colors.splashGreen + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: colors.splashGreen,
    fontWeight: '500',
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
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.splashGreen + '20',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  bookButton: {
    flex: 2,
    backgroundColor: colors.splashGreen,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIcon: {
    width: 16,
    height: 16,
    tintColor: colors.text,
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  messageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.splashGreen,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },

  // Contact Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contactModal: {
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
  contactOptions: {
    gap: 12,
    marginBottom: 20,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
  },
  contactOptionIcon: {
    width: 20,
    height: 20,
    tintColor: colors.text,
    marginRight: 12,
  },
  contactOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  modalCloseButton: {
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  // Message Modal
  messageModal: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  cancelText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  messageModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  sendText: {
    fontSize: 16,
    color: colors.splashGreen,
    fontWeight: '600',
  },
  messageContent: {
    flex: 1,
    padding: 16,
  },
  messageToText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    backgroundColor: '#F8F9FA',
    minHeight: 120,
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

export default ServiceDetailsScreen;
