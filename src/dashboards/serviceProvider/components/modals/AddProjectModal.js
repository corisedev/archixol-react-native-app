import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import {
  X,
  Upload,
  Calendar,
  FileText,
  MapPin,
  Folder,
  Camera,
  Image as ImageIcon,
} from 'lucide-react-native';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {colors} from '../../../../utils/colors';
import {fonts, fontSizes} from '../../../../utils/fonts';
import {addProject, updateProject} from '../../../../api/serviceProvider';

const AddProjectModal = ({
  visible,
  onClose,
  onSuccess,
  editData = null, // For edit mode
}) => {
  const [loading, setLoading] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // Project categories
  const categories = [
    {label: 'Renovation', value: 'renovation'},
    {label: 'Architecture', value: 'architecture'},
    {label: 'Plumbing', value: 'plumbing'},
    {label: 'Electrical', value: 'electrical'},
    {label: 'Construction', value: 'construction'},
    {label: 'Interior Design', value: 'interior_design'},
    {label: 'Landscaping', value: 'landscaping'},
  ];

  // Form state
  const [formData, setFormData] = useState({
    project_title: editData?.project_title || '',
    project_category: editData?.project_category || '',
    project_location: editData?.project_location || '',
    project_description: editData?.project_description || '',
    start_date: editData?.start_date
      ? new Date(editData.start_date)
      : new Date(),
    end_date: editData?.end_date ? new Date(editData.end_date) : new Date(),
    project_imgs: editData?.project_imgs || [],
  });

  const [errors, setErrors] = useState({});

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!formData.project_title.trim()) {
      newErrors.project_title = 'Project title is required';
    }

    if (!formData.project_category) {
      newErrors.project_category = 'Project category is required';
    }

    if (!formData.project_location.trim()) {
      newErrors.project_location = 'Project location is required';
    }

    if (!formData.project_description.trim()) {
      newErrors.project_description = 'Project description is required';
    }

    if (formData.project_imgs.length === 0) {
      newErrors.project_imgs = 'At least one project image is required';
    }

    if (formData.end_date < formData.start_date) {
      newErrors.end_date = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  // Handle date change
  const handleDateChange = (event, selectedDate, dateType) => {
    if (dateType === 'start') {
      setShowStartDatePicker(false);
    } else {
      setShowEndDatePicker(false);
    }

    if (selectedDate) {
      handleInputChange(
        dateType === 'start' ? 'start_date' : 'end_date',
        selectedDate,
      );
    }
  };

  // Format date for display
  const formatDate = date => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle image selection
  const handleImageSelection = type => {
    setShowImageOptions(false);

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      selectionLimit: 5 - formData.project_imgs.length, // Limit based on remaining slots
    };

    const callback = response => {
      if (response.didCancel || response.error) {
        return;
      }

      if (response.assets && response.assets.length > 0) {
        const newImages = response.assets.map(asset => ({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || `project_${Date.now()}.jpg`,
        }));

        const updatedImages = [...formData.project_imgs, ...newImages].slice(
          0,
          5,
        );
        handleInputChange('project_imgs', updatedImages);
      }
    };

    if (type === 'camera') {
      launchCamera(options, callback);
    } else {
      launchImageLibrary(options, callback);
    }
  };

  // Remove image
  const removeImage = index => {
    const updatedImages = formData.project_imgs.filter((_, i) => i !== index);
    handleInputChange('project_imgs', updatedImages);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        project_title: formData.project_title.trim(),
        project_category: formData.project_category,
        project_location: formData.project_location.trim(),
        project_description: formData.project_description.trim(),
        start_date: formData.start_date.toISOString().split('T')[0],
        end_date: formData.end_date.toISOString().split('T')[0],
        project_imgs: formData.project_imgs,
      };

      // Add project_id for edit mode
      if (editData) {
        submitData.project_id = editData.id;
      }

      const response = editData
        ? await updateProject(submitData)
        : await addProject(submitData);

      Alert.alert(
        'Success',
        editData
          ? 'Project updated successfully!'
          : 'Project added successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              resetForm();
              onClose();
              onSuccess && onSuccess(response);
            },
          },
        ],
      );
    } catch (error) {
      console.error('Project submission error:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.error ||
          'Failed to save project. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      project_title: '',
      project_category: '',
      project_location: '',
      project_description: '',
      start_date: new Date(),
      end_date: new Date(),
      project_imgs: [],
    });
    setErrors({});
  };

  // Handle modal close
  const handleClose = () => {
    if (!editData) {
      resetForm();
    }
    onClose();
  };

  // Get selected category label
  const getSelectedCategoryLabel = () => {
    const category = categories.find(
      cat => cat.value === formData.project_category,
    );
    return category ? category.label : 'Select Category';
  };

  // Render image item
  const renderImageItem = ({item, index}) => (
    <View style={styles.imageItem}>
      <Image
        source={{uri: item.uri || item}}
        style={styles.imagePreview}
        resizeMode="cover"
      />
      <TouchableOpacity
        style={styles.removeImageButton}
        onPress={() => removeImage(index)}
        disabled={loading}>
        <X color={colors.background} size={16} />
      </TouchableOpacity>
      {index === 0 && (
        <View style={styles.coverBadge}>
          <Text style={styles.coverText}>Cover</Text>
        </View>
      )}
    </View>
  );

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={loading}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>
                {editData ? 'Edit Project' : 'Add Project'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {editData
                  ? 'Update your project details'
                  : 'Add a new project to your portfolio'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!formData.project_title ||
                  !formData.project_category ||
                  loading) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={
                !formData.project_title || !formData.project_category || loading
              }>
              {loading ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {editData ? 'Update' : 'Save'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* Project Title */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Project Title <Text style={styles.required}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.project_title && styles.inputError,
                ]}>
                <FileText color={colors.textSecondary} size={20} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Modern Kitchen Renovation"
                  value={formData.project_title}
                  onChangeText={value =>
                    handleInputChange('project_title', value)
                  }
                  editable={!loading}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              {errors.project_title && (
                <Text style={styles.errorText}>{errors.project_title}</Text>
              )}
            </View>

            {/* Project Category */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Project Category <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[
                  styles.inputContainer,
                  errors.project_category && styles.inputError,
                ]}
                onPress={() => setShowCategoryPicker(true)}
                disabled={loading}>
                <Folder color={colors.textSecondary} size={20} />
                <Text
                  style={[
                    styles.dateText,
                    !formData.project_category && styles.placeholderText,
                  ]}>
                  {getSelectedCategoryLabel()}
                </Text>
              </TouchableOpacity>
              {errors.project_category && (
                <Text style={styles.errorText}>{errors.project_category}</Text>
              )}
            </View>

            {/* Project Location */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Project Location <Text style={styles.required}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.project_location && styles.inputError,
                ]}>
                <MapPin color={colors.textSecondary} size={20} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., New York, NY"
                  value={formData.project_location}
                  onChangeText={value =>
                    handleInputChange('project_location', value)
                  }
                  editable={!loading}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              {errors.project_location && (
                <Text style={styles.errorText}>{errors.project_location}</Text>
              )}
            </View>

            {/* Date Range */}
            <View style={styles.dateRangeContainer}>
              <View style={styles.dateFieldContainer}>
                <Text style={styles.fieldLabel}>Start Date</Text>
                <TouchableOpacity
                  style={styles.inputContainer}
                  onPress={() => setShowStartDatePicker(true)}
                  disabled={loading}>
                  <Calendar color={colors.textSecondary} size={20} />
                  <Text style={styles.dateText}>
                    {formatDate(formData.start_date)}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.dateFieldContainer}>
                <Text style={styles.fieldLabel}>End Date</Text>
                <TouchableOpacity
                  style={[
                    styles.inputContainer,
                    errors.end_date && styles.inputError,
                  ]}
                  onPress={() => setShowEndDatePicker(true)}
                  disabled={loading}>
                  <Calendar color={colors.textSecondary} size={20} />
                  <Text style={styles.dateText}>
                    {formatDate(formData.end_date)}
                  </Text>
                </TouchableOpacity>
                {errors.end_date && (
                  <Text style={styles.errorText}>{errors.end_date}</Text>
                )}
              </View>
            </View>

            {/* Project Description */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Project Description <Text style={styles.required}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.project_description && styles.inputError,
                ]}>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Describe your project in detail..."
                  value={formData.project_description}
                  onChangeText={value =>
                    handleInputChange('project_description', value)
                  }
                  multiline={true}
                  numberOfLines={6}
                  textAlignVertical="top"
                  editable={!loading}
                  placeholderTextColor={colors.textSecondary}
                  maxLength={600}
                />
              </View>
              <Text style={styles.characterCount}>
                {formData.project_description.length}/600 characters
              </Text>
              {errors.project_description && (
                <Text style={styles.errorText}>
                  {errors.project_description}
                </Text>
              )}
            </View>

            {/* Project Images */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Project Images <Text style={styles.required}>*</Text>
              </Text>
              <Text style={styles.imageHint}>
                First image will be used as cover image. Maximum 5 images
                allowed.
              </Text>

              {formData.project_imgs.length > 0 && (
                <FlatList
                  data={formData.project_imgs}
                  renderItem={renderImageItem}
                  keyExtractor={(item, index) => index.toString()}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.imagesList}
                  contentContainerStyle={styles.imagesListContent}
                />
              )}

              {formData.project_imgs.length < 5 && (
                <TouchableOpacity
                  style={[
                    styles.imageUploadContainer,
                    errors.project_imgs && styles.inputError,
                  ]}
                  onPress={() => setShowImageOptions(true)}
                  disabled={loading}>
                  <Upload color={colors.textSecondary} size={32} />
                  <Text style={styles.uploadText}>
                    {formData.project_imgs.length === 0
                      ? 'Upload Project Images'
                      : 'Add More Images'}
                  </Text>
                  <Text style={styles.uploadSubtext}>
                    JPG, PNG or WEBP (Max 2MB each)
                  </Text>
                </TouchableOpacity>
              )}

              {errors.project_imgs && (
                <Text style={styles.errorText}>{errors.project_imgs}</Text>
              )}
            </View>
          </ScrollView>

          {/* Date Pickers */}
          {showStartDatePicker && (
            <DateTimePicker
              value={formData.start_date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => handleDateChange(event, date, 'start')}
              maximumDate={new Date()}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={formData.end_date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, date) => handleDateChange(event, date, 'end')}
              minimumDate={formData.start_date}
            />
          )}
        </KeyboardAvoidingView>
      </Modal>

      {/* Category Picker Modal */}
      <Modal
        visible={showCategoryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCategoryPicker(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerModal}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setShowCategoryPicker(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.pickerOptions}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.pickerOption,
                    formData.project_category === category.value &&
                      styles.selectedOption,
                  ]}
                  onPress={() => {
                    handleInputChange('project_category', category.value);
                    setShowCategoryPicker(false);
                  }}>
                  <Text
                    style={[
                      styles.pickerOptionText,
                      formData.project_category === category.value &&
                        styles.selectedOptionText,
                    ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Image Selection Modal */}
      <Modal
        visible={showImageOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowImageOptions(false)}>
        <View style={styles.imageOptionsOverlay}>
          <View style={styles.imageOptionsModal}>
            <View style={styles.imageOptionsHeader}>
              <Text style={styles.imageOptionsTitle}>Select Images</Text>
              <TouchableOpacity onPress={() => setShowImageOptions(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.imageOption}
              onPress={() => handleImageSelection('camera')}>
              <Camera color={colors.text} size={24} />
              <Text style={styles.imageOptionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.imageOption}
              onPress={() => handleImageSelection('gallery')}>
              <ImageIcon color={colors.text} size={24} />
              <Text style={styles.imageOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  closeButton: {
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
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Form Fields
  fieldContainer: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.text,
    marginBottom: 8,
  },
  required: {
    color: '#F44336',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  inputError: {
    borderColor: '#F44336',
    backgroundColor: '#FFF5F5',
  },
  textInput: {
    flex: 1,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
    padding: 0,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateText: {
    flex: 1,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: fontSizes.sm,
    color: '#F44336',
    fontFamily: fonts.regular,
    marginTop: 4,
  },
  characterCount: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 4,
    textAlign: 'right',
  },

  // Date Range
  dateRangeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dateFieldContainer: {
    flex: 1,
  },

  // Images
  imageHint: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 12,
  },
  imagesList: {
    marginBottom: 12,
  },
  imagesListContent: {
    paddingRight: 16,
  },
  imageItem: {
    position: 'relative',
    marginRight: 12,
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coverText: {
    fontSize: fontSizes.xs,
    color: colors.background,
    fontFamily: fonts.medium,
  },
  imageUploadContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.medium,
    color: colors.text,
    marginTop: 12,
  },
  uploadSubtext: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 4,
  },

  // Picker Modal
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  pickerOptions: {
    paddingBottom: 20,
  },
  pickerOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  selectedOption: {
    backgroundColor: '#F0F8FF',
  },
  pickerOptionText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
    textTransform: 'capitalize',
  },
  selectedOptionText: {
    color: colors.splashGreen,
    fontFamily: fonts.medium,
  },

  // Image Options Modal
  imageOptionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  imageOptionsModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  imageOptionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  imageOptionsTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  imageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  imageOptionText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
  },
});

export default AddProjectModal;
