import React, {useState} from 'react';
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
  StatusBar, // Add this
} from 'react-native';
import {colors} from '../../../../utils/colors';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {
  getCertificate,
  deleteCertificate,
} from '../../../../api/serviceProvider';

const ManageCertificatesScreen = () => {
  const navigation = useNavigation();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Refresh certificates when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchCertificates();
    }, []),
  );

  const createSectionsData = () => [{id: 'certificates', type: 'certificates'}];

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await getCertificate();
      setCertificates(response.certificates || []);
    } catch (error) {
      console.error('Failed to load certificates:', error);
      Alert.alert('Error', 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCertificates();
    setRefreshing(false);
  };

  const handleAddCertificate = () => {
    navigation.navigate('AddEditCertificate');
  };

  const handleEditCertificate = certificate => {
    navigation.navigate('AddEditCertificate', {certificate, isEdit: true});
  };

  const handleDeleteCertificate = async certificateId => {
    Alert.alert(
      'Delete Certificate',
      'Are you sure you want to delete this certificate? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteCertificate(certificateId),
        },
      ],
    );
  };

  const confirmDeleteCertificate = async certificateId => {
    try {
      setDeleting(certificateId);
      await deleteCertificate({certificate_id: certificateId});
      setCertificates(prev => prev.filter(cert => cert.id !== certificateId));
      Alert.alert('Success', 'Certificate deleted successfully');
    } catch (error) {
      console.error('Failed to delete certificate:', error);
      Alert.alert('Error', 'Failed to delete certificate');
    } finally {
      setDeleting(null);
    }
  };

  const getCertificateStats = () => {
    const currentYear = new Date().getFullYear();
    const thisYear = certificates.filter(
      cert => cert.dated && new Date(cert.dated).getFullYear() === currentYear,
    ).length;

    return {
      total: certificates.length,
      thisYear,
      recent: certificates.filter(
        cert =>
          cert.dated &&
          new Date(cert.dated) >
            new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      ).length,
    };
  };

  const renderHeader = () => {
    const stats = getCertificateStats();

    return (
      <View style={styles.pageHeader}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>My Certificates</Text>
            <Text style={styles.headerSubtitle}>
              Showcase your professional qualifications
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddCertificate}>
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.thisYear}</Text>
            <Text style={styles.statLabel}>This Year</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.recent}</Text>
            <Text style={styles.statLabel}>Recent</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCertificatesList = () => {
    if (certificates.length === 0) {
      return renderEmptyState();
    }

    return (
      <FlatList
        data={certificates}
        renderItem={renderCertificateCard}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.certificatesContainer}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    );
  };

  const renderSection = ({item}) => {
    switch (item.type) {
      case 'certificates':
        return renderCertificatesList();
      default:
        return null;
    }
  };

  const renderStickyHeader = () => {
    const stats = getCertificateStats();

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
            <Text style={styles.headerTitle}>My Certificates</Text>
            <Text style={styles.headerSubtitle}>
              Showcase your professional qualifications
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddCertificate}>
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.thisYear}</Text>
            <Text style={styles.statLabel}>This Year</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.recent}</Text>
            <Text style={styles.statLabel}>Recent</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCertificateCard = ({item, index}) => (
    <View
      style={[
        styles.certificateCard,
        index % 2 === 1 && styles.certificateCardRight,
      ]}>
      {/* Certificate Image */}
      <View style={styles.certificateImageContainer}>
        {item.certificate_img ? (
          <Image
            source={{uri: item.certificate_img}}
            style={styles.certificateImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.certificateImagePlaceholder}>
            <Text style={styles.certificateImagePlaceholderText}>🏆</Text>
          </View>
        )}
        <View style={styles.certificateBadge}>
          <Text style={styles.certificateBadgeText}>CERT</Text>
        </View>
      </View>

      {/* Certificate Info */}
      <View style={styles.certificateInfo}>
        <Text style={styles.certificateTitle} numberOfLines={2}>
          {item.title || 'Untitled Certificate'}
        </Text>

        <View style={styles.certificateDetails}>
          <View style={styles.certificateDate}>
            <Text style={styles.dateIcon}>📅</Text>
            <Text style={styles.dateText}>
              {item.dated
                ? new Date(item.dated).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'No date'}
            </Text>
          </View>

          <View style={styles.certificateId}>
            <Text style={styles.idIcon}>🆔</Text>
            <Text style={styles.idText}>#{item.id}</Text>
          </View>
        </View>

        {/* Verification Status */}
        <View style={styles.verificationStatus}>
          <Text style={styles.verificationIcon}>✅</Text>
          <Text style={styles.verificationText}>Verified</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.certificateActions}>
        <TouchableOpacity
          style={styles.viewButton}
          onPress={() => handleEditCertificate(item)}>
          <Text style={styles.viewButtonText}>👁️ View</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditCertificate(item)}>
          <Text style={styles.editButtonText}>✏️ Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.deleteButton,
            deleting === item.id && styles.deleteButtonDisabled,
          ]}
          onPress={() => handleDeleteCertificate(item.id)}
          disabled={deleting === item.id}>
          {deleting === item.id ? (
            <ActivityIndicator size="small" color="#F44336" />
          ) : (
            <Text style={styles.deleteButtonText}>🗑️</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🏆</Text>
      <Text style={styles.emptyStateTitle}>No Certificates Yet</Text>
      <Text style={styles.emptyStateText}>
        Start building your credibility by adding your first certificate.
        Showcase your qualifications, achievements, and professional
        development.
      </Text>

      <View style={styles.emptyStateBenefits}>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>✅</Text>
          <Text style={styles.benefitText}>Build client trust</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>✅</Text>
          <Text style={styles.benefitText}>Showcase expertise</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>✅</Text>
          <Text style={styles.benefitText}>Stand out from competition</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={handleAddCertificate}>
        <Text style={styles.emptyStateButtonText}>+ Add First Certificate</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color={colors.splashGreen} />
          <Text style={styles.loadingText}>Loading certificates...</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={createSectionsData()}
        renderItem={renderSection}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderStickyHeader}
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
    );
  };

  return <View style={styles.container}>{renderContent()}</View>;
};

