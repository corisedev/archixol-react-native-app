import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {
  getMyProjects,
  cancelProject,
  completeProject,
} from '../../../api/client';
import {useNavigation} from '@react-navigation/native';

// Import your icons here
import SearchIcon from '../../../assets/images/icons/company.png';
import CalendarIcon from '../../../assets/images/icons/company.png';
import LocationIcon from '../../../assets/images/icons/location.png';

const MyProjectsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectModal, setShowProjectModal] = useState(false);

  // Filter options
  const filterOptions = [
    {label: 'All Projects', value: 'all'},
    {label: 'Ongoing', value: 'ongoing'},
    {label: 'Planning', value: 'planning'},
    {label: 'Review', value: 'review'},
    {label: 'Completed', value: 'completed'},
  ];

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      const response = await getMyProjects();
      console.log('My Projects API Response:', response);

      const projectsData = response.projects || [];
      setProjects(projectsData);
      filterProjects(projectsData, selectedFilter, searchQuery);
    } catch (error) {
      console.error('Failed to load projects:', error);
      Alert.alert('Error', 'Unable to load projects. Please try again.');
    }
  }, [selectedFilter, searchQuery, filterProjects]);

  // Filter projects
  const filterProjects = useCallback((projectsData, filter, search) => {
    let filtered = projectsData;

    // Filter by status
    if (filter !== 'all') {
      filtered = filtered.filter(
        project => project.status?.toLowerCase() === filter.toLowerCase(),
      );
    }

    // Filter by search query
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        project =>
          project.title?.toLowerCase().includes(searchLower) ||
          project.description?.toLowerCase().includes(searchLower) ||
          project.category?.toLowerCase().includes(searchLower),
      );
    }

    setFilteredProjects(filtered);
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchProjects();
      setLoading(false);
    };
    loadData();
  }, [fetchProjects]);

  // Update filters when projects change
  useEffect(() => {
    filterProjects(projects, selectedFilter, searchQuery);
  }, [projects, selectedFilter, searchQuery, filterProjects]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  }, [fetchProjects]);

  // Handle filter change
  const handleFilterChange = filter => {
    setSelectedFilter(filter);
  };

  // Handle search
  const handleSearch = query => {
    setSearchQuery(query);
  };

  // Handle project action
  const handleProjectAction = async (action, projectId) => {
    try {
      Alert.alert(
        `${action.charAt(0).toUpperCase() + action.slice(1)} Project`,
        `Are you sure you want to ${action} this project?`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: action.charAt(0).toUpperCase() + action.slice(1),
            style: action === 'cancel' ? 'destructive' : 'default',
            onPress: async () => {
              setLoading(true);
              let response;

              if (action === 'complete') {
                response = await completeProject({project_id: projectId});
              } else if (action === 'cancel') {
                response = await cancelProject({project_id: projectId});
              }

              if (response) {
                Alert.alert('Success', `Project ${action}ed successfully!`);
                await fetchProjects();
              }
              setLoading(false);
            },
          },
        ],
      );
    } catch (error) {
      console.error(`Failed to ${action} project:`, error);
      Alert.alert('Error', `Failed to ${action} project. Please try again.`);
      setLoading(false);
    }
  };

  // Get status color
  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'ongoing':
      case 'in_progress':
        return {bg: '#E3F2FD', text: colors.primary};
      case 'planning':
      case 'open':
        return {bg: '#FFF3E0', text: '#FF9800'};
      case 'review':
      case 'pending_client_approval':
        return {bg: '#E8F5E9', text: colors.splashGreen};
      case 'completed':
        return {bg: '#F3E5F5', text: '#9C27B0'};
      case 'cancelled':
        return {bg: '#FFEBEE', text: '#F44336'};
      default:
        return {bg: '#F5F5F5', text: colors.textSecondary};
    }
  };

  // Format currency
  const formatCurrency = amount => {
    if (typeof amount === 'number') {
      return `Rs ${amount.toLocaleString()}`;
    }
    return `Rs ${amount || '0'}`;
  };

  // Format date
  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get filter counts
  const getFilterCounts = () => {
    const counts = {
      all: projects.length,
      ongoing: projects.filter(p =>
        ['ongoing', 'in_progress'].includes(p.status?.toLowerCase()),
      ).length,
      planning: projects.filter(p =>
        ['planning', 'open'].includes(p.status?.toLowerCase()),
      ).length,
      review: projects.filter(p =>
        ['review', 'pending_client_approval'].includes(p.status?.toLowerCase()),
      ).length,
      completed: projects.filter(p => p.status?.toLowerCase() === 'completed')
        .length,
    };

    return filterOptions.map(option => ({
      ...option,
      count: counts[option.value] || 0,
    }));
  };

  // Render project card - Compact version
  const renderProjectCard = project => {
    const statusColors = getStatusColor(project.status);

    return (
      <TouchableOpacity
        key={project.project_id}
        style={styles.projectCard}
        onPress={() => {
          setSelectedProject(project);
          setShowProjectModal(true);
        }}
        activeOpacity={0.7}>
        <View style={styles.projectHeader}>
          <View style={styles.projectInfo}>
            <Text style={styles.projectTitle} numberOfLines={1}>
              {project.title || project.name || 'Untitled Project'}
            </Text>
            <View style={styles.projectLocation}>
              <Image
                source={LocationIcon}
                style={styles.locationIcon}
                resizeMode="contain"
              />
              <Text style={styles.projectLocationText}>
                {project.city || project.location || 'Location not specified'}
              </Text>
            </View>
          </View>
          <View style={styles.projectMeta}>
            <Text style={styles.projectPrice}>
              {formatCurrency(project.budget || project.price)}
            </Text>
            <View
              style={[styles.statusBadge, {backgroundColor: statusColors.bg}]}>
              <Text style={[styles.statusText, {color: statusColors.text}]}>
                {project.status?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.projectDescription} numberOfLines={2}>
          {project.description || project.details || 'No description available'}
        </Text>

        <View style={styles.projectFooter}>
          <View style={styles.projectMetaRow}>
            <View style={styles.projectMetaItem}>
              <Image
                source={CalendarIcon}
                style={styles.metaIcon}
                resizeMode="contain"
              />
              <Text style={styles.metaText}>
                {formatDate(project.created_at || project.start_date)}
              </Text>
            </View>
            <View style={styles.projectMetaItem}>
              <Text style={styles.metaText}>
                Progress:{' '}
                {project.progressValue || project.completion_percentage || 0}%
              </Text>
            </View>
          </View>

          <View style={styles.projectActions}>
            {project.status !== 'completed' &&
              project.status !== 'cancelled' && (
                <>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      handleProjectAction('complete', project.project_id)
                    }>
                    <Text style={styles.actionButtonText}>Complete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelActionButton}
                    onPress={() =>
                      handleProjectAction('cancel', project.project_id)
                    }>
                    <Text style={styles.cancelActionButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBackground}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${
                      project.progressValue ||
                      project.completion_percentage ||
                      0
                    }%`,
                    backgroundColor: statusColors.text,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {project.progressValue || project.completion_percentage || 0}%
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render project details modal
  const renderProjectModal = () => (
    <Modal
      visible={showProjectModal}
      animationType="slide"
      presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowProjectModal(false)}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Project Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.modalContent}
          showsVerticalScrollIndicator={false}>
          {selectedProject && (
            <View style={styles.projectDetails}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  Project Information
                </Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name:</Text>
                  <Text style={styles.detailValue}>
                    {selectedProject.title || selectedProject.name}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getStatusColor(selectedProject.status)
                          .bg,
                      },
                    ]}>
                    <Text
                      style={[
                        styles.statusText,
                        {color: getStatusColor(selectedProject.status).text},
                      ]}>
                      {selectedProject.status?.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Budget:</Text>
                  <Text
                    style={[
                      styles.detailValue,
                      {color: colors.splashGreen, fontWeight: '600'},
                    ]}>
                    {formatCurrency(
                      selectedProject.budget || selectedProject.price,
                    )}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Progress:</Text>
                  <Text style={styles.detailValue}>
                    {selectedProject.progressValue ||
                      selectedProject.completion_percentage ||
                      0}
                    %
                  </Text>
                </View>
              </View>

              {selectedProject.description && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Description</Text>
                  <Text style={styles.descriptionText}>
                    {selectedProject.description || selectedProject.details}
                  </Text>
                </View>
              )}

              <View style={styles.modalActions}>
                {selectedProject.status !== 'completed' &&
                  selectedProject.status !== 'cancelled' && (
                    <>
                      <TouchableOpacity
                        style={[
                          styles.modalActionButton,
                          {backgroundColor: colors.splashGreen},
                        ]}
                        onPress={() => {
                          setShowProjectModal(false);
                          handleProjectAction(
                            'complete',
                            selectedProject.project_id,
                          );
                        }}>
                        <Text style={styles.modalActionButtonText}>
                          Complete Project
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.modalActionButton,
                          {backgroundColor: '#F44336'},
                        ]}
                        onPress={() => {
                          setShowProjectModal(false);
                          handleProjectAction(
                            'cancel',
                            selectedProject.project_id,
                          );
                        }}>
                        <Text style={styles.modalActionButtonText}>
                          Cancel Project
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  // Loading state
  if (loading && projects.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading projects...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}>
      <View style={styles.wrapper}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>My Projects</Text>
              <Text style={styles.headerSubtitle}>
                Track your project progress
              </Text>
            </View>
            <TouchableOpacity
              style={styles.newProjectButton}
              onPress={() => navigation.navigate('PostJobScreen')}>
              <Text style={styles.newProjectText}>+ New Project</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Image source={SearchIcon} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search projects..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}>
            {getFilterCounts().map(filter => (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.filterTab,
                  selectedFilter === filter.value && styles.activeFilterTab,
                ]}
                onPress={() => handleFilterChange(filter.value)}>
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === filter.value &&
                      styles.activeFilterTabText,
                  ]}>
                  {filter.label}
                </Text>
                <View
                  style={[
                    styles.filterCount,
                    selectedFilter === filter.value && styles.activeFilterCount,
                  ]}>
                  <Text
                    style={[
                      styles.filterCountText,
                      selectedFilter === filter.value &&
                        styles.activeFilterCountText,
                    ]}>
                    {filter.count}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Projects List */}
        <View style={styles.projectsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Projects</Text>
            <Text style={styles.projectCount}>
              {filteredProjects.length} Projects
            </Text>
          </View>

          {filteredProjects.length > 0 ? (
            filteredProjects.map(project => renderProjectCard(project))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'No projects match your search'
                  : 'No projects yet'}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? 'Try a different search term'
                  : 'Create your first project to get started'}
              </Text>
              <TouchableOpacity
                style={styles.emptyActionButton}
                onPress={() => navigation.navigate('CreateProjectScreen')}>
                <Text style={styles.emptyActionButtonText}>Create Project</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Project Details Modal */}
      {renderProjectModal()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 100, // Added proper bottom spacing
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingTop: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  newProjectButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  newProjectText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },

  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12, // Smaller radius
    paddingHorizontal: 16,
    paddingVertical: 10, // Reduced padding
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    width: 18, // Smaller icon
    height: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14, // Smaller font
    color: colors.text,
  },

  filterSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  filterContainer: {
    paddingRight: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, // Reduced padding
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16, // Smaller radius
    backgroundColor: '#F0F0F0',
  },
  activeFilterTab: {
    backgroundColor: colors.splashGreen,
  },
  filterTabText: {
    fontSize: 12, // Smaller font
    color: colors.textSecondary,
    fontWeight: '500',
    marginRight: 6,
  },
  activeFilterTabText: {
    color: colors.background,
  },
  filterCount: {
    backgroundColor: '#E0E0E0',
    borderRadius: 8, // Smaller radius
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  activeFilterCount: {
    backgroundColor: colors.background + '40',
  },
  filterCountText: {
    fontSize: 9, // Smaller font
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeFilterCountText: {
    color: colors.background,
  },

  projectsSection: {
    paddingHorizontal: 16,
    paddingTop: 20, // Reduced margin
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12, // Reduced margin
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  projectCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Project Cards - More Compact
  projectCard: {
    backgroundColor: colors.background,
    borderRadius: 12, // Smaller radius
    padding: 12, // Reduced padding
    marginBottom: 10, // Reduced margin
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8, // Reduced margin
  },
  projectInfo: {
    flex: 1,
    marginRight: 12,
  },
  projectTitle: {
    fontSize: 15, // Smaller font
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4, // Reduced margin
  },
  projectLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 10, // Smaller icon
    height: 10,
    marginRight: 4,
  },
  projectLocationText: {
    fontSize: 12, // Smaller font
    color: colors.textSecondary,
  },
  projectMeta: {
    alignItems: 'flex-end',
  },
  projectPrice: {
    fontSize: 14, // Smaller font
    fontWeight: '700',
    color: colors.splashGreen,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 6, // Reduced padding
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 9, // Smaller font
    fontWeight: '600',
  },
  projectDescription: {
    fontSize: 12, // Smaller font
    color: colors.textSecondary,
    lineHeight: 16, // Reduced line height
    marginBottom: 12, // Reduced margin
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8, // Reduced margin
  },
  projectMetaRow: {
    flex: 1,
  },
  projectMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3, // Reduced margin
  },
  metaIcon: {
    width: 10, // Smaller icon
    height: 10,
    marginRight: 4,
  },
  metaText: {
    fontSize: 11, // Smaller font
    color: colors.textSecondary,
  },
  projectActions: {
    flexDirection: 'row',
    gap: 6, // Reduced gap
  },
  actionButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 10, // Reduced padding
    paddingVertical: 5,
    borderRadius: 12, // Smaller radius
  },
  actionButtonText: {
    color: colors.background,
    fontSize: 11, // Smaller font
    fontWeight: '600',
  },
  cancelActionButton: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10, // Reduced padding
    paddingVertical: 5,
    borderRadius: 12, // Smaller radius
    borderWidth: 1,
    borderColor: '#F44336',
  },
  cancelActionButtonText: {
    color: '#F44336',
    fontSize: 11, // Smaller font
    fontWeight: '600',
  },

  // Progress Section - More Compact
  progressSection: {
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBackground: {
    flex: 1,
    height: 3, // Smaller height
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginRight: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10, // Smaller font
    fontWeight: '600',
    color: colors.textSecondary,
  },

  emptyCard: {
    backgroundColor: colors.background,
    borderRadius: 12, // Smaller radius
    padding: 32, // Reduced padding
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    fontSize: 15, // Smaller font
    color: colors.textSecondary,
    marginBottom: 6, // Reduced margin
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 13, // Smaller font
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16, // Reduced margin
  },
  emptyActionButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 16,
    paddingVertical: 8, // Reduced padding
    borderRadius: 16, // Smaller radius
  },
  emptyActionButtonText: {
    color: colors.background,
    fontSize: 13, // Smaller font
    fontWeight: '600',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingTop: 40,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  placeholder: {
    width: 32,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  projectDetails: {
    paddingVertical: 16,
  },
  detailSection: {
    marginBottom: 20, // Reduced margin
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12, // Reduced margin
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6, // Reduced padding
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 13, // Smaller font
    color: colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13, // Smaller font
    color: colors.text,
    fontWeight: '600',
  },
  descriptionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  modalActions: {
    paddingTop: 16,
    gap: 10, // Reduced gap
  },
  modalActionButton: {
    paddingVertical: 10, // Reduced padding
    borderRadius: 12, // Smaller radius
    alignItems: 'center',
  },
  modalActionButtonText: {
    color: colors.background,
    fontSize: 14, // Smaller font
    fontWeight: '600',
  },
});

export default MyProjectsScreen;
