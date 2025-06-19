import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
  Image,
} from 'react-native';
import {
  ArrowLeft,
  Save,
  Briefcase,
  MapPin,
  FileText,
  ChevronDown,
  X,
  Calendar,
  DollarSign,
  Clock,
  AlertTriangle,
  Paperclip,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {createJob} from '../../../api/client';
import {useNavigation} from '@react-navigation/native';
import {launchImageLibrary} from 'react-native-image-picker';

// Category options
const categoryOptions = [
  {
    label: 'General Construction Services',
    value: 'general_construction_services',
  },
  {label: 'Structural Services', value: 'structural_services'},
  {label: 'Electrical', value: 'electrical'},
  {label: 'Plumbing', value: 'plumbing'},
  {label: 'HVAC', value: 'hvac'},
  {label: 'Painting', value: 'painting'},
  {label: 'Carpentry', value: 'carpentry'},
  {label: 'Roofing', value: 'roofing'},
  {label: 'Flooring', value: 'flooring'},
  {label: 'Landscaping', value: 'landscaping'},
];

// Category Selection Modal Component
const CategoryModal = ({
  visible,
  onClose,
  selectedCategory,
  onCategorySelect,
}) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="slide"
    onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Service Category</Text>
          <TouchableOpacity onPress={onClose}>
            <X color={colors.textSecondary} size={20} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.categoryList}>
          {categoryOptions.map(category => (
            <TouchableOpacity
              key={category.value}
              style={[
                styles.categoryOption,
                selectedCategory === category.value &&
                  styles.selectedCategoryOption,
              ]}
              onPress={() => onCategorySelect(category)}>
              <Text
                style={[
                  styles.categoryOptionText,
                  selectedCategory === category.value &&
                    styles.selectedCategoryOptionText,
                ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  </Modal>
);

const CreateJobScreen = () => {
  const navigation = useNavigation();

  // Loading state
  const [saving, setSaving] = useState(false);

  // Category modal state
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    location: '',
    starting_date: '',
    days_project: '',
    details: '',
    urgent: false,
    budget: '',
    images: [],
    note: '',
  });

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle category selection
  const handleCategorySelect = category => {
    setFormData(prev => ({
      ...prev,
      category: category.value,
    }));
    setCategoryModalVisible(false);
  };

  // Get selected category label
  const getSelectedCategoryLabel = () => {
    const selected = categoryOptions.find(
      cat => cat.value === formData.category,
    );
    return selected ? selected.label : 'Select Service Category';
  };

  // Handle image picker
  const handleImagePicker = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
      selectionLimit: 5 - formData.images.length, // Limit remaining selections
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to pick images');
      } else if (response.errorMessage) {
        console.log('ImagePicker Error Message: ', response.errorMessage);
        Alert.alert('Error', response.errorMessage);
      } else {
        const images = response.assets || [];

        // Check if adding these images would exceed the limit
        if (formData.images.length + images.length > 5) {
          Alert.alert('Limit Exceeded', 'You can only upload up to 5 images');
          return;
        }

        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...images],
        }));
      }
    });
  };

  // Remove image
  const removeImage = index => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Format date for display
  const formatDateForDisplay = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Handle date input (you might want to use a proper date picker)
  const handleDateChange = text => {
    // Simple date validation for YYYY-MM-DD format
    handleInputChange('starting_date', text);
  };

  // Validate form
  const validateForm = () => {
    const errors = [];

    if (!formData.name.trim()) {
      errors.push('Job title is required');
    }

    if (!formData.category) {
      errors.push('Service category is required');
    }

    if (!formData.location.trim()) {
      errors.push('Location is required');
    }

    if (!formData.details.trim()) {
      errors.push('Job details are required');
    }

    if (
      !formData.budget ||
      isNaN(Number(formData.budget)) ||
      Number(formData.budget) <= 0
    ) {
      errors.push('Please enter a valid budget amount');
    }

    if (
      formData.starting_date &&
      !/^\d{4}-\d{2}-\d{2}$/.test(formData.starting_date)
    ) {
      errors.push('Please enter date in YYYY-MM-DD format');
    }

    return errors;
  };

  // Handle create job
  const handleCreate = async () => {
    try {
      // Validate form
      const errors = validateForm();
      if (errors.length > 0) {
        Alert.alert('Validation Error', errors.join('\n'));
        return;
      }

      setSaving(true);

      // Prepare job data
      const jobData = {
        name: formData.name.trim(),
        category: formData.category,
        location: formData.location.trim(),
        starting_date: formData.starting_date,
        days_project: formData.days_project,
        details: formData.details.trim(),
        urgent: formData.urgent,
        budget: Number(formData.budget),
        images: formData.images,
        note: formData.note.trim(),
      };

      console.log('Creating Job:', jobData);

      const response = await createJob(jobData);
      console.log('Create Response:', response);

      Alert.alert('Success', 'Job posted successfully!', [
        {
          text: 'View Job',
          onPress: () => {
            navigation.replace('JobDetailScreen', {
              jobId: response.job?.id || response.job?._id,
            });
          },
        },
        {
          text: 'Post Another',
          onPress: () => {
            // Reset form
            setFormData({
              name: '',
              category: '',
              location: '',
              starting_date: '',
              days_project: '',
              details: '',
              urgent: false,
              budget: '',
              images: [],
              note: '',
            });
          },
        },
      ]);
    } catch (error) {
      console.error('Failed to create job:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to post job. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Post Job</Text>

        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Job Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Briefcase color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Job Information</Text>
          </View>

          {/* Job Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Job Title</Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={text => handleInputChange('name', text)}
              placeholder="Enter job title"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
            />
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Service Category</Text>
            <TouchableOpacity
              style={styles.pickerInput}
              onPress={() => setCategoryModalVisible(true)}>
              <Text
                style={[
                  styles.pickerText,
                  !formData.category && styles.placeholderText,
                ]}>
                {getSelectedCategoryLabel()}
              </Text>
              <ChevronDown color={colors.textSecondary} size={16} />
            </TouchableOpacity>
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Location</Text>
            <TextInput
              style={styles.textInput}
              value={formData.location}
              onChangeText={text => handleInputChange('location', text)}
              placeholder="Enter job location"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
            />
          </View>

          {/* Starting Date & Days */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Starting Date</Text>
              <TextInput
                style={styles.textInput}
                value={formData.starting_date}
                onChangeText={handleDateChange}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Project Duration (Days)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.days_project}
                onChangeText={text => handleInputChange('days_project', text)}
                placeholder="30"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Budget */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Budget (PKR)</Text>
            <TextInput
              style={styles.textInput}
              value={formData.budget}
              onChangeText={text => handleInputChange('budget', text)}
              placeholder="50000"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Job Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Job Details</Text>
          </View>

          {/* Details */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Job Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.details}
              onChangeText={text => handleInputChange('details', text)}
              placeholder="Describe the job requirements, specifications, and expectations..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Additional Notes</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.note}
              onChangeText={text => handleInputChange('note', text)}
              placeholder="Important instructions to the service provider..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Images */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Paperclip color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Service Images</Text>
          </View>

          <TouchableOpacity
            style={styles.imagePicker}
            onPress={handleImagePicker}
            disabled={formData.images.length >= 5}>
            <Paperclip
              color={
                formData.images.length >= 5
                  ? colors.textSecondary
                  : colors.splashGreen
              }
              size={20}
            />
            <View style={styles.imagePickerText}>
              <Text
                style={[
                  styles.imagePickerTitle,
                  formData.images.length >= 5 && {color: colors.textSecondary},
                ]}>
                {formData.images.length >= 5
                  ? 'Maximum Images Reached'
                  : 'Upload Images'}
              </Text>
              <Text style={styles.imagePickerSubtitle}>
                JPG, PNG ({formData.images.length}/5 images)
              </Text>
            </View>
          </TouchableOpacity>

          {/* Display selected images */}
          {formData.images.length > 0 && (
            <View style={styles.imageList}>
              {formData.images.map((image, index) => (
                <View key={index} style={styles.imageItem}>
                  <Image
                    source={{uri: image.uri}}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <View style={styles.imageInfo}>
                    <Text style={styles.imageName} numberOfLines={1}>
                      {image.fileName || `Image ${index + 1}`}
                    </Text>
                    <Text style={styles.imageSize}>
                      {image.fileSize
                        ? `${(image.fileSize / 1024 / 1024).toFixed(1)} MB`
                        : 'Unknown size'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeImage(index)}
                    style={styles.removeButton}>
                    <X color="#F44336" size={16} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Urgent Job Toggle */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertTriangle color={colors.text} size={20} />
            <Text style={styles.sectionTitle}>Priority</Text>
          </View>

          <View style={styles.switchContainer}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Urgent Job</Text>
              <Text style={styles.switchDescription}>
                Mark this as an urgent job to get faster responses
              </Text>
            </View>
            <Switch
              value={formData.urgent}
              onValueChange={value => handleInputChange('urgent', value)}
              trackColor={{false: '#E0E0E0', true: colors.splashGreen + '40'}}
              thumbColor={formData.urgent ? colors.splashGreen : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={saving}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitButton, saving && styles.disabledButton]}
          onPress={handleCreate}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <>
              <Save color={colors.background} size={16} />
              <Text style={styles.submitButtonText}>Post Job</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Category Selection Modal */}
      <CategoryModal
        visible={categoryModalVisible}
        onClose={() => setCategoryModalVisible(false)}
        selectedCategory={formData.category}
        onCategorySelect={handleCategorySelect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  headerRight: {
    width: 40, // To balance the left button
  },

  scrollView: {
    flex: 1,
  },

  // Sections
  section: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },

  // Form Elements
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
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
    color: colors.text,
    backgroundColor: colors.background,
    fontFamily: fonts.regular,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },

  // Layout
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },

  // Picker Input
  pickerInput: {
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
  pickerText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
    flex: 1,
  },
  placeholderText: {
    color: colors.textSecondary,
  },

  // Image Picker
  imagePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.splashGreen,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  imagePickerText: {
    flex: 1,
  },
  imagePickerTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },
  imagePickerSubtitle: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Image List
  imageList: {
    marginTop: 12,
    gap: 8,
  },
  imageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    gap: 12,
  },
  imagePreview: {
    width: 50,
    height: 50,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
  },
  imageInfo: {
    flex: 1,
  },
  imageName: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  imageSize: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },
  removeButton: {
    padding: 4,
  },

  // Switch Container
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  switchDescription: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Bottom Buttons
  bottomButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: colors.splashGreen,
    gap: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
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
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  categoryList: {
    paddingHorizontal: 20,
  },
  categoryOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  selectedCategoryOption: {
    backgroundColor: colors.splashGreen + '10',
  },
  categoryOptionText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  selectedCategoryOptionText: {
    color: colors.splashGreen,
    fontFamily: fonts.semiBold,
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 20,
  },
});

export default CreateJobScreen;
