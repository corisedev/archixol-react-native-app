import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
  FlatList,
} from 'react-native';
import {colors} from '../../../../utils/colors';
import {useNavigation, useRoute} from '@react-navigation/native';
import Layout from '../../components/Layout';
import {addProject, updateProject} from '../../../../api/serviceProvider';

const AddEditProjectScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {project, isEdit} = route.params || {};
  const [active, setActive] = useState('Profile');

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    project_title: '',
    project_category: '',
    project_location: '',
    project_description: '',
    start_date: '',
    end_date: '',
    client_name: '',
    budget_range: '',
    key_features: [],
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [featureInput, setFeatureInput] = useState('');

  // Project categories with icons
  const categories = [
    {name: 'Plumbing', icon: '🔧'},
    {name: 'Electrical', icon: '⚡'},
    {name: 'Carpentry', icon: '🪚'},
    {name: 'Painting', icon: '🎨'},
    {name: 'HVAC', icon: '🌡️'},
    {name: 'Masonry', icon: '🧱'},
    {name: 'Landscaping', icon: '🌿'},
    {name: 'Interior Design', icon: '🏠'},
    {name: 'Construction', icon: '🏗️'},
    {name: 'Renovation', icon: '🔨'},
    {name: 'Roofing', icon: '🏘️'},
    {name: 'Other', icon: '🛠️'},
  ];

  const budgetRanges = [
    'Under $1,000',
    '$1,000 - $5,000',
    '$5,000 - $10,000',
    '$10,000 - $25,000',
    '$25,000 - $50,000',
    'Over $50,000',
  ];

  useEffect(() => {
    if (isEdit && project) {
      setFormData({
        project_title: project.project_title || '',
        project_category: project.project_category || '',
        project_location: project.project_location || '',
        project_description: project.project_description || '',
        start_date: project.start_date ? project.start_date.split('T')[0] : '',
        end_date: project.end_date ? project.end_date.split('T')[0] : '',
        client_name: project.client_name || '',
        budget_range: project.budget_range || '',
        key_features: project.key_features || [],
      });
    }
  }, [isEdit, project]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const renderSection = ({item}) => {
    switch (item.type) {
      case 'images':
        return renderImageSection();
      case 'basic_info':
        return renderBasicInfo();
      case 'category':
        return renderCategorySelector();
      case 'budget':
        return renderBudgetRange();
      case 'features':
        return renderKeyFeatures();
      case 'timeline':
        return renderProjectTimeline();
      case 'tips':
        return renderTips();
      default:
        return null;
    }
  };

  const renderStickyHeader = () => (
    <View style={styles.stickyHeader}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            {isEdit ? 'Edit Project' : 'Add New Project'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isEdit
              ? 'Update your project details'
              : 'Showcase your professional work'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const createSectionsData = () => [
    {id: 'images', type: 'images'},
    {id: 'basic_info', type: 'basic_info'},
    {id: 'category', type: 'category'},
    {id: 'budget', type: 'budget'},
    {id: 'features', type: 'features'},
    {id: 'timeline', type: 'timeline'},
    {id: 'tips', type: 'tips'},
  ];

  const addFeature = () => {
    if (
      featureInput.trim() &&
      !formData.key_features.includes(featureInput.trim())
    ) {
      updateFormData('key_features', [
        ...formData.key_features,
        featureInput.trim(),
      ]);
      setFeatureInput('');
    }
  };

  const removeFeature = index => {
    const newFeatures = formData.key_features.filter((_, i) => i !== index);
    updateFormData('key_features', newFeatures);
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Add Project Images',
      'Choose how you want to add your project images',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Camera',
          onPress: () => Alert.alert('Info', 'Camera feature coming soon'),
        },
        {
          text: 'Gallery',
          onPress: () => Alert.alert('Info', 'Gallery feature coming soon'),
        },
      ],
    );
  };

  const removeImage = index => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.project_title.trim()) {
      Alert.alert('Validation Error', 'Project title is required');
      return false;
    }
    if (formData.project_title.trim().length < 5) {
      Alert.alert(
        'Validation Error',
        'Project title should be at least 5 characters',
      );
      return false;
    }
    if (!formData.project_category.trim()) {
      Alert.alert('Validation Error', 'Please select a project category');
      return false;
    }
    if (!formData.project_description.trim()) {
      Alert.alert('Validation Error', 'Project description is required');
      return false;
    }
    if (formData.project_description.trim().length < 50) {
      Alert.alert(
        'Validation Error',
        'Project description should be at least 50 characters',
      );
      return false;
    }
    if (!formData.start_date) {
      Alert.alert('Validation Error', 'Start date is required');
      return false;
    }
    if (!formData.end_date) {
      Alert.alert('Validation Error', 'End date is required');
      return false;
    }
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      Alert.alert('Validation Error', 'End date must be after start date');
      return false;
    }
    if (new Date(formData.start_date) > new Date()) {
      Alert.alert('Validation Error', 'Start date cannot be in the future');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const projectData = {
        ...formData,
        project_imgs: selectedImages,
      };

      if (isEdit) {
        projectData.project_id = project.id;
        projectData.project_imgs_urls = project.project_imgs || [];
        await updateProject(projectData);
        Alert.alert('Success', 'Project updated successfully!', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      } else {
        await addProject(projectData);
        Alert.alert('Success', 'Project added successfully!', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      Alert.alert(
        'Error',
        `Failed to ${isEdit ? 'update' : 'add'} project. Please try again.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDateForDisplay = dateString => {
    if (!dateString) {
      return '';
    }
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const calculateDuration = () => {
    if (!formData.start_date || !formData.end_date) return '';
    try {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 30) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
      } else if (diffDays < 365) {
        const months = Math.round(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''}`;
      } else {
        const years = Math.round(diffDays / 365);
        return `${years} year${years > 1 ? 's' : ''}`;
      }
    } catch {
      return '';
    }
  };

  const handleDateChange = (field, text) => {
    // Allow only numbers and hyphens
    const cleaned = text.replace(/[^\d-]/g, '');

    // Auto-format as YYYY-MM-DD
    let formatted = cleaned;
    if (cleaned.length >= 4 && cleaned.charAt(4) !== '-') {
      formatted = cleaned.substring(0, 4) + '-' + cleaned.substring(4);
    }
    if (cleaned.length >= 7 && cleaned.charAt(7) !== '-') {
      formatted = cleaned.substring(0, 7) + '-' + cleaned.substring(7);
    }

    // Limit to 10 characters (YYYY-MM-DD)
    if (formatted.length <= 10) {
      updateFormData(field, formatted);
    }
  };

  const renderHeader = () => (
    <View style={styles.pageHeader}>
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>
            {isEdit ? 'Edit Project' : 'Add New Project'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isEdit
              ? 'Update your project details'
              : 'Showcase your professional work'}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderImageSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📸 Project Images</Text>
      <Text style={styles.sectionDescription}>
        Upload high-quality photos that showcase your work
      </Text>

      <TouchableOpacity
        style={styles.addImageButton}
        onPress={handleImagePicker}>
        <Text style={styles.addImageIcon}>📷</Text>
        <Text style={styles.addImageText}>Add Project Images</Text>
        <Text style={styles.addImageSubtext}>
          Before & after photos work best
        </Text>
      </TouchableOpacity>

      {/* Display existing images */}
      {project?.project_imgs && project.project_imgs.length > 0 && (
        <View style={styles.imagesGrid}>
          <Text style={styles.imagesTitle}>
            Current Images ({project.project_imgs.length}):
          </Text>
          <View style={styles.imagesContainer}>
            {project.project_imgs.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{uri: image}} style={styles.projectImage} />
                <View style={styles.imageBadge}>
                  <Text style={styles.imageBadgeText}>{index + 1}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Display selected images */}
      {selectedImages.length > 0 && (
        <View style={styles.imagesGrid}>
          <Text style={styles.imagesTitle}>
            New Images ({selectedImages.length}):
          </Text>
          <View style={styles.imagesContainer}>
            {selectedImages.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{uri: image}} style={styles.projectImage} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => removeImage(index)}>
                  <Text style={styles.removeImageText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  const renderBasicInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📝 Project Details</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Project Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Modern Kitchen Renovation in Downtown Condo"
          value={formData.project_title}
          onChangeText={value => updateFormData('project_title', value)}
          placeholderTextColor={colors.textSecondary}
        />
        <Text style={styles.characterCount}>
          {formData.project_title.length} characters
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Project Location</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., DHA Phase 5, Lahore or Downtown Toronto"
          value={formData.project_location}
          onChangeText={value => updateFormData('project_location', value)}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Client Name (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., John Smith or ABC Company"
          value={formData.client_name}
          onChangeText={value => updateFormData('client_name', value)}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Project Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe the project scope, challenges faced, solutions implemented, materials used, and final outcomes. Include what made this project special..."
          value={formData.project_description}
          onChangeText={value => updateFormData('project_description', value)}
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
        />
        <Text style={styles.characterCount}>
          {formData.project_description.length} / 500 characters
        </Text>
      </View>
    </View>
  );

  const renderCategorySelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🏷️ Project Category *</Text>
      <Text style={styles.sectionDescription}>
        Choose the category that best describes this project
      </Text>
      <View style={styles.categoryGrid}>
  {categories.map(category => (
    <TouchableOpacity
      key={category.name}
      style={[
        styles.categoryChip,
        formData.project_category === category.name &&
          styles.categoryChipActive,
      ]}
      onPress={() => updateFormData('project_category', category.name)}>
      <Text style={styles.categoryIcon}>{category.icon}</Text>
      <Text
        style={[
          styles.categoryChipText,
          formData.project_category === category.name &&
            styles.categoryChipTextActive,
        ]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  ))}
</View>
    </View>
  );

  const renderBudgetRange = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💰 Budget Range (Optional)</Text>
      <Text style={styles.sectionDescription}>
        Help potential clients understand project scale
      </Text>
      <View style={styles.budgetGrid}>
        {budgetRanges.map(range => (
          <TouchableOpacity
            key={range}
            style={[
              styles.budgetChip,
              formData.budget_range === range && styles.budgetChipActive,
            ]}
            onPress={() => updateFormData('budget_range', range)}>
            <Text
              style={[
                styles.budgetChipText,
                formData.budget_range === range && styles.budgetChipTextActive,
              ]}>
              {range}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderKeyFeatures = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⭐ Key Features</Text>
      <Text style={styles.sectionDescription}>
        Highlight special aspects or achievements of this project
      </Text>

      <View style={styles.featureInputContainer}>
        <TextInput
          style={styles.featureInput}
          placeholder="e.g., Energy-efficient lighting, Custom cabinetry..."
          value={featureInput}
          onChangeText={setFeatureInput}
          onSubmitEditing={addFeature}
          placeholderTextColor={colors.textSecondary}
        />
        <TouchableOpacity
          style={[
            styles.addFeatureButton,
            !featureInput.trim() && styles.addFeatureButtonDisabled,
          ]}
          onPress={addFeature}
          disabled={!featureInput.trim()}>
          <Text style={styles.addFeatureButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {formData.key_features.length > 0 && (
        <View style={styles.featuresContainer}>
          {formData.key_features.map((feature, index) => (
            <View key={index} style={styles.featureTag}>
              <Text style={styles.featureTagText}>{feature}</Text>
              <TouchableOpacity onPress={() => removeFeature(index)}>
                <Text style={styles.featureTagRemove}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderProjectTimeline = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📅 Project Timeline *</Text>
      <Text style={styles.sectionDescription}>
        When did this project take place?
      </Text>

      <View style={styles.dateRow}>
        <View style={styles.dateInput}>
          <Text style={styles.inputLabel}>Start Date *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={formData.start_date}
            onChangeText={text => handleDateChange('start_date', text)}
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            maxLength={10}
          />
          {formData.start_date && (
            <Text style={styles.datePreview}>
              📅 {formatDateForDisplay(formData.start_date)}
            </Text>
          )}
        </View>

        <View style={styles.dateInput}>
          <Text style={styles.inputLabel}>End Date *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={formData.end_date}
            onChangeText={text => handleDateChange('end_date', text)}
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            maxLength={10}
          />
          {formData.end_date && (
            <Text style={styles.datePreview}>
              📅 {formatDateForDisplay(formData.end_date)}
            </Text>
          )}
        </View>
      </View>

      {calculateDuration() && (
        <View style={styles.durationContainer}>
          <Text style={styles.durationLabel}>Project Duration:</Text>
          <Text style={styles.durationValue}>⏱ {calculateDuration()}</Text>
        </View>
      )}
    </View>
  );

  const renderTips = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💡 Pro Tips</Text>
      <View style={styles.tipsList}>
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>📸</Text>
          <Text style={styles.tipText}>
            Include before/after photos and progress shots to tell a complete
            story
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>📝</Text>
          <Text style={styles.tipText}>
            Detail specific challenges you overcame and unique solutions you
            provided
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>🎯</Text>
          <Text style={styles.tipText}>
            Highlight client satisfaction and any special recognition received
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>⭐</Text>
          <Text style={styles.tipText}>
            Use key features to showcase your expertise and attention to detail
          </Text>
        </View>
      </View>
    </View>
  );

  const renderContent = () => (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}>
      {renderHeader()}
      {renderImageSection()}
      {renderBasicInfo()}
      {renderCategorySelector()}
      {renderBudgetRange()}
      {renderKeyFeatures()}
      {renderProjectTimeline()}
      {renderTips()}
    </ScrollView>
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
    </View>
  );
};

const styles = StyleSheet.create({
  // Replace pageHeader with:
  stickyHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 50, // Status bar space
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },

  // Add this new style:
  flatListContent: {
    paddingBottom: 40,
  },
  categoryGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 8,
},

  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 20,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
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
  saveButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.background,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryScrollContent: {
    paddingRight: 16,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 120,
  },
  categoryChipActive: {
    backgroundColor: colors.splashGreen,
    borderColor: colors.splashGreen,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  budgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  budgetChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  budgetChipActive: {
    backgroundColor: colors.splashGreen,
    borderColor: colors.splashGreen,
  },
  budgetChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  budgetChipTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  featureInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  featureInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  addFeatureButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFeatureButtonDisabled: {
    opacity: 0.5,
  },
  addFeatureButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  featureTagText: {
    fontSize: 12,
    color: '#1565C0',
    fontWeight: '500',
  },
  featureTagRemove: {
    fontSize: 16,
    color: '#1565C0',
    fontWeight: 'bold',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInput: {
    flex: 1,
  },
  datePreview: {
    fontSize: 12,
    color: colors.splashGreen,
    marginTop: 4,
    fontWeight: '500',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    gap: 8,
  },
  durationLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  durationValue: {
    fontSize: 14,
    color: colors.splashGreen,
    fontWeight: '600',
  },
  addImageButton: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  addImageIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  addImageText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  addImageSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  imagesGrid: {
    marginTop: 16,
  },
  imagesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  imageWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  projectImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  imageBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageBadgeText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: '600',
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
  removeImageText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  tipIcon: {
    fontSize: 16,
    width: 24,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});

export default AddEditProjectScreen;
