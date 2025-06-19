import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import {
  ArrowLeft,
  Building,
  Mail,
  Phone,
  MapPin,
  Edit3,
   X,
  Check,
   IdCard,
  Receipt,
  Building2,
  Settings,
  Share2,
  Camera,
} from 'lucide-react-native';
import {colors} from '../../../../utils/colors';
import {fonts, fontSizes} from '../../../../utils/fonts';
import {
  getCompany,
  becomeCompany,
  getProfile,
} from '../../../../api/serviceProvider';
import {useNavigation} from '@react-navigation/native';
import {useContext} from 'react';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../../context/BackendContext';

const {width} = Dimensions.get('window');

const CompanyProfileScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [companyData, setCompanyData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isCompany, setIsCompany] = useState(false);
  const [becomingCompany, setBecomingCompany] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const navigation = useNavigation();
  const {backendUrl} = useContext(BackendContext);

  // Get full image URL helper function
  const getFullImageUrl = relativePath => {
    if (!relativePath) {
      return null;
    }
    if (relativePath.startsWith('http')) {
      return relativePath;
    }

    const baseUrl = backendUrl || VITE_API_BASE_URL;
    const cleanPath = relativePath.startsWith('/')
      ? relativePath.substring(1)
      : relativePath;
    return `${baseUrl}/${cleanPath}`;
  };

  // Fetch user profile and company data
  const fetchData = useCallback(async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      console.log('🔍 Fetching user and company data...');

      // First get user profile to check if they're a company
      const userResponse = await getProfile();
      setUserData(userResponse);

      // Check if user is a company
      const userIsCompany =
        userResponse?.isCompany ||
        userResponse?.account_type === 'company' ||
        userResponse?.user_type === 'company';

      setIsCompany(userIsCompany);
      console.log('✅ User is company:', userIsCompany);

      // If user is a company, fetch company data
      if (userIsCompany) {
        try {
          const companyResponse = await getCompany();
          // Extract company data properly
          const company = companyResponse?.company || companyResponse;
          setCompanyData(company);
          console.log('✅ Company data loaded:', company);
        } catch (companyError) {
          console.error('❌ Failed to load company data:', companyError);
          // User is marked as company but company data doesn't exist
          setCompanyData(null);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load data:', error);
      Alert.alert('Error', 'Unable to load profile data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
  }, [fetchData]);

  // Handle become company
  const handleBecomeCompany = async () => {
    setBecomingCompany(true);
    try {
      console.log('🏢 Registering as company...');

      const response = await becomeCompany();

      console.log('✅ Successfully registered as company:', response);

      // Update local state
      setIsCompany(true);
      setUserData(prev => ({
        ...prev,
        isCompany: true,
        account_type: 'company',
      }));

      Alert.alert(
        'Success',
        'You have successfully registered as a company! You can now set up your company profile.',
        [
          {
            text: 'Setup Profile',
            onPress: () => navigation.navigate('EditCompanyProfileScreen'),
          },
          {
            text: 'Later',
            style: 'cancel',
          },
        ],
      );

      // Refresh data to get any initial company data
      await fetchData();
    } catch (error) {
      console.error('❌ Failed to become company:', error);
      Alert.alert(
        'Error',
        error?.response?.data?.error ||
          'Failed to register as company. Please try again.',
      );
    } finally {
      setBecomingCompany(false);
      setConfirmModalVisible(false);
    }
  };

  // Format experience years
  const formatExperience = years => {
    if (!years) return 'Experience Not Provided';
    return `${years} years of Experience`;
  };

  // Format company type
  const formatCompanyType = type => {
    if (!type) return 'Not Provided';
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Render service tags
  const renderServiceTags = services => {
    if (!services || services.length === 0) {
      return (
        <View style={styles.serviceTag}>
          <Text style={styles.serviceTagText}>No Services Provided</Text>
        </View>
      );
    }

    return (
      <View style={styles.servicesContainer}>
        {services.map((service, index) => (
          <View key={index} style={styles.serviceTag}>
            <Text style={styles.serviceTagText}>{service}</Text>
          </View>
        ))}
        {/* Experience tag */}
        <View style={styles.serviceTag}>
          <Text style={styles.serviceTagText}>
            {formatExperience(companyData?.experience)}
          </Text>
        </View>
      </View>
    );
  };

  // Render information item
  const renderInfoItem = (icon, label, value) => (
    <View style={styles.infoItem}>
      <View style={styles.iconContainer}>
        {React.createElement(icon, {
          color: colors.splashGreen,
          size: 20,
        })}
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not Provided'}</Text>
      </View>
    </View>
  );

  // Render company profile content
  const renderCompanyProfile = () => {
    if (!companyData) {
      return (
        <View style={styles.noDataContainer}>
          <Building color={colors.textSecondary} size={64} />
          <Text style={styles.noDataTitle}>Company Profile Not Set Up</Text>
          <Text style={styles.noDataSubtitle}>
            Complete your company profile to showcase your business
          </Text>
          <TouchableOpacity
            style={styles.setupButton}
            onPress={() => navigation.navigate('EditCompanyProfileScreen')}>
            <Text style={styles.setupButtonText}>Setup Company Profile</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {/* Company Header Card */}
        <View style={styles.headerCard}>
     

          {/* Banner Image */}
          <View style={styles.bannerContainer}>
            {companyData.banner ? (
              <Image
                source={{uri: getFullImageUrl(companyData.banner)}}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.bannerPlaceholder}>
                <Text style={styles.bannerPlaceholderText}>Place Holder</Text>
              </View>
            )}
          </View>

          {/* Company Logo and Info */}
          <View style={styles.companyInfoSection}>
            {/* Company Logo */}
            <View style={styles.logoContainer}>
              {companyData.logo ? (
                <Image
                  source={{uri: getFullImageUrl(companyData.logo)}}
                  style={styles.logoImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoText}>
                    {companyData.name
                      ? companyData.name.charAt(0).toUpperCase()
                      : 'N'}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.cameraButton}>
                <Camera color={colors.background} size={14} />
              </TouchableOpacity>
            </View>

            {/* Company Basic Info */}
            <View style={styles.companyBasicInfo}>
              <Text style={styles.companyName}>
                {companyData.name || 'Not Provided'}
              </Text>
              <Text style={styles.companyType}>
                {formatCompanyType(companyData.type)}
              </Text>
            </View>

            {/* Edit Button */}
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditCompanyProfileScreen')}>
              <Edit3 color={colors.background} size={16} />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Company Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Company Information</Text>
            <View style={styles.infoGrid}>
              {renderInfoItem(Mail, 'Email', companyData.business_email)}
              {renderInfoItem(MapPin, 'Address', companyData.address)}
              {renderInfoItem(Phone, 'Phone Number', companyData.phone_number)}
              {renderInfoItem(IdCard, 'CNIC', companyData.owner_cnic)}
              {renderInfoItem(
                Building2,
                'Business Registration',
                companyData.BRN,
              )}
              {renderInfoItem(Receipt, 'Tax ID/NTN', companyData.tax_ntn)}
            </View>
          </View>

          {/* About the Company Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About the Company</Text>
            <Text style={styles.aboutText}>
              {companyData.description || 'Not Provided'}
            </Text>

            {/* Services and Experience Tags */}
            {renderServiceTags(companyData.services_tags)}
          </View>

          {/* Owner Information Section */}
          {(companyData.owner_name || companyData.owner_cnic) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Owner Information</Text>
              <View style={styles.ownerInfoGrid}>
                {renderInfoItem(Mail, 'Owner/CEO Name', companyData.owner_name)}
                {renderInfoItem(IdCard, 'Owner CNIC', companyData.owner_cnic)}
                {renderInfoItem(
                  Phone,
                  'Phone Number',
                  companyData.phone_number,
                )}
                {renderInfoItem(MapPin, 'Address', companyData.address)}
              </View>
            </View>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    );
  };

  // Render become company section
  const renderBecomeCompany = () => (
    <View style={styles.becomeCompanyContainer}>
      <View style={styles.becomeCompanyContent}>
        <Building color={colors.splashGreen} size={64} />

        <Text style={styles.becomeCompanyTitle}>Become a Company</Text>

        <Text style={styles.becomeCompanyDescription}>
          Join our platform as a registered company and unlock exclusive
          features to manage your projects, appointments, and services
          efficiently. Showcase your business, connect with clients, and
          streamline your workflow—all in one place.
        </Text>

        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <Check color={colors.splashGreen} size={20} />
            <Text style={styles.benefitText}>Professional company profile</Text>
          </View>
          <View style={styles.benefitItem}>
            <Check color={colors.splashGreen} size={20} />
            <Text style={styles.benefitText}>Enhanced business features</Text>
          </View>
          <View style={styles.benefitItem}>
            <Check color={colors.splashGreen} size={20} />
            <Text style={styles.benefitText}>Team management tools</Text>
          </View>
          <View style={styles.benefitItem}>
            <Check color={colors.splashGreen} size={20} />
            <Text style={styles.benefitText}>
              Advanced analytics & reporting
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.becomeCompanyButton}
          onPress={() => setConfirmModalVisible(true)}
          disabled={becomingCompany}>
          {becomingCompany ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <>
              <Building color={colors.background} size={20} />
              <Text style={styles.becomeCompanyButtonText}>
                Register as a Company
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading company profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Company Profile</Text>
        </View>

        {isCompany && (
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('EditCompanyProfileScreen')}>
            <Edit3 color={colors.text} size={20} />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {isCompany ? renderCompanyProfile() : renderBecomeCompany()}

      {/* Confirmation Modal */}
      <Modal
        visible={confirmModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setConfirmModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Become a Company</Text>
              <TouchableOpacity onPress={() => setConfirmModalVisible(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Building color={colors.splashGreen} size={48} />
              <Text style={styles.modalDescription}>
                Are you sure you want to register as a company? This will change
                your account type and unlock business features.
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setConfirmModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleBecomeCompany}
                disabled={becomingCompany}>
                {becomingCompany ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Register Now</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Header
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

  // Scroll Content
  scrollContent: {
    paddingBottom: 20,
  },

  // Header Card
  headerCard: {
    backgroundColor: colors.background,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  headerActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Banner
  bannerContainer: {
    height: 140,
    width: '100%',
    marginTop: 12,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerPlaceholderText: {
    color: colors.background,
    fontSize: fontSizes.xxl,
    fontFamily: fonts.bold,
  },

  // Company Info Section
  companyInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: -30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.background,
    borderWidth: 4,
    borderColor: colors.background,
    overflow: 'hidden',
    marginRight: 16,
    position: 'relative',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: fontSizes.xxl,
    fontFamily: fonts.bold,
    color: colors.splashGreen,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  companyBasicInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.bold,
    color: colors.text,
    marginBottom: 4,
  },
  companyType: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  editButtonText: {
    color: colors.background,
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
  },

  // Content Container
  contentContainer: {
    paddingHorizontal: 16,
  },

  // Section
  section: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 16,
  },

  // Info Grid
  infoGrid: {
    gap: 16,
  },
  ownerInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    minWidth: '45%',
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  // About Section
  aboutText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.text,
    lineHeight: 22,
    textAlign: 'justify',
    marginBottom: 16,
  },

  // Services Container
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceTag: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  serviceTagText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  // No Data State
  noDataContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
    backgroundColor: colors.background,
    margin: 16,
    borderRadius: 12,
  },
  noDataTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noDataSubtitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  setupButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  setupButtonText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
  },

  // Become Company Section
  becomeCompanyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  becomeCompanyContent: {
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 32,
    borderRadius: 16,
    maxWidth: 400,
    width: '100%',
  },
  becomeCompanyTitle: {
    fontSize: fontSizes.xxl,
    fontFamily: fonts.bold,
    color: colors.text,
    marginTop: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  becomeCompanyDescription: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  benefitsList: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  benefitText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.text,
    flex: 1,
  },
  becomeCompanyButton: {
    backgroundColor: colors.splashGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
    minWidth: 200,
  },
  becomeCompanyButtonText: {
    color: colors.background,
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  confirmModal: {
    backgroundColor: colors.background,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
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
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  modalContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  modalDescription: {
    fontSize: fontSizes.base,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 16,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.textSecondary,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.splashGreen,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },

  // Spacing
  bottomSpacing: {
    height: 32,
  },
});

export default CompanyProfileScreen;
