import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {useNavigation, useRoute} from '@react-navigation/native';
import {
  getJobDetail,
  applyForJob,
  getAllServices,
} from '../../../api/serviceProvider';

// Lucide React Native Icons
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Clock,
  DollarSign,
  MapPin,
  User,
  FileText,
  Send,
  AlertCircle,
  CheckCircle,
  Info,
  Star,
  Building,
  Target,
  MoreVertical,
  Bookmark,
} from 'lucide-react-native';

const {width: screenWidth} = Dimensions.get('window');

const ApplyJobScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {jobId, job: routeJob} = route.params || {};

  // State Management
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [jobDetails, setJobDetails] = useState(routeJob || null);
  const [userServices, setUserServices] = useState([]);
  const [matchingServicesCount, setMatchingServicesCount] = useState(0);

  // Form State
  const [proposalText, setProposalText] = useState('');
  const [proposedBudget, setProposedBudget] = useState('');
  const [proposedTimeline, setProposedTimeline] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [requirements, setRequirements] = useState('');

  // Validation State
  const [errors, setErrors] = useState({});

  // Format currency
  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `PKR ${amount.toLocaleString()}`;
    }
    return `PKR ${amount || '0'}`;
  };

  // Format date
  const formatDate = dateString => {
    const date = new Date(dateString);
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Capitalize text
  const capitalizeText = text => {
    if (!text) return '';
    return text
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Fetch job details and user services
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [jobResponse, servicesResponse] = await Promise.all([
          jobId
            ? getJobDetail({job_id: jobId})
            : Promise.resolve({job: routeJob}),
          getAllServices(),
        ]);

        if (jobResponse?.job) {
          setJobDetails(jobResponse.job);
          setUserServices(jobResponse.user_services || []);
          setMatchingServicesCount(jobResponse.matching_services_count || 0);
        }

        if (servicesResponse?.services) {
          setUserServices(prev =>
            prev.length > 0 ? prev : servicesResponse.services,
          );
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        Alert.alert('Error', 'Failed to load job details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId, routeJob]);

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!proposalText.trim()) {
      newErrors.proposalText = 'Cover letter is required';
    } else if (proposalText.length < 50) {
      newErrors.proposalText = 'Cover letter should be at least 50 characters';
    }

    if (!proposedBudget.trim()) {
      newErrors.proposedBudget = 'Proposed budget is required';
    } else if (isNaN(proposedBudget) || parseFloat(proposedBudget) <= 0) {
      newErrors.proposedBudget = 'Please enter a valid budget amount';
    }

    if (!proposedTimeline.trim()) {
      newErrors.proposedTimeline = 'Timeline is required';
    } else if (isNaN(proposedTimeline) || parseInt(proposedTimeline) <= 0) {
      newErrors.proposedTimeline = 'Please enter a valid number of days';
    }

    if (!selectedServiceId) {
      newErrors.selectedServiceId = 'Please select a service category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert(
        'Validation Error',
        'Please fix the errors before submitting.',
      );
      return;
    }

    try {
      setSubmitting(true);

      const applicationData = {
        job_id: jobDetails.id || jobDetails._id,
        proposal_text: proposalText.trim(),
        proposed_budget: parseFloat(proposedBudget),
        proposed_timeline: parseInt(proposedTimeline),
        service_id: selectedServiceId,
        requirements: requirements.trim(),
      };

      const result = await applyForJob(applicationData);

      Alert.alert(
        'Success!',
        'Your application has been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      console.error('Failed to submit application:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.error ||
          'Failed to submit application. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  if (!jobDetails) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <AlertCircle color={colors.textSecondary} size={48} />
        <Text style={styles.errorText}>Job details not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header - Collections Page Style */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Apply for Job</Text>
          <Text style={styles.headerSubtitle}>Submit your proposal</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Bookmark color={colors.text} size={20} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <MoreVertical color={colors.text} size={20} />
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Job Details Card */}
        <View style={styles.jobCard}>
          <View style={styles.jobHeader}>
            <View style={styles.jobHeaderLeft}>
              <Text style={styles.jobTitle} numberOfLines={2}>
                {jobDetails.title}
              </Text>
              <View style={styles.jobBadges}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>
                    {capitalizeText(jobDetails.category)}
                  </Text>
                </View>
                {jobDetails.urgent && (
                  <View style={styles.urgentBadge}>
                    <Text style={styles.urgentBadgeText}>URGENT</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.jobHeaderRight}>
              <Text style={styles.clientLabel}>Posted by:</Text>
              <Text style={styles.clientName}>
                {jobDetails.client_id?.username || 'Client'}
              </Text>
              <Text style={styles.postedDate}>
                {formatDate(jobDetails.createdAt || jobDetails.created_date)}
              </Text>
            </View>
          </View>

          {/* Job Meta Information */}
          <View style={styles.jobMetaContainer}>
            <View style={styles.jobMetaItem}>
              <DollarSign color={colors.splashGreen} size={16} />
              <View style={styles.jobMetaContent}>
                <Text style={styles.jobMetaLabel}>Budget</Text>
                <Text style={styles.jobMetaValue}>
                  {formatCurrency(jobDetails.budget)}
                </Text>
              </View>
            </View>
            <View style={styles.jobMetaItem}>
              <Clock color={colors.textSecondary} size={16} />
              <View style={styles.jobMetaContent}>
                <Text style={styles.jobMetaLabel}>Timeline</Text>
                <Text style={styles.jobMetaValue}>
                  {jobDetails.timeline} days
                </Text>
              </View>
            </View>
            <View style={styles.jobMetaItem}>
              <Calendar color={colors.textSecondary} size={16} />
              <View style={styles.jobMetaContent}>
                <Text style={styles.jobMetaLabel}>Start Date</Text>
                <Text style={styles.jobMetaValue}>
                  {formatDate(jobDetails.starting_date)}
                </Text>
              </View>
            </View>
            <View style={styles.jobMetaItem}>
              <MapPin color={colors.textSecondary} size={16} />
              <View style={styles.jobMetaContent}>
                <Text style={styles.jobMetaLabel}>Location</Text>
                <Text style={styles.jobMetaValue}>
                  {jobDetails.city || 'Remote'}
                </Text>
              </View>
            </View>
          </View>

          {/* Job Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Job Description</Text>
            <Text style={styles.descriptionText}>{jobDetails.description}</Text>
          </View>

          {/* Client Note */}
          {jobDetails.note && (
            <View style={styles.noteContainer}>
              <View style={styles.noteHeader}>
                <Info color={colors.splashGreen} size={16} />
                <Text style={styles.noteTitle}>Client's Note</Text>
              </View>
              <Text style={styles.noteText}>{jobDetails.note}</Text>
            </View>
          )}

          {/* Job Statistics */}
          <View style={styles.statisticsContainer}>
            <Text style={styles.statisticsText}>
              Proposals received: {jobDetails.proposal_count || 0}
            </Text>
            <Text style={styles.statisticsText}>•</Text>
            <Text style={styles.statisticsText}>
              Matching services: {matchingServicesCount}
            </Text>
          </View>
        </View>

        {/* Matching Services Alert */}
        <View
          style={[
            styles.alertContainer,
            matchingServicesCount > 0
              ? styles.successAlert
              : styles.warningAlert,
          ]}>
          <View style={styles.alertIcon}>
            {matchingServicesCount > 0 ? (
              <CheckCircle color={colors.splashGreen} size={20} />
            ) : (
              <AlertCircle color="#F59E0B" size={20} />
            )}
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>
              {matchingServicesCount > 0
                ? `You have ${matchingServicesCount} matching service${
                    matchingServicesCount > 1 ? 's' : ''
                  }`
                : 'No exact service matches'}
            </Text>
            <Text style={styles.alertDescription}>
              {matchingServicesCount > 0
                ? "Your profile services match this job's requirements well."
                : 'Consider updating your services to better match this type of job.'}
            </Text>
          </View>
        </View>

        {/* Proposal Form */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Your Proposal</Text>

          {/* Cover Letter */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Cover Letter *</Text>
            <TextInput
              style={[
                styles.textArea,
                errors.proposalText && styles.inputError,
              ]}
              placeholder="Describe your approach to this project, relevant experience, and why you're the best fit..."
              value={proposalText}
              onChangeText={text => {
                setProposalText(text);
                if (errors.proposalText) {
                  setErrors(prev => ({...prev, proposalText: null}));
                }
              }}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholderTextColor={colors.textSecondary}
            />
            {errors.proposalText && (
              <Text style={styles.fieldErrorText}>{errors.proposalText}</Text>
            )}
          </View>

          {/* Proposed Budget */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Proposed Budget (PKR) *</Text>
            <TextInput
              style={[
                styles.textInput,
                errors.proposedBudget && styles.inputError,
              ]}
              placeholder="Enter your proposed budget"
              value={proposedBudget}
              onChangeText={text => {
                setProposedBudget(text);
                if (errors.proposedBudget) {
                  setErrors(prev => ({...prev, proposedBudget: null}));
                }
              }}
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
            />
            {errors.proposedBudget && (
              <Text style={styles.fieldErrorText}>{errors.proposedBudget}</Text>
            )}
          </View>

          {/* Timeline */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Timeline (Days) *</Text>
            <TextInput
              style={[
                styles.textInput,
                errors.proposedTimeline && styles.inputError,
              ]}
              placeholder="How many days do you need?"
              value={proposedTimeline}
              onChangeText={text => {
                setProposedTimeline(text);
                if (errors.proposedTimeline) {
                  setErrors(prev => ({...prev, proposedTimeline: null}));
                }
              }}
              keyboardType="numeric"
              placeholderTextColor={colors.textSecondary}
            />
            {errors.proposedTimeline && (
              <Text style={styles.fieldErrorText}>
                {errors.proposedTimeline}
              </Text>
            )}
          </View>

          {/* Service Category */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Service Category *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.servicesScrollContent}>
              {userServices.map((service, index) => (
                <TouchableOpacity
                  key={service.id || index}
                  style={[
                    styles.serviceOption,
                    selectedServiceId === service.id &&
                      styles.serviceOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedServiceId(service.id);
                    if (errors.selectedServiceId) {
                      setErrors(prev => ({...prev, selectedServiceId: null}));
                    }
                  }}>
                  <Text
                    style={[
                      styles.serviceOptionText,
                      selectedServiceId === service.id &&
                        styles.serviceOptionTextSelected,
                    ]}>
                    {capitalizeText(service.service_category)}
                  </Text>
                  {service.matches_job_type && (
                    <View style={styles.matchedBadge}>
                      <Text style={styles.matchedBadgeText}>Matched</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.selectedServiceId && (
              <Text style={styles.fieldErrorText}>
                {errors.selectedServiceId}
              </Text>
            )}
          </View>

          {/* Additional Requirements */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Additional Requirements</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Any specific tools, resources, or requirements you need from the client..."
              value={requirements}
              onChangeText={setRequirements}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              disabled={submitting}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                submitting && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <>
                  <Send color={colors.background} size={16} />
                  <Text style={styles.submitButtonText}>
                    Submit Application
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: fontSizes.base,
    color: '#EF4444',
    fontFamily: fonts.medium,
    marginTop: 12,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: colors.background,
    fontFamily: fonts.semiBold,
    fontSize: fontSizes.base,
  },

  // Header - Collections Page Style
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  // Job Card
  jobCard: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  jobHeaderLeft: {
    flex: 1,
    marginRight: 16,
  },
  jobTitle: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
    lineHeight: 28,
  },
  jobBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },
  urgentBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgentBadgeText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bold,
    color: '#EF4444',
  },
  jobHeaderRight: {
    alignItems: 'flex-end',
  },
  clientLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },
  clientName: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginTop: 2,
  },
  postedDate: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 2,
  },

  // Job Meta
  jobMetaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  jobMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '48%',
  },
  jobMetaContent: {
    flex: 1,
  },
  jobMetaLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },
  jobMetaValue: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginTop: 2,
  },

  // Description
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    lineHeight: 22,
  },

  // Note
  noteContainer: {
    backgroundColor: '#E8F5E9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },
  noteText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
    lineHeight: 20,
  },

  // Statistics
  statisticsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statisticsText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  // Alert
  alertContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  successAlert: {
    backgroundColor: '#E8F5E9',
  },
  warningAlert: {
    backgroundColor: '#FEF3C7',
  },
  alertIcon: {
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    lineHeight: 18,
  },

  // Form
  formContainer: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formTitle: {
    fontSize: fontSizes['2xl'],
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 24,
  },

  // Inputs
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 100,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  fieldErrorText: {
    fontSize: fontSizes.sm,
    color: '#EF4444',
    fontFamily: fonts.medium,
    marginTop: 4,
  },

  // Services
  servicesScrollContent: {
    paddingRight: 16,
  },
  serviceOption: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 120,
    alignItems: 'center',
  },
  serviceOptionSelected: {
    backgroundColor: colors.splashGreen,
    borderColor: colors.splashGreen,
  },
  serviceOptionText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  serviceOptionTextSelected: {
    color: colors.background,
  },
  matchedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  matchedBadgeText: {
    fontSize: fontSizes.xs,
    fontFamily: fonts.bold,
    color: colors.background,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  submitButton: {
    flex: 2,
    backgroundColor: colors.splashGreen,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },
});

export default ApplyJobScreen;
