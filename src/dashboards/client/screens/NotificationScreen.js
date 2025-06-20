import {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  FlatList,
  Modal,
} from 'react-native';
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCircle,
  MessageSquare,
  CreditCard,
  Briefcase,
  AlertTriangle,
  X,
  Filter,
  Trash2,
  Settings,
} from 'lucide-react-native';
import {colors} from '../../../utils/colors';
import {fonts, fontSizes} from '../../../utils/fonts';
import {getNotifications, markNotificationsRead} from '../../../api/client';
import {useNavigation, useFocusEffect} from '@react-navigation/native';

// Notification Item Component
const NotificationItem = ({
  notification,
  onPress,
  onMarkRead,
  onDelete,
  loading,
}) => {
  const getNotificationIcon = type => {
    switch (type) {
      case 'message':
        return MessageSquare;
      case 'payment':
        return CreditCard;
      case 'project':
        return Briefcase;
      case 'system':
      default:
        return AlertTriangle;
    }
  };

  const getNotificationColor = type => {
    switch (type) {
      case 'message':
        return colors.splashGreen;
      case 'payment':
        return '#10B981';
      case 'project':
        return '#2196F3';
      case 'system':
      default:
        return '#F44336';
    }
  };

  const getTimeAgo = dateString => {
    if (!dateString) {
      return '';
    }

    const now = new Date();
    const notificationDate = new Date(dateString);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    }
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    }
    if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    }
    if (diffInMinutes < 10080) {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
    return notificationDate.toLocaleDateString();
  };

  const IconComponent = getNotificationIcon(notification.type);
  const iconColor = getNotificationColor(notification.type);

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.isRead && styles.unreadNotification,
      ]}
      onPress={() => onPress(notification)}
      disabled={loading}>
      <View style={styles.notificationContent}>
        {/* Icon */}
        <View
          style={[
            styles.notificationIcon,
            {backgroundColor: `${iconColor}20`},
          ]}>
          <IconComponent color={iconColor} size={20} />
        </View>

        {/* Content */}
        <View style={styles.notificationBody}>
          <View style={styles.notificationHeader}>
            <Text
              style={[
                styles.notificationTitle,
                !notification.isRead && styles.unreadTitle,
              ]}>
              {notification.title}
            </Text>
            <Text style={styles.notificationTime}>
              {getTimeAgo(notification.createdAt)}
            </Text>
          </View>

          <Text style={styles.notificationDescription} numberOfLines={2}>
            {notification.description}
          </Text>

          {/* 🔥 FIXED: Properly handle sender object */}
          {notification.sender && (
            <Text style={styles.notificationSender}>
              From:{' '}
              {typeof notification.sender === 'object'
                ? notification.sender.username ||
                  notification.sender.name ||
                  'Unknown'
                : notification.sender}
            </Text>
          )}
        </View>

        {/* Status Indicator */}
        {!notification.isRead && <View style={styles.unreadIndicator} />}
      </View>

      {/* Action Buttons */}
      <View style={styles.notificationActions}>
        {!notification.isRead && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onMarkRead(notification.id)}
            disabled={loading}>
            <Check color={colors.splashGreen} size={16} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(notification.id)}
          disabled={loading}>
          <Trash2 color="#F44336" size={16} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

