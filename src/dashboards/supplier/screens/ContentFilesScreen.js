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
  Dimensions,
  Linking,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Plus,
  MoreVertical,
  File,
  Image as ImageIcon,
  Video,
  FileText,
  Search,
  Filter,
  Trash2,
  X,
  Grid3X3,
  List,
  Download,
  Share,
  Eye,
  Calendar,
  HardDrive,
} from 'lucide-react-native';
import {launchImageLibrary, launchCamera, MediaType} from 'react-native-image-picker';
// Remove DocumentPicker import
// import DocumentPicker from '@react-native-documents/picker';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {
  getAllFiles,
  deleteFile,
  deleteMultipleFiles,
  uploadFile,
  uploadMultipleFiles,
} from '../../../api/serviceSupplier';
import {useNavigation} from '@react-navigation/native';
import {useContext} from 'react';
import {VITE_API_BASE_URL} from '@env';
import {BackendContext} from '../../../context/BackendContext';

const {width} = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 48) / 2; // 2 columns with padding

const ContentFilesScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [filterType, setFilterType] = useState('all'); // 'all', 'images', 'documents', 'videos'
  const navigation = useNavigation();
  const {backendUrl} = useContext(BackendContext);

  // Format file size
  const formatFileSize = size => {
    if (!size) return '0 KB';
    const sizeInKB = parseFloat(size);
    if (sizeInKB >= 1024) {
      return `${(sizeInKB / 1024).toFixed(2)} MB`;
    }
    return `${sizeInKB.toFixed(2)} KB`;
  };

  // Format date
  const formatDate = dateString => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Get full image URL
  const getFullImageUrl = relativePath => {
    if (!relativePath) return null;
    if (relativePath.startsWith('http')) return relativePath;

    const baseUrl = backendUrl || VITE_API_BASE_URL;
    const cleanPath = relativePath.startsWith('/')
      ? relativePath.substring(1)
      : relativePath;
    return `${baseUrl}/${cleanPath}`;
  };

  // Get file type icon
  const getFileTypeIcon = fileName => {
    if (!fileName) return File;
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return ImageIcon;
    } else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) {
      return Video;
    } else if (['pdf', 'doc', 'docx', 'txt'].includes(extension)) {
      return FileText;
    }
    return File;
  };

  // Get file type from extension
  const getFileType = fileName => {
    if (!fileName) return 'unknown';
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return 'image';
    } else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) {
      return 'video';
    } else if (['pdf', 'doc', 'docx', 'txt'].includes(extension)) {
      return 'document';
    }
    return 'other';
  };

  // Process files data
  const processFilesData = useCallback(rawData => {
    if (!rawData?.images) return [];

    return rawData.images.reduce((acc, item) => {
      if (item.images && Array.isArray(item.images)) {
        const processedImages = item.images.map(img => ({
          ...img,
          parent_id: item.parent_id,
          parent_type: item.parent_type,
          id: `${item.parent_id}_${img.file_name}`, // Create unique ID
          type: getFileType(img.file_name),
        }));
        return acc.concat(processedImages);
      }
      return acc;
    }, []);
  }, []);

  // Fetch files
  const fetchFiles = useCallback(async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }

      const response = await getAllFiles();
      console.log('Files API Response:', response);

      const processedFiles = processFilesData(response);
      setFiles(processedFiles);
      setFilteredFiles(processedFiles);
    } catch (error) {
      console.error('Failed to load files:', error);
      Alert.alert('Error', 'Unable to load files. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [refreshing, processFilesData]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFiles();
  }, [fetchFiles]);

  const handleFilterType = useCallback(
    type => {
      setFilterType(type);
      applyFilters(searchQuery, type);
    },
    [searchQuery, applyFilters],
  );

  const applyFilters = useCallback(
    (query, type) => {
      let filtered = files;

      // Filter by type
      if (type !== 'all') {
        filtered = filtered.filter(file => file.type === type);
      }

      // Filter by search query
      if (query.trim()) {
        filtered = filtered.filter(file =>
          file.file_name?.toLowerCase().includes(query.toLowerCase()),
        );
      }

      setFilteredFiles(filtered);
    },
    [files],
  );

  // File selection
  const toggleFileSelection = file => {
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.id === file.id);
      if (isSelected) {
        return prev.filter(f => f.id !== file.id);
      } else {
        return [...prev, file];
      }
    });
  };

  const selectAllFiles = () => {
    setSelectedFiles(filteredFiles);
  };

  const clearSelection = () => {
    setSelectedFiles([]);
  };

  // File actions
  const handleFileAction = file => {
    setSelectedFile(file);
    setActionModalVisible(true);
  };

  const handleViewFile = () => {
    setActionModalVisible(false);
    if (selectedFile) {
      const url = getFullImageUrl(selectedFile.preview);
      if (url) {
        Linking.openURL(url);
      }
    }
  };

  const handleShareFile = async () => {
    setActionModalVisible(false);
    if (selectedFile) {
      const url = getFullImageUrl(selectedFile.preview);
      if (url) {
        try {
          // For sharing, you might need to install react-native-share
          // await Share.open({
          //   url: url,
          //   title: selectedFile.file_name,
          // });
          
          // Alternative: Use Linking to share
          const shareUrl = Platform.select({
            ios: `https://www.google.com/search?q=${encodeURIComponent(selectedFile.file_name)}`,
            android: `https://www.google.com/search?q=${encodeURIComponent(selectedFile.file_name)}`,
          });
          
          Linking.openURL(shareUrl);
        } catch (error) {
          console.error('Share error:', error);
        }
      }
    }
  };

  const handleDownloadFile = async () => {
    setActionModalVisible(false);
    if (selectedFile) {
      // Implement download functionality
      Alert.alert('Download', 'Download functionality will be implemented');
    }
  };

  const handleDeleteFile = () => {
    setActionModalVisible(false);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    setDeleteLoading(true);
    try {
      if (selectedFiles.length > 0) {
        // Delete multiple files
        const deletePayload = selectedFiles.map((file, index) => ({
          index,
          parent_id: file.parent_id,
          parent_type: file.parent_type,
          file_name: file.file_name,
          full_name: file.full_name || file.file_name,
        }));

        await deleteMultipleFiles(deletePayload);
        Alert.alert('Success', 'Files deleted successfully');
        setSelectedFiles([]);
      } else if (selectedFile) {
        // Delete single file
        await deleteFile({
          parent_id: selectedFile.parent_id,
          parent_type: selectedFile.parent_type,
          file_name: selectedFile.file_name,
          full_name: selectedFile.full_name || selectedFile.file_name,
        });
        Alert.alert('Success', 'File deleted successfully');
      }

      setDeleteModalVisible(false);
      await fetchFiles();
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete files. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Upload functionality
  const showUploadOptions = () => {
    setUploadModalVisible(true);
  };

  const handleImageUpload = () => {
    setUploadModalVisible(false);
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    Alert.alert(
      'Select Image',
      'Choose from where you want to select an image',
      [
        {
          text: 'Camera',
          onPress: () => launchCamera(options, handleImageResponse),
        },
        {
          text: 'Gallery',
          onPress: () => launchImageLibrary(options, handleImageResponse),
        },
        {text: 'Cancel', style: 'cancel'},
      ],
    );
  };

  const handleImageResponse = response => {
    if (response.didCancel || response.error) return;

    if (response.assets && response.assets[0]) {
      uploadFileToServer(response.assets[0]);
    }
  };

  // New function to handle video uploads
  const handleVideoUpload = () => {
    setUploadModalVisible(false);
    const options = {
      mediaType: 'video',
      includeBase64: false,
      quality: 0.8,
      videoQuality: 'medium',
    };

    Alert.alert(
      'Select Video',
      'Choose from where you want to select a video',
      [
        {
          text: 'Camera',
          onPress: () => launchCamera(options, handleVideoResponse),
        },
        {
          text: 'Gallery',
          onPress: () => launchImageLibrary(options, handleVideoResponse),
        },
        {text: 'Cancel', style: 'cancel'},
      ],
    );
  };

  const handleVideoResponse = response => {
    if (response.didCancel || response.error) return;

    if (response.assets && response.assets[0]) {
      uploadFileToServer(response.assets[0]);
    }
  };

  // Alternative document upload using mixed media
  const handleDocumentUpload = () => {
    setUploadModalVisible(false);
    
    // For now, we'll show an alert since DocumentPicker is removed
    // You can implement a custom file picker or use a different library
    Alert.alert(
      'Document Upload',
      'Document upload feature will be available soon. For now, you can upload images and videos.',
      [
        {
          text: 'Upload Image Instead',
          onPress: handleImageUpload,
        },
        {
          text: 'Upload Video Instead', 
          onPress: handleVideoUpload,
        },
        {text: 'Cancel', style: 'cancel'},
      ],
    );
  };

  const uploadFileToServer = async fileData => {
    setUploadLoading(true);
    try {
      await uploadFile({
        file: fileData,
        metadata: {
          parent_type: 'manual_upload',
          parent_id: Date.now().toString(),
        },
      });

      Alert.alert('Success', 'File uploaded successfully');
      await fetchFiles();
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload file. Please try again.');
    } finally {
      setUploadLoading(false);
    }
  };

  // Render file item for grid view
  const renderFileGridItem = ({item}) => {
    const isSelected = selectedFiles.some(f => f.id === item.id);
    const FileIcon = getFileTypeIcon(item.file_name);

    return (
      <TouchableOpacity
        style={[styles.gridItem, isSelected && styles.selectedItem]}
        onPress={() => toggleFileSelection(item)}
        onLongPress={() => handleFileAction(item)}
        activeOpacity={0.7}>
        <View style={styles.gridImageContainer}>
          {item.type === 'image' ? (
            <Image
              source={{uri: getFullImageUrl(item.preview)}}
              style={styles.gridImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.gridFilePlaceholder}>
              <FileIcon color={colors.textSecondary} size={32} />
            </View>
          )}

          {isSelected && (
            <View style={styles.selectionOverlay}>
              <View style={styles.selectionIndicator} />
            </View>
          )}
        </View>

        <View style={styles.gridFileInfo}>
          <Text style={styles.gridFileName} numberOfLines={2}>
            {item.file_name}
          </Text>
          <Text style={styles.gridFileSize}>{formatFileSize(item.size)}</Text>
          <Text style={styles.gridFileDate}>{formatDate(item.date)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render file item for list view
  const renderFileListItem = ({item}) => {
    const isSelected = selectedFiles.some(f => f.id === item.id);
    const FileIcon = getFileTypeIcon(item.file_name);

    return (
      <TouchableOpacity
        style={[styles.listItem, isSelected && styles.selectedItem]}
        onPress={() => toggleFileSelection(item)}
        onLongPress={() => handleFileAction(item)}
        activeOpacity={0.7}>
        <View style={styles.listImageContainer}>
          {item.type === 'image' ? (
            <Image
              source={{uri: getFullImageUrl(item.preview)}}
              style={styles.listImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.listFilePlaceholder}>
              <FileIcon color={colors.textSecondary} size={24} />
            </View>
          )}
        </View>

        <View style={styles.listFileInfo}>
          <Text style={styles.listFileName} numberOfLines={1}>
            {item.file_name}
          </Text>
          <Text style={styles.listFileDetails}>
            {formatFileSize(item.size)} • {formatDate(item.date)}
          </Text>
          <Text style={styles.listFileType}>
            {item.parent_type || 'Unknown'} • {item.type}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.listActionButton}
          onPress={() => handleFileAction(item)}>
          <MoreVertical color={colors.textSecondary} size={20} />
        </TouchableOpacity>

        {isSelected && <View style={styles.listSelectionIndicator} />}
      </TouchableOpacity>
    );
  };

  // Filter buttons
  const FilterButtons = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterContainer}>
      {[
        {key: 'all', label: 'All', icon: File},
        {key: 'image', label: 'Images', icon: ImageIcon},
        {key: 'document', label: 'Documents', icon: FileText},
        {key: 'video', label: 'Videos', icon: Video},
      ].map(filter => (
        <TouchableOpacity
          key={filter.key}
          style={[
            styles.filterButton,
            filterType === filter.key && styles.filterButtonActive,
          ]}
          onPress={() => handleFilterType(filter.key)}>
          <filter.icon
            size={16}
            color={
              filterType === filter.key
                ? colors.background
                : colors.textSecondary
            }
          />
          <Text
            style={[
              styles.filterButtonText,
              filterType === filter.key && styles.filterButtonTextActive,
            ]}>
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Loading state
  if (loading && files.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading files...</Text>
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
          <Text style={styles.headerTitle}>Content Files</Text>
          <Text style={styles.headerSubtitle}>
            {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''}
            {selectedFiles.length > 0 && ` • ${selectedFiles.length} selected`}
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

          <TouchableOpacity
            style={styles.headerButton}
            onPress={showUploadOptions}>
            <Plus color={colors.text} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Selection Actions */}
      {selectedFiles.length > 0 && (
        <View style={styles.selectionActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={clearSelection}>
            <X color={colors.text} size={16} />
            <Text style={styles.actionButtonText}>Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={selectAllFiles}>
            <Text style={styles.actionButtonText}>Select All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => setDeleteModalVisible(true)}>
            <Trash2 color={colors.background} size={16} />
            <Text style={[styles.actionButtonText, {color: colors.background}]}>
              Delete ({selectedFiles.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filters */}
      <FilterButtons />

      {/* Files List/Grid */}
      {filteredFiles.length === 0 ? (
        <View style={[styles.container, styles.centered]}>
          <File color={colors.textSecondary} size={48} />
          <Text style={styles.emptyTitle}>No Files Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? 'Try adjusting your search or filters'
              : 'Upload your first file to get started'}
          </Text>
          {!searchQuery && (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={showUploadOptions}>
              <Text style={styles.uploadButtonText}>Upload Files</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredFiles}
          renderItem={
            viewMode === 'grid' ? renderFileGridItem : renderFileListItem
          }
          keyExtractor={item => item.id}
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

      {/* Upload Options Modal */}
      <Modal
        visible={uploadModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUploadModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.uploadModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Files</Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.uploadOption}
              onPress={handleImageUpload}
              disabled={uploadLoading}>
              <ImageIcon color={colors.text} size={24} />
              <View style={styles.uploadOptionContent}>
                <Text style={styles.uploadOptionTitle}>Upload Images</Text>
                <Text style={styles.uploadOptionDescription}>
                  Choose from camera or gallery
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadOption}
              onPress={handleVideoUpload}
              disabled={uploadLoading}>
              <Video color={colors.text} size={24} />
              <View style={styles.uploadOptionContent}>
                <Text style={styles.uploadOptionTitle}>Upload Videos</Text>
                <Text style={styles.uploadOptionDescription}>
                  Choose video from camera or gallery
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadOption}
              onPress={handleDocumentUpload}
              disabled={uploadLoading}>
              <FileText color={colors.text} size={24} />
              <View style={styles.uploadOptionContent}>
                <Text style={styles.uploadOptionTitle}>Upload Documents</Text>
                <Text style={styles.uploadOptionDescription}>
                  PDF, DOC, TXT and other files (Coming Soon)
                </Text>
              </View>
            </TouchableOpacity>

            {uploadLoading && (
              <View style={styles.uploadingIndicator}>
                <ActivityIndicator color={colors.splashGreen} />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* File Action Modal */}
      <Modal
        visible={actionModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setActionModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.actionModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>File Actions</Text>
              <TouchableOpacity onPress={() => setActionModalVisible(false)}>
                <X color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={handleViewFile}>
              <Eye color={colors.text} size={20} />
              <Text style={styles.actionText}>View File</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={handleShareFile}>
              <Share color={colors.text} size={20} />
              <Text style={styles.actionText}>Share File</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={handleDownloadFile}>
              <Download color={colors.text} size={20} />
              <Text style={styles.actionText}>Download</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionOption}
              onPress={handleDeleteFile}>
              <Trash2 color="#F44336" size={20} />
              <Text style={[styles.actionText, {color: '#F44336'}]}>
                Delete File
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModal}>
            <Text style={styles.deleteModalTitle}>Delete Files</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete{' '}
              {selectedFiles.length > 0
                ? `${selectedFiles.length} selected file${
                    selectedFiles.length > 1 ? 's' : ''
                  }`
                : selectedFile?.file_name}
              ? This action cannot be undone.
            </Text>

            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setDeleteModalVisible(false)}
                disabled={deleteLoading}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteConfirmButton}
                onPress={confirmDelete}
                disabled={deleteLoading}>
                {deleteLoading ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={styles.deleteConfirmButtonText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

  // Selection Actions
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    gap: 4,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    marginLeft: 'auto',
  },
  actionButtonText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },

  // Filters
  filterContainer: {
    backgroundColor: colors.background,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: colors.splashGreen,
  },
  filterButtonText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.background,
    fontFamily: fonts.semiBold,
  },

  // List Container
  listContainer: {
    padding: 16,
  },
  gridRow: {
    justifyContent: 'space-between',
  },

  // Grid View
  gridItem: {
    backgroundColor: colors.background,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 16,
    width: GRID_ITEM_SIZE,
    overflow: 'hidden',
  },
  selectedItem: {
    borderWidth: 2,
    borderColor: colors.splashGreen,
  },
  gridImageContainer: {
    width: '100%',
    height: GRID_ITEM_SIZE * 0.7,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridFilePlaceholder: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.splashGreen,
  },
  gridFileInfo: {
    padding: 12,
  },
  gridFileName: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  gridFileSize: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  gridFileDate: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginTop: 2,
  },

  // List View
  listItem: {
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
    alignItems: 'center',
    position: 'relative',
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
  listFilePlaceholder: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listFileInfo: {
    flex: 1,
  },
  listFileName: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  listFileDetails: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    marginBottom: 2,
  },
  listFileType: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    textTransform: 'capitalize',
  },
  listActionButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listSelectionIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.splashGreen,
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
  uploadButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadButtonText: {
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
  uploadModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '70%',
  },
  actionModal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '60%',
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
  uploadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  uploadOptionContent: {
    flex: 1,
  },
  uploadOptionTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  uploadOptionDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  uploadingText: {
    fontSize: fontSizes.base,
    color: colors.splashGreen,
    fontFamily: fonts.regular,
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  actionText: {
    fontSize: fontSizes.lg,
    color: colors.text,
    fontFamily: fonts.regular,
  },

  // Delete Modal
  deleteModal: {
    backgroundColor: colors.background,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    alignSelf: 'center',
    maxWidth: 400,
    width: '100%',
  },
  deleteModalTitle: {
    fontSize: fontSizes.xl,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  deleteModalText: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
  },
  deleteConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F44336',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteConfirmButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },
});

export default ContentFilesScreen;