import React, {useState, useEffect} from 'react';
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
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Plus,
  Minus,
  X,
  Camera,
  Image as ImageIcon,
  Save,
  ChevronDown,
  Loader,
} from 'lucide-react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {getService, updateService} from '../../../api/serviceSupplier';
import {useRoute, useNavigation} from '@react-navigation/native';
import {useContext} from 'react';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../context/BackendContext';

const EditServiceScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {backendUrl} = useContext(BackendContext);

  const serviceId = route.params?.serviceId;
  const initialServiceData = route.params?.serviceData;

  // Form state
  const [formData, setFormData] = useState({
    service_title: '',
    service_category: '',
    service_description: '',
    service_location: '',
    service_status: true,
    service_images: [],
    service_tags: [],
    service_faqs: [{question: '', answer: ''}],
    service_process: [{step: ''}],
    service_feature: [{feature: ''}],
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [imagePickerModalVisible, setImagePickerModalVisible] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});

  const categories = [
    {
      value: 'general_construction_services',
      label: 'General Construction Services',
    },
    {value: 'structural_services', label: 'Structural Services'},
    {value: 'electrical', label: 'Electrical'},
    {value: 'plumbing', label: 'Plumbing'},
    {value: 'hvac', label: 'HVAC'},
    {value: 'landscaping', label: 'Landscaping'},
    {value: 'interior_design', label: 'Interior Design'},
    {value: 'home_renovation', label: 'Home Renovation'},
  ];

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

  // Fetch service details
  const fetchServiceDetails = React.useCallback(async () => {
    if (!serviceId) {
      Alert.alert('Error', 'Service ID not found');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      const response = await getService(serviceId);

      if (response && response.service) {
        const service = response.service;
        setFormData({
          service_title: service.service_title || '',
          service_category: service.service_category || '',
          service_description: service.service_description || '',
          service_location: service.service_location || '',
          service_status: service.service_status || true,
          service_images: service.service_images || [],
          service_tags: service.service_tags || [],
          service_faqs:
            service.service_faqs?.length > 0
              ? service.service_faqs
              : [{question: '', answer: ''}],
          service_process:
            service.service_process?.length > 0
              ? service.service_process
              : [{step: ''}],
          service_feature:
            service.service_feature?.length > 0
              ? service.service_feature
              : [{feature: ''}],
        });
      }
    } catch (error) {
      console.error('Failed to load service details:', error);
      Alert.alert('Error', 'Unable to load service details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [serviceId, navigation]);

  // Initialize form with service data
  useEffect(() => {
    if (initialServiceData) {
      // Use provided data
      const service = initialServiceData;
      setFormData({
        service_title: service.service_title || '',
        service_category: service.service_category || '',
        service_description: service.service_description || '',
        service_location: service.service_location || '',
        service_status: service.service_status || true,
        service_images: service.service_images || [],
        service_tags: service.service_tags || [],
        service_faqs:
          service.service_faqs?.length > 0
            ? service.service_faqs
            : [{question: '', answer: ''}],
        service_process:
          service.service_process?.length > 0
            ? service.service_process
            : [{step: ''}],
        service_feature:
          service.service_feature?.length > 0
            ? service.service_feature
            : [{feature: ''}],
      });
    } else {
      // Fetch from API
      fetchServiceDetails();
    }
  }, [serviceId, initialServiceData, fetchServiceDetails]);

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.service_title.trim()) {
      newErrors.service_title = 'Service title is required';
    }

    if (!formData.service_category) {
      newErrors.service_category = 'Service category is required';
    }

    if (!formData.service_description.trim()) {
      newErrors.service_description = 'Service description is required';
    }

    if (
      formData.service_faqs.some(
        faq => !faq.question.trim() || !faq.answer.trim(),
      )
    ) {
      newErrors.service_faqs = 'All FAQ questions and answers are required';
    }

    if (formData.service_process.some(process => !process.step.trim())) {
      newErrors.service_process = 'All process steps are required';
    }

    if (formData.service_feature.some(feature => !feature.feature.trim())) {
      newErrors.service_feature = 'All service features are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors and try again');
      return;
    }

    setSaving(true);
    try {
      const response = await updateService({
        service_id: serviceId,
        ...formData,
      });

      Alert.alert(
        'Success',
        response.message || 'Service updated successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      console.error('Update service failed:', error);
      Alert.alert('Error', error.message || 'Failed to update service');
    } finally {
      setSaving(false);
    }
  };

  // Handle image selection
  const handleImagePicker = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      selectionLimit: 5 - formData.service_images.length,
    };

    launchImageLibrary(options, response => {
      setImagePickerModalVisible(false);

      if (response.didCancel || response.errorMessage) {
        return;
      }

      if (response.assets) {
        const newImages = response.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || `service_image_${Date.now()}.jpg`,
        }));

        setFormData(prev => ({
          ...prev,
          service_images: [...prev.service_images, ...newImages],
        }));
      }
    });
  };

  // Remove image
  const removeImage = index => {
    Alert.alert('Remove Image', 'Are you sure you want to remove this image?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setFormData(prev => ({
            ...prev,
            service_images: prev.service_images.filter((_, i) => i !== index),
          }));
        },
      },
    ]);
  };

  // Handle category selection
  const selectCategory = category => {
    setFormData(prev => ({...prev, service_category: category.value}));
    setCategoryModalVisible(false);
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !formData.service_tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        service_tags: [...prev.service_tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = index => {
    setFormData(prev => ({
      ...prev,
      service_tags: prev.service_tags.filter((_, i) => i !== index),
    }));
  };

  // FAQ functions
  const addFAQ = () => {
    setFormData(prev => ({
      ...prev,
      service_faqs: [...prev.service_faqs, {question: '', answer: ''}],
    }));
  };

  const removeFAQ = index => {
    if (formData.service_faqs.length > 1) {
      setFormData(prev => ({
        ...prev,
        service_faqs: prev.service_faqs.filter((_, i) => i !== index),
      }));
    }
  };

  const updateFAQ = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      service_faqs: prev.service_faqs.map((faq, i) =>
        i === index ? {...faq, [field]: value} : faq,
      ),
    }));
  };

  // Process functions
  const addProcess = () => {
    setFormData(prev => ({
      ...prev,
      service_process: [...prev.service_process, {step: ''}],
    }));
  };

  const removeProcess = index => {
    if (formData.service_process.length > 1) {
      setFormData(prev => ({
        ...prev,
        service_process: prev.service_process.filter((_, i) => i !== index),
      }));
    }
  };

  const updateProcess = (index, value) => {
    setFormData(prev => ({
      ...prev,
      service_process: prev.service_process.map((process, i) =>
        i === index ? {step: value} : process,
      ),
    }));
  };

  // Feature functions
  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      service_feature: [...prev.service_feature, {feature: ''}],
    }));
  };

  const removeFeature = index => {
    if (formData.service_feature.length > 1) {
      setFormData(prev => ({
        ...prev,
        service_feature: prev.service_feature.filter((_, i) => i !== index),
      }));
    }
  };

  const updateFeature = (index, value) => {
    setFormData(prev => ({
      ...prev,
      service_feature: prev.service_feature.map((feature, i) =>
        i === index ? {feature: value} : feature,
      ),
    }));
  };

  const selectedCategory = categories.find(
    cat => cat.value === formData.service_category,
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading service details...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Edit Service</Text>
          <Text style={styles.headerSubtitle}>
            {formData.service_title || 'Service Details'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.headerButton, styles.saveButton]}
          onPress={handleSubmit}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Save color={colors.background} size={20} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.contentContainer}>
          {/* Basic Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            {/* Service Title */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Service Title *</Text>
              <TextInput
                style={[
                  styles.textInput,
                  errors.service_title && styles.inputError,
                ]}
                placeholder="Enter service title"
                value={formData.service_title}
                onChangeText={text =>
                  setFormData(prev => ({...prev, service_title: text}))
                }
                multiline={false}
              />
              {errors.service_title && (
                <Text style={styles.errorText}>{errors.service_title}</Text>
              )}
            </View>

            {/* Service Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Service Category *</Text>
              <TouchableOpacity
                style={[
                  styles.selectButton,
                  errors.service_category && styles.inputError,
                ]}
                onPress={() => setCategoryModalVisible(true)}>
                <Text
                  style={[
                    styles.selectButtonText,
                    !selectedCategory && styles.selectPlaceholder,
                  ]}>
                  {selectedCategory
                    ? selectedCategory.label
                    : 'Select a category'}
                </Text>
                <ChevronDown color={colors.textSecondary} size={20} />
              </TouchableOpacity>
              {errors.service_category && (
                <Text style={styles.errorText}>{errors.service_category}</Text>
              )}
            </View>

            {/* Service Location */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Service Location</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter service location"
                value={formData.service_location}
                onChangeText={text =>
                  setFormData(prev => ({...prev, service_location: text}))
                }
                multiline={false}
              />
            </View>

            {/* Service Description */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Service Description *</Text>
              <TextInput
                style={[
                  styles.textAreaInput,
                  errors.service_description && styles.inputError,
                ]}
                placeholder="Describe your service in detail"
                value={formData.service_description}
                onChangeText={text =>
                  setFormData(prev => ({...prev, service_description: text}))
                }
                multiline={true}
                numberOfLines={6}
                textAlignVertical="top"
              />
              {errors.service_description && (
                <Text style={styles.errorText}>
                  {errors.service_description}
                </Text>
              )}
            </View>
          </View>

          {/* Service Images */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Images</Text>
            <Text style={styles.sectionDescription}>
              Upload up to 5 images showcasing your service
            </Text>

            <View style={styles.imagesContainer}>
              {formData.service_images.map((image, index) => (
                <View key={index} style={styles.imageItem}>
                  <Image
                    source={{
                      uri:
                        typeof image === 'string'
                          ? getFullImageUrl(image)
                          : image.uri,
                    }}
                    style={styles.serviceImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}>
                    <X color={colors.background} size={16} />
                  </TouchableOpacity>
                </View>
              ))}

              {formData.service_images.length < 5 && (
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={() => setImagePickerModalVisible(true)}>
                  <Plus color={colors.textSecondary} size={24} />
                  <Text style={styles.addImageText}>Add Image</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Service Status */}
          <View style={styles.section}>
            <View style={styles.switchContainer}>
              <View style={styles.switchInfo}>
                <Text style={styles.switchLabel}>Service Status</Text>
                <Text style={styles.switchDescription}>
                  Toggle service availability
                </Text>
              </View>
              <Switch
                value={formData.service_status}
                onValueChange={value =>
                  setFormData(prev => ({...prev, service_status: value}))
                }
                trackColor={{false: '#E0E0E0', true: colors.splashGreen + '50'}}
                thumbColor={
                  formData.service_status ? colors.splashGreen : '#FFFFFF'
                }
              />
            </View>
          </View>

          {/* Service FAQs */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            {formData.service_faqs.map((faq, index) => (
              <View key={index} style={styles.dynamicItem}>
                <View style={styles.dynamicItemHeader}>
                  <Text style={styles.dynamicItemTitle}>FAQ {index + 1}</Text>
                  {formData.service_faqs.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeFAQ(index)}>
                      <Minus color={colors.background} size={16} />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Question</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter FAQ question"
                    value={faq.question}
                    onChangeText={text => updateFAQ(index, 'question', text)}
                    multiline={false}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Answer</Text>
                  <TextInput
                    style={styles.textAreaInput}
                    placeholder="Enter FAQ answer"
                    value={faq.answer}
                    onChangeText={text => updateFAQ(index, 'answer', text)}
                    multiline={true}
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addButton} onPress={addFAQ}>
              <Plus color={colors.splashGreen} size={16} />
              <Text style={styles.addButtonText}>Add FAQ</Text>
            </TouchableOpacity>
            {errors.service_faqs && (
              <Text style={styles.errorText}>{errors.service_faqs}</Text>
            )}
          </View>

          {/* Service Process */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Process</Text>
            {formData.service_process.map((process, index) => (
              <View key={index} style={styles.dynamicItem}>
                <View style={styles.dynamicItemHeader}>
                  <Text style={styles.dynamicItemTitle}>Step {index + 1}</Text>
                  {formData.service_process.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeProcess(index)}>
                      <Minus color={colors.background} size={16} />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Process Step</Text>
                  <TextInput
                    style={styles.textAreaInput}
                    placeholder="Describe this step of your process"
                    value={process.step}
                    onChangeText={text => updateProcess(index, text)}
                    multiline={true}
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addButton} onPress={addProcess}>
              <Plus color={colors.splashGreen} size={16} />
              <Text style={styles.addButtonText}>Add Process Step</Text>
            </TouchableOpacity>
            {errors.service_process && (
              <Text style={styles.errorText}>{errors.service_process}</Text>
            )}
          </View>

          {/* Service Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Features</Text>
            {formData.service_feature.map((feature, index) => (
              <View key={index} style={styles.dynamicItem}>
                <View style={styles.dynamicItemHeader}>
                  <Text style={styles.dynamicItemTitle}>
                    Feature {index + 1}
                  </Text>
                  {formData.service_feature.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => removeFeature(index)}>
                      <Minus color={colors.background} size={16} />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Feature Description</Text>
                  <TextInput
                    style={styles.textAreaInput}
                    placeholder="Describe this feature of your service"
                    value={feature.feature}
                    onChangeText={text => updateFeature(index, text)}
                    multiline={true}
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            ))}

            <TouchableOpacity style={styles.addButton} onPress={addFeature}>
              <Plus color={colors.splashGreen} size={16} />
              <Text style={styles.addButtonText}>Add Feature</Text>
            </TouchableOpacity>
            {errors.service_feature && (
              <Text style={styles.errorText}>{errors.service_feature}</Text>
            )}
          </View>

          {/* Service Tags */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Service Tags</Text>
            <Text style={styles.sectionDescription}>
              Add tags to help customers find your service
            </Text>

            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder="Enter a tag and press Add"
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
              />
              <TouchableOpacity style={styles.tagAddButton} onPress={addTag}>
                <Plus color={colors.background} size={16} />
              </TouchableOpacity>
            </View>

            <View style={styles.tagsContainer}>
              {formData.service_tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(index)}>
                    <X color={colors.textSecondary} size={14} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </View>
      </ScrollView>

      {/* Category Selection Modal */}
      <Modal
        visible={categoryModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.categoryModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.categoryList}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.categoryItem,
                    formData.service_category === category.value &&
                      styles.selectedCategory,
                  ]}
                  onPress={() => selectCategory(category)}>
                  <Text
                    style={[
                      styles.categoryText,
                      formData.service_category === category.value &&
                        styles.selectedCategoryText,
                    ]}>
                    {category.label}
                  </Text>
                  {formData.service_category === category.value && (
                    <Save color={colors.splashGreen} size={20} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Image Picker Modal */}
      <Modal
        visible={imagePickerModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setImagePickerModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.imagePickerModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Images</Text>
              <TouchableOpacity
                onPress={() => setImagePickerModalVisible(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.imagePickerOption}
              onPress={handleImagePicker}>
              <ImageIcon color={colors.splashGreen} size={24} />
              <Text style={styles.imagePickerText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
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
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: colors.splashGreen,
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
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 2,
  },

  // Content
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 12,
  },

  // Input Groups
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
    backgroundColor: colors.background,
  },
  textAreaInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
    backgroundColor: colors.background,
    minHeight: 100,
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    fontSize: fontSizes.sm,
    color: '#F44336',
    fontFamily: fonts.regular,
    marginTop: 4,
  },

  // Select Button
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  selectButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  selectPlaceholder: {
    color: colors.textSecondary,
  },

  // Images
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageItem: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F44336',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageButton: {
    width: 80,
    height: 80,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
  },
  addImageText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 4,
  },

  // Switch
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  switchDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 2,
  },

  // Dynamic Items
  dynamicItem: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: colors.background,
    marginBottom: 12,
  },
  dynamicItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dynamicItemTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.text,
  },
  removeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F44336',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.splashGreen,
    borderRadius: 8,
    backgroundColor: colors.background,
    gap: 8,
  },
  addButtonText: {
    fontSize: fontSizes.base,
    color: colors.splashGreen,
    fontFamily: fonts.medium,
  },

  // Tags
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
    backgroundColor: colors.background,
  },
  tagAddButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.regular,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  categoryModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
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

  // Category List
  categoryList: {
    maxHeight: 400,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedCategory: {
    backgroundColor: colors.splashGreen + '10',
  },
  categoryText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  selectedCategoryText: {
    color: colors.splashGreen,
    fontFamily: fonts.medium,
  },

  // Image Picker
  imagePickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 16,
  },
  imagePickerText: {
    fontSize: fontSizes.lg,
    color: colors.text,
    fontFamily: fonts.regular,
  },

  bottomSpacing: {
    height: 20,
  },
});

export default EditServiceScreen;
