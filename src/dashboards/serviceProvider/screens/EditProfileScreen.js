import React, {useState, useEffect, useRef} from 'react';
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
  StatusBar,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import {
  ArrowLeft,
  Camera,
  Save,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  IdCard,
  Briefcase,
  Clock,
  Tag,
  Plus,
  Trash2,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {useRoute, useNavigation} from '@react-navigation/native';
import {useContext} from 'react';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../context/BackendContext';
// import ImagePicker from 'react-native-image-crop-picker';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {updateProfile} from '../../../api/serviceProvider';
import LocalFallbackImage from '../../../assets/images/BathroomRenovation.jpg';

const {width: screenWidth} = Dimensions.get('window');

const EditProfileScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {backendUrl} = useContext(BackendContext);

  // Get profile data from route params
  const initialProfileData = route.params?.profileData || {};

  // Form state
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullname: initialProfileData.fullname || '',
    email: initialProfileData.email || '',
    phone_number:
      initialProfileData.phone_number || initialProfileData.phone || '',
    address: initialProfileData.address || '',
    cnic: initialProfileData.cnic || '',
    website: initialProfileData.website || '',
    introduction:
      initialProfileData.introduction || initialProfileData.bio || '',
    service_location:
      initialProfileData.location || initialProfileData.service_location || '',
    experience: initialProfileData.experience
      ? String(initialProfileData.experience)
      : '',
    services_tags: initialProfileData.services_tags || [],
    profile_img: initialProfileData.profile_img || null,
    banner_img: initialProfileData.banner_img || null,
  });

  // Image states
  const [profileImageUri, setProfileImageUri] = useState(null);
  const [bannerImageUri, setBannerImageUri] = useState(null);
  const [newTag, setNewTag] = useState('');

  // Refs for scrolling
  const scrollViewRef = useRef(null);

  // Get full image URL helper function
  const getFullImageUrl = (relativePath, fallbackText = '') => {
    if (!relativePath || relativePath === '') {
      return Image.resolveAssetSource(LocalFallbackImage).uri;
    }

    if (relativePath.startsWith('http')) return relativePath;

    const baseUrl = backendUrl || VITE_API_BASE_URL;
    if (!baseUrl) {
      console.warn('No backend URL configured');
      return Image.resolveAssetSource(LocalFallbackImage).uri;
    }

    const cleanPath = relativePath.startsWith('/')
      ? relativePath.substring(1)
      : relativePath;

    const fullUrl = `${baseUrl}/${cleanPath}`;
    return fullUrl;
  };

  // Handle form field changes
  const updateFormField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle image picker
  const handleImagePicker = type => {
    Alert.alert('Select Image', 'Choose an option', [
      {text: 'Camera', onPress: () => openCamera(type)},
      {text: 'Gallery', onPress: () => openGallery(type)},
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  const openCamera = type => {
    ImagePicker.openCamera({
      width: type === 'profile' ? 400 : 800,
      height: type === 'profile' ? 400 : 400,
      cropping: true,
      compressImageQuality: 0.8,
      includeBase64: false,
    })
      .then(image => {
        if (type === 'profile') {
          setProfileImageUri(image.path);
          updateFormField('profile_img', image);
        } else {
          setBannerImageUri(image.path);
          updateFormField('banner_img', image);
        }
      })
      .catch(error => {
        console.log('Camera error:', error);
      });
  };

  const openGallery = type => {
    ImagePicker.openPicker({
      width: type === 'profile' ? 400 : 800,
      height: type === 'profile' ? 400 : 400,
      cropping: true,
      compressImageQuality: 0.8,
      includeBase64: false,
    })
      .then(image => {
        if (type === 'profile') {
          setProfileImageUri(image.path);
          updateFormField('profile_img', image);
        } else {
          setBannerImageUri(image.path);
          updateFormField('banner_img', image);
        }
      })
      .catch(error => {
        console.log('Gallery error:', error);
      });
  };

  // Handle adding new service tag
  const addServiceTag = () => {
    if (newTag.trim() && !formData.services_tags.includes(newTag.trim())) {
      updateFormField('services_tags', [
        ...formData.services_tags,
        newTag.trim(),
      ]);
      setNewTag('');
    }
  };

  // Handle removing service tag
  const removeServiceTag = tagToRemove => {
    updateFormField(
      'services_tags',
      formData.services_tags.filter(tag => tag !== tagToRemove),
    );
  };

  // Handle form validation
  const validateForm = () => {
    if (!formData.fullname.trim()) {
      Alert.alert('Validation Error', 'Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Validation Error', 'Email is required');
      return false;
    }
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    if (
      formData.phone_number &&
      !/^\+?[\d\s\-\(\)]+$/.test(formData.phone_number)
    ) {
      Alert.alert('Validation Error', 'Please enter a valid phone number');
      return false;
    }
    if (formData.experience && isNaN(formData.experience)) {
      Alert.alert('Validation Error', 'Experience must be a number');
      return false;
    }
    return true;
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Prepare form data for API
      const profileData = {
        ...formData,
        experience: formData.experience ? parseInt(formData.experience) : null,
      };

      // Remove empty fields
      Object.keys(profileData).forEach(key => {
        if (profileData[key] === '' || profileData[key] === null) {
          delete profileData[key];
        }
      });

      console.log('Updating profile with data:', profileData);

      const response = await updateProfile(profileData);

      if (response.success || response.message) {
        Alert.alert('Success', 'Profile updated successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to update profile. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle discard changes
  const handleDiscardChanges = () => {
    Alert.alert(
      'Discard Changes',
      'Are you sure you want to discard your changes?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ],
    );
  };

  // Render input field
  const renderInputField = (
    label,
    field,
    placeholder,
    icon,
    keyboardType = 'default',
    multiline = false,
    maxLength,
    editable = true,
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputWrapper, !editable && styles.inputDisabled]}>
        <View style={styles.inputIcon}>
          {React.createElement(icon, {
            color: colors.splashGreen,
            size: 20,
          })}
        </View>
        <TextInput
          style={[styles.textInput, multiline && styles.textInputMultiline]}
          value={formData[field]}
          onChangeText={value => updateFormField(field, value)}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType={keyboardType}
          multiline={multiline}
          maxLength={maxLength}
          editable={editable}
          numberOfLines={multiline ? 4 : 1}
        />
      </View>
      {maxLength && (
        <Text style={styles.characterCount}>
          {formData[field]?.length || 0}/{maxLength}
        </Text>
      )}
    </View>
  );

  // Render image upload section
  const renderImageUpload = (type, title, currentImage, selectedUri) => (
    <View style={styles.imageUploadContainer}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity
        style={[
          styles.imageUploadButton,
          type === 'banner' ? styles.bannerUpload : styles.profileUpload,
        ]}
        onPress={() => handleImagePicker(type)}>
        {selectedUri || currentImage ? (
          <Image
            source={{
              uri: selectedUri || getFullImageUrl(currentImage, 'Image'),
            }}
            style={[
              styles.uploadedImage,
              type === 'banner' ? styles.bannerImage : styles.profileImage,
            ]}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Camera color={colors.textSecondary} size={32} />
            <Text style={styles.uploadPlaceholderText}>
              Tap to upload {type} image
            </Text>
          </View>
        )}

        <View style={styles.uploadOverlay}>
          <Camera color={colors.background} size={20} />
        </View>
      </TouchableOpacity>
    </View>
  );

  // Render service tags section
  const renderServiceTags = () => (
    <View style={styles.tagsContainer}>
      <Text style={styles.sectionTitle}>Services & Skills</Text>

      {/* Existing tags */}
      <View style={styles.tagsWrapper}>
        {formData.services_tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
            <TouchableOpacity
              style={styles.tagRemove}
              onPress={() => removeServiceTag(tag)}>
              <X color={colors.splashGreen} size={14} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Add new tag */}
      <View style={styles.addTagContainer}>
        <View style={styles.addTagInputWrapper}>
          <TextInput
            style={styles.addTagInput}
            value={newTag}
            onChangeText={setNewTag}
            placeholder="Add a service or skill"
            placeholderTextColor={colors.textSecondary}
            onSubmitEditing={addServiceTag}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={styles.addTagButton}
            onPress={addServiceTag}
            disabled={!newTag.trim()}>
            <Plus
              color={newTag.trim() ? colors.background : colors.textSecondary}
              size={18}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        <TouchableOpacity
          style={[styles.headerButton, styles.saveButton]}
          onPress={handleSaveProfile}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Save color={colors.background} size={20} />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Profile Images Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Profile Images</Text>

            {renderImageUpload(
              'profile',
              'Profile Picture',
              formData.profile_img,
              profileImageUri,
            )}

            {renderImageUpload(
              'banner',
              'Banner Image',
              formData.banner_img,
              bannerImageUri,
            )}
          </View>

          {/* Personal Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>

            {renderInputField(
              'Full Name *',
              'fullname',
              'Enter your full name',
              User,
            )}

            {renderInputField(
              'Email Address *',
              'email',
              'Enter your email address',
              Mail,
              'email-address',
              false,
              undefined,
              false, // Email is usually not editable
            )}

            {renderInputField(
              'Phone Number',
              'phone_number',
              'Enter your phone number',
              Phone,
              'phone-pad',
            )}

            {renderInputField(
              'Address',
              'address',
              'Enter your address',
              MapPin,
            )}

            {renderInputField('CNIC', 'cnic', 'Enter your CNIC number', IdCard)}

            {renderInputField(
              'Website',
              'website',
              'Enter your website URL',
              Globe,
              'url',
            )}
          </View>

          {/* Professional Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Information</Text>

            {renderInputField(
              'Service Location',
              'service_location',
              'Enter your service area',
              MapPin,
            )}

            {renderInputField(
              'Years of Experience',
              'experience',
              'Enter years of experience',
              Clock,
              'numeric',
            )}

            {renderInputField(
              'About Yourself',
              'introduction',
              'Tell us about yourself, your skills and experience...',
              Briefcase,
              'default',
              true,
              600,
            )}
          </View>

          {/* Services & Skills Section */}
          <View style={styles.section}>{renderServiceTags()}</View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.splashGreen} />
            <Text style={styles.loadingText}>Updating profile...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header Styles
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.splashGreen,
  },

  // Content Styles
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Section Styles
  section: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 16,
  },

  // Input Styles
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  inputDisabled: {
    backgroundColor: '#F0F0F0',
    opacity: 0.7,
  },
  inputIcon: {
    paddingTop: 12,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
    paddingVertical: 12,
    minHeight: 44,
  },
  textInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },

  // Image Upload Styles
  imageUploadContainer: {
    marginBottom: 20,
  },
  imageUploadButton: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderStyle: 'dashed',
  },
  profileUpload: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    borderRadius: 60,
  },
  bannerUpload: {
    width: '100%',
    height: 120,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  profileImage: {
    borderRadius: 60,
  },
  bannerImage: {
    borderRadius: 12,
  },
  uploadPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  uploadPlaceholderText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  uploadOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tags Styles
  tagsContainer: {
    marginTop: 8,
  },
  tagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.splashGreen,
  },
  tagText: {
    fontSize: fontSizes.sm,
    color: colors.splashGreen,
    fontFamily: fonts.medium,
    marginRight: 6,
  },
  tagRemove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTagContainer: {
    marginTop: 8,
  },
  addTagInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingHorizontal: 12,
  },
  addTagInput: {
    flex: 1,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
    paddingVertical: 12,
    minHeight: 44,
  },
  addTagButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  // Loading Styles
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: colors.background,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  loadingText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.medium,
    marginTop: 12,
  },

  bottomSpacing: {
    height: 20,
  },
});

export default EditProfileScreen;
