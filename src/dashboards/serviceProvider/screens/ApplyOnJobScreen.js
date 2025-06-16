import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {useNavigation, useRoute} from '@react-navigation/native';

const ApplyOnJobScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {job} = route.params;

  const [uploadStatus, setUploadStatus] = useState('idle');
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    email: '',
    experience: '',
    skills: [],
    coverLetter: '',
    bidAmount: '',
    estimatedTime: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationRef, setApplicationRef] = useState('');

  const skillOptions = [
    'Plumbing',
    'Bathroom Fixtures',
    'Water Systems',
    'Pipe Fitting',
    'Installation',
    'Repair',
    'Maintenance',
    'Problem Solving',
  ];

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleUploadCV = () => {
    setUploadStatus('uploading');
    setTimeout(() => {
      setUploadStatus('uploaded');
    }, 2000);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.phoneNumber.trim())
      newErrors.phoneNumber = 'Phone number is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.experience.trim())
      newErrors.experience = 'Experience is required';
    if (formData.skills.length === 0)
      newErrors.skills = 'Select at least one skill';
    if (!formData.bidAmount.trim())
      newErrors.bidAmount = 'Bid amount is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      const ref = `APP-${Date.now().toString().slice(-6)}${Math.floor(
        Math.random() * 100,
      )}`;
      setApplicationRef(ref);
      setIsSubmitted(true);
    }
  };

  const toggleSkill = skill => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const calculatePrice = () => {
    const bidValue = parseInt(formData.bidAmount) || 0;
    const minPrice = job.minPrice || 0;
    const maxPrice = job.maxPrice || 0;

    if (bidValue >= minPrice && bidValue <= maxPrice) {
      return {isValid: true, message: 'Within budget range'};
    }
    return {isValid: false, message: 'Outside budget range'};
  };

  // Format currency
  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `Rs ${amount.toLocaleString()}`;
    }
    return `Rs ${amount || '0'}`;
  };

  // Success Screen
  if (isSubmitted) {
    return (
      <View style={styles.container}>
        {/* Sticky Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Application Submitted</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Text style={styles.successIcon}>✓</Text>
          </View>

          <Text style={styles.successTitle}>Application Submitted!</Text>
          <Text style={styles.successSubtitle}>
            Your application for "{job.title}" has been successfully submitted.
            The client will review your application and contact you soon.
          </Text>

          <View style={styles.applicationRefContainer}>
            <Text style={styles.refTitle}>Application Reference</Text>
            <Text style={styles.refNumber}>{applicationRef}</Text>
          </View>

          <TouchableOpacity
            style={styles.viewStatusButton}
            onPress={() => navigation.navigate('MyApplications')}>
            <Text style={styles.viewStatusButtonText}>
              View Application Status
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backToJobsButton}
            onPress={() => navigation.navigate('JobsScreen')}>
            <Text style={styles.backToJobsButtonText}>Back to Jobs</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Sticky Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Apply for Job
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}>
        {/* Job Info Card */}
        <View style={styles.jobInfoCard}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <View style={styles.jobMeta}>
            <View style={styles.jobLocation}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.jobLocationText}>{job.location}</Text>
            </View>
            {job.tag && (
              <View style={[styles.jobTag, {backgroundColor: job.tagBgColor}]}>
                <Text style={[styles.jobTagText, {color: job.tagColor}]}>
                  {job.tag}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.jobBudget}>{job.price}</Text>

          {/* Budget Range */}
          {job.minPrice && job.maxPrice && (
            <View style={styles.budgetRange}>
              <Text style={styles.budgetRangeLabel}>Budget Range:</Text>
              <Text style={styles.budgetRangeValue}>
                {formatCurrency(job.minPrice)} - {formatCurrency(job.maxPrice)}
              </Text>
            </View>
          )}
        </View>

        {/* CV Upload Section */}
        <View style={styles.uploadSection}>
          <Text style={styles.sectionTitle}>Upload CV/Resume</Text>

          {uploadStatus === 'idle' && (
            <>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleUploadCV}>
                <Text style={styles.uploadIcon}>📁</Text>
                <Text style={styles.uploadText}>
                  Tap to upload your CV/Resume
                </Text>
                <Text style={styles.uploadSubtext}>
                  PDF, DOC, DOCX (max 5MB)
                </Text>
              </TouchableOpacity>
            </>
          )}

          {uploadStatus === 'uploading' && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color={colors.splashGreen} />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          )}

          {uploadStatus === 'uploaded' && (
            <View style={styles.uploadedContainer}>
              <Text style={styles.uploadSuccessIcon}>✓</Text>
              <Text style={styles.uploadedText}>CV uploaded successfully</Text>
              <TouchableOpacity
                style={styles.reuploadButton}
                onPress={() => setUploadStatus('idle')}>
                <Text style={styles.reuploadText}>Upload Different File</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Personal Information */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={[styles.input, errors.fullName && styles.inputError]}
              placeholder="Enter your full name"
              value={formData.fullName}
              onChangeText={text => setFormData({...formData, fullName: text})}
            />
            {errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={[styles.input, errors.phoneNumber && styles.inputError]}
              placeholder="+92 300 1234567"
              value={formData.phoneNumber}
              onChangeText={text =>
                setFormData({...formData, phoneNumber: text})
              }
              keyboardType="phone-pad"
            />
            {errors.phoneNumber && (
              <Text style={styles.errorText}>{errors.phoneNumber}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="your.email@example.com"
              value={formData.email}
              onChangeText={text => setFormData({...formData, email: text})}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </View>
        </View>

        {/* Experience & Skills */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Experience & Skills</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Years of Experience *</Text>
            <TextInput
              style={[styles.input, errors.experience && styles.inputError]}
              placeholder="e.g., 5 years"
              value={formData.experience}
              onChangeText={text =>
                setFormData({...formData, experience: text})
              }
              keyboardType="numeric"
            />
            {errors.experience && (
              <Text style={styles.errorText}>{errors.experience}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Relevant Skills *</Text>
            <View style={styles.skillsContainer}>
              {skillOptions.map(skill => (
                <TouchableOpacity
                  key={skill}
                  style={[
                    styles.skillChip,
                    formData.skills.includes(skill) && styles.skillChipActive,
                  ]}
                  onPress={() => toggleSkill(skill)}>
                  {formData.skills.includes(skill) && (
                    <Text style={styles.checkIcon}>✓</Text>
                  )}
                  <Text
                    style={[
                      styles.skillText,
                      formData.skills.includes(skill) && styles.skillTextActive,
                    ]}>
                    {skill}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.skills && (
              <Text style={styles.errorText}>{errors.skills}</Text>
            )}
          </View>
        </View>

        {/* Cover Letter */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Cover Letter</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Why are you the best fit?</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your experience, skills, and why you're perfect for this job..."
              value={formData.coverLetter}
              onChangeText={text =>
                setFormData({...formData, coverLetter: text})
              }
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Bid Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Your Bid</Text>

          {job.minPrice && job.maxPrice && (
            <View style={styles.bidRangeContainer}>
              <Text style={styles.bidRangeText}>
                {formatCurrency(job.minPrice)}
              </Text>
              <View style={styles.bidSlider}>
                <View style={styles.bidSliderTrack} />
                <View style={styles.bidSliderThumb} />
              </View>
              <Text style={styles.bidRangeText}>
                {formatCurrency(job.maxPrice)}
              </Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bid Amount (Rs) *</Text>
            <TextInput
              style={[styles.input, errors.bidAmount && styles.inputError]}
              placeholder="Enter your bid amount"
              value={formData.bidAmount}
              onChangeText={text => setFormData({...formData, bidAmount: text})}
              keyboardType="numeric"
            />
            {formData.bidAmount && (
              <Text
                style={[
                  styles.bidValidation,
                  calculatePrice().isValid
                    ? styles.bidValid
                    : styles.bidInvalid,
                ]}>
                {calculatePrice().message}
              </Text>
            )}
            {errors.bidAmount && (
              <Text style={styles.errorText}>{errors.bidAmount}</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Expected Completion Time</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 2-3 days, 1 week"
              value={formData.estimatedTime}
              onChangeText={text =>
                setFormData({...formData, estimatedTime: text})
              }
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Application</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // Sticky Header
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
  backBtn: {
    padding: 8,
  },
  backBtnText: {
    color: colors.splashGreen,
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerPlaceholder: {
    width: 40,
  },

  scrollView: {
    flex: 1,
  },

  // Job Info Card
  jobInfoCard: {
    backgroundColor: colors.background,
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  jobMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  jobLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  jobLocationText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  jobTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  jobTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  jobBudget: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.splashGreen,
    marginBottom: 8,
  },
  budgetRange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 6,
  },
  budgetRangeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginRight: 8,
  },
  budgetRangeValue: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },

  // Form Sections
  formSection: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  uploadSection: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },

  // Upload Styles
  uploadButton: {
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  uploadingContainer: {
    alignItems: 'center',
    padding: 24,
  },
  uploadingText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  uploadedContainer: {
    alignItems: 'center',
    padding: 24,
  },
  uploadSuccessIcon: {
    fontSize: 32,
    color: colors.splashGreen,
    marginBottom: 8,
  },
  uploadedText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  reuploadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.splashGreen,
    borderRadius: 6,
  },
  reuploadText: {
    fontSize: 12,
    color: colors.splashGreen,
  },

  // Form Inputs
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 100,
  },

  // Skills
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
  },
  skillChipActive: {
    borderColor: colors.splashGreen,
    backgroundColor: colors.splashGreen + '20',
  },
  checkIcon: {
    color: colors.splashGreen,
    marginRight: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  skillText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  skillTextActive: {
    color: colors.splashGreen,
    fontWeight: '500',
  },

  // Bid Section
  bidRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  bidRangeText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  bidSlider: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginHorizontal: 12,
    position: 'relative',
  },
  bidSliderTrack: {
    height: 4,
    backgroundColor: colors.splashGreen,
    borderRadius: 2,
    width: '50%',
  },
  bidSliderThumb: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: colors.splashGreen,
    borderRadius: 6,
    top: -4,
    left: '50%',
    marginLeft: -6,
  },
  bidValidation: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  bidValid: {
    color: colors.splashGreen,
  },
  bidInvalid: {
    color: '#F44336',
  },

  // Bottom Actions
  bottomActions: {
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
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: colors.splashGreen,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },

  // Success Screen
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.splashGreen + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 40,
    color: colors.splashGreen,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  applicationRefContainer: {
    backgroundColor: colors.splashGreen + '20',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    alignItems: 'center',
    width: '100%',
  },
  refTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  refNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.splashGreen,
  },
  viewStatusButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 16,
  },
  viewStatusButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  backToJobsButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  backToJobsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});

export default ApplyOnJobScreen;
