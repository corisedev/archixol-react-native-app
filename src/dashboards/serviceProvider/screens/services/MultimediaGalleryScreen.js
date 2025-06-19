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
  FlatList,
} from 'react-native';
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  FileText,
  Award,
  Building,
  ChevronRight,
  Search,
  Filter,
  Pencil,
  Trash2,
  X,
  Grid3X3,
  List,
  Eye,
  Calendar,
} from 'lucide-react-native';
import DeleteConfirmationModal from '../../components/modals/DeleteConfirmationModal';
import AddCertificateModal from '../../components/modals/AddCertificateModal';
import {colors} from '../../../../utils/colors';
import {fonts, fontSizes} from '../../../../utils/fonts';
import {
  getCertificate,
  getProjects,
  getCompanyDocs,
  deleteCertificate,
  deleteProject,
  deleteCompanyDoc,
} from '../../../../api/serviceProvider';
import {useNavigation} from '@react-navigation/native';
import {useContext} from 'react';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../../context/BackendContext';
import AddProjectModal from '../../components/modals/AddProjectModal';

const MultimediaGalleryScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [projects, setProjects] = useState([]);
  const [companyDocs, setCompanyDocs] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('certificates'); // 'certificates', 'projects', 'company_docs'
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [user] = useState({isCompany: false});
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const navigation = useNavigation();
  const {backendUrl} = useContext(BackendContext);

  // Modal states
  const [showAddCertificateModal, setShowAddCertificateModal] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState(null);

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
    const fullUrl = `${baseUrl}/${cleanPath}`;

    return fullUrl;
  };

  // Fetch all multimedia data
  const fetchMultimediaData = useCallback(async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      console.log('🔍 Fetching multimedia data...');

      // Fetch all data in parallel
      const [certificatesResponse, projectsResponse, companyDocsResponse] =
        await Promise.allSettled([
          getCertificate(),
          getProjects(),
          user.isCompany ? getCompanyDocs() : Promise.resolve({documents: []}),
        ]);

      // Handle certificates
      if (certificatesResponse.status === 'fulfilled') {
        const certs = certificatesResponse.value?.certificates || [];
        setCertificates(certs);
        console.log('✅ Certificates loaded:', certs.length);
      } else {
        console.error(
          '❌ Failed to load certificates:',
          certificatesResponse.reason,
        );
        setCertificates([]);
      }

      // Handle projects
      if (projectsResponse.status === 'fulfilled') {
        const proj = projectsResponse.value?.projects || [];
        setProjects(proj);
        console.log('✅ Projects loaded:', proj.length);
      } else {
        console.error('❌ Failed to load projects:', projectsResponse.reason);
        setProjects([]);
      }

      // Handle company documents
      if (companyDocsResponse.status === 'fulfilled') {
        const docs = companyDocsResponse.value?.documents || [];
        setCompanyDocs(docs);
        console.log('✅ Company docs loaded:', docs.length);
      } else {
        console.error(
          '❌ Failed to load company docs:',
          companyDocsResponse.reason,
        );
        setCompanyDocs([]);
      }

      // Filter data based on active tab
      filterData(activeTab, searchQuery);
    } catch (error) {
      console.error('❌ Failed to load multimedia data:', error);
      Alert.alert('Error', 'Unable to load multimedia data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing, activeTab, searchQuery, user.isCompany, filterData]);

  useEffect(() => {
    fetchMultimediaData();
  }, [fetchMultimediaData]);

  // Filter data based on tab and search
  const filterData = useCallback(
    (tab, query) => {
      let dataToFilter = [];

      switch (tab) {
        case 'certificates':
          dataToFilter = certificates.map(cert => ({
            ...cert,
            type: 'certificate',
          }));
          break;
        case 'projects':
          dataToFilter = projects.map(proj => ({...proj, type: 'project'}));
          break;
        case 'company_docs':
          dataToFilter = companyDocs.map(doc => ({...doc, type: 'document'}));
          break;
        default:
          dataToFilter = [];
      }

      // Filter by search query
      if (query.trim()) {
        dataToFilter = dataToFilter.filter(item => {
          const searchText = query.toLowerCase();
          return (
            (
              item.certificate_title ||
              item.project_title ||
              item.doc_title ||
              ''
            )
              .toLowerCase()
              .includes(searchText) ||
            (
              item.certificate_description ||
              item.project_description ||
              item.doc_description ||
              ''
            )
              .toLowerCase()
              .includes(searchText) ||
            (item.organization || item.client_name || '')
              .toLowerCase()
              .includes(searchText)
          );
        });
      }

      setFilteredData(dataToFilter);
    },
    [certificates, projects, companyDocs],
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMultimediaData();
  }, [fetchMultimediaData]);

  // Tab change
  const handleTabChange = useCallback(
    tab => {
      setActiveTab(tab);
      filterData(tab, searchQuery);
    },
    [searchQuery, filterData],
  );

  // Handle item actions
  const handleItemAction = item => {
    setSelectedItem(item);
    setActionModalVisible(true);
  };

  // Handle edit item
  const handleEditItem = () => {
    setActionModalVisible(false);
    const {type} = selectedItem;

    switch (type) {
      case 'certificate':
        setEditingCertificate(selectedItem);
        setShowAddCertificateModal(true);
        break;
      case 'project':
        setEditingProject(selectedItem);
        setShowAddProjectModal(true);
        break;
      case 'document':
        // ... existing code
        break;
    }
  };

  // Handle delete item
  const handleDeleteItem = () => {
    setActionModalVisible(false);
    setDeleteModalVisible(true);
  };

  const onConfirmDelete = async () => {
    setDeleteLoading(true);
    try {
      const {type, id} = selectedItem;

      switch (type) {
        case 'certificate':
          await deleteCertificate({certificate_id: id});
          break;
        case 'project':
          await deleteProject({project_id: id});
          break;
        case 'document':
          await deleteCompanyDoc({document_id: id});
          break;
      }

      setDeleteModalVisible(false);
      Alert.alert('Success', `${type} deleted successfully`);
      await fetchMultimediaData(); // Refresh the data
    } catch (error) {
      console.error('Delete failed:', error);
      Alert.alert(
        'Error',
        `Failed to delete ${selectedItem.type}. Please try again.`,
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle view item details
  const handleViewItem = item => {
    if (!item || !item.type) {
      console.warn('No valid item to view');
      return;
    }

    const {type} = item;

    switch (type) {
      case 'certificate':
        navigation.navigate('CertificateDetailScreen', {
          certificateId: item.id,
          certificateData: item,
        });
        break;
      case 'project':
        navigation.navigate('ProjectDetailScreen', {
          projectId: item.id,
          projectData: item,
        });
        break;
      case 'document':
        navigation.navigate('DocumentDetailScreen', {
          documentId: item.id,
          documentData: item,
        });
        break;
      default:
        console.warn('Unknown item type for viewing:', type);
    }
  };

  // Format date helper
  const formatDate = dateString => {
    if (!dateString) {
      return 'No date';
    }
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return dateString;
    }
  };

  // Get item image
  const getItemImage = item => {
    switch (item.type) {
      case 'certificate':
        return item.certificate_img;
      case 'project':
        return item.project_imgs && item.project_imgs[0]
          ? item.project_imgs[0]
          : null;
      case 'document':
        return item.doc_image;
      default:
        return null;
    }
  };

  // Get item title
  const getItemTitle = item => {
    switch (item.type) {
      case 'certificate':
        return item.certificate_title || 'Untitled Certificate';
      case 'project':
        return item.project_title || 'Untitled Project';
      case 'document':
        return item.doc_title || 'Untitled Document';
      default:
        return 'Untitled';
    }
  };

  // Get item subtitle
  const getItemSubtitle = item => {
    switch (item.type) {
      case 'certificate':
        return item.organization || 'Unknown Organization';
      case 'project':
        return item.client_name || 'Personal Project';
      case 'document':
        return item.doc_type || 'Document';
      default:
        return '';
    }
  };

  // Get item date
  const getItemDate = item => {
    switch (item.type) {
      case 'certificate':
        return formatDate(item.issue_date || item.created_at);
      case 'project':
        return formatDate(item.start_date || item.created_at);
      case 'document':
        return formatDate(item.upload_date || item.created_at);
      default:
        return '';
    }
  };

  // Get icon for item type
  const getItemIcon = (type, size = 20) => {
    switch (type) {
      case 'certificate':
        return <Award color={colors.splashGreen} size={size} />;
      case 'project':
        return <FileText color={colors.splashBlue || '#3B82F6'} size={size} />;
      case 'document':
        return (
          <Building color={colors.splashOrange || '#F59E0B'} size={size} />
        );
      default:
        return <FileText color={colors.textSecondary} size={size} />;
    }
  };

  // Render grid item
  const renderGridItem = ({item}) => {
    const itemImage = getItemImage(item);

    return (
      <TouchableOpacity
        style={styles.gridCard}
        onPress={() => handleViewItem(item)}
        activeOpacity={0.7}>
        <View style={styles.gridImageContainer}>
          {itemImage ? (
            <Image
              source={{uri: getFullImageUrl(itemImage)}}
              style={styles.gridImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.gridPlaceholder}>
              {getItemIcon(item.type, 24)}
            </View>
          )}
          <TouchableOpacity
            style={styles.gridActionButton}
            onPress={() => handleItemAction(item)}>
            <MoreVertical color={colors.text} size={16} />
          </TouchableOpacity>
          <View style={styles.typeBadge}>{getItemIcon(item.type, 12)}</View>
        </View>

        <View style={styles.gridContent}>
          <Text style={styles.gridTitle} numberOfLines={2}>
            {getItemTitle(item)}
          </Text>

          <Text style={styles.gridSubtitle} numberOfLines={1}>
            {getItemSubtitle(item)}
          </Text>

          <View style={styles.dateContainer}>
            <Calendar color={colors.textSecondary} size={12} />
            <Text style={styles.dateText}>{getItemDate(item)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render list item
  const renderListItem = ({item}) => {
    const itemImage = getItemImage(item);

    return (
      <TouchableOpacity
        style={styles.listCard}
        onPress={() => handleViewItem(item)}
        activeOpacity={0.7}>
        <View style={styles.listImageContainer}>
          {itemImage ? (
            <Image
              source={{uri: getFullImageUrl(itemImage)}}
              style={styles.listImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.listPlaceholder}>
              {getItemIcon(item.type, 20)}
            </View>
          )}
        </View>

        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle} numberOfLines={1}>
              {getItemTitle(item)}
            </Text>
            <TouchableOpacity
              style={styles.listActionButton}
              onPress={() => handleItemAction(item)}>
              <MoreVertical color={colors.text} size={16} />
            </TouchableOpacity>
          </View>

          <Text style={styles.listSubtitle} numberOfLines={1}>
            {getItemSubtitle(item)}
          </Text>

          <View style={styles.listFooter}>
            <View style={styles.dateContainer}>
              <Calendar color={colors.textSecondary} size={12} />
              <Text style={styles.dateText}>{getItemDate(item)}</Text>
            </View>
            <ChevronRight color={colors.textSecondary} size={16} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Get tab counts
  const getTabCounts = () => ({
    certificates: certificates.length,
    projects: projects.length,
    company_docs: companyDocs.length,
  });

  const tabCounts = getTabCounts();

  // Handle add new item
  const handleAddNew = () => {
    switch (activeTab) {
      case 'certificates':
        setEditingCertificate(null);
        setShowAddCertificateModal(true);
        break;
      case 'projects':
        setEditingProject(null);
        setShowAddProjectModal(true);
        break;
      case 'company_docs':
        navigation.navigate('AddCompanyDocScreen');
        break;
    }
  };

  // Handle certificate modal close
  const handleCertificateModalClose = () => {
    setShowAddCertificateModal(false);
    setEditingCertificate(null);
  };

  // Handle certificate success
  const handleCertificateSuccess = response => {
    console.log('Certificate operation successful:', response);
    fetchMultimediaData(); // Refresh the data
  };

  // Loading state
  if (loading && filteredData.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading multimedia gallery...</Text>
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
          <Text style={styles.headerTitle}>Multimedia Gallery</Text>
          <Text style={styles.headerSubtitle}>
            {filteredData.length} item{filteredData.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? (
              <List color={colors.text} size={20} />
            ) : (
              <Grid3X3 color={colors.text} size={20} />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.headerButton} onPress={handleAddNew}>
            <Plus color={colors.text} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search color={colors.textSecondary} size={20} />
          <Text style={styles.searchInput}>Search multimedia...</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter color={colors.text} size={20} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'certificates' && styles.activeTab,
            ]}
            onPress={() => handleTabChange('certificates')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'certificates' && styles.activeTabText,
              ]}>
              Certificates ({tabCounts.certificates})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'projects' && styles.activeTab]}
            onPress={() => handleTabChange('projects')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'projects' && styles.activeTabText,
              ]}>
              Projects ({tabCounts.projects})
            </Text>
          </TouchableOpacity>

          {user.isCompany && (
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'company_docs' && styles.activeTab,
              ]}
              onPress={() => handleTabChange('company_docs')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'company_docs' && styles.activeTabText,
                ]}>
                Company Docs ({tabCounts.company_docs})
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Content */}
      {filteredData.length === 0 ? (
        <View style={[styles.container, styles.centered]}>
          {getItemIcon(activeTab.replace('_docs', ''), 48)}
          <Text style={styles.emptyTitle}>No Items Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try adjusting your search'
              : `Add your first ${activeTab.replace('_', ' ')} to get started`}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleAddNew}>
              <Text style={styles.createButtonText}>
                Add {activeTab.replace('_docs', ' Document').replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={viewMode === 'grid' ? renderGridItem : renderListItem}
          keyExtractor={item => `${item.type}-${item.id}`}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode}
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : null}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Action Modal */}
      <Modal
        visible={actionModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setActionModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.actionModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Item Actions</Text>
              <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={() => {
                setActionModalVisible(false);
                if (selectedItem) {
                  handleViewItem(selectedItem);
                }
              }}>
              <Eye color={colors.text} size={20} style={styles.actionIcon} />
              <Text style={styles.actionText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={handleEditItem}>
              <Pencil color={colors.text} size={20} style={styles.actionIcon} />
              <Text style={styles.actionText}>Edit Item</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={handleDeleteItem}>
              <Trash2 color="#F44336" size={20} style={styles.actionIcon} />
              <Text style={[styles.actionText, styles.deleteActionText]}>
                Delete Item
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onConfirm={onConfirmDelete}
        itemName={selectedItem ? getItemTitle(selectedItem) : 'this item'}
        itemType={selectedItem?.type || 'Item'}
        loading={deleteLoading}
      />

      {/* Add/Edit Certificate Modal */}
      <AddCertificateModal
        visible={showAddCertificateModal}
        onClose={handleCertificateModalClose}
        onSuccess={handleCertificateSuccess}
        editData={editingCertificate}
      />

      <AddProjectModal
        visible={showAddProjectModal}
        onClose={() => {
          setShowAddProjectModal(false);
          setEditingProject(null);
        }}
        onSuccess={response => {
          console.log('Project operation successful:', response);
          fetchMultimediaData(); // Refresh the data
        }}
        editData={editingProject}
      />
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

  // Search
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs
  tabsContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F8F9FA',
  },
  activeTab: {
    backgroundColor: colors.splashGreen,
  },
  tabText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },
  activeTabText: {
    color: colors.background,
  },

  // List Container
  listContainer: {
    padding: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
  },

  // Grid View
  gridCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  gridImageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridPlaceholder: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridActionButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContent: {
    padding: 12,
  },
  gridTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  gridSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 6,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // List View
  listCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 12,
    flexDirection: 'row',
    padding: 12,
  },
  listImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  listImage: {
    width: '100%',
    height: '100%',
  },
  listPlaceholder: {
    flex: 1,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    flex: 1,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    flex: 1,
  },
  listSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 6,
  },
  listActionButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Empty State
  emptyTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 32,
    fontFamily: fonts.regular,
  },
  createButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: colors.background,
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
  },

  // Modals
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
    maxHeight: '80%',
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
    fontSize: fontSizes.lg,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  deleteActionText: {
    color: '#F44336',
  },
});
export default MultimediaGalleryScreen;
