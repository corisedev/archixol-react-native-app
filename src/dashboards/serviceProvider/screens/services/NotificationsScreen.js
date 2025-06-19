import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  ArrowLeft,
  MessageSquareText,
  CreditCard,
  ClipboardList,
  AlertTriangle,
  CheckCheck,
  Reply,
  Eye,
  ExternalLink,
  X,
  HelpCircle,
  Bell,
  BellOff,
} from 'lucide-react-native';
import {colors} from '../../../../utils/colors';
import {fonts, fontSizes} from '../../../../utils/fonts';
import {useNavigation} from '@react-navigation/native';

// Individual Notification Components
const MessageNotify = ({
  title,
  description,
  isRead = false,
  onReply,
  onMarkRead,
}) => {
  return (
    <View style={[styles.notificationCard, !isRead && styles.unreadCard]}>
      <View style={styles.notificationContent}>
        <View style={styles.iconContainer}>
          <MessageSquareText
            color={colors.splashGreen}
            size={20}
            style={[styles.icon, {backgroundColor: colors.splashGreen + '30'}]}
          />
        </View>
        <View style={styles.textContent}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            New message from {title}
          </Text>
          <Text style={styles.notificationDescription} numberOfLines={2}>
            {description}
          </Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.primaryButton} onPress={onReply}>
          <Reply color={colors.background} size={16} />
          <Text style={styles.primaryButtonText}>Reply</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onMarkRead}>
          <CheckCheck color={colors.text} size={16} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const PaymentNotify = ({
  title,
  description,
  isRead = false,
  onViewReceipt,
  onDismiss,
}) => {
  return (
    <View style={[styles.notificationCard, !isRead && styles.unreadCard]}>
      <View style={styles.notificationContent}>
        <View style={styles.iconContainer}>
          <CreditCard
            color="#FFD700"
            size={20}
            style={[styles.icon, {backgroundColor: '#FFD700' + '30'}]}
          />
        </View>
        <View style={styles.textContent}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            Payment {title}
          </Text>
          <Text style={styles.notificationDescription} numberOfLines={2}>
            {description}
          </Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.primaryButton} onPress={onViewReceipt}>
          <Eye color={colors.background} size={16} />
          <Text style={styles.primaryButtonText}>View Receipt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onDismiss}>
          <X color={colors.text} size={16} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ProjectNotify = ({
  title,
  description,
  isRead = false,
  onViewDetails,
  onDismiss,
}) => {
  return (
    <View style={[styles.notificationCard, !isRead && styles.unreadCard]}>
      <View style={styles.notificationContent}>
        <View style={styles.iconContainer}>
          <ClipboardList
            color="#3B82F6"
            size={20}
            style={[styles.icon, {backgroundColor: '#3B82F6' + '30'}]}
          />
        </View>
        <View style={styles.textContent}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.notificationDescription} numberOfLines={2}>
            {description}
          </Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.primaryButton} onPress={onViewDetails}>
          <ExternalLink color={colors.background} size={16} />
          <Text style={styles.primaryButtonText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onDismiss}>
          <X color={colors.text} size={16} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const SystemAlertNotify = ({
  title,
  description,
  isRead = false,
  onSubmitDocument,
  onHelp,
}) => {
  return (
    <View style={[styles.notificationCard, !isRead && styles.unreadCard]}>
      <View style={styles.notificationContent}>
        <View style={styles.iconContainer}>
          <AlertTriangle
            color="#EF4444"
            size={20}
            style={[styles.icon, {backgroundColor: '#EF4444' + '30'}]}
          />
        </View>
        <View style={styles.textContent}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.notificationDescription} numberOfLines={2}>
            {description}
          </Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onSubmitDocument}>
          <ExternalLink color={colors.background} size={16} />
          <Text style={styles.primaryButtonText}>Submit Document</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={onHelp}>
          <HelpCircle color={colors.text} size={16} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Main Notifications Screen
const NotificationsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread'
  const [hasNextPage, setHasNextPage] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const navigation = useNavigation();

  // Mock data for demonstration
  const mockNotifications = [
    {
      id: 1,
      type: 'message',
      title: 'John Doe',
      description:
        'Hey, I would like to discuss the project details with you. When are you available?',
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: 'John Doe',
    },
    {
      id: 2,
      type: 'payment',
      title: 'received',
      description: 'Payment of $500 has been received for Project ABC',
      isRead: true,
      createdAt: new Date().toISOString(),
      sender: 'System',
    },
    {
      id: 3,
      type: 'project',
      title: 'New Project Assignment',
      description:
        'You have been assigned to work on the Mobile App Development project',
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: 'Admin',
    },
    {
      id: 4,
      type: 'system',
      title: 'Document Verification Required',
      description:
        'Please submit your identity verification documents to complete your profile',
      isRead: false,
      createdAt: new Date().toISOString(),
      sender: 'System',
    },
    {
      id: 5,
      type: 'message',
      title: 'Sarah Wilson',
      description: 'Thank you for the excellent work on the website design!',
      isRead: true,
      createdAt: new Date().toISOString(),
      sender: 'Sarah Wilson',
    },
  ];

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (page = 1, isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
          setCurrentPage(1);
        } else if (page === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Mock pagination
        const itemsPerPage = 10;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedData = mockNotifications.slice(startIndex, endIndex);

        if (isRefresh || page === 1) {
          setNotifications(paginatedData);
          setCurrentPage(1);
        } else {
          setNotifications(prev => [...prev, ...paginatedData]);
        }

        setHasNextPage(endIndex < mockNotifications.length);
        setCurrentPage(page);
      } catch (error) {
        console.error('Failed to load notifications:', error);
        Alert.alert('Error', 'Unable to load notifications. Please try again.');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Filter notifications based on tab
  useEffect(() => {
    let filtered = notifications;

    if (activeTab === 'unread') {
      filtered = notifications.filter(notification => !notification.isRead);
    }

    setFilteredNotifications(filtered);
  }, [notifications, activeTab]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    await fetchNotifications(1, true);
  }, [fetchNotifications]);

  // Load more notifications
  const loadMore = useCallback(() => {
    if (hasNextPage && !loadingMore) {
      fetchNotifications(currentPage + 1);
    }
  }, [hasNextPage, loadingMore, currentPage, fetchNotifications]);

  // Handle tab change
  const handleTabChange = useCallback(tab => {
    setActiveTab(tab);
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        isRead: true,
      }));

      setNotifications(updatedNotifications);
      Alert.alert('Success', 'All notifications marked as read');
    } catch (error) {
      Alert.alert('Error', 'Failed to mark notifications as read');
    }
  }, [notifications]);

  // Notification action handlers
  const handleReply = notification => {
    console.log('Reply to:', notification);
    // Navigate to chat or compose message
  };

  const handleMarkRead = notification => {
    const updatedNotifications = notifications.map(n =>
      n.id === notification.id ? {...n, isRead: true} : n,
    );
    setNotifications(updatedNotifications);
  };

  const handleViewReceipt = notification => {
    console.log('View receipt:', notification);
    // Navigate to payment details
  };

  const handleViewDetails = notification => {
    console.log('View details:', notification);
    // Navigate to project details
  };

  const handleSubmitDocument = notification => {
    console.log('Submit document:', notification);
    // Navigate to document upload
  };

  const handleHelp = notification => {
    console.log('Help:', notification);
    // Navigate to help/support
  };

  const handleDismiss = notification => {
    const updatedNotifications = notifications.filter(
      n => n.id !== notification.id,
    );
    setNotifications(updatedNotifications);
  };

  // Render notification by type
  const renderNotificationByType = notification => {
    const commonProps = {
      title: notification.title,
      description: notification.description,
      isRead: notification.isRead,
    };

    switch (notification.type) {
      case 'message':
        return (
          <MessageNotify
            {...commonProps}
            onReply={() => handleReply(notification)}
            onMarkRead={() => handleMarkRead(notification)}
          />
        );
      case 'payment':
        return (
          <PaymentNotify
            {...commonProps}
            onViewReceipt={() => handleViewReceipt(notification)}
            onDismiss={() => handleDismiss(notification)}
          />
        );
      case 'project':
        return (
          <ProjectNotify
            {...commonProps}
            onViewDetails={() => handleViewDetails(notification)}
            onDismiss={() => handleDismiss(notification)}
          />
        );
      case 'system':
        return (
          <SystemAlertNotify
            {...commonProps}
            onSubmitDocument={() => handleSubmitDocument(notification)}
            onHelp={() => handleHelp(notification)}
          />
        );
      default:
        return (
          <SystemAlertNotify
            {...commonProps}
            onSubmitDocument={() => handleSubmitDocument(notification)}
            onHelp={() => handleHelp(notification)}
          />
        );
    }
  };

  // Render notification item
  const renderNotificationItem = ({item}) => (
    <View style={styles.notificationItem}>
      {renderNotificationByType(item)}
    </View>
  );

  // Get tab counts
  const getTabCounts = () => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const allCount = notifications.length;
    return {unread: unreadCount, all: allCount};
  };

  const tabCounts = getTabCounts();

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

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {filteredNotifications.length} notification
            {filteredNotifications.length !== 1 ? 's' : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={markAllAsRead}
          disabled={tabCounts.unread === 0}>
          <BellOff
            color={tabCounts.unread === 0 ? colors.textSecondary : colors.text}
            size={20}
          />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'all' && styles.activeTab]}
            onPress={() => handleTabChange('all')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'all' && styles.activeTabText,
              ]}>
              All ({tabCounts.all})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
            onPress={() => handleTabChange('unread')}>
            <Text
              style={[
                styles.tabText,
                activeTab === 'unread' && styles.activeTabText,
              ]}>
              Unread ({tabCounts.unread})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <View style={[styles.container, styles.centered]}>
          <Bell color={colors.textSecondary} size={48} />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'unread'
              ? "You're all caught up! No unread notifications."
              : "You don't have any notifications yet."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={() => (
            <View style={styles.footerContainer}>
              {loadingMore ? (
                <ActivityIndicator size="small" color={colors.splashGreen} />
              ) : hasNextPage ? (
                <Text style={styles.footerText}>Pull up to load more</Text>
              ) : (
                <Text style={styles.footerText}>No more notifications</Text>
              )}
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
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

  // List
  listContainer: {
    padding: 16,
  },
  notificationItem: {
    marginBottom: 12,
  },

  // Notification Card
  notificationCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  unreadCard: {
    borderWidth: 1,
    borderColor: colors.splashGreen,
  },
  notificationContent: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    padding: 8,
    borderRadius: 8,
  },
  textContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: fontSizes.base,
    fontFamily: fonts.semiBold,
    color: colors.text,
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  primaryButton: {
    backgroundColor: colors.splashGreen,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  primaryButtonText: {
    color: colors.background,
    fontSize: fontSizes.sm,
    fontFamily: fonts.medium,
  },
  secondaryButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
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

  // Footer
  footerContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    fontFamily: fonts.regular,
  },
});

export default NotificationsScreen;
