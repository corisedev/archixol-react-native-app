import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import {colors} from '../../../../utils/colors';;;
import {useNavigation, useRoute} from '@react-navigation/native';
import {updateProfile} from '../../../../api/serviceProvider';

const {width} = Dimensions.get('window');

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {profile} = route.params || {};

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullname: profile?.fullname || '',
    email: profile?.email || '',
    phone_number: profile?.phone_number || '',
    address: profile?.address || '',
    experience: profile?.experience?.toString() || '',
    introduction: profile?.introduction || '',
    cnic: profile?.cnic || '',
    website: profile?.website || '',
    service_location: profile?.service_location || '',
    services: profile?.services || [],
  });

  const [serviceInput, setServiceInput] = useState('');
  const [selectedImages, setSelectedImages] = useState({
    profile_img: null,
    banner_img: null,
    intro_video: null,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  // All your existing functions (updateFormData, addService, etc.) remain the same
  const updateFormData = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({...prev, [field]: null}));
    }
  };

  const addService = () => {
    if (
      serviceInput.trim() &&
      !formData.services.includes(serviceInput.trim())
    ) {
      updateFormData('services', [...formData.services, serviceInput.trim()]);
      setServiceInput('');
    }
  };

  const removeService = index => {
    const newServices = formData.services.filter((_, i) => i !== index);
    updateFormData('services', newServices);
  };

  const handleImagePicker = imageType => {
    Alert.alert('Select Image', `Choose your ${imageType.replace('_', ' ')}`, [
      {text: 'Camera', onPress: () => console.log('Camera selected')},
      {text: 'Gallery', onPress: () => console.log('Gallery selected')},
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.fullname.trim()) {
      errors.fullname = 'Full name is required';
    } else if (formData.fullname.length < 2) {
      errors.fullname = 'Name must be at least 2 characters';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!formData.phone_number.trim()) {
      errors.phone_number = 'Phone number is required';
    } else if (formData.phone_number.length < 10) {
      errors.phone_number = 'Please enter a valid phone number';
    }
    if (formData.cnic && formData.cnic.length !== 13) {
      errors.cnic = 'CNIC must be 13 digits';
    }
    if (
      formData.experience &&
      (isNaN(formData.experience) || formData.experience < 0)
    ) {
      errors.experience = 'Please enter valid years of experience';
    }
    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      errors.website =
        'Please enter a valid website URL (starting with http:// or https://)';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getProfileCompleteness = () => {
    const fields = [
      formData.fullname,
      formData.email,
      formData.phone_number,
      formData.address,
      formData.introduction,
      formData.experience,
      formData.service_location,
      formData.services.length > 0 ? 'services' : '',
    ];
    const completed = fields.filter(field => field && field !== '').length;
    return Math.round((completed / fields.length) * 100);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert(
        'Please Fix Errors',
        'Please correct the highlighted fields before saving.',
      );
      return;
    }
    try {
      setLoading(true);
      const updateData = {
        ...formData,
        experience: formData.experience
          ? parseInt(formData.experience, 10)
          : undefined,
        ...selectedImages,
      };
      await updateProfile(updateData);
      Alert.alert(
        'Profile Updated! 🎉',
        'Your profile has been successfully updated and is now more attractive to clients.',
        [{text: 'Great!', onPress: () => navigation.goBack()}],
      );
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert(
        'Update Failed',
        'Unable to update your profile. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Sticky Header Component
  const renderHeader = () => {
    const completeness = getProfileCompleteness();

    return (
      <View style={styles.stickyHeader}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <Text style={styles.headerSubtitle}>
              Update your professional information
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}>
            {loading ? (
              <View style={styles.saveButtonLoading}>
                <ActivityIndicator size="small" color={colors.background} />
              </View>
            ) : (
              <View style={styles.saveButtonContent}>
                <Text style={styles.saveButtonIcon}>💾</Text>
                <Text style={styles.saveButtonText}>Save</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.completenessContainer}>
          <View style={styles.completenessCard}>
            <View style={styles.completenessHeader}>
              <Text style={styles.completenessTitle}>Profile Completeness</Text>
              <Text style={styles.completenessPercentage}>{completeness}%</Text>
            </View>
            <View style={styles.completenessBar}>
              <View
                style={[
                  styles.completenessProgress,
                  {width: `${completeness}%`},
                ]}
              />
            </View>
            <Text style={styles.completenessHint}>
              {completeness < 70
                ? 'Complete more fields to attract more clients'
                : completeness < 90
                ? "You're almost there! Just a few more fields"
                : 'Excellent! Your profile looks professional and complete'}
            </Text>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.previewButton}
            onPress={() => setShowPreview(!showPreview)}>
            <Text style={styles.previewButtonIcon}>👁️</Text>
            <Text style={styles.previewButtonText}>
              {showPreview ? 'Hide Preview' : 'Preview'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ✅ Create data array for FlatList
  const createSectionsData = () => {
    const sections = [
      {
        id: 'profile_images',
        type: 'profile_images',
        title: 'Profile Images',
      },
      {
        id: 'basic_info',
        type: 'basic_info',
        title: 'Basic Information',
      },
      {
        id: 'contact_info',
        type: 'contact_info',
        title: 'Location & Contact',
      },
      {
        id: 'introduction',
        type: 'introduction',
        title: 'Professional Introduction',
      },
      {
        id: 'services',
        type: 'services',
        title: 'Professional Services',
      },
    ];

    if (showPreview) {
      sections.push({
        id: 'preview',
        type: 'preview',
        title: 'Profile Preview',
      });
    }

    return sections;
  };

  // ✅ Render different section types
  const renderSection = ({item}) => {
    switch (item.type) {
      case 'profile_images':
        return renderProfileImagesSection();
      case 'basic_info':
        return renderBasicInfoSection();
      case 'contact_info':
        return renderContactInfoSection();
      case 'introduction':
        return renderIntroductionSection();
      case 'services':
        return renderServicesSection();
      case 'preview':
        return renderPreviewSection();
      default:
        return null;
    }
  };

  // All your existing render functions
  const renderInputField = (field, label, options = {}) => {
    const {
      placeholder,
      multiline = false,
      keyboardType = 'default',
      autoCapitalize = 'sentences',
      required = false,
      maxLength,
      description,
      icon,
      tips = [],
    } = options;

    return (
      <View style={styles.inputGroup}>
        <View style={styles.inputLabelContainer}>
          <View style={styles.inputLabelRow}>
            {icon && <Text style={styles.inputIcon}>{icon}</Text>}
            <Text style={styles.inputLabel}>
              {label}
              {required && <Text style={styles.requiredStar}> *</Text>}
            </Text>
          </View>
          {maxLength && (
            <Text style={styles.characterCount}>
              {formData[field]?.length || 0}/{maxLength}
            </Text>
          )}
        </View>

        {description && (
          <Text style={styles.inputDescription}>{description}</Text>
        )}

        <TextInput
          style={[
            styles.input,
            multiline && styles.textArea,
            fieldErrors[field] && styles.inputError,
          ]}
          placeholder={placeholder}
          value={formData[field]}
          onChangeText={value => updateFormData(field, value)}
          placeholderTextColor={colors.textSecondary}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          maxLength={maxLength}
        />

        {fieldErrors[field] && (
          <Text style={styles.errorText}>⚠️ {fieldErrors[field]}</Text>
        )}

        {tips.length > 0 && (
          <View style={styles.inputTips}>
            {tips.map((tip, index) => (
              <Text key={index} style={styles.inputTip}>
                💡 {tip}
              </Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderImageItem = (
    title,
    imageType,
    currentImage,
    description,
    tips,
  ) => (
    <View style={styles.imageSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionDescription}>{description}</Text>
        </View>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>Optional</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.imageContainer}
        onPress={() => handleImagePicker(imageType)}>
        {currentImage || selectedImages[imageType] ? (
          <View style={styles.selectedImageContainer}>
            <Image
              source={{uri: currentImage || selectedImages[imageType]}}
              style={[
                styles.selectedImage,
                imageType === 'banner_img' && styles.bannerImage,
              ]}
            />
            <View style={styles.imageOverlay}>
              <Text style={styles.imageOverlayIcon}>📷</Text>
              <Text style={styles.imageOverlayText}>Change {title}</Text>
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.imagePlaceholder,
              imageType === 'banner_img' && styles.bannerPlaceholder,
            ]}>
            <Text style={styles.imagePlaceholderIcon}>
              {imageType === 'profile_img'
                ? '👤'
                : imageType === 'banner_img'
                ? '🎨'
                : '🎥'}
            </Text>
            <Text style={styles.imagePlaceholderTitle}>Upload {title}</Text>
            <Text style={styles.imagePlaceholderSubtitle}>
              Tap to select from gallery or camera
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {tips && (
        <View style={styles.imageTips}>
          <Text style={styles.imageTipsTitle}>💡 Tips:</Text>
          {tips.map((tip, index) => (
            <Text key={index} style={styles.imageTip}>
              • {tip}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  const renderProfileImagesSection = () => (
    <View style={styles.section}>
      {renderImageItem(
        'Profile Photo',
        'profile_img',
        profile?.profile_img,
        'Your main profile picture that clients will see',
        [
          'Use a clear, professional headshot',
          'Good lighting and clean background work best',
          'Square aspect ratio (1:1) is recommended',
        ],
      )}

      {renderImageItem(
        'Cover Banner',
        'banner_img',
        profile?.banner_img,
        'A banner image for your profile header',
        [
          'Showcase your work or workspace',
          '16:9 aspect ratio works best',
          'High resolution images look more professional',
        ],
      )}

      {renderImageItem(
        'Introduction Video',
        'intro_video',
        profile?.intro_video,
        'A short video introducing yourself to clients',
        [
          'Keep it under 60 seconds',
          'Speak clearly and confidently',
          'Good audio quality is essential',
        ],
      )}
    </View>
  );

  const renderBasicInfoSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <Text style={styles.sectionDescription}>
            Essential details about yourself
          </Text>
        </View>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>Required</Text>
        </View>
      </View>

      {renderInputField('fullname', 'Full Name', {
        placeholder: 'Enter your complete name',
        required: true,
        icon: '👤',
        maxLength: 50,
        tips: ['Use your real name for trust and credibility'],
      })}

      {renderInputField('email', 'Email Address', {
        placeholder: 'your.email@example.com',
        keyboardType: 'email-address',
        autoCapitalize: 'none',
        required: true,
        icon: '📧',
        description: 'This email will be used for client communications',
      })}

      {renderInputField('phone_number', 'Phone Number', {
        placeholder: '+92 300 1234567',
        keyboardType: 'phone-pad',
        required: true,
        icon: '📱',
        tips: ['Include country code for international clients'],
      })}

      {renderInputField('cnic', 'CNIC Number', {
        placeholder: '12345-1234567-1',
        keyboardType: 'numeric',
        icon: '🆔',
        maxLength: 15,
        description: 'For identity verification (Pakistani ID)',
      })}

      {renderInputField('experience', 'Years of Experience', {
        placeholder: 'e.g., 5',
        keyboardType: 'numeric',
        icon: '⭐',
        tips: ['Be honest about your experience level'],
      })}
    </View>
  );

  const renderContactInfoSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Location & Contact</Text>
          <Text style={styles.sectionDescription}>
            Where you're located and how clients can reach you
          </Text>
        </View>
      </View>

      {renderInputField('address', 'Home Address', {
        placeholder: 'Street address, city, postal code',
        multiline: true,
        icon: '🏠',
        description: 'Your residential address (kept private)',
      })}

      {renderInputField('service_location', 'Service Area', {
        placeholder: 'Where do you provide your services?',
        icon: '📍',
        tips: [
          'Be specific about your coverage area',
          'Include nearby cities if you travel for work',
        ],
      })}

      {renderInputField('website', 'Website URL', {
        placeholder: 'https://yourwebsite.com',
        keyboardType: 'url',
        autoCapitalize: 'none',
        icon: '🌐',
        description: 'Your portfolio or business website',
      })}
    </View>
  );

  const renderIntroductionSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Professional Introduction</Text>
          <Text style={styles.sectionDescription}>
            Tell clients about your expertise and what makes you unique
          </Text>
        </View>
      </View>

      {renderInputField('introduction', 'About Yourself', {
        placeholder:
          'Describe your professional background, skills, and what you can offer to clients...',
        multiline: true,
        icon: '✍️',
        maxLength: 500,
        tips: [
          'Highlight your key skills and achievements',
          'Mention what makes you different from others',
          'Keep it conversational and engaging',
          'Include specific examples of your work',
        ],
      })}
    </View>
  );

  const renderServicesSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Professional Services</Text>
          <Text style={styles.sectionDescription}>
            What services do you offer to clients?
          </Text>
        </View>
        <View style={styles.servicesCount}>
          <Text style={styles.servicesCountText}>
            {formData.services.length}
          </Text>
        </View>
      </View>

      <View style={styles.serviceInputContainer}>
        <TextInput
          style={styles.serviceInput}
          placeholder="e.g., Web Development, Logo Design, Content Writing..."
          value={serviceInput}
          onChangeText={setServiceInput}
          onSubmitEditing={addService}
          placeholderTextColor={colors.textSecondary}
        />
        <TouchableOpacity
          style={[
            styles.addServiceButton,
            !serviceInput.trim() && styles.addServiceButtonDisabled,
          ]}
          onPress={addService}
          disabled={!serviceInput.trim()}>
          <Text style={styles.addServiceButtonIcon}>➕</Text>
          <Text style={styles.addServiceButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {formData.services.length > 0 ? (
        <View style={styles.servicesContainer}>
          {formData.services.map((service, index) => (
            <View key={index} style={styles.serviceTag}>
              <Text style={styles.serviceTagIcon}>⚡</Text>
              <Text style={styles.serviceTagText}>{service}</Text>
              <TouchableOpacity
                style={styles.serviceTagRemoveButton}
                onPress={() => removeService(index)}>
                <Text style={styles.serviceTagRemove}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.noServices}>
          <Text style={styles.noServicesIcon}>💼</Text>
          <Text style={styles.noServicesText}>
            Add services to help clients understand what you offer
          </Text>
        </View>
      )}

      <View style={styles.serviceTips}>
        <Text style={styles.serviceTipsTitle}>💡 Service Tips:</Text>
        <Text style={styles.serviceTip}>
          • Be specific (e.g., "WordPress Development" vs "Web Development")
        </Text>
        <Text style={styles.serviceTip}>
          • Include your specialties and main skills
        </Text>
        <Text style={styles.serviceTip}>
          • Use terms clients would search for
        </Text>
      </View>
    </View>
  );

  const renderPreviewSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📱 Profile Preview</Text>
      <Text style={styles.sectionDescription}>
        How your profile will appear to clients
      </Text>

      <View style={styles.previewCard}>
        <View style={styles.previewHeader}>
          <View style={styles.previewAvatar}>
            {profile?.profile_img ? (
              <Image
                source={{uri: profile.profile_img}}
                style={styles.previewAvatarImage}
              />
            ) : (
              <Text style={styles.previewAvatarText}>👤</Text>
            )}
          </View>
          <View style={styles.previewInfo}>
            <Text style={styles.previewName}>
              {formData.fullname || 'Your Name'}
            </Text>
            <Text style={styles.previewLocation}>
              📍 {formData.service_location || 'Service Location'}
            </Text>
            {formData.experience && (
              <Text style={styles.previewExperience}>
                ⭐ {formData.experience} years experience
              </Text>
            )}
          </View>
        </View>

        {formData.introduction && (
          <Text style={styles.previewIntro} numberOfLines={3}>
            {formData.introduction}
          </Text>
        )}

        {formData.services.length > 0 && (
          <View style={styles.previewServices}>
            {formData.services.slice(0, 3).map((service, index) => (
              <View key={index} style={styles.previewServiceTag}>
                <Text style={styles.previewServiceText}>{service}</Text>
              </View>
            ))}
            {formData.services.length > 3 && (
              <Text style={styles.previewMoreServices}>
                +{formData.services.length - 3} more
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );

  // ✅ Main return with FlatList
  return (
    <View style={styles.container}>
      <FlatList
        data={createSectionsData()}
        renderItem={renderSection}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
};

// Set displayName for Layout component detection
EditProfileScreen.displayName = 'EditProfileScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  flatListContent: {
    paddingBottom: 40, // Bottom nav space
  },

  // ✅ Sticky Header Styles
  stickyHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 50, // Status bar space
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 18,
    color: colors.text,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  saveButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  saveButtonIcon: {
    fontSize: 12,
  },
  saveButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonLoading: {
    paddingHorizontal: 12,
  },

  // Profile Completeness
  completenessContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  completenessCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  completenessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completenessTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  completenessPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.splashGreen,
  },
  completenessBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 8,
  },
  completenessProgress: {
    height: '100%',
    backgroundColor: colors.splashGreen,
    borderRadius: 3,
  },
  completenessHint: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 6,
  },
  previewButtonIcon: {
    fontSize: 14,
  },
  previewButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },

  // Sections
  section: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  imageSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sectionBadge: {
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionBadgeText: {
    color: '#F44336',
    fontSize: 10,
    fontWeight: '600',
  },

  // Enhanced Image Sections
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedImageContainer: {
    position: 'relative',
  },
  selectedImage: {
    width: 140,
    height: 140,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  bannerImage: {
    width: width - 72,
    height: 100,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  imageOverlayIcon: {
    fontSize: 14,
  },
  imageOverlayText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  imagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  bannerPlaceholder: {
    width: width - 72,
    height: 100,
  },
  imagePlaceholderIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  imagePlaceholderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  imagePlaceholderSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  imageTips: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
  },
  imageTipsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  imageTip: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 2,
  },

  // Enhanced Input Fields
  inputGroup: {
    marginBottom: 20,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  requiredStar: {
    color: '#F44336',
    fontWeight: '700',
  },
  characterCount: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  inputDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: '#F44336',
    borderWidth: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
    fontWeight: '500',
  },
  inputTips: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  inputTip: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 2,
  },

  // Enhanced Services Section
  servicesCount: {
    backgroundColor: colors.splashGreen,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servicesCountText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '700',
  },
  serviceInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  serviceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
  addServiceButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  addServiceButtonDisabled: {
    opacity: 0.5,
  },
  addServiceButtonIcon: {
    fontSize: 12,
  },
  addServiceButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  serviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 6,
  },
  serviceTagIcon: {
    fontSize: 12,
  },
  serviceTagText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  serviceTagRemoveButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFE0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTagRemove: {
    fontSize: 10,
    color: '#F44336',
    fontWeight: 'bold',
  },
  noServices: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 16,
  },
  noServicesIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  noServicesText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  serviceTips: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
  },
  serviceTipsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  serviceTip: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 2,
  },

  // Preview Section
  previewCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  previewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  previewAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  previewAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  previewAvatarText: {
    fontSize: 20,
  },
  previewInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  previewName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  previewLocation: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  previewExperience: {
    fontSize: 12,
    color: colors.splashGreen,
    fontWeight: '500',
  },
  previewIntro: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 12,
  },
  previewServices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  previewServiceTag: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewServiceText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '500',
  },
  previewMoreServices: {
    fontSize: 11,
    color: colors.textSecondary,
    fontStyle: 'italic',
    alignSelf: 'center',
  },
});

export default EditProfileScreen;
