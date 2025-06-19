import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  FlatList,
  StatusBar,
} from 'react-native';
import {colors} from '../../../../utils/colors';;;
import {useNavigation, useRoute} from '@react-navigation/native';
import {updateCompany} from '../../../../api/serviceProvider';

const {width} = Dimensions.get('window');

const EditCompanyScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {company} = route.params || {};

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: company?.name || '',
    business_email: company?.business_email || '',
    address: company?.address || '',
    experience: company?.experience?.toString() || '',
    description: company?.description || '',
    owner_name: company?.owner_name || '',
    owner_cnic: company?.owner_cnic || '',
    phone_number: company?.phone_number || '',
    service_location: company?.service_location || '',
    services: company?.services || [],
  });

  const [serviceInput, setServiceInput] = useState('');
  const [selectedImages, setSelectedImages] = useState({
    logo: null,
    banner: null,
    license_img: null,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  const updateFormData = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
    // Clear field error when user starts typing
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
    Alert.alert(
      'Select Image',
      `Choose your company ${imageType.replace('_', ' ')}`,
      [
        {text: 'Camera', onPress: () => console.log('Camera selected')},
        {text: 'Gallery', onPress: () => console.log('Gallery selected')},
        {text: 'Cancel', style: 'cancel'},
      ],
    );
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Company name is required';
    } else if (formData.name.length < 2) {
      errors.name = 'Company name must be at least 2 characters';
    }

    if (!formData.business_email.trim()) {
      errors.business_email = 'Business email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.business_email)) {
      errors.business_email = 'Please enter a valid email address';
    }

    if (!formData.owner_name.trim()) {
      errors.owner_name = 'Owner name is required';
    } else if (formData.owner_name.length < 2) {
      errors.owner_name = 'Owner name must be at least 2 characters';
    }

    if (!formData.phone_number.trim()) {
      errors.phone_number = 'Phone number is required';
    } else if (formData.phone_number.length < 10) {
      errors.phone_number = 'Please enter a valid phone number';
    }

    if (formData.owner_cnic && formData.owner_cnic.length !== 13) {
      errors.owner_cnic = 'CNIC must be 13 digits';
    }

    if (
      formData.experience &&
      (isNaN(formData.experience) || formData.experience < 0)
    ) {
      errors.experience = 'Please enter valid years of experience';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getCompanyCompleteness = () => {
    const fields = [
      formData.name,
      formData.business_email,
      formData.owner_name,
      formData.phone_number,
      formData.address,
      formData.description,
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
        experience: formData.experience ? parseInt(formData.experience, 10) : 0,
        ...selectedImages,
      };

      await updateCompany(updateData);
      Alert.alert(
        'Company Updated! 🎉',
        'Your company profile has been successfully updated and now looks more professional to clients.',
        [{text: 'Excellent!', onPress: () => navigation.goBack()}],
      );
    } catch (error) {
      console.error('Failed to update company:', error);
      Alert.alert(
        'Update Failed',
        'Unable to update your company profile. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => {
    const completeness = getCompanyCompleteness();

    return (
      <View style={styles.pageHeader}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Edit Company Profile</Text>
            <Text style={styles.headerSubtitle}>
              Update your business information
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
              <Text style={styles.completenessTitle}>
                Business Profile Completeness
              </Text>
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
                ? 'Complete more fields to build stronger client trust'
                : completeness < 90
                ? 'Almost there! Your company profile is looking great'
                : 'Perfect! Your company profile is complete and professional'}
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

  const renderCompanyBranding = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Company Branding</Text>
          <Text style={styles.sectionDescription}>
            Create a professional visual identity for your business
          </Text>
        </View>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>Recommended</Text>
        </View>
      </View>

      {/* Company Banner */}
      <View style={styles.brandingItem}>
        <Text style={styles.brandingItemTitle}>🎨 Cover Banner</Text>
        <Text style={styles.brandingItemDescription}>
          A professional banner that appears at the top of your company profile
        </Text>
        <View style={styles.bannerContainer}>
          {company?.banner || selectedImages.banner ? (
            <View style={styles.selectedBannerContainer}>
              <Image
                source={{uri: company?.banner || selectedImages.banner}}
                style={styles.bannerImage}
              />
              <View style={styles.bannerOverlay}>
                <TouchableOpacity
                  style={styles.changeBannerButton}
                  onPress={() => handleImagePicker('banner')}>
                  <Text style={styles.changeBannerIcon}>📷</Text>
                  <Text style={styles.changeBannerButtonText}>
                    Change Banner
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.bannerPlaceholder}
              onPress={() => handleImagePicker('banner')}>
              <Text style={styles.bannerPlaceholderIcon}>🎨</Text>
              <Text style={styles.bannerPlaceholderTitle}>
                Upload Company Banner
              </Text>
              <Text style={styles.bannerPlaceholderSubtitle}>
                Showcase your business with a professional cover image
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.brandingTips}>
          <Text style={styles.brandingTipsTitle}>💡 Banner Tips:</Text>
          <Text style={styles.brandingTip}>
            • Use high-resolution images (1920x1080 or 16:9 ratio)
          </Text>
          <Text style={styles.brandingTip}>
            • Showcase your work, office, or team
          </Text>
          <Text style={styles.brandingTip}>
            • Keep text minimal - the banner should be visual
          </Text>
        </View>
      </View>

      {/* Company Logo */}
      <View style={styles.brandingItem}>
        <Text style={styles.brandingItemTitle}>🏢 Company Logo</Text>
        <Text style={styles.brandingItemDescription}>
          Your brand's visual identity that represents your business
        </Text>
        <View style={styles.logoContainer}>
          {company?.logo || selectedImages.logo ? (
            <View style={styles.selectedLogoContainer}>
              <Image
                source={{uri: company?.logo || selectedImages.logo}}
                style={styles.companyLogo}
              />
              <TouchableOpacity
                style={styles.changeLogoButton}
                onPress={() => handleImagePicker('logo')}>
                <Text style={styles.changeLogoIcon}>📷</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.logoPlaceholder}
              onPress={() => handleImagePicker('logo')}>
              <Text style={styles.logoPlaceholderIcon}>🏢</Text>
              <Text style={styles.logoPlaceholderTitle}>Upload Logo</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.brandingTips}>
          <Text style={styles.brandingTipsTitle}>💡 Logo Tips:</Text>
          <Text style={styles.brandingTip}>
            • Square format (1:1 ratio) works best
          </Text>
          <Text style={styles.brandingTip}>
            • Clear, simple design with good contrast
          </Text>
          <Text style={styles.brandingTip}>
            • Minimum 500x500 pixels for quality
          </Text>
        </View>
      </View>
    </View>
  );

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

  const renderStickyHeader = () => {
    const completeness = getCompanyCompleteness();

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
            <Text style={styles.headerTitle}>Edit Company Profile</Text>
            <Text style={styles.headerSubtitle}>
              Update your business information
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
              <Text style={styles.completenessTitle}>
                Business Profile Completeness
              </Text>
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
                ? 'Complete more fields to build stronger client trust'
                : completeness < 90
                ? 'Almost there! Your company profile is looking great'
                : 'Perfect! Your company profile is complete and professional'}
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

  const createSectionsData = () => [
    {id: 'branding', type: 'branding'},
    {id: 'company_info', type: 'company_info'},
    {id: 'owner_info', type: 'owner_info'},
    {id: 'contact', type: 'contact'},
    {id: 'services', type: 'services'},
    {id: 'license', type: 'license'},
    ...(showPreview ? [{id: 'preview', type: 'preview'}] : []),
  ];

  const renderSection = ({item}) => {
    switch (item.type) {
      case 'branding':
        return renderCompanyBranding();
      case 'company_info':
        return renderCompanyInformation();
      case 'owner_info':
        return renderOwnerInformation();
      case 'contact':
        return renderBusinessContact();
      case 'services':
        return renderBusinessServices();
      case 'license':
        return renderBusinessLicense();
      case 'preview':
        return renderPreviewSection();
      default:
        return null;
    }
  };

  const renderCompanyInformation = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Company Information</Text>
          <Text style={styles.sectionDescription}>
            Basic details about your business
          </Text>
        </View>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>Required</Text>
        </View>
      </View>

      {renderInputField('name', 'Company Name', {
        placeholder: 'Enter your company or business name',
        required: true,
        icon: '🏢',
        maxLength: 100,
        tips: ['Use your official registered business name'],
      })}

      {renderInputField('experience', 'Years in Business', {
        placeholder: 'e.g., 5',
        keyboardType: 'numeric',
        icon: '⭐',
        description: 'How many years has your company been operating?',
        tips: ['Be honest about your business experience'],
      })}

      {renderInputField('description', 'Company Description', {
        placeholder:
          'Describe your company, its mission, values, and what makes it unique...',
        multiline: true,
        icon: '📝',
        maxLength: 500,
        description:
          'Tell potential clients about your business story and values',
        tips: [
          'Highlight what makes your company unique',
          'Mention your mission and core values',
          'Keep it engaging and client-focused',
          "Include your company's key achievements",
        ],
      })}
    </View>
  );

  const renderOwnerInformation = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Business Owner Details</Text>
          <Text style={styles.sectionDescription}>
            Information about the company owner or primary contact
          </Text>
        </View>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>Required</Text>
        </View>
      </View>

      {renderInputField('owner_name', 'Owner Full Name', {
        placeholder: 'Enter the full name of the business owner',
        required: true,
        icon: '👤',
        maxLength: 50,
        description:
          'Legal name of the person who owns or manages the business',
      })}

      {renderInputField('owner_cnic', 'Owner CNIC', {
        placeholder: '12345-1234567-1',
        keyboardType: 'numeric',
        icon: '🆔',
        maxLength: 15,
        description: 'Pakistani national ID for business verification',
        tips: ['Required for business verification and legal compliance'],
      })}
    </View>
  );

  const renderBusinessContact = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Business Contact Information</Text>
          <Text style={styles.sectionDescription}>
            How clients can reach your business
          </Text>
        </View>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>Required</Text>
        </View>
      </View>

      {renderInputField('business_email', 'Business Email', {
        placeholder: 'contact@yourcompany.com',
        keyboardType: 'email-address',
        autoCapitalize: 'none',
        required: true,
        icon: '📧',
        description: 'Professional email address for client communications',
        tips: ['Use a professional email with your domain name if possible'],
      })}

      {renderInputField('phone_number', 'Business Phone', {
        placeholder: '+92 300 1234567',
        keyboardType: 'phone-pad',
        required: true,
        icon: '📱',
        description: 'Primary phone number for your business',
        tips: ['Include country code for international clients'],
      })}

      {renderInputField('address', 'Business Address', {
        placeholder:
          'Complete business address including street, city, and postal code',
        multiline: true,
        icon: '🏠',
        description: 'Physical location of your business',
        tips: [
          'Include complete address for credibility',
          'This helps with local search visibility',
        ],
      })}

      {renderInputField('service_location', 'Service Coverage Areas', {
        placeholder: 'Cities, regions, or areas where you provide services',
        icon: '📍',
        description: 'Geographic areas where you offer your services',
        tips: [
          'Be specific about your coverage area',
          'Include nearby cities if you travel for work',
          'This helps clients find you based on location',
        ],
      })}
    </View>
  );

  const renderBusinessServices = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Business Services</Text>
          <Text style={styles.sectionDescription}>
            What services does your company offer to clients?
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
          placeholder="e.g., Web Development, Digital Marketing, Consulting..."
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
              <Text style={styles.serviceTagText}>
                {typeof service === 'string'
                  ? service
                  : service?.name ||
                    service?.title ||
                    service?.service_title ||
                    'Service'}
              </Text>
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
            Add services to help clients understand what your company offers
          </Text>
        </View>
      )}

      <View style={styles.serviceTips}>
        <Text style={styles.serviceTipsTitle}>💡 Service Tips:</Text>
        <Text style={styles.serviceTip}>
          • Be specific about what you offer (e.g., "WordPress Development")
        </Text>
        <Text style={styles.serviceTip}>
          • Include your company's main specialties
        </Text>
        <Text style={styles.serviceTip}>
          • Use industry terms clients would search for
        </Text>
        <Text style={styles.serviceTip}>
          • Focus on services that generate the most revenue
        </Text>
      </View>
    </View>
  );

  const renderBusinessLicense = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>
            Business License & Credentials
          </Text>
          <Text style={styles.sectionDescription}>
            Upload your official business license for verification
          </Text>
        </View>
        <View style={styles.licenseBadge}>
          <Text style={styles.licenseBadgeText}>Verification</Text>
        </View>
      </View>

      <View style={styles.licenseContainer}>
        {company?.license_img || selectedImages.license_img ? (
          <View style={styles.selectedLicenseContainer}>
            <Image
              source={{uri: company?.license_img || selectedImages.license_img}}
              style={styles.licenseImage}
            />
            <View style={styles.licenseOverlay}>
              <TouchableOpacity
                style={styles.changeLicenseButton}
                onPress={() => handleImagePicker('license_img')}>
                <Text style={styles.changeLicenseIcon}>📷</Text>
                <Text style={styles.changeLicenseButtonText}>
                  Change License
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.licensePlaceholder}
            onPress={() => handleImagePicker('license_img')}>
            <Text style={styles.licensePlaceholderIcon}>📄</Text>
            <Text style={styles.licensePlaceholderTitle}>
              Upload Business License
            </Text>
            <Text style={styles.licensePlaceholderSubtitle}>
              Add your official business registration or license document
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.licenseInfo}>
        <View style={styles.licenseInfoItem}>
          <Text style={styles.licenseInfoIcon}>✅</Text>
          <Text style={styles.licenseInfoText}>
            Builds client trust and credibility
          </Text>
        </View>
        <View style={styles.licenseInfoItem}>
          <Text style={styles.licenseInfoIcon}>🏛️</Text>
          <Text style={styles.licenseInfoText}>Shows legal compliance</Text>
        </View>
        <View style={styles.licenseInfoItem}>
          <Text style={styles.licenseInfoIcon}>🔒</Text>
          <Text style={styles.licenseInfoText}>Secure document storage</Text>
        </View>
      </View>

      <View style={styles.licenseTips}>
        <Text style={styles.licenseTipsTitle}>💡 License Tips:</Text>
        <Text style={styles.licenseTip}>
          • Upload clear, high-quality images
        </Text>
        <Text style={styles.licenseTip}>• Ensure all text is readable</Text>
        <Text style={styles.licenseTip}>
          • Include valid business registration documents
        </Text>
      </View>
    </View>
  );

  const renderPreviewSection = () => {
    if (!showPreview) {
      return null;
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏢 Company Preview</Text>
        <Text style={styles.sectionDescription}>
          How your company profile will appear to clients
        </Text>

        <View style={styles.previewCard}>
          {/* Banner Preview */}
          <View style={styles.previewBanner}>
            {company?.banner ? (
              <Image
                source={{uri: company.banner}}
                style={styles.previewBannerImage}
              />
            ) : (
              <View style={styles.previewBannerPlaceholder}>
                <Text style={styles.previewBannerText}>🎨</Text>
              </View>
            )}
          </View>

          {/* Company Info Preview */}
          <View style={styles.previewContent}>
            <View style={styles.previewHeader}>
              <View style={styles.previewLogo}>
                {company?.logo ? (
                  <Image
                    source={{uri: company.logo}}
                    style={styles.previewLogoImage}
                  />
                ) : (
                  <Text style={styles.previewLogoText}>🏢</Text>
                )}
              </View>
              <View style={styles.previewInfo}>
                <Text style={styles.previewCompanyName}>
                  {formData.name || 'Your Company Name'}
                </Text>
                <Text style={styles.previewOwnerName}>
                  Owner: {formData.owner_name || 'Owner Name'}
                </Text>
                {formData.experience && (
                  <Text style={styles.previewExperience}>
                    ⭐ {formData.experience} years in business
                  </Text>
                )}
              </View>
            </View>

            {formData.description && (
              <Text style={styles.previewDescription} numberOfLines={3}>
                {formData.description}
              </Text>
            )}

            <View style={styles.previewContact}>
              <Text style={styles.previewContactItem}>
                📧 {formData.business_email || 'business@email.com'}
              </Text>
              <Text style={styles.previewContactItem}>
                📱 {formData.phone_number || 'Phone Number'}
              </Text>
              {formData.service_location && (
                <Text style={styles.previewContactItem}>
                  📍 {formData.service_location}
                </Text>
              )}
            </View>

            {formData.services.length > 0 && (
              <View style={styles.previewServices}>
                {formData.services.slice(0, 3).map((service, index) => (
                  <View key={index} style={styles.previewServiceTag}>
                    <Text style={styles.previewServiceText}>
                      {typeof service === 'string'
                        ? service
                        : service?.name || 'Service'}
                    </Text>
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
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={createSectionsData()}
        renderItem={renderSection}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderStickyHeader}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
};

EditCompanyScreen.displayName = 'EditCompanyScreen';

const styles = StyleSheet.create({
  // Add these new styles:
  flatListContent: {
    paddingBottom: 40, // Bottom nav space
  },

  // ✅ Update pageHeader to stickyHeader:
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

  // Remove old pageHeader style
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Enhanced Header

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

  // Enhanced Branding Section
  brandingItem: {
    marginBottom: 24,
  },
  brandingItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  brandingItemDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  bannerContainer: {
    marginBottom: 12,
  },
  selectedBannerContainer: {
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  changeBannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeBannerIcon: {
    fontSize: 14,
  },
  changeBannerButtonText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  bannerPlaceholder: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  bannerPlaceholderIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  bannerPlaceholderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  bannerPlaceholderSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 200,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedLogoContainer: {
    position: 'relative',
  },
  companyLogo: {
    width: 100,
    height: 100,
    borderRadius: 50,
    resizeMode: 'cover',
  },
  changeLogoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  changeLogoIcon: {
    fontSize: 14,
  },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  logoPlaceholderIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  logoPlaceholderTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  brandingTips: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
  },
  brandingTipsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  brandingTip: {
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

  // Enhanced License Section
  licenseBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  licenseBadgeText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: '600',
  },
  licenseContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedLicenseContainer: {
    position: 'relative',
  },
  licenseImage: {
    width: width - 112,
    height: 180,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  licenseOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  changeLicenseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changeLicenseIcon: {
    fontSize: 14,
  },
  changeLicenseButtonText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  licensePlaceholder: {
    width: width - 112,
    height: 180,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  licensePlaceholderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  licensePlaceholderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  licensePlaceholderSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 200,
  },
  licenseInfo: {
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  licenseInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  licenseInfoIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  licenseInfoText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  licenseTips: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
  },
  licenseTipsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  licenseTip: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 2,
  },

  // Preview Section
  previewCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  previewBanner: {
    height: 80,
  },
  previewBannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewBannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBannerText: {
    fontSize: 24,
    color: colors.background,
  },
  previewContent: {
    padding: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  previewLogo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: -30,
    borderWidth: 3,
    borderColor: '#F8F9FA',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  previewLogoImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  previewLogoText: {
    fontSize: 24,
  },
  previewInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  previewCompanyName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  previewOwnerName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  previewExperience: {
    fontSize: 12,
    color: colors.splashGreen,
    fontWeight: '500',
  },
  previewDescription: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    marginBottom: 12,
  },
  previewContact: {
    marginBottom: 12,
  },
  previewContactItem: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
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

  bottomSpacer: {
    height: 40,
  },
});

export default EditCompanyScreen;
