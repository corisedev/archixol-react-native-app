import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  StatusBar,
  FlatList,
} from 'react-native';
import {colors} from '../../../../utils/colors';
import {useNavigation, useRoute} from '@react-navigation/native';
import {addService, updateService} from '../../../../api/serviceProvider';

const AddEditServiceScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {service, isEdit} = route.params || {};

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    service_title: '',
    service_category: '',
    service_description: '',
    service_status: true,
    service_tags: [],
    service_faqs: [{question: '', answer: ''}],
    service_process: [{step: ''}],
    service_feature: [{feature: ''}],
  });

  // Tag input state
  const [tagInput, setTagInput] = useState('');

  // Service categories with icons
  const categories = [
    {name: 'Plumbing', icon: '🔧'},
    {name: 'Electrical', icon: '⚡'},
    {name: 'Carpentry', icon: '🪚'},
    {name: 'Painting', icon: '🎨'},
    {name: 'HVAC', icon: '🌡️'},
    {name: 'Masonry', icon: '🧱'},
    {name: 'Cleaning', icon: '🧽'},
    {name: 'Landscaping', icon: '🌿'},
    {name: 'Roofing', icon: '🏠'},
    {name: 'Flooring', icon: '🪵'},
    {name: 'Other', icon: '🛠️'},
  ];

  useEffect(() => {
    if (isEdit && service) {
      setFormData({
        service_title: service.service_title || '',
        service_category: service.service_category || '',
        service_description: service.service_description || '',
        service_status: service.service_status || false,
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
  }, [isEdit, service]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.service_tags.includes(tagInput.trim())) {
      updateFormData('service_tags', [
        ...formData.service_tags,
        tagInput.trim(),
      ]);
      setTagInput('');
    }
  };

  const createSectionsData = () => [
    {id: 'basic_info', type: 'basic_info'},
    {id: 'category', type: 'category'},
    {id: 'status', type: 'status'},
    {id: 'tags', type: 'tags'},
    {id: 'features', type: 'features'},
    {id: 'process', type: 'process'},
    {id: 'faqs', type: 'faqs'},
  ];

  const renderSection = ({item}) => {
    switch (item.type) {
      case 'basic_info':
        return renderBasicInfo();
      case 'category':
        return renderCategorySelector();
      case 'status':
        return renderServiceStatus();
      case 'tags':
        return renderTagsSection();
      case 'features':
        return renderFeaturesSection();
      case 'process':
        return renderProcessSection();
      case 'faqs':
        return renderFAQsSection();
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
            {isEdit ? 'Edit Service' : 'Create New Service'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isEdit
              ? 'Update your service details'
              : 'Add a new service to your portfolio'}
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

  const renderFeaturesSection = () =>
    renderDynamicSection(
      'Service Features',
      '⭐',
      formData.service_feature,
      addFeature,
      updateFeature,
      removeFeature,
      'e.g., Licensed and insured, 24/7 emergency service...',
      true,
      'feature',
      'Highlight what makes your service special',
    );

  const renderProcessSection = () =>
    renderDynamicSection(
      'Service Process',
      '📋',
      formData.service_process,
      addProcess,
      updateProcess,
      removeProcess,
      'e.g., Initial consultation and assessment...',
      true,
      'step',
      'Explain your work process step by step',
    );

  const renderFAQsSection = () =>
    renderDynamicSection(
      'Service FAQs',
      '❓',
      formData.service_faqs,
      addFAQ,
      updateFAQ,
      removeFAQ,
      '',
      false,
      null,
      'Answer common questions clients might have',
    );

  const removeTag = index => {
    const newTags = formData.service_tags.filter((_, i) => i !== index);
    updateFormData('service_tags', newTags);
  };

  const addFAQ = () => {
    updateFormData('service_faqs', [
      ...formData.service_faqs,
      {question: '', answer: ''},
    ]);
  };

  const updateFAQ = (index, field, value) => {
    const newFAQs = [...formData.service_faqs];
    newFAQs[index][field] = value;
    updateFormData('service_faqs', newFAQs);
  };

  const removeFAQ = index => {
    if (formData.service_faqs.length > 1) {
      const newFAQs = formData.service_faqs.filter((_, i) => i !== index);
      updateFormData('service_faqs', newFAQs);
    }
  };

  const addProcess = () => {
    updateFormData('service_process', [
      ...formData.service_process,
      {step: ''},
    ]);
  };

  const updateProcess = (index, value) => {
    const newProcess = [...formData.service_process];
    newProcess[index].step = value;
    updateFormData('service_process', newProcess);
  };

  const removeProcess = index => {
    if (formData.service_process.length > 1) {
      const newProcess = formData.service_process.filter((_, i) => i !== index);
      updateFormData('service_process', newProcess);
    }
  };

  const addFeature = () => {
    updateFormData('service_feature', [
      ...formData.service_feature,
      {feature: ''},
    ]);
  };

  const updateFeature = (index, value) => {
    const newFeatures = [...formData.service_feature];
    newFeatures[index].feature = value;
    updateFormData('service_feature', newFeatures);
  };

  const removeFeature = index => {
    if (formData.service_feature.length > 1) {
      const newFeatures = formData.service_feature.filter(
        (_, i) => i !== index,
      );
      updateFormData('service_feature', newFeatures);
    }
  };

  const validateForm = () => {
    if (!formData.service_title.trim()) {
      Alert.alert('Validation Error', 'Service title is required');
      return false;
    }
    if (!formData.service_category.trim()) {
      Alert.alert('Validation Error', 'Please select a service category');
      return false;
    }
    if (!formData.service_description.trim()) {
      Alert.alert('Validation Error', 'Service description is required');
      return false;
    }
    if (formData.service_description.trim().length < 50) {
      Alert.alert(
        'Validation Error',
        'Service description should be at least 50 characters',
      );
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

      // Filter out empty FAQs, process steps, and features
      const filteredData = {
        ...formData,
        service_faqs: formData.service_faqs.filter(
          faq => faq.question.trim() && faq.answer.trim(),
        ),
        service_process: formData.service_process.filter(process =>
          process.step.trim(),
        ),
        service_feature: formData.service_feature.filter(feature =>
          feature.feature.trim(),
        ),
        service_images: [], // Add empty array for images (can be extended later)
      };

      if (isEdit) {
        filteredData.service_id = service.id;
        filteredData.service_images_urls = service.service_images || [];
        await updateService(filteredData);
        Alert.alert('Success', 'Service updated successfully!', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      } else {
        await addService(filteredData);
        Alert.alert('Success', 'Service created successfully!', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      }
    } catch (error) {
      console.error('Failed to save service:', error);
      Alert.alert('Error', `Failed to ${isEdit ? 'update' : 'create'} service`);
    } finally {
      setLoading(false);
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
            {isEdit ? 'Edit Service' : 'Create New Service'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isEdit
              ? 'Update your service details'
              : 'Add a new service to your portfolio'}
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

  const renderBasicInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📝 Basic Information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Service Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Professional Home Plumbing Services"
          value={formData.service_title}
          onChangeText={value => updateFormData('service_title', value)}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Service Description *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your service in detail. Include what you offer, your expertise, and what makes you unique..."
          value={formData.service_description}
          onChangeText={value => updateFormData('service_description', value)}
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={4}
        />
        <Text style={styles.characterCount}>
          {formData.service_description.length} / 500 characters
        </Text>
      </View>
    </View>
  );

  const renderCategorySelector = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🏷️ Service Category *</Text>
      <Text style={styles.sectionDescription}>
        Choose the category that best describes your service
      </Text>
      <View style={styles.categoryGrid}>
        {categories.map(category => (
          <TouchableOpacity
            key={category.name}
            style={[
              styles.categoryChip,
              formData.service_category === category.name &&
                styles.categoryChipActive,
            ]}
            onPress={() => updateFormData('service_category', category.name)}>
            <Text style={styles.categoryIcon}>{category.icon}</Text>
            <Text
              style={[
                styles.categoryChipText,
                formData.service_category === category.name &&
                  styles.categoryChipTextActive,
              ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderServiceStatus = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>⚙️ Service Settings</Text>
      <View style={styles.switchContainer}>
        <View style={styles.switchInfo}>
          <Text style={styles.switchLabel}>Service Active</Text>
          <Text style={styles.switchDescription}>
            {formData.service_status
              ? 'Service is active and visible to clients'
              : 'Service is inactive and hidden from clients'}
          </Text>
        </View>
        <Switch
          value={formData.service_status}
          onValueChange={value => updateFormData('service_status', value)}
          trackColor={{false: '#E0E0E0', true: colors.splashGreen}}
          thumbColor={colors.background}
        />
      </View>
    </View>
  );

  const renderTagsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🏪 Service Tags</Text>
      <Text style={styles.sectionDescription}>
        Add tags to help clients find your service more easily
      </Text>
      <View style={styles.tagInputContainer}>
        <TextInput
          style={styles.tagInput}
          placeholder="e.g., emergency, 24/7, certified..."
          value={tagInput}
          onChangeText={setTagInput}
          onSubmitEditing={addTag}
          placeholderTextColor={colors.textSecondary}
        />
        <TouchableOpacity
          style={[
            styles.addTagButton,
            !tagInput.trim() && styles.addTagButtonDisabled,
          ]}
          onPress={addTag}
          disabled={!tagInput.trim()}>
          <Text style={styles.addTagButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      {formData.service_tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {formData.service_tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
              <TouchableOpacity onPress={() => removeTag(index)}>
                <Text style={styles.tagRemove}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderDynamicSection = (
    title,
    icon,
    items,
    addFunc,
    updateFunc,
    removeFunc,
    placeholder,
    isObject = false,
    field = null,
    description = '',
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>
            {icon} {title}
          </Text>
          {description && (
            <Text style={styles.sectionDescription}>{description}</Text>
          )}
        </View>
        <TouchableOpacity style={styles.addButton} onPress={addFunc}>
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>
      {items.map((item, index) => (
        <View key={index} style={styles.dynamicItem}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>{index + 1}</Text>
          </View>
          <View style={styles.dynamicContent}>
            {title === 'Service FAQs' ? (
              <>
                <TextInput
                  style={[styles.input, styles.faqQuestion]}
                  placeholder="Question"
                  value={item.question}
                  onChangeText={value => updateFunc(index, 'question', value)}
                  placeholderTextColor={colors.textSecondary}
                  multiline
                />
                <TextInput
                  style={[styles.input, styles.faqAnswer]}
                  placeholder="Answer"
                  value={item.answer}
                  onChangeText={value => updateFunc(index, 'answer', value)}
                  placeholderTextColor={colors.textSecondary}
                  multiline
                />
              </>
            ) : (
              <TextInput
                style={[styles.input, styles.dynamicInput]}
                placeholder={placeholder}
                value={isObject ? item[field] : item}
                onChangeText={value => updateFunc(index, value)}
                placeholderTextColor={colors.textSecondary}
                multiline={title !== 'Service Features'}
              />
            )}
          </View>
          {items.length > 1 && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeFunc(index)}>
              <Text style={styles.removeButtonText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const renderContent = () => (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}>
      {renderHeader()}
      {renderBasicInfo()}
      {renderCategorySelector()}
      {renderServiceStatus()}
      {renderTagsSection()}

      {renderDynamicSection(
        'Service Features',
        '⭐',
        formData.service_feature,
        addFeature,
        updateFeature,
        removeFeature,
        'e.g., Licensed and insured, 24/7 emergency service...',
        true,
        'feature',
        'Highlight what makes your service special',
      )}

      {renderDynamicSection(
        'Service Process',
        '📋',
        formData.service_process,
        addProcess,
        updateProcess,
        removeProcess,
        'e.g., Initial consultation and assessment...',
        true,
        'step',
        'Explain your work process step by step',
      )}

      {renderDynamicSection(
        'Service FAQs',
        '❓',
        formData.service_faqs,
        addFAQ,
        updateFAQ,
        removeFAQ,
        '',
        false,
        null,
        'Answer common questions clients might have',
      )}

      <View style={styles.spacer} />
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

  // Add category grid style:
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
  pageHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
    marginBottom: 12,
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
    minWidth: 100,
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
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: colors.background,
    fontWeight: '600',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  addTagButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTagButtonDisabled: {
    opacity: 0.5,
  },
  addTagButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#1565C0',
    fontWeight: '500',
  },
  tagRemove: {
    fontSize: 16,
    color: '#1565C0',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonIcon: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  addButtonText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  dynamicItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  stepNumberText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  dynamicContent: {
    flex: 1,
  },
  dynamicInput: {
    minHeight: 40,
  },
  faqQuestion: {
    marginBottom: 8,
    minHeight: 40,
  },
  faqAnswer: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  removeButtonText: {
    fontSize: 16,
    color: '#F44336',
    fontWeight: 'bold',
  },
  spacer: {
    height: 40,
  },
});

export default AddEditServiceScreen;
