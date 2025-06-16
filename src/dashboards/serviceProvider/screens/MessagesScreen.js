import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {useNavigation} from '@react-navigation/native';

const MessagesScreen = () => {
  const navigation = useNavigation();
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filters = ['All', 'Unread', 'Clients', 'Job Related'];

  const allMessages = [
    {
      id: '1',
      senderName: 'Ali Hassan',
      avatar: '👨',
      preview:
        "Hello Ahmed, I'm interested in hiring you for the plumbing repair job. When would you be available to start? I need this fixed as soon as possible.",
      time: '2h ago',
      jobTitle: 'Bathroom Plumbing Repair',
      status: 'New',
      isUnread: true,
      conversationCount: 0,
      messageType: 'job',
    },
    {
      id: '2',
      senderName: 'Samia Khan',
      avatar: '👩',
      preview:
        "Thank you for completing the job so promptly. I've left a 5-star review on your profile. Will definitely recommend you to friends and family for any future work.",
      time: 'Yesterday',
      jobTitle: 'Kitchen Sink Installation',
      status: null,
      isUnread: false,
      conversationCount: 3,
      messageType: 'job',
    },
    {
      id: '3',
      senderName: 'Zain Malik',
      avatar: '👨',
      preview:
        'I reviewed your application for the bathroom renovation project. Your experience looks great, but I need some more information about your availability and specific expertise with modern fixtures.',
      time: '2 days ago',
      jobTitle: 'Bathroom Renovation',
      status: 'Pending',
      isUnread: false,
      conversationCount: 0,
      messageType: 'job',
    },
    {
      id: '4',
      senderName: 'Farah Ahmed',
      avatar: '👩',
      preview:
        "Hi Ahmed, I wanted to follow up on our previous conversation about the pipe replacement. Have you had a chance to check your schedule? I'd like to book you for next week.",
      time: '1 week ago',
      jobTitle: 'Pipe Replacement',
      status: null,
      isUnread: false,
      conversationCount: 5,
      messageType: 'job',
    },
    {
      id: '5',
      senderName: 'Bilal Khan',
      avatar: '👨',
      preview:
        'I reviewed your application for the bathroom renovation project. Your experience looks great, but I need some more information about your availability and specific expertise with modern fixtures.',
      time: '2 week ago',
      jobTitle: 'Bathroom Renovation',
      status: 'Pending',
      isUnread: false,
      conversationCount: 0,
      messageType: 'job',
    },
  ];

  // Filter messages based on active filter and search query
  const getFilteredMessages = () => {
    let filtered = allMessages;

    // Apply filter
    switch (activeFilter) {
      case 'Unread':
        filtered = filtered.filter(msg => msg.isUnread);
        break;
      case 'Clients':
        filtered = filtered.filter(
          msg => msg.messageType === 'client' || msg.conversationCount > 0,
        );
        break;
      case 'Job Related':
        filtered = filtered.filter(msg => msg.messageType === 'job');
        break;
      default:
        // 'All' - no filtering
        break;
    }

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(
        msg =>
          msg.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
          msg.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return filtered;
  };

  const renderMessage = ({item}) => (
    <TouchableOpacity
      style={styles.messageCard}
      onPress={() => {
        navigation.navigate('Conversation', {
          conversation: item,
        });
      }}>
      {item.isUnread && <View style={styles.unreadIndicator} />}

      <View style={styles.avatarContainer}>
        <Text style={styles.avatarEmoji}>{item.avatar}</Text>
      </View>

      <View style={styles.messageContent}>
        <View style={styles.messageHeader}>
          <Text style={styles.senderName}>{item.senderName}</Text>
          <Text style={styles.messageTime}>{item.time}</Text>
        </View>

        <Text style={styles.messagePreview} numberOfLines={2}>
          {item.preview}
        </Text>

        <View style={styles.messageMeta}>
          <View style={styles.jobInfo}>
            <Text style={styles.jobIcon}>💼</Text>
            <Text style={styles.jobTitle}>{item.jobTitle}</Text>
          </View>

          {item.status && (
            <View
              style={[
                styles.statusBadge,
                item.status === 'New' && styles.statusNew,
                item.status === 'Pending' && styles.statusPending,
              ]}>
              <Text
                style={[
                  styles.statusText,
                  item.status === 'New' && styles.statusTextNew,
                  item.status === 'Pending' && styles.statusTextPending,
                ]}>
                {item.status}
              </Text>
            </View>
          )}

          {!item.status && item.conversationCount > 0 && (
            <View style={styles.conversationBadge}>
              <Text style={styles.conversationCount}>
                {item.conversationCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const filteredMessages = getFilteredMessages();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Messages</Text>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textSecondary}
        />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}>
          {filters.map(filter => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                activeFilter === filter && styles.filterTabActive,
              ]}
              onPress={() => setActiveFilter(filter)}>
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter && styles.filterTextActive,
                ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredMessages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>No messages found</Text>
            <Text style={styles.emptyMessage}>
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'Your messages will appear here'}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    margin: 16,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  filterContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: colors.background,
  },
  filterContent: {
    paddingHorizontal: 16,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 20,
    position: 'relative',
  },
  filterTabActive: {
    borderBottomWidth: 3,
    borderBottomColor: colors.splashGreen,
  },
  filterText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.splashGreen,
    fontWeight: '500',
  },
  messagesList: {
    paddingVertical: 16,
  },
  messageCard: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 0,
    position: 'relative',
  },
  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: [{translateY: -3}],
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.splashGreen,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  messageContent: {
    flex: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  messageTime: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  messagePreview: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  messageMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  jobIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  jobTitle: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusNew: {
    backgroundColor: '#E8F5E9',
  },
  statusPending: {
    backgroundColor: '#FFF8E1',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTextNew: {
    color: colors.splashGreen,
  },
  statusTextPending: {
    color: '#FFC107',
  },
  conversationBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.splashGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationCount: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default MessagesScreen;
