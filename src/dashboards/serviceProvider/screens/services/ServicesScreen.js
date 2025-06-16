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
  StatusBar,
} from 'react-native';
import {colors} from '../../../../utils/colors';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {getAllServices, deleteService} from '../../../../api/serviceProvider';

const ServicesScreen = () => {
  const navigation = useNavigation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(null);

  // Refresh services when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchServices();
    }, []),
  );

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await getAllServices();
      setServices(response.services_list || []);
    } catch (error) {
      console.error('Failed to load services:', error);
      Alert.alert('Error', 'Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  };

  const handleAddService = () => {
    navigation.navigate('AddEditService');
  };

  const createSectionsData = () => [{id: 'services', type: 'services'}];

  const renderServicesList = () => {
    if (services.length === 0) {
      return renderEmptyState();
    }

    return (
      <FlatList
        data={services}
        renderItem={renderServiceCard}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.servicesContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    );
  };

  const renderStickyHeader = () => (
    <View style={styles.stickyHeader}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header Top with Back Button */}
      <View style={styles.headerTop}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Services</Text>
          <Text style={styles.headerSubtitle}>
            Manage and showcase your professional services
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddService}>
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{services.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {services.filter(s => s.service_status).length}
          </Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {services.filter(s => !s.service_status).length}
          </Text>
          <Text style={styles.statLabel}>Inactive</Text>
        </View>
      </View>
    </View>
  );

  const handleEditService = service => {
    navigation.navigate('AddEditService', {service, isEdit: true});
  };

  const handleViewService = service => {
    navigation.navigate('ServiceDetails', {service});
  };

  const handleDeleteService = async serviceId => {
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteService(serviceId),
        },
      ],
    );
  };

  const confirmDeleteService = async serviceId => {
    try {
      setDeleting(serviceId);
      await deleteService({service_id: serviceId});
      setServices(prev => prev.filter(service => service.id !== serviceId));
      Alert.alert('Success', 'Service deleted successfully');
    } catch (error) {
      console.error('Failed to delete service:', error);
      Alert.alert('Error', 'Failed to delete service');
    } finally {
      setDeleting(null);
    }
  };

  const getServiceStatusInfo = status => {
    if (status) {
      return {
        text: 'Active',
        backgroundColor: '#E8F5E9',
        textColor: colors.splashGreen,
        icon: '✅',
      };
    } else {
      return {
        text: 'Inactive',
        backgroundColor: '#FFEBEE',
        textColor: '#F44336',
        icon: '⏸️',
      };
    }
  };

  const renderServiceCard = ({item}) => {
    const statusInfo = getServiceStatusInfo(item.service_status);

    return (
      <View style={styles.serviceCard}>
        {/* Service Header */}
        <View style={styles.serviceHeader}>
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceTitle} numberOfLines={2}>
              {item.service_title || 'Untitled Service'}
            </Text>
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryIcon}>🏷️</Text>
              <Text style={styles.serviceCategory}>
                {item.service_category || 'General'}
              </Text>
            </View>
          </View>
          <View style={styles.serviceActions}>
            <View
              style={[
                styles.statusBadge,
                {backgroundColor: statusInfo.backgroundColor},
              ]}>
              <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
              <Text style={[styles.statusText, {color: statusInfo.textColor}]}>
                {statusInfo.text}
              </Text>
            </View>
          </View>
        </View>

        {/* Service Description */}
        <Text style={styles.serviceDescription} numberOfLines={3}>
          {item.service_description || 'No description provided'}
        </Text>

        {/* Service Tags */}
        {item.service_tags && item.service_tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.service_tags.slice(0, 3).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {item.service_tags.length > 3 && (
              <View style={[styles.tag, styles.moreTag]}>
                <Text style={[styles.tagText, styles.moreTagText]}>
                  +{item.service_tags.length - 3} more
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Service Stats */}
        <View style={styles.serviceStats}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>📋</Text>
            <Text style={styles.statText}>
              {item.service_process?.length || 0} Steps
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statText}>
              {item.service_feature?.length || 0} Features
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>❓</Text>
            <Text style={styles.statText}>
              {item.service_faqs?.length || 0} FAQs
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🖼️</Text>
            <Text style={styles.statText}>
              {item.service_images?.length || 0} Images
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleViewService(item)}>
            <Text style={styles.viewButtonText}>👁️ View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditService(item)}>
            <Text style={styles.editButtonText}>✏️ Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.deleteButton,
              deleting === item.id && styles.deleteButtonDisabled,
            ]}
            onPress={() => handleDeleteService(item.id)}
            disabled={deleting === item.id}>
            {deleting === item.id ? (
              <ActivityIndicator size="small" color="#F44336" />
            ) : (
              <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>🛠️</Text>
      <Text style={styles.emptyStateTitle}>No Services Yet</Text>
      <Text style={styles.emptyStateText}>
        Start by creating your first service to showcase your skills and attract
        clients. Build your portfolio of services to grow your business.
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={handleAddService}>
        <Text style={styles.emptyStateButtonText}>+ Create First Service</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSection = ({item}) => {
    switch (item.type) {
      case 'services':
        return renderServicesList();
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color={colors.splashGreen} />
          <Text style={styles.loadingText}>Loading services...</Text>
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
  // Add these styles to your StyleSheet:
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
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
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

  // Replace pageHeader with:
  stickyHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 50, // Status bar space
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    marginBottom: 10,
  },

  // Add this new style:
  flatListContent: {
    paddingBottom: 40,
  },

  // Update listContainer to servicesContainer:
  servicesContainer: {
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
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },

  // Update these existing styles:
  headerContent: {
    flex: 1, // Add this line
  },
  headerTitle: {
    fontSize: 20, // Change from 24 to 20
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    // Remove marginBottom: 16,
  },
  addButton: {
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 16, // Change from 20 to 16
    paddingVertical: 8, // Change from 12 to 8
    borderRadius: 20, // Change from 25 to 20
    flexDirection: 'row',
    alignItems: 'center',
    // Remove alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  addButtonIcon: {
    color: colors.background,
    fontSize: 16, // Change from 18 to 16
    fontWeight: '600',
    // Remove marginRight: 6,
  },
  addButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBadge: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  statBadgeNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.splashGreen,
  },
  statBadgeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    flexGrow: 1,
  },
  separator: {
    height: 8,
  },
  serviceCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  serviceCategory: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  serviceActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 10,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  serviceDescription: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  moreTag: {
    backgroundColor: colors.splashGreen,
  },
  tagText: {
    fontSize: 12,
    color: '#1565C0',
    fontWeight: '500',
  },
  moreTagText: {
    color: colors.background,
  },
  serviceStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  statText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  viewButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  editButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 12,
    color: colors.background,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
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
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    fontSize: 64,
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
    marginBottom: 30,
    maxWidth: 280,
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

export default ServicesScreen;
