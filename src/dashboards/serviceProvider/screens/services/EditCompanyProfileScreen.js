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
  TextInput,
  SafeAreaView,
  StatusBar,
  Modal,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Building,
  Upload,
  X,
  Save,
  Camera,
  Image as ImageIcon,
  FileText,
  Plus,
  Minus,
} from 'lucide-react-native';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {colors} from '../../../../utils/colors';
import {fonts, fontSizes} from '../../../../utils/fonts';
import {getCompany, updateCompany} from '../../../../api/serviceProvider';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useContext} from 'react';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../../context/BackendContext';

const EditCompanyProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {backendUrl} = useContext(BackendContext);

  // Form State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    logo: null,
    banner: null,
    license_img: null,
    name: '',
    business_email: '',
    type: '',
    BRN: '',
    tax_ntn: '',
    address: '',
    experience: '',
    description: '',
    owner_name: '',
    owner_cnic: '',
    phone_number: '',
    services_tags: [],
  });

  // Modal States
  const [imagePickerModal, setImagePickerModal] = useState(false);
  const [currentImageField, setCurrentImageField] = useState(null);
  const [companyTypeModal, setCompanyTypeModal] = useState(false);
  const [tagInputModal, setTagInputModal] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Company types
  const companyTypes = [
    {value: 'general_contractors', label: 'General Contractors'},
    {value: 'civil_engineering_firms', label: 'Civil Engineering Firms'},
    {
      value: 'residential_construction_companies',
      label: 'Residential Construction Companies',
    },
  ];

  // Get full image URL helper function
  const getFullImageUrl = relativePath => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;

    const baseUrl = backendUrl || VITE_API_BASE_URL;
    const cleanPath = relativePath.startsWith('/')
      ? relativePath.substring(1)
      : relativePath;
    return `${baseUrl}/${cleanPath}`;
  };

  // Fetch company data
  const fetchCompanyData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCompany();
      const company = response?.company || response;

      if (company) {
        setFormData({
          logo: company.logo ? {uri: getFullImageUrl(company.logo)} : null,
          banner: company.banner
            ? {uri: getFullImageUrl(company.banner)}
            : null,
          license_img: company.license_img
            ? {uri: getFullImageUrl(company.license_img)}
            : null,
          name: company.name || '',
          business_email: company.business_email || '',
          type: company.type || '',
          BRN: company.BRN || '',
          tax_ntn: company.tax_ntn || '',
          address: company.address || '',
          experience: company.experience?.toString() || '',
          description: company.description || '',
          owner_name: company.owner_name || '',
          owner_cnic: company.owner_cnic || '',
          phone_number: company.phone_number || '',
          services_tags: company.services_tags || [],
        });
      }
    } catch (error) {
      console.error('Failed to fetch company data:', error);
      Alert.alert('Error', 'Failed to load company data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanyData();
  }, [fetchCompanyData]);

  // Handle input change
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle image picker
  const handleImagePicker = field => {
    setCurrentImageField(field);
    setImagePickerModal(true);
  };

  // Launch camera
  const launchCameraHandler = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1000,
      maxHeight: 1000,
    };

    launchCamera(options, response => {
      setImagePickerModal(false);
      if (response.assets && response.assets[0]) {
        handleInputChange(currentImageField, {
          uri: response.assets[0].uri,
          type: response.assets[0].type,
          name: response.assets[0].fileName || `${currentImageField}.jpg`,
        });
      }
    });
  };

  // Launch image library
  const launchImageLibraryHandler = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1000,
      maxHeight: 1000,
    };

    launchImageLibrary(options, response => {
      setImagePickerModal(false);
      if (response.assets && response.assets[0]) {
        handleInputChange(currentImageField, {
          uri: response.assets[0].uri,
          type: response.assets[0].type,
          name: response.assets[0].fileName || `${currentImageField}.jpg`,
        });
      }
    });
  };

  // Handle document picker for license
  const handleDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.pdf,
          DocumentPicker.types.doc,
          DocumentPicker.types.docx,
        ],
      });

      if (result[0]) {
        handleInputChange('license_img', {
          uri: result[0].uri,
          type: result[0].type,
          name: result[0].name,
        });
      }
    } catch (error) {
      if (!DocumentPicker.isCancel(error)) {
        console.error('Document picker error:', error);
        Alert.alert('Error', 'Failed to pick document');
      }
    }
  };

  // Add service tag
  const handleAddTag = () => {
    if (newTag.trim()) {
      setFormData(prev => ({
        ...prev,
        services_tags: [...prev.services_tags, newTag.trim()],
      }));
      setNewTag('');
      setTagInputModal(false);
    }
  };

  // Remove service tag
  const handleRemoveTag = index => {
    setFormData(prev => ({
      ...prev,
      services_tags: prev.services_tags.filter((_, i) => i !== index),
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    try {
      setSaving(true);

      // Validate required fields
      if (!formData.name.trim()) {
        Alert.alert('Validation Error', 'Company name is required');
        return;
      }

      if (formData.business_email && !isValidEmail(formData.business_email)) {
        Alert.alert('Validation Error', 'Please enter a valid email address');
        return;
      }

      // Prepare form data for submission
      const submitData = {
        ...formData,
        experience: formData.experience
          ? parseInt(formData.experience)
          : undefined,
      };

      const response = await updateCompany(submitData);

      Alert.alert('Success', 'Company profile updated successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Update company profile error:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.error || 'Failed to update company profile',
      );
    } finally {
      setSaving(false);
    }
  };

  // Email validation
  const isValidEmail = email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Format company type label
  const getCompanyTypeLabel = value => {
    const type = companyTypes.find(t => t.value === value);
    return type ? type.label : 'Select Company Type';
  };

  // Render image upload component
  const renderImageUpload = (field, label, aspectRatio = 1) => {
    const image = formData[field];

    return (
      <View style={styles.uploadContainer}>
        <Text style={styles.uploadLabel}>{label}</Text>
        <TouchableOpacity
          style={[
            styles.uploadBox,
            aspectRatio === 16 / 9 && styles.uploadBoxWide,
          ]}
          onPress={() => handleImagePicker(field)}>
          {image ? (
            <>
              <Image source={{uri: image.uri}} style={styles.uploadedImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => handleInputChange(field, null)}>
                <X color={colors.background} size={16} />
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.uploadPlaceholder}>
              <Upload color={colors.textSecondary} size={32} />
              <Text style={styles.uploadPlaceholderText}>
                Tap to upload {label.toLowerCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Render text input
  const renderTextInput = (field, label, placeholder, options = {}) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.textInput, options.multiline && styles.textAreaInput]}
        value={formData[field]}
        onChangeText={value => handleInputChange(field, value)}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={options.keyboardType || 'default'}
        multiline={options.multiline || false}
        numberOfLines={options.numberOfLines || 1}
        maxLength={options.maxLength}
      />
      {options.maxLength && (
        <Text style={styles.characterCount}>
          {formData[field].length}/{options.maxLength} characters
        </Text>
      )}
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading company data...</Text>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Company Update Profile</Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <X color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Image Uploads */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Images</Text>
          <View style={styles.imageUploadsContainer}>
            {renderImageUpload('logo', 'Company Logo', 1)}
            {renderImageUpload('banner', 'Company Banner Image', 16 / 9)}
          </View>
        </View>

        {/* Company Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>

          {renderTextInput('name', 'Company Name', 'Enter company name')}

          {/* Company Type Selector */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Company Type</Text>
            <TouchableOpacity
              style={styles.selectInput}
              onPress={() => setCompanyTypeModal(true)}>
              <Text
                style={[
                  styles.selectInputText,
                  !formData.type && styles.selectInputPlaceholder,
                ]}>
                {getCompanyTypeLabel(formData.type)}
              </Text>
            </TouchableOpacity>
          </View>

          {renderTextInput(
            'BRN',
            'Business Registration Number',
            'TXR11564654466',
          )}
          {renderTextInput('tax_ntn', 'Tax ID/NTN', 'TXR11564654466')}
          {renderTextInput(
            'business_email',
            'Business Email',
            'company@example.com',
            {keyboardType: 'email-address'},
          )}
          {renderTextInput(
            'phone_number',
            'Phone Number',
            'Your contact number',
            {keyboardType: 'phone-pad'},
          )}
          {renderTextInput(
            'address',
            'Office Address',
            'Enter your office address',
          )}
          {renderTextInput(
            'experience',
            'Experience (Years)',
            'Enter experience in years',
            {keyboardType: 'numeric'},
          )}

          {/* Services Tags */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Services Provided</Text>
            <View style={styles.tagsContainer}>
              {formData.services_tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <TouchableOpacity
                    style={styles.tagRemoveButton}
                    onPress={() => handleRemoveTag(index)}>
                    <X color={colors.textSecondary} size={14} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                style={styles.addTagButton}
                onPress={() => setTagInputModal(true)}>
                <Plus color={colors.splashGreen} size={16} />
                <Text style={styles.addTagText}>Add Service</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.inputDescription}>
              Press enter to add service
            </Text>
          </View>
        </View>

        {/* About the Company */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About the Company</Text>
          {renderTextInput(
            'description',
            'Company Description',
            'Tell us about your company...',
            {
              multiline: true,
              numberOfLines: 6,
              maxLength: 600,
            },
          )}
        </View>

        {/* Ownership */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ownership</Text>
          {renderTextInput(
            'owner_name',
            'Owner/CEO Name',
            'Enter Owner/CEO Name',
          )}
          {renderTextInput(
            'owner_cnic',
            'CNIC/SSN of Owner',
            'Enter CNIC/SSN of Owner',
          )}

          {/* Business License Upload */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Business License Upload</Text>
            <TouchableOpacity
              style={styles.documentUploadBox}
              onPress={handleDocumentPicker}>
              {formData.license_img ? (
                <View style={styles.documentUploaded}>
                  <FileText color={colors.splashGreen} size={24} />
                  <Text style={styles.documentName}>
                    {formData.license_img.name}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeDocumentButton}
                    onPress={() => handleInputChange('license_img', null)}>
                    <X color={colors.textSecondary} size={16} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.documentUploadPlaceholder}>
                  <Upload color={colors.textSecondary} size={24} />
                  <Text style={styles.documentUploadText}>
                    Upload Business License
                  </Text>
                  <Text style={styles.documentUploadSubtext}>
                    PDF, DOC, DOCX (Max 5MB)
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={saving}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, saving && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <>
                <Save color={colors.background} size={18} />
                <Text style={styles.submitButtonText}>Submit</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Image Picker Modal */}
      <Modal
        visible={imagePickerModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setImagePickerModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.imagePickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Image</Text>
              <TouchableOpacity onPress={() => setImagePickerModal(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.imagePickerOptions}>
              <TouchableOpacity
                style={styles.imagePickerOption}
                onPress={launchCameraHandler}>
                <Camera color={colors.splashGreen} size={24} />
                <Text style={styles.imagePickerOptionText}>Take Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.imagePickerOption}
                onPress={launchImageLibraryHandler}>
                <ImageIcon color={colors.splashGreen} size={24} />
                <Text style={styles.imagePickerOptionText}>
                  Choose from Gallery
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Company Type Modal */}
      <Modal
        visible={companyTypeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCompanyTypeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.selectModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Company Type</Text>
              <TouchableOpacity onPress={() => setCompanyTypeModal(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.selectOptions}>
              {companyTypes.map(type => (
                <TouchableOpacity
                  key={type.value}
                  style={styles.selectOption}
                  onPress={() => {
                    handleInputChange('type', type.value);
                    setCompanyTypeModal(false);
                  }}>
                  <Text style={styles.selectOptionText}>{type.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Tag Input Modal */}
      <Modal
        visible={tagInputModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTagInputModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.tagInputModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Service</Text>
              <TouchableOpacity onPress={() => setTagInputModal(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                value={newTag}
                onChangeText={setNewTag}
                placeholder="Enter service name"
                placeholderTextColor={colors.textSecondary}
                autoFocus={true}
                onSubmitEditing={handleAddTag}
              />

              <View style={styles.tagInputActions}>
                <TouchableOpacity
                  style={styles.tagCancelButton}
                  onPress={() => {
                    setNewTag('');
                    setTagInputModal(false);
                  }}>
                  <Text style={styles.tagCancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.tagAddButton}
                  onPress={handleAddTag}>
                  <Text style={styles.tagAddButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    marginBottom: 10,
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
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Section
  section: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
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

  // Image Uploads
  imageUploadsContainer: {
    gap: 16,
  },
  uploadContainer: {
    marginBottom: 16,
  },
  uploadLabel: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 8,
  },
  uploadBox: {
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    backgroundColor: '#FAFAFA',
    position: 'relative',
    overflow: 'hidden',
  },
  uploadBoxWide: {
    height: 100,
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadPlaceholderText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text Inputs
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
    backgroundColor: colors.background,
  },
  textAreaInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  inputDescription: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginTop: 4,
  },

  // Select Input
  selectInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  selectInputText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  selectInputPlaceholder: {
    color: colors.textSecondary,
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.splashGreen,
  },
  tagRemoveButton: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  addTagText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.splashGreen,
  },

  // Document Upload
  documentUploadBox: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    minHeight: 120,
  },
  documentUploaded: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  licenseImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  documentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  documentName: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.text,
    textAlign: 'center',
  },
  removeDocumentButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
  },
  documentUploadPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  documentUploadText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  documentUploadSubtext: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Submit Container
  submitContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.splashGreen,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  submitButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  // Image Picker Modal
  imagePickerModal: {
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
  imagePickerOptions: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 16,
  },
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    gap: 16,
  },
  imagePickerOptionText: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  // Select Modal
  selectModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  selectOptions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  selectOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectOptionText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  // Tag Input Modal
  tagInputModal: {
    backgroundColor: colors.background,
    marginHorizontal: 20,
    borderRadius: 16,
    alignSelf: 'center',
    width: '90%',
    maxWidth: 400,
  },
  tagInputContainer: {
    padding: 20,
  },
  tagInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
    backgroundColor: colors.background,
    marginBottom: 16,
  },
  tagInputActions: {
    flexDirection: 'row',
    gap: 12,
  },
  tagCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    alignItems: 'center',
  },
  tagCancelButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  tagAddButton: {
    flex: 1,
    backgroundColor: colors.splashGreen,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tagAddButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },

  // Spacing
  bottomSpacing: {
    height: 32,
  },
});

export default EditCompanyProfileScreen;