// Filter Modal Component
const FilterModal = ({visible, onClose, filters, onApplyFilters}) => {
  const [selectedFilters, setSelectedFilters] = useState(filters);

  const filterOptions = [
    {label: 'All', value: 'all'},
    {label: 'Unread', value: 'unread'},
    {label: 'Messages', value: 'message'},
    {label: 'Payments', value: 'payment'},
    {label: 'Projects', value: 'project'},
    {label: 'System Alerts', value: 'system'},
  ];

  const handleFilterChange = (filterType, value) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const handleApply = () => {
    onApplyFilters(selectedFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      type: 'all',
      status: 'all',
    };
    setSelectedFilters(resetFilters);
    onApplyFilters(resetFilters);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.filterModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Notifications</Text>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.textSecondary} size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterOptions}>
            <Text style={styles.filterSectionTitle}>Type</Text>
            {filterOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterOption,
                  (selectedFilters.type === option.value ||
                    selectedFilters.status === option.value) &&
                    styles.selectedFilterOption,
                ]}
                onPress={() => {
                  if (option.value === 'all' || option.value === 'unread') {
                    handleFilterChange('status', option.value);
                    handleFilterChange('type', 'all');
                  } else {
                    handleFilterChange('type', option.value);
                    handleFilterChange('status', 'all');
                  }
                }}>
                <Text
                  style={[
                    styles.filterOptionText,
                    (selectedFilters.type === option.value ||
                      selectedFilters.status === option.value) &&
                      styles.selectedFilterOptionText,
                  ]}>
                  {option.label}
                </Text>
                {(selectedFilters.type === option.value ||
                  selectedFilters.status === option.value) && (
                  <CheckCircle color={colors.splashGreen} size={16} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.filterActions}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// List Footer Component
const ListFooter = ({loadingMore, hasNextPage, notifications}) => (
  <View style={styles.listFooter}>
    {loadingMore && (
      <ActivityIndicator size="small" color={colors.splashGreen} />
    )}
    {!hasNextPage && notifications.length > 0 && (
      <Text style={styles.endOfListText}>No more notifications</Text>
    )}
  </View>
);

const NotificationScreen = () => {
  const navigation = useNavigation();

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [markAllLoading, setMarkAllLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
  });

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    unread: 0,
  });

  // 🔥 FIXED: Updated fetchNotifications to handle the API response properly
  const fetchNotifications = useCallback(
    async (page = 1, reset = false) => {
      try {
        if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        // Use the correct API call format
        const response = await getNotifications({
          page: page,
          limit: 20,
          type: filters.type !== 'all' ? filters.type : undefined,
          read: filters.status === 'unread' ? false : undefined,
        });

        if (response && response.notifications) {
          // 🔥 FIXED: Ensure notifications are properly processed
          const processedNotifications = response.notifications.map(
            notification => ({
              ...notification,
              // Ensure sender is properly handled
              sender:
                typeof notification.sender === 'object'
                  ? notification.sender.username ||
                    notification.sender.name ||
                    'Unknown'
                  : notification.sender,
            }),
          );

          const newNotifications =
            reset || page === 1
              ? processedNotifications
              : [...notifications, ...processedNotifications];

          setNotifications(newNotifications);
          setFilteredNotifications(newNotifications);

          // Update pagination
          setCurrentPage(page);
          setHasNextPage(response.pagination?.hasNextPage || false);

          // Update stats
          setStats({
            total:
              response.pagination?.totalNotifications ||
              newNotifications.length,
            unread: newNotifications.filter(n => !n.isRead).length,
          });
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
        Alert.alert('Error', 'Unable to load notifications. Please try again.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [notifications, filters.status, filters.type],
  );

  // Initial load and refresh on focus
  useFocusEffect(
    useCallback(() => {
      fetchNotifications(1, true);
    }, [fetchNotifications]),
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications(1, true);
    setRefreshing(false);
  }, [fetchNotifications]);

  // Load more
  const loadMore = useCallback(() => {
    if (hasNextPage && !loadingMore && !loading) {
      fetchNotifications(currentPage + 1);
    }
  }, [hasNextPage, loadingMore, loading, currentPage, fetchNotifications]);

  // Mark single notification as read
  const markNotificationRead = async notificationId => {
    try {
      setActionLoading(notificationId);

      await markNotificationsRead({
        notificationId,
        isReadAll: false,
      });

      // Update local state
      const updatedNotifications = notifications.map(notification =>
        notification.id === notificationId
          ? {...notification, isRead: true}
          : notification,
      );

      setNotifications(updatedNotifications);
      setFilteredNotifications(updatedNotifications);

      // Update stats
      setStats(prev => ({
        ...prev,
        unread: prev.unread - 1,
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read.');
    } finally {
      setActionLoading(null);
    }
  };

  // Mark all notifications as read
  const markAllNotificationsRead = async () => {
    try {
      setMarkAllLoading(true);

      await markNotificationsRead({isReadAll: true});

      // Update local state
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        isRead: true,
      }));

      setNotifications(updatedNotifications);
      setFilteredNotifications(updatedNotifications);

      // Update stats
      setStats(prev => ({
        ...prev,
        unread: 0,
      }));

      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read.');
    } finally {
      setMarkAllLoading(false);
    }
  };

  // Delete notification
  const deleteNotification = async notificationId => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(notificationId);

              // Remove from local state (API call would go here)
              const updatedNotifications = notifications.filter(
                notification => notification.id !== notificationId,
              );

              setNotifications(updatedNotifications);
              setFilteredNotifications(updatedNotifications);

              // Update stats
              const deletedNotification = notifications.find(
                n => n.id === notificationId,
              );
              if (deletedNotification && !deletedNotification.isRead) {
                setStats(prev => ({
                  total: prev.total - 1,
                  unread: prev.unread - 1,
                }));
              } else {
                setStats(prev => ({
                  ...prev,
                  total: prev.total - 1,
                }));
              }
            } catch (error) {
              console.error('Failed to delete notification:', error);
              Alert.alert('Error', 'Failed to delete notification.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ],
    );
  };

  // Handle notification press
  const handleNotificationPress = notification => {
    // Mark as read if not already read
    if (!notification.isRead) {
      markNotificationRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'message':
        navigation.navigate('ChatScreen', {
          clientId: notification.senderId,
        });
        break;
      case 'project':
        navigation.navigate('ProjectDetailScreen', {
          projectId: notification.relatedId,
        });
        break;
      case 'payment':
        navigation.navigate('PaymentScreen', {
          orderId: notification.relatedId,
        });
        break;
      case 'system':
      default:
        navigation.navigate('NotificationDetailScreen', {
          notificationId: notification.id,
        });
        break;
    }
  };

  // Apply filters
  const applyFilters = newFilters => {
    setFilters(newFilters);
  };

  // Empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Bell color={colors.textSecondary} size={64} />
      <Text style={styles.emptyStateTitle}>No Notifications</Text>
      <Text style={styles.emptyStateDescription}>
        {filters.status === 'unread'
          ? "You're all caught up! No unread notifications."
          : "You don't have any notifications yet."}
      </Text>
    </View>
  );

  // Loading state
  if (loading && notifications.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
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

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {stats.unread > 0 ? `${stats.unread} unread` : 'All caught up'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => setFilterModalVisible(true)}>
            <Filter color={colors.text} size={18} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => navigation.navigate('NotificationSettingsScreen')}>
            <Settings color={colors.text} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, {color: colors.splashGreen}]}>
            {stats.unread}
          </Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={markAllNotificationsRead}
          disabled={markAllLoading || stats.unread === 0}>
          {markAllLoading ? (
            <ActivityIndicator size="small" color={colors.background} />
          ) : (
            <>
              <CheckCircle color={colors.background} size={16} />
              <Text style={styles.markAllButtonText}>Mark All Read</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => (
          <NotificationItem
            notification={item}
            onPress={handleNotificationPress}
            onMarkRead={markNotificationRead}
            onDelete={deleteNotification}
            loading={actionLoading === item.id}
          />
        )}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={
          <ListFooter
            loadingMore={loadingMore}
            hasNextPage={hasNextPage}
            notifications={notifications}
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.notificationsList}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        onApplyFilters={applyFilters}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
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
  headerCenter: {
    flex: 1,
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
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statItem: {
    alignItems: 'center',
    marginRight: 24,
  },
  statValue: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 'auto',
    gap: 4,
  },
  markAllButtonText: {
    fontSize: fontSizes.sm,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },

  // Notifications List
  notificationsList: {
    padding: 16,
  },
  notificationItem: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  unreadNotification: {
    borderColor: colors.splashGreen,
    borderWidth: 2,
    backgroundColor: '#F0FDF4',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationBody: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.medium,
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontFamily: fonts.semiBold,
  },
  notificationTime: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
  notificationDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationSender: {
    fontSize: fontSizes.xs,
    color: colors.splashGreen,
    fontFamily: fonts.medium,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.splashGreen,
    marginLeft: 8,
    marginTop: 6,
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#FFF3F3',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: fontSizes.lg,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    textAlign: 'center',
    paddingHorizontal: 32,
  },

  // List Footer
  listFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endOfListText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },

  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '70%',
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
  filterOptions: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSectionTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedFilterOption: {
    backgroundColor: '#F0F9FF',
  },
  filterOptionText: {
    fontSize: fontSizes.base,
    color: colors.text,
    fontFamily: fonts.regular,
  },
  selectedFilterOptionText: {
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },
  filterActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.splashGreen,
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.splashGreen,
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: colors.splashGreen,
    borderRadius: 8,
  },
  applyButtonText: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.background,
  },
});

export default NotificationScreen;
