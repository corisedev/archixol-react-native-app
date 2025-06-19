import React, {useState, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import {colors} from '../../../../utils/colors';;;
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {
  getCompany,
  becomeCompany,
  getCompanyDocs,
} from '../../../../api/serviceProvider';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../../context/BackendContext';

const {width} = Dimensions.get('window');

const CompanyProfileScreen = () => {
  const navigation = useNavigation();
  const [company, setCompany] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [becomingCompany, setBecomingCompany] = useState(false);
  const [isCompany, setIsCompany] = useState(false);

  // Get backend URL from context or env
  const {backendUrl} = useContext(BackendContext);
  const BASE_IMAGE_URL = backendUrl || VITE_API_BASE_URL;

  console.log('🏢 Company Screen - Base Image URL:', BASE_IMAGE_URL);

  // Helper function to get full image URL
  const getFullImageUrl = relativePath => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath; // Already full URL

    const fullUrl = `${BASE_IMAGE_URL}${relativePath}`;
    console.log('🖼️ Company Image URL:', relativePath, '→', fullUrl);
    return fullUrl;
  };

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchCompanyData();
    }, []),
  );

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      try {
        const companyData = await getCompany();
        console.log('🏢 Company Data:', companyData);

        const actualCompany = companyData.company || companyData;
        console.log('🏢 Actual Company Object:', actualCompany);
        console.log('🏢 Company Logo:', actualCompany?.logo);
        console.log('🏢 Company Banner:', actualCompany?.banner);
        console.log('🏢 Company License:', actualCompany?.license_img);

        setCompany(actualCompany);
        setIsCompany(true);

        const docsData = await getCompanyDocs();
        console.log('📋 Company Documents:', docsData);
        setDocuments(docsData.documents || []);
      } catch (error) {
        console.log('❌ No company data found, user is not a company');
        setIsCompany(false);
        setCompany(null);
        setDocuments([]);
      }
    } catch (error) {
      console.error('Failed to load company data:', error);
      Alert.alert('Error', 'Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCompanyData();
    setRefreshing(false);
  };

  const handleBecomeCompany = async () => {
    Alert.alert(
      'Upgrade to Company Profile',
      'Transform your individual profile into a professional business presence. This upgrade is free and includes company branding, document management, and enhanced credibility features.',
      [
        {text: 'Maybe Later', style: 'cancel'},
        {text: 'Upgrade Now', style: 'default', onPress: confirmBecomeCompany},
      ],
    );
  };

  const confirmBecomeCompany = async () => {
    try {
      setBecomingCompany(true);
      await becomeCompany();
      setIsCompany(true);
      Alert.alert(
        'Welcome to Business!',
        'Your company profile is now active! Start by adding your business details and uploading important documents to build trust with clients.',
        [{text: 'Get Started', onPress: () => handleEditCompany()}],
      );
      await fetchCompanyData();
    } catch (error) {
      console.error('Failed to become company:', error);
      Alert.alert('Error', 'Failed to upgrade to company profile');
    } finally {
      setBecomingCompany(false);
    }
  };

  const handleEditCompany = () => {
    navigation.navigate('EditCompany', {company});
  };

  const handleManageDocuments = () => {
    navigation.navigate('ManageCompanyDocs');
  };

  const getCompanyCompleteness = () => {
    if (!company) return 0;
    const fields = [
      company.name,
      company.description,
      company.business_email,
      company.phone_number,
      company.address,
      company.logo,
      company.license_img,
      company.services && company.services.length > 0,
    ];
    const completed = fields.filter(field => field && field !== '').length;
    return Math.round((completed / fields.length) * 100);
  };

  const getDocumentStats = () => {
    const currentYear = new Date().getFullYear();
    const thisYear = documents.filter(
      doc => doc.dated && new Date(doc.dated).getFullYear() === currentYear,
    ).length;

    const expiringSoon = documents.filter(doc => {
      if (!doc.expiry_date) return false;
      const expiryDate = new Date(doc.expiry_date);
      const today = new Date();
      const thirtyDaysFromNow = new Date(
        today.getTime() + 30 * 24 * 60 * 60 * 1000,
      );
      return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
    }).length;

    return {
      total: documents.length,
      thisYear,
      expiringSoon,
      verified: documents.length,
    };
  };

  // ✅ Sticky Header Component
  const renderHeader = () => {
    const completeness = getCompanyCompleteness();

    return (
      <View style={styles.stickyHeader}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Company Profile</Text>
            <Text style={styles.headerSubtitle}>
              {isCompany
                ? 'Manage your business presence'
                : 'Upgrade to business profile'}
            </Text>
          </View>
          {isCompany && (
            <TouchableOpacity
              style={styles.editHeaderButton}
              onPress={handleEditCompany}>
              <Text style={styles.editHeaderIcon}>✏️</Text>
              <Text style={styles.editHeaderText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {isCompany && (
          <View style={styles.completenessContainer}>
            <View style={styles.completenessCard}>
              <View style={styles.completenessHeader}>
                <Text style={styles.completenessTitle}>
                  Profile Completeness
                </Text>
                <Text style={styles.completenessPercentage}>
                  {completeness}%
                </Text>
              </View>
              <View style={styles.completenessBar}>
                <View
                  style={[
                    styles.completenessProgress,
                    {width: `${completeness}%`},
                  ]}
                />
              </View>
              <Text style={styles.completenessHint}>
                {completeness < 80
                  ? 'Complete your profile to build more trust with clients'
                  : 'Great! Your profile looks professional and complete'}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  // ✅ Create sections data for FlatList
  const createSectionsData = () => {
    if (!isCompany) {
      return [{id: 'upgrade', type: 'upgrade'}];
    }

    return [
      {id: 'company_header', type: 'company_header'},
      {id: 'business_metrics', type: 'business_metrics'},
      {id: 'contact_info', type: 'contact_info'},
      ...(company?.license_img
        ? [{id: 'license_info', type: 'license_info'}]
        : []),
      ...(company?.services?.length > 0
        ? [{id: 'services', type: 'services'}]
        : []),
      {id: 'documents', type: 'documents'},
      {id: 'quick_actions', type: 'quick_actions'},
    ];
  };

  // ✅ Render different section types
  const renderSection = ({item}) => {
    switch (item.type) {
      case 'upgrade':
        return renderNotCompanyView();
      case 'company_header':
        return renderCompanyHeader();
      case 'business_metrics':
        return renderBusinessMetrics();
      case 'contact_info':
        return renderContactInfo();
      case 'license_info':
        return renderLicenseInfo();
      case 'services':
        return renderServices();
      case 'documents':
        return renderDocumentsSection();
      case 'quick_actions':
        return renderQuickActions();
      default:
        return null;
    }
  };

  const renderNotCompanyView = () => (
    <View style={styles.upgradeSection}>
      <View style={styles.upgradeCard}>
        <View style={styles.upgradeIconContainer}>
          <Text style={styles.upgradeIcon}>🏢</Text>
          <View style={styles.upgradeIconBadge}>
            <Text style={styles.upgradeIconBadgeText}>FREE</Text>
          </View>
        </View>

        <Text style={styles.upgradeTitle}>Transform Into a Business</Text>
        <Text style={styles.upgradeDescription}>
          Elevate your professional presence with a comprehensive company
          profile. Showcase your expertise, build client trust, and stand out
          from individual service providers.
        </Text>

        <View style={styles.upgradeFeatures}>
          <Text style={styles.featuresTitle}>✨ What You'll Get:</Text>

          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>🎯</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Professional Branding</Text>
                <Text style={styles.featureDescription}>
                  Custom logo, banner, and company colors
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>📋</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Document Management</Text>
                <Text style={styles.featureDescription}>
                  Upload licenses, certificates, and permits
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>🛡️</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Trust & Credibility</Text>
                <Text style={styles.featureDescription}>
                  Verified business status and credentials
                </Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureIconText}>📈</Text>
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>Business Insights</Text>
                <Text style={styles.featureDescription}>
                  Performance metrics and client analytics
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.upgradeStats}>
          <View style={styles.upgradeStat}>
            <Text style={styles.upgradeStatNumber}>3x</Text>
            <Text style={styles.upgradeStatLabel}>More Client Trust</Text>
          </View>
          <View style={styles.upgradeStatDivider} />
          <View style={styles.upgradeStat}>
            <Text style={styles.upgradeStatNumber}>2x</Text>
            <Text style={styles.upgradeStatLabel}>Higher Bookings</Text>
          </View>
          <View style={styles.upgradeStatDivider} />
          <View style={styles.upgradeStat}>
            <Text style={styles.upgradeStatNumber}>100%</Text>
            <Text style={styles.upgradeStatLabel}>Free Forever</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.upgradeButton,
            becomingCompany && styles.upgradeButtonDisabled,
          ]}
          onPress={handleBecomeCompany}
          disabled={becomingCompany}>
          {becomingCompany ? (
            <View style={styles.upgradeButtonLoading}>
              <ActivityIndicator size="small" color={colors.background} />
              <Text style={styles.upgradeButtonLoadingText}>
                Creating your business profile...
              </Text>
            </View>
          ) : (
            <View style={styles.upgradeButtonContent}>
              <Text style={styles.upgradeButtonIcon}>🚀</Text>
              <Text style={styles.upgradeButtonText}>
                Upgrade to Business Profile
              </Text>
              <Text style={styles.upgradeButtonSubtext}>
                Free • Takes 30 seconds
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.upgradeNote}>
          <Text style={styles.upgradeNoteIcon}>💡</Text>
          <Text style={styles.upgradeNoteText}>
            You can always switch back to individual profile later if needed
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCompanyHeader = () => {
    const bannerImageUrl = getFullImageUrl(company?.banner);
    const logoImageUrl = getFullImageUrl(company?.logo);

    console.log('🏢 Rendering Company Header...');
    console.log('🏢 Banner URL:', bannerImageUrl);
    console.log('🏢 Logo URL:', logoImageUrl);

    return (
      <View style={styles.companyHeader}>
        <View style={styles.bannerContainer}>
          {bannerImageUrl ? (
            <Image
              source={{uri: bannerImageUrl}}
              style={styles.bannerImage}
              onLoad={() =>
                console.log('✅ Company banner loaded successfully')
              }
              onError={error =>
                console.log(
                  '❌ Company banner failed to load:',
                  error.nativeEvent.error,
                )
              }
            />
          ) : (
            <View style={styles.bannerPlaceholder}>
              <Text style={styles.bannerPlaceholderText}>🏢</Text>
              <Text style={styles.bannerPlaceholderLabel}>
                Add Company Banner
              </Text>
            </View>
          )}
          <View style={styles.bannerOverlay} />
          <TouchableOpacity
            style={styles.bannerEditButton}
            onPress={handleEditCompany}>
            <Text style={styles.bannerEditIcon}>📷</Text>
            <Text style={styles.bannerEditText}>Edit Banner</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            {logoImageUrl ? (
              <Image
                source={{uri: logoImageUrl}}
                style={styles.companyLogo}
                onLoad={() =>
                  console.log('✅ Company logo loaded successfully')
                }
                onError={error =>
                  console.log(
                    '❌ Company logo failed to load:',
                    error.nativeEvent.error,
                  )
                }
              />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={styles.logoPlaceholderText}>🏢</Text>
              </View>
            )}
            <View style={styles.logoStatusBadge}>
              <Text style={styles.logoStatusIcon}>✅</Text>
            </View>
          </View>
        </View>

        <View style={styles.companyInfo}>
          <View style={styles.companyNameSection}>
            <Text style={styles.companyName}>
              {company.name || 'Company Name'}
            </Text>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>🛡️</Text>
              <Text style={styles.verifiedText}>Verified Business</Text>
            </View>
          </View>

          <View style={styles.companyMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>👤</Text>
              <Text style={styles.metaText}>
                Owner: {company.owner_name || 'Not specified'}
              </Text>
            </View>

            {company.experience && (
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>⭐</Text>
                <Text style={styles.metaText}>
                  {company.experience}{' '}
                  {company.experience === 1 ? 'year' : 'years'} in business
                </Text>
              </View>
            )}

            {company.service_location && (
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>📍</Text>
                <Text style={styles.metaText}>
                  {String(company.service_location)}
                </Text>
              </View>
            )}
          </View>

          {company.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionText}>
                {String(company.description)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // ✅ Updated Business Metrics with 2x2 Grid
  const renderBusinessMetrics = () => {
    const docStats = getDocumentStats();
    const metrics = [
      {
        icon: '📊',
        number: `${getCompanyCompleteness()}%`,
        label: 'Profile Complete',
        color: colors.splashGreen,
      },
      {
        icon: '📄',
        number: docStats.total,
        label: 'Documents',
        color: '#2196F3',
      },
      {
        icon: '✅',
        number: docStats.verified,
        label: 'Verified',
        color: '#4CAF50',
      },
      {
        icon: '⚠️',
        number: docStats.expiringSoon,
        label: 'Expiring Soon',
        color: '#FF9800',
      },
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Business Overview</Text>
        <View style={styles.metricsGrid}>
          {metrics.map((metric, index) => (
            <View key={index} style={styles.metricCard}>
              <Text style={styles.metricIcon}>{metric.icon}</Text>
              <Text style={[styles.metricNumber, {color: metric.color}]}>
                {metric.number}
              </Text>
              <Text style={styles.metricLabel}>{metric.label}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderContactInfo = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Business Contact</Text>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>Professional</Text>
        </View>
      </View>

      <View style={styles.contactGrid}>
        {company.business_email && (
          <View style={styles.contactItem}>
            <View style={styles.contactIconContainer}>
              <Text style={styles.contactIcon}>📧</Text>
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Business Email</Text>
              <Text style={styles.contactText}>
                {String(company.business_email)}
              </Text>
            </View>
            <TouchableOpacity style={styles.contactAction}>
              <Text style={styles.contactActionText}>✉️</Text>
            </TouchableOpacity>
          </View>
        )}

        {company.phone_number && (
          <View style={styles.contactItem}>
            <View style={styles.contactIconContainer}>
              <Text style={styles.contactIcon}>📱</Text>
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Phone Number</Text>
              <Text style={styles.contactText}>
                {String(company.phone_number)}
              </Text>
            </View>
            <TouchableOpacity style={styles.contactAction}>
              <Text style={styles.contactActionText}>📞</Text>
            </TouchableOpacity>
          </View>
        )}

        {company.address && (
          <View style={styles.contactItem}>
            <View style={styles.contactIconContainer}>
              <Text style={styles.contactIcon}>🏠</Text>
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Business Address</Text>
              <Text style={styles.contactText}>{String(company.address)}</Text>
            </View>
            <TouchableOpacity style={styles.contactAction}>
              <Text style={styles.contactActionText}>🗺️</Text>
            </TouchableOpacity>
          </View>
        )}

        {company.owner_cnic && (
          <View style={styles.contactItem}>
            <View style={styles.contactIconContainer}>
              <Text style={styles.contactIcon}>🆔</Text>
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactLabel}>Owner CNIC</Text>
              <Text style={styles.contactText}>
                CNIC: {String(company.owner_cnic)}
              </Text>
            </View>
            <View style={styles.cnicVerifiedBadge}>
              <Text style={styles.cnicVerifiedText}>✅ Verified</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  const renderLicenseInfo = () => {
    const licenseImageUrl = getFullImageUrl(company?.license_img);

    console.log('📋 License Image URL:', licenseImageUrl);

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Business License</Text>
          <View style={styles.licenseStatusBadge}>
            <Text style={styles.licenseStatusIcon}>✅</Text>
            <Text style={styles.licenseStatusText}>Verified</Text>
          </View>
        </View>

        <View style={styles.licenseContainer}>
          <View style={styles.licenseImageContainer}>
            {licenseImageUrl ? (
              <Image
                source={{uri: licenseImageUrl}}
                style={styles.licenseImage}
                onLoad={() =>
                  console.log('✅ License image loaded successfully')
                }
                onError={error =>
                  console.log(
                    '❌ License image failed to load:',
                    error.nativeEvent.error,
                  )
                }
              />
            ) : (
              <View style={styles.licenseImagePlaceholder}>
                <Text style={styles.licenseImagePlaceholderText}>📄</Text>
                <Text style={styles.licenseImagePlaceholderLabel}>
                  License Image
                </Text>
              </View>
            )}
            <View style={styles.licenseOverlay}>
              <TouchableOpacity style={styles.licenseViewButton}>
                <Text style={styles.licenseViewIcon}>👁️</Text>
                <Text style={styles.licenseViewText}>View Full Size</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.licenseInfo}>
            <View style={styles.licenseInfoItem}>
              <Text style={styles.licenseInfoIcon}>🏛️</Text>
              <Text style={styles.licenseInfoText}>
                Government Issued Business License
              </Text>
            </View>
            <View style={styles.licenseInfoItem}>
              <Text style={styles.licenseInfoIcon}>🔒</Text>
              <Text style={styles.licenseInfoText}>
                Document Authenticity Verified
              </Text>
            </View>
            <View style={styles.licenseInfoItem}>
              <Text style={styles.licenseInfoIcon}>📅</Text>
              <Text style={styles.licenseInfoText}>Valid & Up to Date</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderServices = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Business Services</Text>
        <Text style={styles.servicesCount}>
          {company.services.length} Services
        </Text>
      </View>

      <View style={styles.servicesContainer}>
        {company.services.slice(0, 6).map((service, index) => (
          <View key={index} style={styles.serviceCard}>
            <Text style={styles.serviceIcon}>⚡</Text>
            <Text style={styles.serviceText}>
              {typeof service === 'string'
                ? service
                : service.name || service.title || 'Service'}
            </Text>
          </View>
        ))}
        {company.services.length > 6 && (
          <View style={styles.serviceCard}>
            <Text style={styles.serviceIcon}>➕</Text>
            <Text style={styles.serviceText}>
              +{company.services.length - 6} more services
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderDocumentsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <Text style={styles.sectionTitle}>Company Documents</Text>
          <Text style={styles.sectionSubtitle}>
            Legal credentials and certifications
          </Text>
        </View>
        <TouchableOpacity
          style={styles.manageButton}
          onPress={handleManageDocuments}>
          <Text style={styles.manageButtonIcon}>⚙️</Text>
          <Text style={styles.manageButtonText}>Manage</Text>
        </TouchableOpacity>
      </View>

      {documents.length > 0 ? (
        <>
          <View style={styles.documentsGrid}>
            {documents.slice(0, 4).map((doc, index) => {
              const docImageUrl = getFullImageUrl(doc.doc_image);
              console.log(`📄 Document ${index} Image URL:`, docImageUrl);

              return (
                <View key={index} style={styles.documentCard}>
                  <View style={styles.documentImageContainer}>
                    {docImageUrl ? (
                      <Image
                        source={{uri: docImageUrl}}
                        style={styles.documentImage}
                        onLoad={() =>
                          console.log(
                            `✅ Document ${index} image loaded successfully`,
                          )
                        }
                        onError={error =>
                          console.log(
                            `❌ Document ${index} image failed to load:`,
                            error.nativeEvent.error,
                          )
                        }
                      />
                    ) : (
                      <View style={styles.documentPlaceholder}>
                        <Text style={styles.documentPlaceholderText}>📄</Text>
                      </View>
                    )}
                    <View style={styles.documentBadge}>
                      <Text style={styles.documentBadgeText}>DOC</Text>
                    </View>
                  </View>

                  <Text style={styles.documentTitle} numberOfLines={2}>
                    {String(doc.title) || 'Document'}
                  </Text>

                  <View style={styles.documentMeta}>
                    <Text style={styles.documentDate}>
                      📅{' '}
                      {doc.dated
                        ? new Date(doc.dated).toLocaleDateString()
                        : 'No date'}
                    </Text>
                  </View>
                </View>
              );
            })}

            {documents.length > 4 && (
              <TouchableOpacity
                style={styles.moreDocsCard}
                onPress={handleManageDocuments}>
                <View style={styles.moreDocsPlaceholder}>
                  <Text style={styles.moreDocsNumber}>
                    +{documents.length - 4}
                  </Text>
                  <Text style={styles.moreDocsText}>More Documents</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.viewAllDocsButton}
            onPress={handleManageDocuments}>
            <Text style={styles.viewAllDocsText}>📋 View All Documents</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.noDocuments}>
          <Text style={styles.noDocumentsIcon}>📁</Text>
          <Text style={styles.noDocumentsTitle}>No Documents Yet</Text>
          <Text style={styles.noDocumentsText}>
            Build trust with clients by uploading your business credentials,
            licenses, certificates, and permits.
          </Text>

          <View style={styles.documentBenefits}>
            <View style={styles.documentBenefit}>
              <Text style={styles.documentBenefitIcon}>🛡️</Text>
              <Text style={styles.documentBenefitText}>Build client trust</Text>
            </View>
            <View style={styles.documentBenefit}>
              <Text style={styles.documentBenefitIcon}>⚖️</Text>
              <Text style={styles.documentBenefitText}>
                Meet legal requirements
              </Text>
            </View>
            <View style={styles.documentBenefit}>
              <Text style={styles.documentBenefitIcon}>🏆</Text>
              <Text style={styles.documentBenefitText}>
                Stand out from competitors
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.addFirstDocButton}
            onPress={handleManageDocuments}>
            <Text style={styles.addFirstDocIcon}>📄</Text>
            <Text style={styles.addFirstDocText}>Add Your First Document</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // ✅ Updated Quick Actions with 2x2 Grid
  const renderQuickActions = () => {
    const actions = [
      {
        icon: '✏️',
        title: 'Edit Profile',
        desc: 'Update company details',
        onPress: handleEditCompany,
        color: colors.splashGreen,
      },
      {
        icon: '📋',
        title: 'Manage Docs',
        desc: 'Add or update documents',
        onPress: handleManageDocuments,
        color: '#2196F3',
      },
      {
        icon: '📊',
        title: 'Analytics',
        desc: 'View profile insights',
        onPress: () => {},
        color: '#FF9800',
      },
      {
        icon: '🔗',
        title: 'Share Profile',
        desc: 'Share with clients',
        onPress: () => {},
        color: '#9C27B0',
      },
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {actions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickActionCard}
              onPress={action.onPress}>
              <View
                style={[
                  styles.quickActionIconContainer,
                  {backgroundColor: `${action.color}20`},
                ]}>
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
              </View>
              <Text style={styles.quickActionTitle}>{action.title}</Text>
              <Text style={styles.quickActionDesc}>{action.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading your company profile...</Text>
        <Text style={styles.loadingSubtext}>This may take a few moments</Text>
      </View>
    );
  }

  // ✅ Main return with FlatList
  return (
    <View style={styles.container}>
      <FlatList
        data={createSectionsData()}
        renderItem={renderSection}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.splashGreen]}
            tintColor={colors.splashGreen}
          />
        }
      />
    </View>
  );
};

// Set displayName for Layout component detection
CompanyProfileScreen.displayName = 'CompanyProfileScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  flatListContent: {
    paddingBottom: 40, // Bottom nav space
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },

  // ✅ Sticky Header Styles
  stickyHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 50, // Status bar space
    paddingBottom: 16,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
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
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  editHeaderButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  editHeaderIcon: {
    color: colors.background,
    fontSize: 12,
  },
  editHeaderText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },

  // Profile Completeness
  completenessContainer: {
    marginTop: 8,
  },
  completenessCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  completenessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  completenessTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  completenessPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.splashGreen,
  },
  completenessBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 8,
  },
  completenessProgress: {
    height: '100%',
    backgroundColor: colors.splashGreen,
    borderRadius: 3,
  },
  completenessHint: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Upgrade Section
  upgradeSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  upgradeCard: {
    backgroundColor: colors.background,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  upgradeIconContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  upgradeIcon: {
    fontSize: 80,
  },
  upgradeIconBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upgradeIconBadgeText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: '700',
  },
  upgradeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  upgradeDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    maxWidth: 300,
  },
  upgradeFeatures: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureIconText: {
    fontSize: 18,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  upgradeStats: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  upgradeStat: {
    flex: 1,
    alignItems: 'center',
  },
  upgradeStatNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.splashGreen,
    marginBottom: 4,
  },
  upgradeStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  upgradeStatDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  upgradeButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    alignSelf: 'stretch',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
    marginBottom: 16,
  },
  upgradeButtonDisabled: {
    opacity: 0.7,
  },
  upgradeButtonContent: {
    alignItems: 'center',
  },
  upgradeButtonIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  upgradeButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  upgradeButtonSubtext: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  upgradeButtonLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  upgradeButtonLoadingText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  upgradeNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  upgradeNoteIcon: {
    fontSize: 16,
  },
  upgradeNoteText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    flex: 1,
  },

  // Company Header
  companyHeader: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  bannerContainer: {
    height: 160,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerPlaceholderText: {
    fontSize: 48,
    color: colors.background,
    marginBottom: 8,
  },
  bannerPlaceholderLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  bannerEditButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bannerEditIcon: {
    fontSize: 14,
  },
  bannerEditText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: -60,
    marginBottom: 20,
  },
  logoContainer: {
    position: 'relative',
  },
  companyLogo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    borderColor: colors.background,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: colors.background,
  },
  logoPlaceholderText: {
    fontSize: 48,
    color: colors.textSecondary,
  },
  logoStatusBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  logoStatusIcon: {
    fontSize: 16,
  },
  companyInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  companyNameSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  companyName: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  verifiedIcon: {
    fontSize: 14,
  },
  verifiedText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  companyMeta: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaIcon: {
    fontSize: 16,
  },
  metaText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  descriptionContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  descriptionText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
    textAlign: 'center',
  },

  // Sections
  section: {
    backgroundColor: colors.background,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  sectionBadge: {
    backgroundColor: 'rgba(103, 58, 183, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionBadgeText: {
    color: '#673AB7',
    fontSize: 10,
    fontWeight: '600',
  },

  // ✅ Updated Business Metrics - 2x2 Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: (width - 88) / 2, // 2 cards per row
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Contact Info
  contactGrid: {
    gap: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contactIcon: {
    fontSize: 18,
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  contactText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  contactAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactActionText: {
    fontSize: 14,
  },
  cnicVerifiedBadge: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cnicVerifiedText: {
    color: '#4CAF50',
    fontSize: 10,
    fontWeight: '600',
  },

  // License Info
  licenseStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  licenseStatusIcon: {
    fontSize: 12,
  },
  licenseStatusText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: '600',
  },
  licenseContainer: {
    gap: 16,
  },
  licenseImageContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  licenseImage: {
    width: width - 112,
    height: 200,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  licenseImagePlaceholder: {
    width: width - 112,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  licenseImagePlaceholderText: {
    fontSize: 48,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  licenseImagePlaceholderLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  licenseOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: 8,
  },
  licenseViewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  licenseViewIcon: {
    fontSize: 14,
  },
  licenseViewText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  licenseInfo: {
    gap: 12,
  },
  licenseInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  licenseInfoIcon: {
    fontSize: 16,
    width: 24,
  },
  licenseInfoText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },

  // Services
  servicesCount: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  serviceIcon: {
    fontSize: 14,
  },
  serviceText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },

  // Documents Section
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  manageButtonIcon: {
    fontSize: 12,
  },
  manageButtonText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  documentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  documentCard: {
    width: (width - 88) / 2,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
  },
  documentImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  documentImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  documentPlaceholder: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  documentPlaceholderText: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  documentBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  documentBadgeText: {
    color: colors.background,
    fontSize: 8,
    fontWeight: '600',
  },
  documentTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    lineHeight: 18,
  },
  documentMeta: {
    marginTop: 4,
  },
  documentDate: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  moreDocsCard: {
    width: (width - 88) / 2,
    backgroundColor: colors.splashGreen,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  moreDocsPlaceholder: {
    alignItems: 'center',
  },
  moreDocsNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.background,
    marginBottom: 4,
  },
  moreDocsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.background,
  },
  viewAllDocsButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  viewAllDocsText: {
    fontSize: 14,
    color: colors.splashGreen,
    fontWeight: '600',
  },
  noDocuments: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noDocumentsIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noDocumentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  noDocumentsText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 280,
  },
  documentBenefits: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  documentBenefit: {
    alignItems: 'center',
    flex: 1,
  },
  documentBenefitIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  documentBenefitText: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  addFirstDocButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  addFirstDocIcon: {
    fontSize: 16,
  },
  addFirstDocText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },

  // ✅ Updated Quick Actions - 2x2 Grid
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    width: (width - 88) / 2, // 2 cards per row
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
  },
  quickActionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickActionIcon: {
    fontSize: 20,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  quickActionDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default CompanyProfileScreen;
