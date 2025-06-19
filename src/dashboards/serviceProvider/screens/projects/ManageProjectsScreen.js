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
import {colors} from '../../../../utils/colors';;;
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {getProjects, deleteProject} from '../../../../api/serviceProvider';

const ManageProjectsScreen = () => {
  const navigation = useNavigation();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Refresh projects when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchProjects();
    }, []),
  );

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await getProjects();
      setProjects(response.projects || []);
    } catch (error) {
      console.error('Failed to load projects:', error);
      Alert.alert('Error', 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  };

  const handleAddProject = () => {
    navigation.navigate('AddEditProject');
  };

  const handleEditProject = project => {
    navigation.navigate('AddEditProject', {project, isEdit: true});
  };

  const handleViewProject = project => {
    navigation.navigate('ProjectDetails', {project});
  };

  const handleDeleteProject = async projectId => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteProject(projectId),
        },
      ],
    );
  };

  const confirmDeleteProject = async projectId => {
    try {
      setDeleting(projectId);
      await deleteProject({project_id: projectId});
      setProjects(prev => prev.filter(project => project.id !== projectId));
      Alert.alert('Success', 'Project deleted successfully');
    } catch (error) {
      console.error('Failed to delete project:', error);
      Alert.alert('Error', 'Failed to delete project');
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = dateString => {
    if (!dateString) return 'No date';
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

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'Duration not specified';

    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 30) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
      } else if (diffDays < 365) {
        const months = Math.round(diffDays / 30);
        return `${months} month${months > 1 ? 's' : ''}`;
      } else {
        const years = Math.round(diffDays / 365);
        return `${years} year${years > 1 ? 's' : ''}`;
      }
    } catch {
      return 'Duration not specified';
    }
  };

  const getProjectStats = () => {
    const currentYear = new Date().getFullYear();
    const thisYear = projects.filter(
      project =>
        project.start_date &&
        new Date(project.start_date).getFullYear() === currentYear,
    ).length;

    const completed = projects.filter(
      project => project.end_date && new Date(project.end_date) <= new Date(),
    ).length;

    const ongoing = projects.filter(
      project =>
        project.start_date &&
        new Date(project.start_date) <= new Date() &&
        (!project.end_date || new Date(project.end_date) > new Date()),
    ).length;

    return {
      total: projects.length,
      thisYear,
      completed,
      ongoing,
    };
  };

  const createSectionsData = () => [{id: 'projects', type: 'projects'}];

  const renderSection = ({item}) => {
    switch (item.type) {
      case 'projects':
        return renderProjectsList();
      default:
        return null;
    }
  };

  const renderProjectsList = () => {
    if (projects.length === 0) {
      return renderEmptyState();
    }

    return (
      <FlatList
        data={projects}
        renderItem={renderProjectCard}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.projectsContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    );
  };

  const renderStickyHeader = () => {
    const stats = getProjectStats();

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
            <Text style={styles.headerTitle}>My Projects</Text>
            <Text style={styles.headerSubtitle}>
              Showcase your professional portfolio
            </Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddProject}>
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
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.ongoing}</Text>
            <Text style={styles.statLabel}>Ongoing</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.thisYear}</Text>
            <Text style={styles.statLabel}>This Year</Text>
          </View>
        </View>
      </View>
    );
  };

  const getProjectStatus = (startDate, endDate) => {
    if (!startDate) return {status: 'draft', color: '#9E9E9E', icon: '📝'};

    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (start > now) {
      return {status: 'upcoming', color: '#FF9800', icon: '⏳'};
    } else if (!end || end > now) {
      return {status: 'ongoing', color: colors.splashGreen, icon: '🚀'};
    } else {
      return {status: 'completed', color: '#2196F3', icon: '✅'};
    }
  };

  const renderProjectCard = ({item}) => {
    const projectStatus = getProjectStatus(item.start_date, item.end_date);

    return (
      <TouchableOpacity
        style={styles.projectCard}
        onPress={() => handleViewProject(item)}
        activeOpacity={0.7}>
        {/* Project Image */}
        <View style={styles.projectImageContainer}>
          {item.project_imgs && item.project_imgs.length > 0 ? (
            <Image
              source={{uri: item.project_imgs[0]}}
              style={styles.projectImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.projectImagePlaceholder}>
              <Text style={styles.projectImagePlaceholderText}>📁</Text>
            </View>
          )}

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              {backgroundColor: projectStatus.color},
            ]}>
            <Text style={styles.statusIcon}>{projectStatus.icon}</Text>
            <Text style={styles.statusText}>{projectStatus.status}</Text>
          </View>

          {/* Category Badge */}
          {item.project_category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {item.project_category}
              </Text>
            </View>
          )}

          {/* Image Count */}
          {item.project_imgs && item.project_imgs.length > 1 && (
            <View style={styles.imageCountBadge}>
              <Text style={styles.imageCountText}>
                📷 {item.project_imgs.length}
              </Text>
            </View>
          )}
        </View>

        {/* Project Info */}
        <View style={styles.projectInfo}>
          <Text style={styles.projectTitle} numberOfLines={2}>
            {item.project_title || 'Untitled Project'}
          </Text>

          <View style={styles.projectMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📍</Text>
              <Text style={styles.metaText}>
                {item.project_location || 'Location not specified'}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>⏱</Text>
              <Text style={styles.metaText}>
                {calculateDuration(item.start_date, item.end_date)}
              </Text>
            </View>
          </View>

          <Text style={styles.projectDescription} numberOfLines={2}>
            {item.project_description || 'No description provided'}
          </Text>

          <View style={styles.projectDates}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Start:</Text>
              <Text style={styles.dateValue}>
                {formatDate(item.start_date)}
              </Text>
            </View>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>End:</Text>
              <Text style={styles.dateValue}>{formatDate(item.end_date)}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.projectActions}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={e => {
              e.stopPropagation();
              handleViewProject(item);
            }}>
            <Text style={styles.viewButtonText}>👁️ View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editButton}
            onPress={e => {
              e.stopPropagation();
              handleEditProject(item);
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
              handleDeleteProject(item.id);
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
      <Text style={styles.emptyStateTitle}>No Projects Yet</Text>
      <Text style={styles.emptyStateText}>
        Start building your portfolio by showcasing your best work. Add project
        details, photos, and descriptions to attract more clients.
      </Text>

      <View style={styles.emptyStateBenefits}>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>✅</Text>
          <Text style={styles.benefitText}>Showcase your expertise</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>✅</Text>
          <Text style={styles.benefitText}>Build client confidence</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>✅</Text>
          <Text style={styles.benefitText}>Attract better opportunities</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={handleAddProject}>
        <Text style={styles.emptyStateButtonText}>+ Add First Project</Text>
      </TouchableOpacity>
    </View>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color={colors.splashGreen} />
          <Text style={styles.loadingText}>Loading projects...</Text>
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

  // Update listContainer to projectsContainer:
  projectsContainer: {
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
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  separator: {
    height: 8,
  },
  projectCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  projectImageContainer: {
    height: 200,
    position: 'relative',
  },
  projectImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  projectImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  projectImagePlaceholderText: {
    fontSize: 48,
    color: colors.textSecondary,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusIcon: {
    fontSize: 12,
  },
  statusText: {
    color: colors.background,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    color: colors.background,
    fontSize: 11,
    fontWeight: '500',
  },
  imageCountBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  imageCountText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: '500',
  },
  projectInfo: {
    padding: 16,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  projectMeta: {
    gap: 6,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaIcon: {
    fontSize: 12,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  projectDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  projectDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  projectActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
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
    fontSize: 12,
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
    fontSize: 12,
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
    fontSize: 12,
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

export default ManageProjectsScreen;
