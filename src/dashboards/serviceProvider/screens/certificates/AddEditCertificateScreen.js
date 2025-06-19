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
  StatusBar, // Add this
  FlatList, // Add this
} from 'react-native';
import {colors} from '../../../../utils/colors';;;
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  addCertificate,
  updateCertificate,
} from '../../../../api/serviceProvider';

const AddEditCertificateScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {certificate, isEdit} = route.params || {};

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    dated: new Date().toISOString().split('T')[0],
    organization: '',
    credentialId: '',
    skills: [],
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [skillInput, setSkillInput] = useState('');

  // Common certification types for suggestions
  const certificationSuggestions = [
    'AWS Certified Solutions Architect',
    'Microsoft Azure Fundamentals',
    'Google Cloud Professional',
    'Project Management Professional (PMP)',
    'Certified Scrum Master',
    'CompTIA Security+',
    'Cisco Certified Network Associate',
    'Salesforce Administrator',
    'Six Sigma Green Belt',
    'ITIL Foundation',
  ];

  const createSectionsData = () => [
    {id: 'image', type: 'image'},
    {id: 'basic_info', type: 'basic_info'},
    {id: 'skills', type: 'skills'},
    ...(isEdit ? [] : [{id: 'suggestions', type: 'suggestions'}]),
    {id: 'preview', type: 'preview'},
    {id: 'tips', type: 'tips'},
  ];

  useEffect(() => {
    if (isEdit && certificate) {
      setFormData({
        title: certificate.title || '',
        dated: certificate.dated
          ? certificate.dated.split('T')[0]
          : new Date().toISOString().split('T')[0],
        organization: certificate.organization || '',
        credentialId: certificate.credentialId || '',
        skills: certificate.skills || [],
      });
    }
  }, [isEdit, certificate]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      updateFormData('skills', [...formData.skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = index => {
    const newSkills = formData.skills.filter((_, i) => i !== index);
    updateFormData('skills', newSkills);
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Select Image',
      'Choose how you want to add your certificate image',
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

  const renderSection = ({item}) => {
    switch (item.type) {
      case 'image':
        return renderImageSection();
      case 'basic_info':
        return renderBasicInfo();
      case 'skills':
        return renderSkillsSection();
      case 'suggestions':
        return renderSuggestions();
      case 'preview':
        return renderPreview();
      case 'tips':
        return renderTips();
      default:
        return null;
    }
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Certificate title is required');
      return false;
    }
    if (formData.title.trim().length < 5) {
      Alert.alert(
        'Validation Error',
        'Certificate title should be at least 5 characters',
      );
      return false;
    }
    if (!formData.dated) {
      Alert.alert('Validation Error', 'Certificate date is required');
      return false;
    }

    // Validate date format and logic
    const certDate = new Date(formData.dated);
    const today = new Date();
    if (certDate > today) {
      Alert.alert(
        'Validation Error',
        'Certificate date cannot be in the future',
      );
      return false;
    }

    if (!isEdit && !selectedImage && !certificate?.certificate_img) {
      Alert.alert(
        'Validation Error',
        'Certificate image is required for new certificates',
      );
      return false;
    }
    return true;
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
            {isEdit ? 'Edit Certificate' : 'Add New Certificate'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isEdit
              ? 'Update your certification details'
              : 'Showcase your professional achievement'}
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

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const certificateData = {
        ...formData,
        certificate_img: selectedImage ? [selectedImage] : [],
      };

      if (isEdit) {
        certificateData.certificate_id = certificate.id;
        await updateCertificate(certificateData);
        Alert.alert('Success', 'Certificate updated successfully!', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      } else {
        await addCertificate(certificateData);
        Alert.alert('Success', 'Certificate added successfully!', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      }
    } catch (error) {
      console.error('Failed to save certificate:', error);
      Alert.alert(
        'Error',
        `Failed to ${isEdit ? 'update' : 'add'} certificate. Please try again.`,
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDateForDisplay = dateString => {
    if (!dateString) return '';
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

  const handleDateChange = text => {
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
      updateFormData('dated', formatted);
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
            {isEdit ? 'Edit Certificate' : 'Add New Certificate'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isEdit
              ? 'Update your certification details'
              : 'Showcase your professional achievement'}
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
      <Text style={styles.sectionTitle}>🏆 Certificate Image *</Text>
      <Text style={styles.sectionDescription}>
        Upload a clear, high-quality image of your certificate
      </Text>
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={handleImagePicker}>
        {certificate?.certificate_img || selectedImage ? (
          <View style={styles.imageWrapper}>
            <Image
              source={{uri: certificate?.certificate_img || selectedImage}}
              style={styles.selectedImage}
            />
            <View style={styles.imageOverlay}>
              <Text style={styles.imageOverlayText}>📷 Change Image</Text>
            </View>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderIcon}>📸</Text>
            <Text style={styles.imagePlaceholderTitle}>Upload Certificate</Text>
            <Text style={styles.imagePlaceholderNote}>
              Take a photo or select from gallery
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderBasicInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📝 Certificate Details</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Certificate Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., AWS Certified Solutions Architect - Associate"
          value={formData.title}
          onChangeText={value => updateFormData('title', value)}
          placeholderTextColor={colors.textSecondary}
          multiline
        />
        <Text style={styles.characterCount}>
          {formData.title.length} characters
        </Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Issuing Organization</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Amazon Web Services, Microsoft, Google"
          value={formData.organization}
          onChangeText={value => updateFormData('organization', value)}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Issue Date *</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={formData.dated}
          onChangeText={handleDateChange}
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          maxLength={10}
        />
        {formData.dated && (
          <Text style={styles.datePreview}>
            📅 {formatDateForDisplay(formData.dated)}
          </Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Credential ID</Text>
        <TextInput
          style={styles.input}
          placeholder="Certificate or credential ID (optional)"
          value={formData.credentialId}
          onChangeText={value => updateFormData('credentialId', value)}
          placeholderTextColor={colors.textSecondary}
        />
      </View>
    </View>
  );

  const renderSkillsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🎯 Related Skills</Text>
      <Text style={styles.sectionDescription}>
        Add skills you gained or demonstrated with this certificate
      </Text>

      <View style={styles.skillInputContainer}>
        <TextInput
          style={styles.skillInput}
          placeholder="e.g., Cloud Architecture, DevOps..."
          value={skillInput}
          onChangeText={setSkillInput}
          onSubmitEditing={addSkill}
          placeholderTextColor={colors.textSecondary}
        />
        <TouchableOpacity
          style={[
            styles.addSkillButton,
            !skillInput.trim() && styles.addSkillButtonDisabled,
          ]}
          onPress={addSkill}
          disabled={!skillInput.trim()}>
          <Text style={styles.addSkillButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {formData.skills.length > 0 && (
        <View style={styles.skillsContainer}>
          {formData.skills.map((skill, index) => (
            <View key={index} style={styles.skillTag}>
              <Text style={styles.skillTagText}>{skill}</Text>
              <TouchableOpacity onPress={() => removeSkill(index)}>
                <Text style={styles.skillTagRemove}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderSuggestions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💡 Common Certifications</Text>
      <Text style={styles.sectionDescription}>
        Tap any suggestion to use as your certificate title
      </Text>
      <View style={styles.suggestionsContainer}>
        {certificationSuggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionChip}
            onPress={() => updateFormData('title', suggestion)}>
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPreview = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>👁️ Preview</Text>
      <Text style={styles.sectionDescription}>
        How your certificate will appear in your profile
      </Text>
      <View style={styles.previewCard}>
        <View style={styles.previewImageContainer}>
          {certificate?.certificate_img || selectedImage ? (
            <Image
              source={{uri: certificate?.certificate_img || selectedImage}}
              style={styles.previewImage}
            />
          ) : (
            <View style={styles.previewImagePlaceholder}>
              <Text style={styles.previewImagePlaceholderText}>🏆</Text>
            </View>
          )}
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeText}>CERT</Text>
          </View>
        </View>
        <View style={styles.previewInfo}>
          <Text style={styles.previewTitle}>
            {formData.title || 'Certificate Title'}
          </Text>
          {formData.organization && (
            <Text style={styles.previewOrganization}>
              {formData.organization}
            </Text>
          )}
          <Text style={styles.previewDate}>
            {formData.dated
              ? formatDateForDisplay(formData.dated)
              : 'Issue Date'}
          </Text>
          {formData.credentialId && (
            <Text style={styles.previewCredential}>
              ID: {formData.credentialId}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderTips = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💡 Pro Tips</Text>
      <View style={styles.tipsList}>
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>📷</Text>
          <Text style={styles.tipText}>
            Use good lighting and avoid shadows when photographing your
            certificate
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>📝</Text>
          <Text style={styles.tipText}>
            Include the complete official name as it appears on the certificate
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>🏢</Text>
          <Text style={styles.tipText}>
            Add the issuing organization to build credibility
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>🎯</Text>
          <Text style={styles.tipText}>
            Tag relevant skills to help clients find you for specific expertise
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
      {renderSkillsSection()}
      {!isEdit && renderSuggestions()}
      {renderPreview()}
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
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageOverlayText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '500',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  imagePlaceholderIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  imagePlaceholderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  imagePlaceholderNote: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
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
  characterCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },
  datePreview: {
    fontSize: 12,
    color: colors.splashGreen,
    marginTop: 4,
    fontWeight: '500',
  },
  skillInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  skillInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
  },
  addSkillButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSkillButtonDisabled: {
    opacity: 0.5,
  },
  addSkillButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  skillTagText: {
    fontSize: 12,
    color: '#1565C0',
    fontWeight: '500',
  },
  skillTagRemove: {
    fontSize: 16,
    color: '#1565C0',
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  suggestionText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  previewCard: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'flex-start',
    gap: 12,
  },
  previewImageContainer: {
    position: 'relative',
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  previewImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImagePlaceholderText: {
    fontSize: 32,
    color: colors.textSecondary,
  },
  previewBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  previewBadgeText: {
    color: colors.background,
    fontSize: 8,
    fontWeight: '600',
  },
  previewInfo: {
    flex: 1,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  previewOrganization: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  previewDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  previewCredential: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace',
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

export default AddEditCertificateScreen;
