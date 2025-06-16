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
  FlatList,
  Image,
} from 'react-native';
import {colors} from '../../../utils/colors';

// Sample messages data (replace with actual API calls)
const sampleMessages = [
  {
    id: '1',
    sender: 'Ahmed Khan',
    subject: 'Order #ORD-2458 Payment Confirmation',
    preview:
      'Hi, I have completed the payment for order #ORD-2458. Please confirm receipt and processing status.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: false,
    type: 'order',
    avatar: null,
    orderId: 'ORD-2458',
  },
  {
    id: '2',
    sender: 'Sarah Ahmed',
    subject: 'Product Inquiry - Safety Gear',
    preview:
      'Hello, I am interested in your safety gear products. Could you please provide more details about bulk pricing?',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    isRead: true,
    type: 'inquiry',
    avatar: null,
  },
  {
    id: '3',
    sender: 'Mohammad Ali',
    subject: 'Return Request - Order #ORD-2456',
    preview:
      'I need to return some items from my recent order. The products received do not match the specifications.',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    isRead: false,
    type: 'return',
    avatar: null,
    orderId: 'ORD-2456',
  },
  {
    id: '4',
    sender: 'Fatima Sheikh',
    subject: 'Shipping Update Request',
    preview:
      'Could you please provide an update on the shipping status of my order? It has been 3 days since dispatch.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    isRead: true,
    type: 'shipping',
    avatar: null,
  },
  {
    id: '5',
    sender: 'Hassan Raza',
    subject: 'Bulk Order Quotation',
    preview:
      'We are looking to place a bulk order for electrical components. Please provide your best quotation.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    isRead: false,
    type: 'quotation',
    avatar: null,
  },
];

const MessagesScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [messages, setMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeData, setComposeData] = useState({
    recipient: '',
    subject: '',
    message: '',
  });

  // Filter options
  const filterOptions = ['All', 'Unread', 'Orders', 'Inquiries', 'Returns'];

  // Stats data
  const [statsData, setStatsData] = useState({
    totalMessages: 0,
    unreadMessages: 0,
    todayMessages: 0,
    responseRate: 0,
  });

  // Load messages
  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMessages(sampleMessages);

      // Calculate stats
      const total = sampleMessages.length;
      const unread = sampleMessages.filter(m => !m.isRead).length;
      const today = sampleMessages.filter(m => {
        const messageDate = new Date(m.timestamp);
        const todayDate = new Date();
        return messageDate.toDateString() === todayDate.toDateString();
      }).length;

      setStatsData({
        totalMessages: total,
        unreadMessages: unread,
        todayMessages: today,
        responseRate: 85, // Sample response rate
      });
    } catch (error) {
      console.error('Failed to load messages:', error);
      Alert.alert('Error', 'Unable to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMessages();
    setRefreshing(false);
  }, [loadMessages]);

  // Filter messages
  const getFilteredMessages = () => {
    let filtered = messages;

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        message =>
          message.sender.toLowerCase().includes(searchLower) ||
          message.subject.toLowerCase().includes(searchLower) ||
          message.preview.toLowerCase().includes(searchLower),
      );
    }

    // Apply category filter
    switch (selectedFilter) {
      case 'Unread':
        filtered = filtered.filter(m => !m.isRead);
        break;
      case 'Orders':
        filtered = filtered.filter(m => m.type === 'order');
        break;
      case 'Inquiries':
        filtered = filtered.filter(m => m.type === 'inquiry');
        break;
      case 'Returns':
        filtered = filtered.filter(m => m.type === 'return');
        break;
      default:
        break;
    }

    return filtered;
  };

  // Get message type color
  const getMessageTypeColor = type => {
    switch (type) {
      case 'order':
        return '#4CAF50';
      case 'inquiry':
        return '#2196F3';
      case 'return':
        return '#FF9800';
      case 'shipping':
        return '#9C27B0';
      case 'quotation':
        return '#00BCD4';
      default:
        return '#757575';
    }
  };

  // Format timestamp
  const formatTimestamp = timestamp => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - messageTime) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 24 * 60) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / (24 * 60))}d ago`;
    }
  };

  // Mark message as read
  const markAsRead = messageId => {
    setMessages(prev =>
      prev.map(msg => (msg.id === messageId ? {...msg, isRead: true} : msg)),
    );
  };

  // View message details
  const viewMessage = message => {
    setSelectedMessage(message);
    setShowMessageModal(true);
    if (!message.isRead) {
      markAsRead(message.id);
    }
  };

  // Send message
  const sendMessage = async () => {
    try {
      if (
        !composeData.recipient ||
        !composeData.subject ||
        !composeData.message
      ) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      Alert.alert('Success', 'Message sent successfully!');
      setShowComposeModal(false);
      setComposeData({recipient: '', subject: '', message: ''});
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  // Render stats cards
  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{statsData.totalMessages}</Text>
          <Text style={styles.statLabel}>Total Messages</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, {color: '#FF9800'}]}>
            {statsData.unreadMessages}
          </Text>
          <Text style={styles.statLabel}>Unread</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{statsData.todayMessages}</Text>
          <Text style={styles.statLabel}>Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{statsData.responseRate}%</Text>
          <Text style={styles.statLabel}>Response Rate</Text>
        </View>
      </View>
    </View>
  );

  // Render message item
  const renderMessageItem = ({item: message}) => (
    <TouchableOpacity
      style={[styles.messageCard, !message.isRead && styles.unreadMessage]}
      onPress={() => viewMessage(message)}
      activeOpacity={0.7}>
      <View style={styles.messageHeader}>
        <View style={styles.messageInfo}>
          <View style={styles.avatarContainer}>
            {message.avatar ? (
              <Image source={{uri: message.avatar}} style={styles.avatar} />
            ) : (
              <View style={styles.defaultAvatar}>
                <Text style={styles.avatarText}>
                  {message.sender.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.messageDetails}>
            <View style={styles.messageTopRow}>
              <Text
                style={[styles.senderName, !message.isRead && styles.boldText]}>
                {message.sender}
              </Text>
              <Text style={styles.timestamp}>
                {formatTimestamp(message.timestamp)}
              </Text>
            </View>
            <Text
              style={[
                styles.messageSubject,
                !message.isRead && styles.boldText,
              ]}
              numberOfLines={1}>
              {message.subject}
            </Text>
            <Text style={styles.messagePreview} numberOfLines={2}>
              {message.preview}
            </Text>
            <View style={styles.messageFooter}>
              <View
                style={[
                  styles.messageTypeBadge,
                  {backgroundColor: getMessageTypeColor(message.type) + '20'},
                ]}>
                <Text
                  style={[
                    styles.messageTypeText,
                    {color: getMessageTypeColor(message.type)},
                  ]}>
                  {message.type.charAt(0).toUpperCase() + message.type.slice(1)}
                </Text>
              </View>
              {!message.isRead && <View style={styles.unreadDot} />}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render message modal
  const renderMessageModal = () => {
    if (!selectedMessage) return null;

    return (
      <Modal
        visible={showMessageModal}
        animationType="slide"
        presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowMessageModal(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Message Details</Text>
            <TouchableOpacity style={styles.replyButton}>
              <Text style={styles.replyButtonText}>Reply</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.messageModalHeader}>
              <View style={styles.avatarContainer}>
                <View style={styles.defaultAvatar}>
                  <Text style={styles.avatarText}>
                    {selectedMessage.sender.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.messageModalInfo}>
                <Text style={styles.modalSenderName}>
                  {selectedMessage.sender}
                </Text>
                <Text style={styles.modalSubject}>
                  {selectedMessage.subject}
                </Text>
                <Text style={styles.modalTimestamp}>
                  {selectedMessage.timestamp.toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.messageBody}>
              <Text style={styles.messageBodyText}>
                {selectedMessage.preview}
              </Text>
            </View>

            {selectedMessage.orderId && (
              <View style={styles.orderInfo}>
                <Text style={styles.orderInfoTitle}>Related Order</Text>
                <TouchableOpacity style={styles.orderLink}>
                  <Text style={styles.orderLinkText}>
                    {selectedMessage.orderId}
                  </Text>
                  <Text style={styles.orderLinkArrow}>›</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    );
  };

  // Render compose modal
  const renderComposeModal = () => (
    <Modal
      visible={showComposeModal}
      animationType="slide"
      presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setShowComposeModal(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>New Message</Text>
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.composeForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>To</Text>
              <TextInput
                style={styles.textInput}
                value={composeData.recipient}
                onChangeText={text =>
                  setComposeData({...composeData, recipient: text})
                }
                placeholder="Enter recipient email"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                style={styles.textInput}
                value={composeData.subject}
                onChangeText={text =>
                  setComposeData({...composeData, subject: text})
                }
                placeholder="Enter subject"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Message</Text>
              <TextInput
                style={[styles.textInput, styles.messageInput]}
                value={composeData.message}
                onChangeText={text =>
                  setComposeData({...composeData, message: text})
                }
                placeholder="Type your message..."
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity
            style={styles.composeButton}
            onPress={() => setShowComposeModal(true)}>
            <Text style={styles.composeButtonText}>+ New Message</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>Customer communications</Text>
      </View>

      {/* Stats Cards */}
      {renderStatsCards()}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}>
        {filterOptions.map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && styles.activeFilterTab,
            ]}
            onPress={() => setSelectedFilter(filter)}>
            <Text
              style={[
                styles.filterTabText,
                selectedFilter === filter && styles.activeFilterTabText,
              ]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages List */}
      <FlatList
        data={getFilteredMessages()}
        renderItem={renderMessageItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'No messages match your search'
                : 'No messages yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Try a different search term'
                : 'Customer messages will appear here'}
            </Text>
          </View>
        )}
      />

      {/* Message Details Modal */}
      {renderMessageModal()}

      {/* Compose Modal */}
      {renderComposeModal()}
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
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.background,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  composeButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  composeButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  statsContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.background,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
  },
  activeFilterTab: {
    backgroundColor: '#4CAF50',
  },
  filterTabText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: colors.background,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  unreadMessage: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  messageInfo: {
    flex: 1,
    flexDirection: 'row',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  messageDetails: {
    flex: 1,
  },
  messageTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  messageSubject: {
    fontSize: 15,
    color: colors.text,
    marginBottom: 6,
  },
  messagePreview: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  messageTypeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  boldText: {
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
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
  replyButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  replyButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messageModalHeader: {
    flexDirection: 'row',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  messageModalInfo: {
    flex: 1,
    marginLeft: 12,
  },
  modalSenderName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  modalSubject: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  modalTimestamp: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  messageBody: {
    paddingVertical: 20,
  },
  messageBodyText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  orderInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  orderInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  orderLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderLinkText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  orderLinkArrow: {
    fontSize: 18,
    color: '#4CAF50',
  },
  // Compose Modal
  cancelButton: {
    minWidth: 60,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  sendButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  composeForm: {
    paddingVertical: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },
});

export default MessagesScreen;
