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
  Linking,
} from 'react-native';
import {
  ArrowLeft,
  Building,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Globe,
  User,
  MoreVertical,
  Edit,
  Star,
  Package,
  DollarSign,
  Clock,
  Award,
  ExternalLink,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {getVendor} from '../../../api/serviceSupplier';
import {useNavigation} from '@react-navigation/native';

const VendorDetailScreen = ({route}) => {
  const navigation = useNavigation();
  const {vendorId, vendorData} = route.params;

  // State
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showActionModal, setShowActionModal] = useState(false);

  // Transform slug to title helper
  const transformSlugToTitle = slug => {
    if (!slug) return 'N/A';
    return slug
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format date helper
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get business type color
  const getBusinessTypeColor = type => {
    const colors = {
      general_contractor: '#4CAF50',
      specialty_contractor: '#2196F3',
      material_supplier: '#FF9800',
      equipment_lessor: '#9C27B0',
      construction_consultant: '#607D8B',
    };
    return colors[type] || '#757575';
  };

  // Fetch vendor data
  const fetchVendorData = useCallback(async () => {
    setLoading(true);
    try {
      // If we have data from route params, use it, otherwise fetch
      if (vendorData) {
        setVendor(vendorData);
      } else {
        const response = await getVendor({vendor_id: vendorId});
        if (response && response.vendor) {
          setVendor(response.vendor);
        }
      }
    } catch (error) {
      console.error('Failed to fetch vendor:', error);
      Alert.alert('Error', 'Failed to load vendor data');
    } finally {
      setLoading(false);
    }
  }, [vendorData, vendorId]);

  useEffect(() => {
    fetchVendorData();
  }, [fetchVendorData]);

  // Handle phone call
  const handlePhoneCall = phoneNumber => {
    const url = `tel:${phoneNumber}`;
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Phone calls are not supported on this device');
        }
      })
      .catch(error => console.error('Error opening phone:', error));
  };

  // Handle email
  const handleEmail = email => {
    const url = `mailto:${email}`;
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Email is not supported on this device');
        }
      })
      .catch(error => console.error('Error opening email:', error));
  };

  // Handle website
  const handleWebsite = website => {
    let url = website;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert('Error', 'Cannot open website');
        }
      })
      .catch(error => console.error('Error opening website:', error));
  };

  // Handle edit
  const handleEdit = () => {
    setShowActionModal(false);
    navigation.navigate('EditVendorScreen', {
      vendorId: vendor.id,
      vendorData: vendor,
    });
  };

  // Render stats card
  const renderStatsCard = ({
    title,
    value,
    icon: Icon,
    color = colors.splashGreen,
  }) => (
    <View style={styles.statsCard}>
      <View style={[styles.statsIcon, {backgroundColor: color + '20'}]}>
        <Icon color={color} size={20} />
      </View>
      <View style={styles.statsContent}>
        <Text style={styles.statsValue}>{value}</Text>
        <Text style={styles.statsTitle}>{title}</Text>
      </View>
    </View>
  );

  // Render info row
  const renderInfoRow = ({label, value, onPress, icon: Icon}) => (
    <TouchableOpacity
      style={styles.infoRow}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <View style={styles.infoValueContainer}>
          <Text
            style={[styles.infoValue, onPress && styles.infoValueClickable]}>
            {value || 'N/A'}
          </Text>
          {Icon && onPress && <Icon color={colors.splashGreen} size={16} />}
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render action modal
  const renderActionModal = () => (
    <Modal
      visible={showActionModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowActionModal(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.actionModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Vendor Actions</Text>
            <TouchableOpacity onPress={() => setShowActionModal(false)}>
              <ArrowLeft color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.actionOption} onPress={handleEdit}>
            <Edit color={colors.text} size={20} style={styles.actionIcon} />
            <Text style={styles.actionText}>Edit Vendor</Text>
          </TouchableOpacity>

          {vendor?.phone_number && (
            <TouchableOpacity
              style={styles.actionOption}
              onPress={() => {
                setShowActionModal(false);
                handlePhoneCall(vendor.phone_number);
              }}>
              <Phone color={colors.text} size={20} style={styles.actionIcon} />
              <Text style={styles.actionText}>Call Vendor</Text>
            </TouchableOpacity>
          )}

          {vendor?.email && (
            <TouchableOpacity
              style={styles.actionOption}
              onPress={() => {
                setShowActionModal(false);
                handleEmail(vendor.email);
              }}>
              <Mail color={colors.text} size={20} style={styles.actionIcon} />
              <Text style={styles.actionText}>Send Email</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading vendor details...</Text>
      </View>
    );
  }

  // Error state
  if (!vendor) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Building color={colors.textSecondary} size={48} />
        <Text style={styles.errorTitle}>Vendor Not Found</Text>
        <Text style={styles.errorSubtitle}>
          Unable to load vendor data. Please try again.
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}>
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Vendor Details</Text>
          <Text style={styles.headerSubtitle}>
            {vendor.vendor_name || `${vendor.first_name} ${vendor.last_name}`}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowActionModal(true)}>
          <MoreVertical color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={{
                  uri:
                    vendor.logo ||
                    'https://via.placeholder.com/120x120/22c55e/FFFFFF?text=V',
                }}
                style={styles.avatar}
                resizeMode="cover"
              />
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.vendorName}>
                {vendor.vendor_name ||
                  `${vendor.first_name} ${vendor.last_name}`}
              </Text>

              {vendor.business_type && (
                <View
                  style={[
                    styles.businessTypeChip,
                    {
                      backgroundColor:
                        getBusinessTypeColor(vendor.business_type) + '20',
                    },
                  ]}>
                  <Text
                    style={[
                      styles.businessTypeText,
                      {color: getBusinessTypeColor(vendor.business_type)},
                    ]}>
                    {transformSlugToTitle(vendor.business_type)}
                  </Text>
                </View>
              )}

              <View style={styles.profileMeta}>
                <View style={styles.metaItem}>
                  <Calendar color={colors.textSecondary} size={14} />
                  <Text style={styles.metaText}>
                    Created: {formatDate(vendor.created_at)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Performance Overview</Text>
          <View style={styles.statsGrid}>
            {renderStatsCard({
              title: 'Total Orders',
              value: vendor.purchased_product || '0',
              icon: Package,
              color: colors.splashGreen,
            })}
            {renderStatsCard({
              title: 'Order Value',
              value: `$${vendor.total_order_value || '0'}`,
              icon: DollarSign,
              color: '#2196F3',
            })}
            {renderStatsCard({
              title: 'Avg. Delivery',
              value: `${vendor.avg_delivery_time || '0'} days`,
              icon: Clock,
              color: '#FF9800',
            })}
            {renderStatsCard({
              title: 'Quality Rating',
              value: `${vendor.quality_rating || '4.8'}★`,
              icon: Star,
              color: '#FFC107',
            })}
          </View>
        </View>

        {/* Company Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Company Information</Text>
          <View style={styles.sectionContent}>
            {renderInfoRow({
              label: 'Company Name',
              value:
                vendor.vendor_name ||
                `${vendor.first_name} ${vendor.last_name}`,
            })}
            {renderInfoRow({
              label: 'Business Type',
              value: transformSlugToTitle(vendor.business_type),
            })}
            {renderInfoRow({
              label: 'Tax ID/NTN',
              value: vendor.tax_ntn,
            })}
            {renderInfoRow({
              label: 'Year Established',
              value: vendor.year_established,
            })}
            {renderInfoRow({
              label: 'Employees',
              value: transformSlugToTitle(vendor.employees),
            })}
            {vendor.website &&
              renderInfoRow({
                label: 'Website',
                value: vendor.website,
                onPress: () => handleWebsite(vendor.website),
                icon: ExternalLink,
              })}
          </View>
        </View>

        {/* Address Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Information</Text>
          <View style={styles.sectionContent}>
            {renderInfoRow({
              label: 'Street Address',
              value: vendor.street_address,
            })}
            {renderInfoRow({
              label: 'City',
              value: vendor.city,
            })}
            {renderInfoRow({
              label: 'State/Province',
              value: vendor.state_province,
            })}
            {renderInfoRow({
              label: 'Postal/ZIP Code',
              value: vendor.zip_code,
            })}
            {renderInfoRow({
              label: 'Country',
              value: vendor.country,
            })}
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Primary Contact</Text>
          <View style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <View style={styles.contactAvatar}>
                <User color={colors.background} size={20} />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>
                  {`${vendor.first_name} ${vendor.last_name}`.trim() ||
                    'Contact Person'}
                </Text>
                <Text style={styles.contactRole}>Primary Contact</Text>
              </View>
            </View>

            <View style={styles.contactActions}>
              {vendor.email && (
                <TouchableOpacity
                  style={styles.contactAction}
                  onPress={() => handleEmail(vendor.email)}>
                  <Mail color={colors.splashGreen} size={16} />
                  <Text style={styles.contactActionText}>{vendor.email}</Text>
                </TouchableOpacity>
              )}

              {vendor.phone_number && (
                <TouchableOpacity
                  style={styles.contactAction}
                  onPress={() => handlePhoneCall(vendor.phone_number)}>
                  <Phone color={colors.splashGreen} size={16} />
                  <Text style={styles.contactActionText}>
                    {vendor.phone_number}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Modal */}
      {renderActionModal()}
    </View>
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
  errorTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
    fontFamily: fonts.regular,
  },
  retryButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 2,
  },

  // Content
  content: {
    flex: 1,
    padding: 16,
  },

  // Profile Card
  profileCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    flex: 1,
  },
  vendorName: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 8,
  },
  businessTypeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  businessTypeText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
  },
  profileMeta: {
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Stats Section
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statsCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContent: {
    flex: 1,
  },
  statsValue: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  statsTitle: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 2,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionContent: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },

  // Info Row
  infoRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  infoContent: {
    padding: 16,
  },
  infoLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 4,
  },
  infoValueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoValue: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.medium,
    flex: 1,
  },
  infoValueClickable: {
    color: colors.splashGreen,
  },

  // Contact Card
  contactCard: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  contactRole: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 2,
  },
  contactActions: {
    gap: 12,
  },
  contactAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactActionText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontFamily: fonts.regular,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
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
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
});

export default VendorDetailScreen;
