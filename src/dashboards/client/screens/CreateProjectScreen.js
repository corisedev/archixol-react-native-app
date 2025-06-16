import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import DocumentPicker from '@react-native-documents/picker';
import {launchImageLibrary} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {createProject} from '../../../services/client/clientService'; // Adjust path as needed

const {width} = Dimensions.get('window');

const CreateProjectScreen = ({navigation}) => {
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    details: '',
    budget: '',
    days_project: '',
    location: '',
    starting_date: new Date(),
    urgent: false,
    note: '',
    required_skills: [],
    tags: [],
  });

  // UI State
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState({});

  // Categories for dropdown
  const categories = [
    'Web Development',
    'Mobile App Development',
    'Graphic Design',
    'Content Writing',
    'Digital Marketing',
    'Data Entry',
    'Translation',
    'Video Editing',
    'Photography',
    'Consulting',
    'Other',
  ];

  // Validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project title is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.details.trim()) {
      newErrors.details = 'Project description is required';
    }

    if (
      !formData.budget ||
      isNaN(formData.budget) ||
      parseFloat(formData.budget) <= 0
    ) {
      newErrors.budget = 'Valid budget amount is required';
    }

    if (
      !formData.days_project ||
      isNaN(formData.days_project) ||
      parseInt(formData.days_project) <= 0
    ) {
      newErrors.days_project = 'Valid timeline in days is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle file attachment
  const handleAttachFile = () => {
    Alert.alert('Attach File', 'Choose file type', [
      {
        text: 'Document',
        onPress: attachDocument,
      },
      {
        text: 'Image',
        onPress: attachImage,
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const attachDocument = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true,
      });

      const newFiles = results.map(file => ({
        uri: file.uri,
        name: file.name,
        type: file.type,
        size: file.size,
        id: Date.now() + Math.random(),
      }));

      setAttachedFiles(prev => [...prev, ...newFiles]);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('Document picker cancelled');
      } else {
        console.error('Document picker error:', err);
        Alert.alert('Error', 'Failed to attach document');
      }
    }
  };

  const attachImage = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
      selectionLimit: 5,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel || response.error) {
        return;
      }

      if (response.assets) {
        const newFiles = response.assets.map(asset => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}.jpg`,
          type: asset.type,
          size: asset.fileSize,
          id: Date.now() + Math.random(),
        }));

        setAttachedFiles(prev => [...prev, ...newFiles]);
      }
    });
  };

  // Remove attached file
  const removeFile = fileId => {
    setAttachedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // Add skill
  const addSkill = () => {
    if (
      skillInput.trim() &&
      !formData.required_skills.includes(skillInput.trim())
    ) {
      setFormData(prev => ({
        ...prev,
        required_skills: [...prev.required_skills, skillInput.trim()],
      }));
      setSkillInput('');
    }
  };

  // Remove skill
  const removeSkill = skill => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter(s => s !== skill),
    }));
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = tag => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  // Handle date change
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({...prev, starting_date: selectedDate}));
    }
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert(
        'Validation Error',
        'Please fill all required fields correctly',
      );
      return;
    }

    setLoading(true);

    try {
      // Prepare files for upload
      const docs = attachedFiles.map(file => ({
        uri: file.uri,
        name: file.name,
        type: file.type,
      }));

      // Prepare data according to backend expectations
      const projectData = {
        name: formData.name,
        category: formData.category.toLowerCase(),
        details: formData.details,
        budget: parseFloat(formData.budget),
        days_project: parseInt(formData.days_project),
        location: formData.location,
        starting_date: formData.starting_date.toISOString(),
        urgent: formData.urgent,
        note: formData.note,
        required_skills: formData.required_skills,
        tags: formData.tags,
        docs: docs,
      };

      const response = await createProject(projectData);

      Alert.alert('Success', 'Project created successfully!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
            // Optionally navigate to project details or projects list
            // navigation.navigate('MyProjectsScreen');
          },
        },
      ]);
    } catch (error) {
      console.error('Create project error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create project. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#2E3A59" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create New Project</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Project Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Project Title <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter project title"
              value={formData.name}
              onChangeText={text =>
                setFormData(prev => ({...prev, name: text}))
              }
              maxLength={100}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Category <Text style={styles.required}>*</Text>
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.categoryRow}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryChip,
                      formData.category === category &&
                        styles.categoryChipSelected,
                    ]}
                    onPress={() => setFormData(prev => ({...prev, category}))}>
                    <Text
                      style={[
                        styles.categoryText,
                        formData.category === category &&
                          styles.categoryTextSelected,
                      ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}
          </View>

          {/* Project Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Project Description <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textArea, errors.details && styles.inputError]}
              placeholder="Describe your project requirements in detail..."
              value={formData.details}
              onChangeText={text =>
                setFormData(prev => ({...prev, details: text}))
              }
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={1000}
            />
            {errors.details && (
              <Text style={styles.errorText}>{errors.details}</Text>
            )}
          </View>

          {/* Budget and Timeline Row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>
                Budget ($) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.budget && styles.inputError]}
                placeholder="0.00"
                value={formData.budget}
                onChangeText={text =>
                  setFormData(prev => ({...prev, budget: text}))
                }
                keyboardType="numeric"
              />
              {errors.budget && (
                <Text style={styles.errorText}>{errors.budget}</Text>
              )}
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={styles.label}>
                Timeline (Days) <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.days_project && styles.inputError]}
                placeholder="30"
                value={formData.days_project}
                onChangeText={text =>
                  setFormData(prev => ({...prev, days_project: text}))
                }
                keyboardType="numeric"
              />
              {errors.days_project && (
                <Text style={styles.errorText}>{errors.days_project}</Text>
              )}
            </View>
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Location <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.location && styles.inputError]}
              placeholder="Enter project location"
              value={formData.location}
              onChangeText={text =>
                setFormData(prev => ({...prev, location: text}))
              }
            />
            {errors.location && (
              <Text style={styles.errorText}>{errors.location}</Text>
            )}
          </View>

          {/* Starting Date */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Starting Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}>
              <Text style={styles.dateText}>
                {formData.starting_date.toLocaleDateString()}
              </Text>
              <Icon name="date-range" size={20} color="#7B8794" />
            </TouchableOpacity>
          </View>

          {/* Urgent Toggle */}
          <View style={styles.inputGroup}>
            <TouchableOpacity
              style={styles.urgentToggle}
              onPress={() =>
                setFormData(prev => ({...prev, urgent: !prev.urgent}))
              }>
              <View style={styles.urgentToggleLeft}>
                <Icon
                  name={
                    formData.urgent ? 'check-box' : 'check-box-outline-blank'
                  }
                  size={24}
                  color={formData.urgent ? '#FF6B6B' : '#7B8794'}
                />
                <Text style={styles.urgentText}>Mark as Urgent</Text>
              </View>
              {formData.urgent && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentBadgeText}>URGENT</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Required Skills */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Required Skills</Text>
            <View style={styles.skillInputRow}>
              <TextInput
                style={styles.skillInput}
                placeholder="Add a skill"
                value={skillInput}
                onChangeText={setSkillInput}
                onSubmitEditing={addSkill}
              />
              <TouchableOpacity style={styles.addButton} onPress={addSkill}>
                <Icon name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.chipContainer}>
              {formData.required_skills.map(skill => (
                <View key={skill} style={styles.chip}>
                  <Text style={styles.chipText}>{skill}</Text>
                  <TouchableOpacity onPress={() => removeSkill(skill)}>
                    <Icon name="close" size={16} color="#7B8794" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Tags */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tags</Text>
            <View style={styles.skillInputRow}>
              <TextInput
                style={styles.skillInput}
                placeholder="Add a tag"
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
              />
              <TouchableOpacity style={styles.addButton} onPress={addTag}>
                <Icon name="add" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.chipContainer}>
              {formData.tags.map(tag => (
                <View key={tag} style={styles.chip}>
                  <Text style={styles.chipText}>{tag}</Text>
                  <TouchableOpacity onPress={() => removeTag(tag)}>
                    <Icon name="close" size={16} color="#7B8794" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Additional Notes */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Additional Notes</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Any additional information or special requirements..."
              value={formData.note}
              onChangeText={text =>
                setFormData(prev => ({...prev, note: text}))
              }
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>

          {/* File Attachments */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Attachments</Text>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={handleAttachFile}>
              <Icon name="attach-file" size={20} color="#4A90E2" />
              <Text style={styles.attachButtonText}>Attach Files</Text>
            </TouchableOpacity>

            {attachedFiles.length > 0 && (
              <View style={styles.attachedFiles}>
                {attachedFiles.map(file => (
                  <View key={file.id} style={styles.attachedFile}>
                    <Icon name="insert-drive-file" size={16} color="#7B8794" />
                    <Text style={styles.fileName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <TouchableOpacity onPress={() => removeFile(file.id)}>
                      <Icon name="close" size={16} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Create Project</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={formData.starting_date}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2E3A59',
  },
  placeholder: {
    width: 34,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2E3A59',
    marginBottom: 8,
  },
  required: {
    color: '#FF6B6B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#2E3A59',
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#2E3A59',
    minHeight: 100,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  categoryRow: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  categoryChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
  },
  categoryChipSelected: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  categoryText: {
    fontSize: 14,
    color: '#7B8794',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  dateText: {
    fontSize: 16,
    color: '#2E3A59',
  },
  urgentToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  urgentToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urgentText: {
    fontSize: 16,
    color: '#2E3A59',
    marginLeft: 10,
  },
  urgentBadge: {
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  urgentBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  skillInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skillInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#2E3A59',
    marginRight: 10,
  },
  addButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 14,
    color: '#4A90E2',
    marginRight: 6,
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A90E2',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  attachButtonText: {
    fontSize: 16,
    color: '#4A90E2',
    marginLeft: 8,
  },
  attachedFiles: {
    marginTop: 10,
  },
  attachedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 5,
  },
  fileName: {
    flex: 1,
    fontSize: 14,
    color: '#2E3A59',
    marginLeft: 8,
    marginRight: 8,
  },
  submitContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  submitButton: {
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default CreateProjectScreen;
