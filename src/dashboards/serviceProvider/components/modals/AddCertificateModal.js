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
} from 'react-native';
import {
  X,
  Upload,
  Calendar,
  FileText,
  Award,
  Camera,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react-native';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {colors} from '../../../../utils/colors';
import {fonts, fontSizes} from '../../../../utils/fonts';
import {addCertificate} from '../../../../api/serviceProvider';

const AddCertificateModal = ({
  visible,
  onClose,
  onSuccess,
  editData = null, // For edit mode
}) => {
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: editData?.certificate_title || '',
    organization: editData?.organization || '',
    issueDate: editData?.issue_date
      ? new Date(editData.issue_date)
      : new Date(),
    description: editData?.certificate_description || '',
    certificateImage: editData?.certificate_img || null,
  });

  const [errors, setErrors] = useState({});

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Certificate title is required';
    }

    if (!formData.organization.trim()) {
      newErrors.organization = 'Organization name is required';
    }

    if (!formData.certificateImage) {
      newErrors.certificateImage = 'Certificate image is required';
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
  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange('issueDate', selectedDate);
    }
  };

  // Format date for display
  const formatDate = date => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
    };

    const callback = response => {
      if (response.didCancel || response.error) {
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        handleInputChange('certificateImage', {
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || 'certificate.jpg',
        });
      }
    };

    if (type === 'camera') {
      launchCamera(options, callback);
    } else {
      launchImageLibrary(options, callback);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        title: formData.title.trim(),
        organization: formData.organization.trim(),
        dated: formData.issueDate.toISOString().split('T')[0],
        certificate_description: formData.description.trim(),
        certificate_img: [formData.certificateImage],
      };

      // Add certificate_id for edit mode
      if (editData) {
        submitData.certificate_id = editData.id;
      }

      const response = await addCertificate(submitData);

      Alert.alert(
        'Success',
        editData
          ? 'Certificate updated successfully!'
          : 'Certificate added successfully!',
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
      console.error('Certificate submission error:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.error ||
          'Failed to save certificate. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      organization: '',
      issueDate: new Date(),
      description: '',
      certificateImage: null,
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
                {editData ? 'Edit Certificate' : 'Add Certificate'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {editData
                  ? 'Update your certificate details'
                  : 'Add a new certificate to your profile'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!formData.title || !formData.organization || loading) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!formData.title || !formData.organization || loading}>
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
            {/* Certificate Title */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Certificate Title <Text style={styles.required}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.title && styles.inputError,
                ]}>
                <Award color={colors.textSecondary} size={20} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., AWS Certified Solutions Architect"
                  value={formData.title}
                  onChangeText={value => handleInputChange('title', value)}
                  editable={!loading}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              {errors.title && (
                <Text style={styles.errorText}>{errors.title}</Text>
              )}
            </View>

            {/* Organization */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Issuing Organization <Text style={styles.required}>*</Text>
              </Text>
              <View
                style={[
                  styles.inputContainer,
                  errors.organization && styles.inputError,
                ]}>
                <FileText color={colors.textSecondary} size={20} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Amazon Web Services"
                  value={formData.organization}
                  onChangeText={value =>
                    handleInputChange('organization', value)
                  }
                  editable={!loading}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              {errors.organization && (
                <Text style={styles.errorText}>{errors.organization}</Text>
              )}
            </View>

            {/* Issue Date */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Issue Date</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowDatePicker(true)}
                disabled={loading}>
                <Calendar color={colors.textSecondary} size={20} />
                <Text style={styles.dateText}>
                  {formatDate(formData.issueDate)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Description (Optional)</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Add details about your certificate..."
                  value={formData.description}
                  onChangeText={value =>
                    handleInputChange('description', value)
                  }
                  multiline={true}
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!loading}
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>

            {/* Certificate Image */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                Certificate Image <Text style={styles.required}>*</Text>
              </Text>

              {formData.certificateImage ? (
                <View style={styles.imagePreviewContainer}>
                  <Image
                    source={{
                      uri:
                        typeof formData.certificateImage === 'string'
                          ? formData.certificateImage
                          : formData.certificateImage.uri,
                    }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleInputChange('certificateImage', null)}
                    disabled={loading}>
                    <X color={colors.background} size={16} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.imageUploadContainer,
                    errors.certificateImage && styles.inputError,
                  ]}
                  onPress={() => setShowImageOptions(true)}
                  disabled={loading}>
                  <Upload color={colors.textSecondary} size={32} />
                  <Text style={styles.uploadText}>
                    Upload Certificate Image
                  </Text>
                  <Text style={styles.uploadSubtext}>
                    JPG, PNG or WEBP (Max 5MB)
                  </Text>
                </TouchableOpacity>
              )}

              {errors.certificateImage && (
                <Text style={styles.errorText}>{errors.certificateImage}</Text>
              )}
            </View>
          </ScrollView>

          {/* Date Picker */}
          {showDatePicker && (
            <DateTimePicker
              value={formData.issueDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </KeyboardAvoidingView>
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
              <Text style={styles.imageOptionsTitle}>Select Image</Text>
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  dateText: {
    flex: 1,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  errorText: {
    fontSize: fontSizes.sm,
    color: '#F44336',
    fontFamily: fonts.regular,
    marginTop: 4,
  },

  // Image Upload
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
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
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

export default AddCertificateModal;
