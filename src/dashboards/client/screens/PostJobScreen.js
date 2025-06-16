import {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  FlatList,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {createJob} from '../../../api/client';
import {useNavigation} from '@react-navigation/native';
import DocumentPicker from '@react-native-documents/picker';

// Import your icons here
import DocumentIcon from '../../../assets/images/icons/company.png';

const PostJobScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    details: '',
    budget: '',
    days_project: '',
    location: '',
    urgent: false,
    note: '',
    required_skills: '',
    tags: '',
    docs: [],
  });

  // Validation errors
  const [errors, setErrors] = useState({});

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSkillsModal, setShowSkillsModal] = useState(false);

  // Job categories (matching your backend)
  const jobCategories = [
    {label: 'Plumbing Supplies', value: 'plumbing_supplies', icon: '🔧'},
    {
      label: 'Electrical Components',
      value: 'electrical_components',
      icon: '⚡',
    },
    {label: 'Safety Gear', value: 'safety_gear', icon: '🦺'},
    {
      label: 'Construction Materials',
      value: 'construction_materials',
      icon: '🏗️',
    },
    {label: 'HVAC Systems', value: 'hvac_systems', icon: '❄️'},
    {label: 'Painting Supplies', value: 'painting_supplies', icon: '🎨'},
    {label: 'Flooring Materials', value: 'flooring_materials', icon: '🏠'},
    {label: 'Roofing Materials', value: 'roofing_materials', icon: '🏘️'},
  ];

  // Common skills for suggestions
  const commonSkills = [
    'Plumbing',
    'Electrical Work',
    'Carpentry',
    'Painting',
    'Roofing',
    'HVAC Installation',
    'Flooring',
    'Tiling',
    'Masonry',
    'Welding',
    'Construction',
    'Home Repair',
    'Maintenance',
    'Installation',
  ];

  // Create sections data for FlatList
  const createSectionsData = () => [{id: 'content', type: 'content'}];

  // Render sticky header
  const renderStickyHeader = () => (
    <View style={styles.stickyHeader}>
      {/* Header */}
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post New Job</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {width: '100%'}]} />
        </View>
        <Text style={styles.progressText}>Fill in job details</Text>
      </View>
    </View>
  );

  // Render section content
  const renderSection = ({item}) => {
    switch (item.type) {
      case 'content':
        return renderFormContent();
      default:
        return null;
    }
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Job title is required';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.details.trim()) {
      newErrors.details = 'Job description is required';
    } else if (formData.details.trim().length < 20) {
      newErrors.details = 'Description must be at least 20 characters';
    }

    if (!formData.budget.trim()) {
      newErrors.budget = 'Budget is required';
    } else if (isNaN(formData.budget) || parseFloat(formData.budget) <= 0) {
      newErrors.budget = 'Please enter a valid budget amount';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (
      formData.days_project &&
      (isNaN(formData.days_project) || parseInt(formData.days_project) <= 0)
    ) {
      newErrors.days_project = 'Please enter a valid number of days';
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

  // Handle document picker
  const handleDocumentPicker = async () => {
    try {
      setUploadingDocs(true);
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true,
      });

      // Filter results to ensure they're valid
      const validDocs = results.filter(doc => doc.size <= 10 * 1024 * 1024); // 10MB limit

      if (validDocs.length !== results.length) {
        Alert.alert(
          'Warning',
          'Some files were skipped because they exceed 10MB limit',
        );
      }

      setFormData(prev => ({
        ...prev,
        docs: [...prev.docs, ...validDocs],
      }));
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('Error', 'Failed to pick documents');
      }
    } finally {
      setUploadingDocs(false);
    }
  };

  // Remove document
  const removeDocument = index => {
    setFormData(prev => ({
      ...prev,
      docs: prev.docs.filter((_, i) => i !== index),
    }));
  };

  // Handle category selection
  const selectCategory = category => {
    handleInputChange('category', category.value);
    setShowCategoryModal(false);
  };

  // Add skill
  const addSkill = skill => {
    const currentSkills = formData.required_skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    if (!currentSkills.includes(skill)) {
      const newSkills = [...currentSkills, skill].join(', ');
      handleInputChange('required_skills', newSkills);
    }
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors below');
      return;
    }

    try {
      setLoading(true);

      // Prepare form data for submission
      const submitData = {
        ...formData,
        required_skills: formData.required_skills
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        tags: formData.tags
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
      };

      const response = await createJob(submitData);

      if (response) {
        Alert.alert('Success!', 'Your job has been posted successfully.', [
          {
            text: 'View Jobs',
            onPress: () => navigation.navigate('Jobs'),
          },
          {
            text: 'Post Another',
            onPress: () => {
              // Reset form
              setFormData({
                name: '',
                category: '',
                details: '',
                budget: '',
                days_project: '',
                location: '',
                urgent: false,
                note: '',
                required_skills: '',
                tags: '',
                docs: [],
              });
              setErrors({});
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Failed to create job:', error);
      Alert.alert('Error', 'Failed to post job. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Get selected category label
  const getSelectedCategoryLabel = () => {
    const selected = jobCategories.find(cat => cat.value === formData.category);
    return selected ? selected.label : 'Select Category';
  };

  // Format currency display
  const formatCurrency = amount => {
    if (!amount) return '';
    return `Rs ${amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  // Render form content
  const renderFormContent = () => (
    <View style={styles.formContainer}>
      {/* Job Title */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Job Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Job Title <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.textInput, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={text => handleInputChange('name', text)}
            placeholder="Enter a clear, descriptive job title"
            placeholderTextColor={colors.textSecondary}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        {/* Category Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Category <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={[styles.selectInput, errors.category && styles.inputError]}
            onPress={() => setShowCategoryModal(true)}>
            <Text
              style={[
                styles.selectInputText,
                formData.category
                  ? styles.selectedText
                  : styles.placeholderText,
              ]}>
              {getSelectedCategoryLabel()}
            </Text>
            <Text style={styles.selectIcon}>▼</Text>
          </TouchableOpacity>
          {errors.category && (
            <Text style={styles.errorText}>{errors.category}</Text>
          )}
        </View>

        {/* Job Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Job Description <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.textArea, errors.details && styles.inputError]}
            value={formData.details}
            onChangeText={text => handleInputChange('details', text)}
            placeholder="Describe what you need done, including specific requirements, materials needed, and any other important details..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            placeholderTextColor={colors.textSecondary}
          />
          <Text style={styles.characterCount}>
            {formData.details.length}/500 characters
          </Text>
          {errors.details && (
            <Text style={styles.errorText}>{errors.details}</Text>
          )}
        </View>
      </View>

      {/* Budget & Timeline */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Budget & Timeline</Text>

        <View style={styles.inputRow}>
          <View style={styles.inputGroupHalf}>
            <Text style={styles.inputLabel}>
              Budget (Rs) <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, errors.budget && styles.inputError]}
              value={formData.budget}
              onChangeText={text => handleInputChange('budget', text)}
              placeholder="0"
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
            />
            {formData.budget && (
              <Text style={styles.budgetDisplay}>
                {formatCurrency(formData.budget)}
              </Text>
            )}
            {errors.budget && (
              <Text style={styles.errorText}>{errors.budget}</Text>
            )}
          </View>

          <View style={styles.inputGroupHalf}>
            <Text style={styles.inputLabel}>Timeline (days)</Text>
            <TextInput
              style={[
                styles.textInput,
                errors.days_project && styles.inputError,
              ]}
              value={formData.days_project}
              onChangeText={text => handleInputChange('days_project', text)}
              placeholder="7"
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
            />
            {errors.days_project && (
              <Text style={styles.errorText}>{errors.days_project}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Location */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Location & Requirements</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>
            Job Location <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.textInput, errors.location && styles.inputError]}
            value={formData.location}
            onChangeText={text => handleInputChange('location', text)}
            placeholder="Enter job location (city, area, address)"
            placeholderTextColor={colors.textSecondary}
          />
          {errors.location && (
            <Text style={styles.errorText}>{errors.location}</Text>
          )}
        </View>

        {/* Required Skills */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Required Skills</Text>
          <TextInput
            style={styles.textInput}
            value={formData.required_skills}
            onChangeText={text => handleInputChange('required_skills', text)}
            placeholder="e.g., Plumbing, Electrical, Carpentry (separate with commas)"
            placeholderTextColor={colors.textSecondary}
          />
          <TouchableOpacity
            style={styles.suggestionButton}
            onPress={() => setShowSkillsModal(true)}>
            <Text style={styles.suggestionButtonText}>
              + Add from suggestions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tags */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Tags (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.tags}
            onChangeText={text => handleInputChange('tags', text)}
            placeholder="e.g., urgent, weekend work, experienced only"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        {/* Urgent Toggle */}
        <View style={styles.switchGroup}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Mark as Urgent</Text>
            <Text style={styles.switchDescription}>
              Urgent jobs get higher visibility
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.switchButton,
              formData.urgent && styles.switchButtonActive,
            ]}
            onPress={() => handleInputChange('urgent', !formData.urgent)}>
            <View
              style={[
                styles.switchThumb,
                formData.urgent && styles.switchThumbActive,
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Documents */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Attachments (Optional)</Text>

        <TouchableOpacity
          style={styles.uploadButton}
          onPress={handleDocumentPicker}
          disabled={uploadingDocs}>
          <Image source={DocumentIcon} style={styles.uploadIcon} />
          <Text style={styles.uploadButtonText}>
            {uploadingDocs ? 'Uploading...' : 'Upload Documents'}
          </Text>
          <Text style={styles.uploadSubtext}>
            Plans, images, specifications (Max 10MB each)
          </Text>
        </TouchableOpacity>

        {/* Document List */}
        {formData.docs.length > 0 && (
          <View style={styles.documentsList}>
            {formData.docs.map((doc, index) => (
              <View key={index} style={styles.documentItem}>
                <Image source={DocumentIcon} style={styles.docIcon} />
                <View style={styles.docInfo}>
                  <Text style={styles.docName} numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <Text style={styles.docSize}>
                    {(doc.size / 1024 / 1024).toFixed(2)} MB
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeDocButton}
                  onPress={() => removeDocument(index)}>
                  <Text style={styles.removeDocText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Additional Notes */}
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>

        <TextInput
          style={styles.textArea}
          value={formData.note}
          onChangeText={text => handleInputChange('note', text)}
          placeholder="Any additional information or special requirements..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {/* Submit Button */}
      <View style={styles.submitSection}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.submitButtonText}>Post Job</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.submitNote}>
          By posting this job, you agree to our terms of service and privacy
          policy
        </Text>
      </View>
    </View>
  );

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

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCategoryModal(false)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Category</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            {jobCategories.map(category => (
              <TouchableOpacity
                key={category.value}
                style={[
                  styles.categoryOption,
                  formData.category === category.value &&
                    styles.selectedCategoryOption,
                ]}
                onPress={() => selectCategory(category)}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text
                  style={[
                    styles.categoryOptionText,
                    formData.category === category.value &&
                      styles.selectedCategoryOptionText,
                  ]}>
                  {category.label}
                </Text>
                {formData.category === category.value && (
                  <Text style={styles.selectedIndicator}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Skills Suggestion Modal */}
      <Modal
        visible={showSkillsModal}
        animationType="slide"
        presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSkillsModal(false)}>
              <Text style={styles.modalCloseText}>Done</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Skills</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.skillsDescription}>
              Tap skills to add them to your job requirements:
            </Text>
            <View style={styles.skillsContainer}>
              {commonSkills.map(skill => (
                <TouchableOpacity
                  key={skill}
                  style={styles.skillChip}
                  onPress={() => addSkill(skill)}>
                  <Text style={styles.skillChipText}>{skill}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
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

  // Sticky Header
  stickyHeader: {
    backgroundColor: colors.background,
    paddingTop: 50, // Status bar space
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: colors.text,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 40,
  },

  // Progress (now part of sticky header)
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.splashGreen,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Add FlatList content style
  flatListContent: {
    paddingBottom: 40,
  },

  // Form
  formContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputGroupHalf: {
    flex: 1,
    marginRight: 8,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  required: {
    color: '#F44336',
  },
  textInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  textArea: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 120,
    textAlignVertical: 'top',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectInputText: {
    fontSize: 16,
    flex: 1,
  },
  selectedText: {
    color: colors.text,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  selectIcon: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    fontSize: 12,
    color: '#F44336',
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  budgetDisplay: {
    fontSize: 12,
    color: colors.splashGreen,
    marginTop: 4,
    fontWeight: '500',
  },

  // Switch
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  switchButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
    padding: 2,
    justifyContent: 'center',
  },
  switchButtonActive: {
    backgroundColor: colors.splashGreen,
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.background,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{translateX: 20}],
  },

  // Upload
  uploadButton: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  uploadIcon: {
    width: 32,
    height: 32,
    marginBottom: 12,
    tintColor: colors.splashGreen,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  documentsList: {
    marginTop: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  docIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    tintColor: colors.splashGreen,
  },
  docInfo: {
    flex: 1,
  },
  docName: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  docSize: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  removeDocButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeDocText: {
    fontSize: 12,
    color: '#F44336',
  },

  // Suggestions
  suggestionButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  suggestionButtonText: {
    fontSize: 12,
    color: colors.splashGreen,
    fontWeight: '500',
  },

  // Submit
  submitSection: {
    marginTop: 24,
    marginBottom: 20,
  },
  submitButton: {
    backgroundColor: colors.splashGreen,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  submitNote: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalCloseButton: {
    minWidth: 60,
  },
  modalCloseText: {
    fontSize: 16,
    color: colors.splashGreen,
    fontWeight: '500',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Category Options
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  selectedCategoryOption: {
    backgroundColor: colors.splashGreen + '15',
    borderWidth: 1,
    borderColor: colors.splashGreen,
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryOptionText: {
    fontSize: 16,
    color: colors.text,
    flex: 1,
  },
  selectedCategoryOptionText: {
    color: colors.splashGreen,
    fontWeight: '500',
  },
  selectedIndicator: {
    fontSize: 16,
    color: colors.splashGreen,
    fontWeight: '600',
  },

  // Skills
  skillsDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  skillChipText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
});

export default PostJobScreen;
