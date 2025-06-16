import React, {useState, useEffect, useCallback, useRef} from 'react';
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
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {colors} from '../../../utils/colors';
import {
  getConversations,
  getConversationMessages,
  sendMessage,
} from '../../../api/client';

// Import your icons here
import SearchIcon from '../../../assets/images/icons/company.png';
import SendIcon from '../../../assets/images/icons/company.png';
import AttachIcon from '../../../assets/images/icons/company.png';
import BackIcon from '../../../assets/images/icons/company.png';
import OnlineIcon from '../../../assets/images/icons/company.png';
import MessageIcon from '../../../assets/images/icons/company.png';

const MessagesScreen = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [currentView, setCurrentView] = useState('conversations'); // 'conversations' or 'chat'

  const flatListRef = useRef(null);
  const messagesRef = useRef(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      const response = await getConversations({limit: 50});
      console.log('Conversations API Response:', response);
      setConversations(response.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      Alert.alert('Error', 'Unable to load conversations. Please try again.');
    }
  }, []);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async conversationId => {
    try {
      setLoadingMessages(true);
      const response = await getConversationMessages(conversationId, {
        limit: 100,
      });
      console.log('Messages API Response:', response);
      setMessages(response.messages || []);

      // Scroll to bottom after loading messages
      setTimeout(() => {
        messagesRef.current?.scrollToEnd({animated: true});
      }, 100);
    } catch (error) {
      console.error('Failed to load messages:', error);
      Alert.alert('Error', 'Unable to load messages. Please try again.');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchConversations();
      setLoading(false);
    };
    loadData();
  }, [fetchConversations]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (currentView === 'conversations') {
      await fetchConversations();
    } else if (selectedConversation) {
      await fetchMessages(selectedConversation.conversation_id);
    }
    setRefreshing(false);
  }, [fetchConversations, fetchMessages, selectedConversation, currentView]);

  // Filter conversations based on search
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      conversation.participant_name?.toLowerCase().includes(searchLower) ||
      conversation.last_message?.toLowerCase().includes(searchLower) ||
      conversation.project_title?.toLowerCase().includes(searchLower)
    );
  });

  // Handle conversation selection
  const handleConversationSelect = conversation => {
    setSelectedConversation(conversation);
    setCurrentView('chat');
    fetchMessages(conversation.conversation_id);
  };

  // Handle back to conversations
  const handleBackToConversations = () => {
    setCurrentView('conversations');
    setSelectedConversation(null);
    setMessages([]);
  };

  // Send message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    try {
      setSendingMessage(true);
      const messageToSend = messageText.trim();
      setMessageText('');

      // Optimistically add message to UI
      const tempMessage = {
        message_id: Date.now().toString(),
        message: messageToSend,
        sender_type: 'client',
        created_at: new Date().toISOString(),
        is_temp: true,
      };
      setMessages(prev => [...prev, tempMessage]);

      // Scroll to bottom
      setTimeout(() => {
        messagesRef.current?.scrollToEnd({animated: true});
      }, 100);

      const response = await sendMessage({
        conversation_id: selectedConversation.conversation_id,
        message: messageToSend,
      });

      if (response) {
        // Remove temp message and add real message
        setMessages(prev =>
          prev.filter(msg => msg.message_id !== tempMessage.message_id),
        );
        await fetchMessages(selectedConversation.conversation_id);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => !msg.is_temp));
    } finally {
      setSendingMessage(false);
    }
  };

  // Format time
  const formatTime = dateString => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', {weekday: 'short'});
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // Render conversation item
  const renderConversationItem = ({item: conversation}) => {
    const isUnread = conversation.unread_count > 0;

    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => handleConversationSelect(conversation)}
        activeOpacity={0.7}>
        <View style={styles.conversationHeader}>
          <View style={styles.avatarContainer}>
            {conversation.participant_avatar ? (
              <Image
                source={{uri: conversation.participant_avatar}}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.placeholderAvatar}>
                <Text style={styles.avatarText}>
                  {(conversation.participant_name?.[0] || 'U').toUpperCase()}
                </Text>
              </View>
            )}
            {conversation.is_online && (
              <View style={styles.onlineIndicator}>
                <Image source={OnlineIcon} style={styles.onlineIcon} />
              </View>
            )}
          </View>

          <View style={styles.conversationInfo}>
            <View style={styles.conversationMeta}>
              <Text
                style={[styles.participantName, isUnread && styles.unreadText]}>
                {conversation.participant_name || 'Unknown User'}
              </Text>
              <Text style={styles.messageTime}>
                {formatTime(conversation.last_message_time)}
              </Text>
            </View>

            <View style={styles.messagePreview}>
              <Text
                style={[styles.lastMessage, isUnread && styles.unreadMessage]}
                numberOfLines={1}>
                {conversation.last_message || 'No messages yet'}
              </Text>
              {isUnread && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>
                    {conversation.unread_count > 99
                      ? '99+'
                      : conversation.unread_count}
                  </Text>
                </View>
              )}
            </View>

            {conversation.project_title && (
              <Text style={styles.projectTitle} numberOfLines={1}>
                Project: {conversation.project_title}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render message item
  const renderMessageItem = ({item: message}) => {
    const isMyMessage = message.sender_type === 'client';
    const isTemp = message.is_temp;

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessage : styles.otherMessage,
        ]}>
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessageBubble : styles.otherMessageBubble,
            isTemp && styles.tempMessage,
          ]}>
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.otherMessageText,
            ]}>
            {message.message}
          </Text>
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : styles.otherMessageTime,
              ]}>
              {formatTime(message.created_at)}
            </Text>
            {isTemp && (
              <ActivityIndicator
                size="small"
                color={colors.background}
                style={styles.sendingIndicator}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  // Render conversations view
  const renderConversationsView = () => (
    <View style={styles.conversationsContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSubtitle}>
            {conversations.length} conversations
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Image
            source={SearchIcon}
            style={styles.searchIcon}
            resizeMode="contain"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      {/* Conversations List */}
      <View style={styles.conversationsSection}>
        {filteredConversations.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={filteredConversations}
            renderItem={renderConversationItem}
            keyExtractor={item => item.conversation_id}
            contentContainerStyle={styles.conversationsList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Image source={MessageIcon} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'No conversations match your search'
                : 'No conversations yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? 'Try a different search term'
                : 'Start a conversation by contacting a service provider'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  // Render chat view
  const renderChatView = () => (
    <KeyboardAvoidingView
      style={styles.chatContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackToConversations}>
          <Image source={BackIcon} style={styles.backIcon} />
        </TouchableOpacity>

        <View style={styles.chatHeaderInfo}>
          <View style={styles.chatAvatarContainer}>
            {selectedConversation?.participant_avatar ? (
              <Image
                source={{uri: selectedConversation.participant_avatar}}
                style={styles.chatAvatar}
              />
            ) : (
              <View style={styles.chatPlaceholderAvatar}>
                <Text style={styles.chatAvatarText}>
                  {(
                    selectedConversation?.participant_name?.[0] || 'U'
                  ).toUpperCase()}
                </Text>
              </View>
            )}
            {selectedConversation?.is_online && (
              <View style={styles.chatOnlineIndicator}>
                <Image source={OnlineIcon} style={styles.chatOnlineIcon} />
              </View>
            )}
          </View>

          <View style={styles.chatUserInfo}>
            <Text style={styles.chatUserName}>
              {selectedConversation?.participant_name || 'Unknown User'}
            </Text>
            <Text style={styles.chatUserStatus}>
              {selectedConversation?.is_online ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>

        <View style={styles.chatHeaderActions}>
          {/* Add any header actions here */}
        </View>
      </View>

      {/* Messages List */}
      <View style={styles.messagesContainer}>
        {loadingMessages ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.splashGreen} />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : messages.length > 0 ? (
          <FlatList
            ref={messagesRef}
            data={messages}
            renderItem={renderMessageItem}
            keyExtractor={item => item.message_id}
            contentContainerStyle={styles.messagesList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() =>
              messagesRef.current?.scrollToEnd({animated: true})
            }
          />
        ) : (
          <View style={styles.emptyMessages}>
            <Image source={MessageIcon} style={styles.emptyMessagesIcon} />
            <Text style={styles.emptyMessagesText}>No messages yet</Text>
            <Text style={styles.emptyMessagesSubtext}>
              Start the conversation!
            </Text>
          </View>
        )}
      </View>

      {/* Message Input */}
      <View style={styles.messageInputContainer}>
        <View style={styles.messageInputWrapper}>
          <TouchableOpacity style={styles.attachButton}>
            <Image source={AttachIcon} style={styles.attachIcon} />
          </TouchableOpacity>

          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
            placeholderTextColor={colors.textSecondary}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sendingMessage) &&
                styles.sendButtonDisabled,
            ]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sendingMessage}>
            {sendingMessage ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Image source={SendIcon} style={styles.sendIcon} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.splashGreen} />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {currentView === 'conversations'
        ? renderConversationsView()
        : renderChatView()}
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

  // Conversations View Styles
  conversationsContainer: {
    flex: 1,
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
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  conversationsSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  conversationsList: {
    paddingVertical: 8,
  },
  conversationCard: {
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  placeholderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.background,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIcon: {
    width: 10,
    height: 10,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  unreadText: {
    color: colors.splashGreen,
  },
  messageTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  messagePreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
  },
  unreadMessage: {
    color: colors.text,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: colors.splashGreen,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.background,
  },
  projectTitle: {
    fontSize: 12,
    color: colors.primary,
    fontStyle: 'italic',
  },

  // Chat View Styles
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 40,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  chatHeaderInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  chatPlaceholderAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.background,
  },
  chatOnlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatOnlineIcon: {
    width: 8,
    height: 8,
  },
  chatUserInfo: {
    flex: 1,
  },
  chatUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  chatUserStatus: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  chatHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageContainer: {
    marginVertical: 4,
  },
  myMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myMessageBubble: {
    backgroundColor: colors.splashGreen,
    borderBottomRightRadius: 8,
  },
  otherMessageBubble: {
    backgroundColor: colors.background,
    borderBottomLeftRadius: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tempMessage: {
    opacity: 0.7,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: colors.background,
  },
  otherMessageText: {
    color: colors.text,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  myMessageTime: {
    color: colors.background + '80',
  },
  otherMessageTime: {
    color: colors.textSecondary,
  },
  sendingIndicator: {
    marginLeft: 4,
  },
  messageInputContainer: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  messageInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8F9FA',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  attachButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  attachIcon: {
    width: 16,
    height: 16,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.splashGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  sendIcon: {
    width: 16,
    height: 16,
    tintColor: colors.background,
  },

  // Empty States
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyMessagesIcon: {
    width: 48,
    height: 48,
    marginBottom: 12,
    opacity: 0.5,
  },
  emptyMessagesText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptyMessagesSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default MessagesScreen;
