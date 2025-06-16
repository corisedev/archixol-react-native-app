import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import {addCompanyDoc, updateCompanyDoc} from '../../../../api/serviceProvider';

const AddEditCompanyDocScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {document, isEdit} = route.params || {};

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    dated: new Date().toISOString().split('T')[0],
    document_number: '',
    issuing_authority: '',
    expiry_date: '',
    description: '',
  });
  const [selectedImage, setSelectedImage] = useState(null);

  // Document categories with icons and templates
  const documentCategories = [
    {
      name: 'Business License',
      icon: '📜',
      color: '#4CAF50',
      template: 'Business Operating License',
    },
    {
      name: 'Tax Registration',
      icon: '💰',
      color: '#FF9800',
      template: 'Tax Registration Certificate',
    },
    {
      name: 'Trade License',
      icon: '🏪',
      color: '#2196F3',
      template: 'Trade License Certificate',
    },
    {
      name: 'Insurance Certificate',
      icon: '🛡️',
      color: '#9C27B0',
      template: 'Business Insurance Certificate',
    },
    {
      name: 'Registration Certificate',
      icon: '📝',
      color: '#F44336',
      template: 'Company Registration Certificate',
    },
    {
      name: 'Permit Document',
      icon: '📋',
      color: '#607D8B',
      template: 'Building/Work Permit',
    },
    {
      name: 'Compliance Certificate',
      icon: '✅',
      color: '#795548',
      template: 'Compliance Certificate',
    },
    {
      name: 'Other Document',
      icon: '📄',
      color: '#757575',
      template: 'Business Document',
    },
  ];

  const createSectionsData = () => [
    {id: 'image', type: 'image'},
    {id: 'basic_info', type: 'basic_info'},
    {id: 'dates', type: 'dates'},
    ...(isEdit ? [] : [{id: 'document_types', type: 'document_types'}]),
    {id: 'preview', type: 'preview'},
    {id: 'tips', type: 'tips'},
  ];

  useEffect(() => {
    if (isEdit && document) {
      setFormData({
        title: document.title || '',
        dated: document.dated
          ? document.dated.split('T')[0]
          : new Date().toISOString().split('T')[0],
        document_number: document.document_number || '',
        issuing_authority: document.issuing_authority || '',
        expiry_date: document.expiry_date
          ? document.expiry_date.split('T')[0]
          : '',
        description: document.description || '',
      });
    }
  }, [isEdit, document]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const renderSection = ({item}) => {
    switch (item.type) {
      case 'image':
        return renderImageSection();
      case 'basic_info':
        return renderBasicInfo();
      case 'dates':
        return renderDateSection();
      case 'document_types':
        return renderDocumentTypes();
      case 'preview':
        return renderPreview();
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
            {isEdit ? 'Edit Document' : 'Add Business Document'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isEdit
              ? 'Update your document details'
              : 'Upload and organize your business credentials'}
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

  const handleImagePicker = () => {
    Alert.alert(
      'Add Document Image',
      'Choose how you want to add your document image',
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

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Validation Error', 'Document title is required');
      return false;
    }
    if (formData.title.trim().length < 5) {
      Alert.alert(
        'Validation Error',
        'Document title should be at least 5 characters',
      );
      return false;
    }
    if (!formData.dated) {
      Alert.alert('Validation Error', 'Issue date is required');
      return false;
    }

    // Validate date logic
    const issueDate = new Date(formData.dated);
    const today = new Date();
    if (issueDate > today) {
      Alert.alert('Validation Error', 'Issue date cannot be in the future');
      return false;
    }

    // Validate expiry date if provided
    if (formData.expiry_date) {
      const expiryDate = new Date(formData.expiry_date);
      if (expiryDate <= issueDate) {
        Alert.alert('Validation Error', 'Expiry date must be after issue date');
        return false;
      }
    }

    if (!isEdit && !selectedImage && !document?.doc_image) {
      Alert.alert(
        'Validation Error',
        'Document image is required for new documents',
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

      const documentData = {
        ...formData,
        doc_image: selectedImage ? [selectedImage] : [],
      };

      if (isEdit) {
        documentData.document_id = document.id;
        await updateCompanyDoc(documentData);
        Alert.alert('Success', 'Document updated successfully!', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      } else {
        await addCompanyDoc(documentData);
        Alert.alert('Success', 'Document added successfully!', [
          {text: 'OK', onPress: () => navigation.goBack()},
        ]);
      }
    } catch (error) {
      console.error('Failed to save document:', error);
      Alert.alert(
        'Error',
        `Failed to ${isEdit ? 'update' : 'add'} document. Please try again.`,
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

  const getDocumentStatus = () => {
    if (!formData.expiry_date) {
      return null;
    }

    const today = new Date();
    const expiryDate = new Date(formData.expiry_date);
    const daysUntilExpiry = Math.ceil(
      (expiryDate - today) / (1000 * 60 * 60 * 24),
    );

    if (daysUntilExpiry < 0) {
      return {status: 'expired', text: 'Expired', color: '#F44336', icon: '⚠️'};
    } else if (daysUntilExpiry <= 30) {
      return {
        status: 'expiring',
        text: 'Expiring Soon',
        color: '#FF9800',
        icon: '⏰',
      };
    } else {
      return {status: 'valid', text: 'Valid', color: '#4CAF50', icon: '✅'};
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
            {isEdit ? 'Edit Document' : 'Add Business Document'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isEdit
              ? 'Update your document details'
              : 'Upload and organize your business credentials'}
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
      <Text style={styles.sectionTitle}>📄 Document Image *</Text>
      <Text style={styles.sectionDescription}>
        Upload a clear scan or photo of your document
      </Text>
      <TouchableOpacity
        style={styles.imageContainer}
        onPress={handleImagePicker}>
        {document?.doc_image || selectedImage ? (
          <View style={styles.imageWrapper}>
            <Image
              source={{uri: document?.doc_image || selectedImage}}
              style={styles.selectedImage}
            />
            <View style={styles.imageOverlay}>
              <Text style={styles.imageOverlayText}>📷 Change Image</Text>
            </View>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderIcon}>📸</Text>
            <Text style={styles.imagePlaceholderTitle}>Upload Document</Text>
            <Text style={styles.imagePlaceholderNote}>
              Scan or take a photo of your business document
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderBasicInfo = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📝 Document Details</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Document Title *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Business Operating License - Trade Permit"
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
        <Text style={styles.inputLabel}>Document Number (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., BL-2024-001234 or REG-789456"
          value={formData.document_number}
          onChangeText={value => updateFormData('document_number', value)}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Issuing Authority (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Ministry of Commerce, Local Municipality"
          value={formData.issuing_authority}
          onChangeText={value => updateFormData('issuing_authority', value)}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Additional details about this document, its purpose, or special conditions..."
          value={formData.description}
          onChangeText={value => updateFormData('description', value)}
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );

  const renderDateSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📅 Document Dates</Text>

      <View style={styles.dateRow}>
        <View style={styles.dateInput}>
          <Text style={styles.inputLabel}>Issue Date *</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={formData.dated}
            onChangeText={text => handleDateChange('dated', text)}
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

        <View style={styles.dateInput}>
          <Text style={styles.inputLabel}>Expiry Date (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={formData.expiry_date}
            onChangeText={text => handleDateChange('expiry_date', text)}
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            maxLength={10}
          />
          {formData.expiry_date && (
            <Text style={styles.datePreview}>
              📅 {formatDateForDisplay(formData.expiry_date)}
            </Text>
          )}
        </View>
      </View>

      {getDocumentStatus() && (
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: getDocumentStatus().color},
            ]}>
            <Text style={styles.statusIcon}>{getDocumentStatus().icon}</Text>
            <Text style={styles.statusText}>{getDocumentStatus().text}</Text>
          </View>
        </View>
      )}
    </View>
  );

  const renderDocumentTypes = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>📋 Document Categories</Text>
      <Text style={styles.sectionDescription}>
        Select a category to use as your document title template
      </Text>
      <View style={styles.categoriesGrid}>
        {documentCategories.map((category, index) => (
          <TouchableOpacity
            key={index}
            style={styles.categoryCard}
            onPress={() => updateFormData('title', category.template)}>
            <View
              style={[styles.categoryIcon, {backgroundColor: category.color}]}>
              <Text style={styles.categoryIconText}>{category.icon}</Text>
            </View>
            <Text style={styles.categoryName}>{category.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderPreview = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>👁️ Preview</Text>
      <Text style={styles.sectionDescription}>
        How your document will appear in your company profile
      </Text>
      <View style={styles.previewCard}>
        <View style={styles.previewImageContainer}>
          {document?.doc_image || selectedImage ? (
            <Image
              source={{uri: document?.doc_image || selectedImage}}
              style={styles.previewImage}
            />
          ) : (
            <View style={styles.previewImagePlaceholder}>
              <Text style={styles.previewImagePlaceholderText}>📄</Text>
            </View>
          )}
          <View style={styles.previewBadge}>
            <Text style={styles.previewBadgeText}>DOC</Text>
          </View>
        </View>
        <View style={styles.previewInfo}>
          <Text style={styles.previewTitle}>
            {formData.title || 'Document Title'}
          </Text>
          {formData.issuing_authority && (
            <Text style={styles.previewAuthority}>
              {formData.issuing_authority}
            </Text>
          )}
          <Text style={styles.previewDate}>
            Issue:{' '}
            {formData.dated ? formatDateForDisplay(formData.dated) : 'Date'}
          </Text>
          {formData.expiry_date && (
            <Text style={styles.previewExpiry}>
              Expires: {formatDateForDisplay(formData.expiry_date)}
            </Text>
          )}
          {formData.document_number && (
            <Text style={styles.previewNumber}>
              #{formData.document_number}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderTips = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>💡 Best Practices</Text>
      <View style={styles.tipsList}>
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>📷</Text>
          <Text style={styles.tipText}>
            Use high-resolution scans or well-lit photos with all text clearly
            visible
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>📝</Text>
          <Text style={styles.tipText}>
            Include the complete official document name and reference numbers
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>📅</Text>
          <Text style={styles.tipText}>
            Add expiry dates to receive renewal reminders and maintain
            compliance
          </Text>
        </View>
        <View style={styles.tipItem}>
          <Text style={styles.tipIcon}>🔒</Text>
          <Text style={styles.tipText}>
            Only upload documents you have legal authorization to share publicly
          </Text>
        </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  stickyHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 50, // Status bar space
    paddingBottom: 16,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
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
  statusContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusIcon: {
    fontSize: 14,
  },
  statusText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: '45%',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryIconText: {
    fontSize: 20,
  },
  categoryName: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
    textAlign: 'center',
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
  previewAuthority: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  previewDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  previewExpiry: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  previewNumber: {
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

export default AddEditCompanyDocScreen;
