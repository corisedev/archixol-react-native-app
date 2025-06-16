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
  FlatList,
  Image,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {getNotifications, markNotificationAsRead} from '../../../api/client';

// Import your icons here
import NotificationIcon from '../../../assets/images/icons/company.png';
import OrderIcon from '../../../assets/images/icons/company.png';
import MessageIcon from '../../../assets/images/icons/company.png';
import ProjectIcon from '../../../assets/images/icons/company.png';
import PaymentIcon from '../../../assets/images/icons/company.png';
import SystemIcon from '../../../assets/images/icons/company.png';
import SecurityIcon from '../../../assets/images/icons/company.png';
import PromotionIcon from '../../../assets/images/icons/company.png';
import CheckIcon from '../../../assets/images/icons/company.png';
import MarkAllIcon from '../../../assets/images/icons/company.png';

const NotificationsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  // Filter options
  const filterOptions = [
    {label: 'All', value: 'all', icon: NotificationIcon},
    {label: 'Orders', value: 'order', icon: OrderIcon},
    {label: 'Messages', value: 'message', icon: MessageIcon},
    {label: 'Projects', value: 'project', icon: ProjectIcon},
    {label: 'Payments', value: 'payment', icon: PaymentIcon},
    {label: 'System', value: 'system', icon: SystemIcon},
  ];

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (pageNum = 1, resetData = true) => {
      try {
        if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const params = {
          page: pageNum,
          limit: 20,
          ...(selectedFilter !== 'all' && {type: selectedFilter}),
        };

        const response = await getNotifications(params);
        console.log('Notifications API Response:', response);

        if (response && response.notifications) {
          const newNotifications = response.notifications;

          if (resetData || pageNum === 1) {
            setNotifications(newNotifications);
          } else {
            setNotifications(prev => [...prev, ...newNotifications]);
          }

          setHasMore(
            response.pagination?.current_page <
              response.pagination?.total_pages,
          );
          setPage(pageNum);
        } else {
          if (resetData || pageNum === 1) {
            setNotifications([]);
          }
          setHasMore(false);
        }
      } catch (error) {
        console.error('Failed to load notifications:', error);
        Alert.alert('Error', 'Unable to load notifications. Please try again.');
        if (resetData || pageNum === 1) {
          setNotifications([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedFilter],
  );

  // Initial load
  useEffect(() => {
    fetchNotifications(1, true);
  }, [fetchNotifications]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications(1, true);
    setRefreshing(false);
  }, [fetchNotifications]);

  // Load more notifications
  const loadMoreNotifications = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchNotifications(page + 1, false);
    }
  }, [fetchNotifications, page, hasMore, loadingMore]);

  // Mark notification as read
  const handleMarkAsRead = async notificationId => {
    try {
      setMarkingRead(true);
      const response = await markNotificationAsRead(notificationId);

      if (response) {
        // Update local state
        setNotifications(prev =>
          prev.map(notification =>
            notification.notification_id === notificationId
              ? {...notification, is_read: true}
              : notification,
          ),
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    } finally {
      setMarkingRead(false);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      setMarkingRead(true);
      const unreadNotifications = notifications.filter(n => !n.is_read);

      // Mark all unread notifications as read
      await Promise.all(
        unreadNotifications.map(notification =>
          markNotificationAsRead(notification.notification_id),
        ),
      );

      // Update local state
      setNotifications(prev =>
        prev.map(notification => ({...notification, is_read: true})),
      );

      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    } finally {
      setMarkingRead(false);
    }
  };

  // Get notification icon
  const getNotificationIcon = type => {
    switch (type?.toLowerCase()) {
      case 'order':
        return OrderIcon;
      case 'message':
        return MessageIcon;
      case 'project':
        return ProjectIcon;
      case 'payment':
        return PaymentIcon;
      case 'system':
        return SystemIcon;
      case 'security':
        return SecurityIcon;
      case 'promotion':
        return PromotionIcon;
      default:
        return NotificationIcon;
    }
  };

  // Get notification color
  const getNotificationColor = type => {
    switch (type?.toLowerCase()) {
      case 'order':
        return colors.splashGreen;
      case 'message':
        return colors.primary;
      case 'project':
        return '#FF9800';
      case 'payment':
        return '#9C27B0';
      case 'system':
        return '#607D8B';
      case 'security':
        return '#F44336';
      case 'promotion':
        return '#4CAF50';
      default:
        return colors.textSecondary;
    }
  };

  // Format time
  const formatTime = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (selectedFilter === 'all') return true;
    return notification.type === selectedFilter;
  });

  // Get unread count
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Render notification item
  const renderNotificationItem = ({item: notification}) => {
    const isUnread = !notification.is_read;
    const notificationColor = getNotificationColor(notification.type);
    const NotificationIconComponent = getNotificationIcon(notification.type);

    return (
      <TouchableOpacity
        style={[styles.notificationCard, isUnread && styles.unreadNotification]}
        onPress={() => {
          if (isUnread) {
            handleMarkAsRead(notification.notification_id);
          }
          // Handle navigation based on notification type
        }}
        activeOpacity={0.7}>
        <View style={styles.notificationContent}>
          <View
            style={[
              styles.notificationIcon,
              {backgroundColor: notificationColor + '20'},
            ]}>
            <Image
              source={NotificationIconComponent}
              style={[
                styles.notificationIconImage,
                {tintColor: notificationColor},
              ]}
              resizeMode="contain"
            />
          </View>

          <View style={styles.notificationInfo}>
            <View style={styles.notificationHeader}>
              <Text
                style={[
                  styles.notificationTitle,
                  isUnread && styles.unreadTitle,
                ]}>
                {notification.title || 'Notification'}
              </Text>
              <Text style={styles.notificationTime}>
                {formatTime(notification.created_at)}
              </Text>
            </View>

            <Text style={styles.notificationMessage} numberOfLines={2}>
              {notification.message ||
                notification.body ||
                'No message content'}
            </Text>

            <View style={styles.notificationFooter}>
              <View style={styles.notificationMeta}>
                <Text style={styles.notificationCategory}>
                  {notification.type?.toUpperCase() || 'GENERAL'}
                </Text>
                {notification.priority && (
                  <Text
                    style={[
                      styles.notificationPriority,
                      {
                        color:
                          notification.priority === 'high'
                            ? '#F44336'
                            : '#FF9800',
                      },
                    ]}>
                    {notification.priority.toUpperCase()}
                  </Text>
                )}
              </View>

              {isUnread && (
                <View style={styles.unreadIndicator}>
                  <View style={styles.unreadDot} />
                </View>
              )}
            </View>
          </View>
        </View>

        {isUnread && (
          <TouchableOpacity
            style={styles.markReadButton}
            onPress={() => handleMarkAsRead(notification.notification_id)}>
            <Image source={CheckIcon} style={styles.markReadIcon} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  // Loading state
  if (loading && notifications.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  // Calculate stats
  const statsData = [
    {
      label: 'Total',
      value: notifications.length.toString(),
      color: colors.splashGreen,
    },
    {
      label: 'Unread',
      value: unreadCount.toString(),
      color: '#FF9800',
    },
    {
      label: 'Today',
      value: notifications
        .filter(n => {
          const today = new Date();
          const notificationDate = new Date(n.created_at);
          return notificationDate.toDateString() === today.toDateString();
        })
        .length.toString(),
      color: colors.primary,
    },
    {
      label: 'This Week',
      value: notifications
        .filter(n => {
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return new Date(n.created_at) > weekAgo;
        })
        .length.toString(),
      color: '#9C27B0',
    },
  ];

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
              <Text style={styles.headerTitle}>Notifications</Text>
              <Text style={styles.headerSubtitle}>
                {unreadCount > 0
                  ? `${unreadCount} unread notifications`
                  : 'All caught up!'}
              </Text>
            </View>
            {unreadCount > 0 && (
              <TouchableOpacity
                style={styles.markAllButton}
                onPress={handleMarkAllAsRead}
                disabled={markingRead}>
                {markingRead ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <>
                    <Image source={MarkAllIcon} style={styles.markAllIcon} />
                    <Text style={styles.markAllText}>Mark All</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {statsData.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={[styles.statValue, {color: stat.color}]}>
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}>
            {filterOptions.map(filter => (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.filterTab,
                  selectedFilter === filter.value && styles.activeFilterTab,
                ]}
                onPress={() => setSelectedFilter(filter.value)}>
                <Image
                  source={filter.icon}
                  style={[
                    styles.filterIcon,
                    {
                      tintColor:
                        selectedFilter === filter.value
                          ? colors.background
                          : colors.textSecondary,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === filter.value &&
                      styles.activeFilterTabText,
                  ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Notifications List */}
        <View style={styles.notificationsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedFilter === 'all'
                ? 'All Notifications'
                : `${
                    filterOptions.find(f => f.value === selectedFilter)?.label
                  } Notifications`}
            </Text>
            <Text style={styles.notificationCount}>
              {filteredNotifications.length} notifications
            </Text>
          </View>

          {filteredNotifications.length > 0 ? (
            <>
              {filteredNotifications.map((notification, index) => (
                <View key={notification.notification_id || index}>
                  {renderNotificationItem({item: notification})}
                </View>
              ))}

              {loadingMore && (
                <View style={styles.loadMoreContainer}>
                  <ActivityIndicator size="small" color={colors.splashGreen} />
                  <Text style={styles.loadMoreText}>Loading more...</Text>
                </View>
              )}

              {hasMore && !loadingMore && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={loadMoreNotifications}>
                  <Text style={styles.loadMoreButtonText}>Load More</Text>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Image source={NotificationIcon} style={styles.emptyIcon} />
              <Text style={styles.emptyText}>
                {selectedFilter === 'all'
                  ? 'No notifications yet'
                  : `No ${filterOptions
                      .find(f => f.value === selectedFilter)
                      ?.label.toLowerCase()} notifications`}
              </Text>
              <Text style={styles.emptySubtext}>
                {selectedFilter === 'all'
                  ? 'Notifications will appear here when you have updates'
                  : 'Try selecting a different filter or check back later'}
              </Text>
            </View>
          )}
        </View>
      </View>
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
    paddingBottom: 10,
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
    paddingTop: 40,
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
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.splashGreen,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  markAllIcon: {
    width: 16,
    height: 16,
    tintColor: colors.background,
    marginRight: 4,
  },
  markAllText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  filterSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  filterContainer: {
    paddingRight: 16,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  activeFilterTab: {
    backgroundColor: colors.splashGreen,
  },
  filterIcon: {
    width: 16,
    height: 16,
    marginRight: 6,
  },
  filterTabText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: colors.background,
  },
  notificationsSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  notificationCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  notificationCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    position: 'relative',
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: colors.splashGreen,
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
  notificationIconImage: {
    width: 20,
    height: 20,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: '600',
    color: colors.text,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationCategory: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  notificationPriority: {
    fontSize: 10,
    fontWeight: '600',
    backgroundColor: '#FF980020',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unreadIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.splashGreen,
  },
  markReadButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markReadIcon: {
    width: 12,
    height: 12,
    tintColor: colors.background,
  },
  loadMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  loadMoreText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  loadMoreButton: {
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  loadMoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.splashGreen,
  },
  emptyContainer: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationsScreen;