const styles = StyleSheet.create({
  // Replace pageHeader with:
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

  // Update listContainer to certificatesContainer:
  certificatesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
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
  addButton: {
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
  addButtonIcon: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.splashGreen,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
  },
  separator: {
    height: 8,
  },
  certificateCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
    marginRight: 8,
  },
  certificateCardRight: {
    marginRight: 0,
    marginLeft: 8,
  },
  certificateImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  certificateImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
  },
  certificateImagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  certificateImagePlaceholderText: {
    fontSize: 32,
    color: colors.textSecondary,
  },
  certificateBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  certificateBadgeText: {
    color: colors.background,
    fontSize: 8,
    fontWeight: '600',
  },
  certificateInfo: {
    marginBottom: 12,
  },
  certificateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 18,
  },
  certificateDetails: {
    gap: 6,
    marginBottom: 8,
  },
  certificateDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateIcon: {
    fontSize: 12,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  certificateId: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idIcon: {
    fontSize: 12,
  },
  idText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  verificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  verificationIcon: {
    fontSize: 10,
  },
  verificationText: {
    fontSize: 10,
    color: colors.splashGreen,
    fontWeight: '600',
  },
  certificateActions: {
    flexDirection: 'row',
    gap: 6,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  viewButtonText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  editButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: colors.splashGreen,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 11,
    color: colors.background,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonDisabled: {
    opacity: 0.7,
  },
  deleteButtonText: {
    fontSize: 11,
    color: '#F44336',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    maxWidth: 280,
  },
  emptyStateBenefits: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  benefitIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  benefitText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  emptyStateButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  emptyStateButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ManageCertificatesScreen;
