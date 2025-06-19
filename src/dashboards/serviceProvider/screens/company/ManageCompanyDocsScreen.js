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
  StatusBar,
} from 'react-native';
import {colors} from '../../../../utils/colors';;;
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {
  getCompanyDocs,
  deleteCompanyDoc,
} from '../../../../api/serviceProvider';

const ManageCompanyDocsScreen = () => {
  const navigation = useNavigation();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Refresh documents when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchDocuments();
    }, []),
  );

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await getCompanyDocs();
      setDocuments(response.documents || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
      Alert.alert('Error', 'Failed to load company documents');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDocuments();
    setRefreshing(false);
  };

  const handleAddDocument = () => {
    navigation.navigate('AddEditCompanyDoc');
  };

  const handleEditDocument = document => {
    navigation.navigate('AddEditCompanyDoc', {document, isEdit: true});
  };

  const handleViewDocument = document => {
    Alert.alert(
      'Document Details',
      `Title: ${document.title}\nDate: ${formatDate(document.dated)}\nID: ${
        document.id
      }`,
      [
        {text: 'Edit', onPress: () => handleEditDocument(document)},
        {text: 'Close', style: 'cancel'},
      ],
    );
  };

  const handleDeleteDocument = async documentId => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteDocument(documentId),
        },
      ],
    );
  };

  const confirmDeleteDocument = async documentId => {
    try {
      setDeleting(documentId);
      await deleteCompanyDoc({document_id: documentId});
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      Alert.alert('Success', 'Document deleted successfully');
    } catch (error) {
      console.error('Failed to delete document:', error);
      Alert.alert('Error', 'Failed to delete document');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = dateString => {
    if (!dateString) {
      return 'No date';
    }
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getDocumentStats = () => {
    const currentYear = new Date().getFullYear();
    const thisYear = documents.filter(
      doc => doc.dated && new Date(doc.dated).getFullYear() === currentYear,
    ).length;

    const recent = documents.filter(
      doc =>
        doc.dated &&
        new Date(doc.dated) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    ).length;

    return {
      total: documents.length,
      thisYear,
      recent,
      verified: documents.length, // Assuming all uploaded docs are verified
    };
  };

  const getDocumentType = title => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('license')) {
      return {type: 'License', icon: '📜', color: '#4CAF50'};
    }
    if (lowerTitle.includes('certificate')) {
      return {type: 'Certificate', icon: '🏆', color: '#FF9800'};
    }
    if (lowerTitle.includes('insurance')) {
      return {type: 'Insurance', icon: '🛡️', color: '#2196F3'};
    }
    if (lowerTitle.includes('permit')) {
      return {type: 'Permit', icon: '📋', color: '#9C27B0'};
    }
    if (lowerTitle.includes('registration')) {
      return {type: 'Registration', icon: '📝', color: '#F44336'};
    }
    return {type: 'Document', icon: '📄', color: '#757575'};
  };

  const renderStickyHeader = () => {
    const stats = getDocumentStats();

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
            <Text style={styles.headerTitle}>Company Documents</Text>
            <Text style={styles.headerSubtitle}>
              Manage your business credentials and legal documents
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddDocument}>
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
            <Text style={styles.statNumber}>{stats.verified}</Text>
            <Text style={styles.statLabel}>Verified</Text>
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

  const renderDocumentCard = ({item, index}) => {
    const docType = getDocumentType(item.title || '');

    return (
      <TouchableOpacity
        style={[
          styles.documentCard,
          index % 2 === 1 && styles.documentCardRight,
        ]}
        onPress={() => handleViewDocument(item)}
        activeOpacity={0.7}>
        {/* Document Image */}
        <View style={styles.documentImageContainer}>
          {item.doc_image ? (
            <Image
              source={{uri: item.doc_image}}
              style={styles.documentImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.documentImagePlaceholder}>
              <Text style={styles.documentImagePlaceholderText}>📄</Text>
            </View>
          )}

          {/* Document Type Badge */}
          <View style={[styles.typeBadge, {backgroundColor: docType.color}]}>
            <Text style={styles.typeIcon}>{docType.icon}</Text>
            <Text style={styles.typeText}>{docType.type}</Text>
          </View>

          {/* Verified Badge */}
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedIcon}>✅</Text>
          </View>
        </View>

        {/* Document Info */}
        <View style={styles.documentInfo}>
          <Text style={styles.documentTitle} numberOfLines={2}>
            {item.title || 'Untitled Document'}
          </Text>

          <View style={styles.documentDetails}>
            <View style={styles.documentDate}>
              <Text style={styles.dateIcon}>📅</Text>
              <Text style={styles.dateText}>{formatDate(item.dated)}</Text>
            </View>

            <View style={styles.documentId}>
              <Text style={styles.idIcon}>🆔</Text>
              <Text style={styles.idText}>#{item.id}</Text>
            </View>
          </View>

          {/* Status Info */}
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <Text style={styles.statusIcon}>🔒</Text>
              <Text style={styles.statusText}>Secure</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusIcon}>☁️</Text>
              <Text style={styles.statusText}>Cloud Stored</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.documentActions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={e => {
              e.stopPropagation();
              handleViewDocument(item);
            }}>
            <Text style={styles.viewButtonText}>👁️ View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editButton}
            onPress={e => {
              e.stopPropagation();
              handleEditDocument(item);
            }}>
            <Text style={styles.editButtonText}>✏️ Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.deleteButton,
              deleting === item.id && styles.deleteButtonDisabled,
            ]}
            onPress={e => {
              e.stopPropagation();
              handleDeleteDocument(item.id);
            }}
            disabled={deleting === item.id}>
            {deleting === item.id ? (
              <ActivityIndicator size="small" color="#F44336" />
            ) : (
              <Text style={styles.deleteButtonText}>🗑️</Text>
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📁</Text>
      <Text style={styles.emptyStateTitle}>No Documents Yet</Text>
      <Text style={styles.emptyStateText}>
        Build trust and credibility by uploading your business documents.
        Include licenses, certificates, permits, and other legal credentials.
      </Text>

      <View style={styles.emptyStateBenefits}>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>✅</Text>
          <Text style={styles.benefitText}>
            Build client trust and credibility
          </Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>✅</Text>
          <Text style={styles.benefitText}>
            Meet legal and regulatory requirements
          </Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>✅</Text>
          <Text style={styles.benefitText}>Stand out from competitors</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>✅</Text>
          <Text style={styles.benefitText}>
            Secure cloud storage and access
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={handleAddDocument}>
        <Text style={styles.emptyStateButtonText}>+ Add First Document</Text>
      </TouchableOpacity>
    </View>
  );

  // Separator component moved outside of ManageCompanyDocsScreen
  const Separator = () => <View style={styles.separator} />;

  const renderContent = () => {
    if (loading) {
      return (
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color={colors.splashGreen} />
          <Text style={styles.loadingText}>Loading documents...</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={documents}
        renderItem={renderDocumentCard}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.splashGreen]}
            tintColor={colors.splashGreen}
          />
        }
        ListHeaderComponent={renderStickyHeader} // ✅ Change this
        stickyHeaderIndices={[0]} // ✅ Add this
        ListEmptyComponent={renderEmptyState}
        numColumns={2}
        columnWrapperStyle={documents.length > 0 ? styles.row : null}
        ItemSeparatorComponent={Separator}
      />
    );
  };

  return <View style={styles.container}>{renderContent()}</View>;
};

ManageCompanyDocsScreen.displayName = 'ManageCompanyDocsScreen';

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
    marginBottom: 8,
  },

  // Update listContainer:
  listContainer: {
    paddingBottom: 100, // Bottom nav space
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
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.splashGreen,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  row: {
    justifyContent: 'space-between',
  },
  separator: {
    height: 8,
  },
  documentCard: {
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
  documentCardRight: {
    marginRight: 0,
    marginLeft: 8,
  },
  documentImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  documentImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
  },
  documentImagePlaceholder: {
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
  documentImagePlaceholderText: {
    fontSize: 32,
    color: colors.textSecondary,
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 2,
  },
  typeIcon: {
    fontSize: 10,
  },
  typeText: {
    color: colors.background,
    fontSize: 9,
    fontWeight: '600',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedIcon: {
    fontSize: 12,
  },
  documentInfo: {
    marginBottom: 12,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 18,
  },
  documentDetails: {
    gap: 6,
    marginBottom: 8,
  },
  documentDate: {
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
  documentId: {
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
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statusIcon: {
    fontSize: 10,
  },
  statusText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  documentActions: {
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

export default ManageCompanyDocsScreen;
