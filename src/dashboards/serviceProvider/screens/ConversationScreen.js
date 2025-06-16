import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { colors } from '../../../utils/colors';
import { useNavigation, useRoute } from '@react-navigation/native';

const ConversationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { conversation } = route.params || {};

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello Ahmed, I'm interested in hiring you for the plumbing repair job. When would you be available to start? I need this fixed as soon as possible.",
      sender: 'client',
      time: '10:30 AM',
      isRead: true,
    },
    {
      id: '2',
      text: "Hi Ali, thanks for reaching out! I'm available starting tomorrow morning. I could come by around 9 AM if that works for you?",
      sender: 'me',
      time: '10:35 AM',
      isRead: true,
    },
    {
      id: '3',
      text: "That sounds perfect! I'll be home all day tomorrow. Can you let me know what tools and materials you'll need? I can pick up anything from the hardware store today.",
      sender: 'client',
      time: '10:36 AM',
      isRead: true,
    },
    {
      id: '4',
      text: "I'll bring all the necessary tools with me. As for materials, I'll need to see the exact issue first.",
      sender: 'me',
      time: '10:37 AM',
      isRead: true,
    },
  ]);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: String(messages.length + 1),
        text: message,
        sender: 'me',
        time: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        isRead: false,
      };

      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const renderMessage = (msg) => {
    const isMyMessage = msg.sender === 'me';

    return (
      <View
        key={msg.id}
        style={[
          styles.messageWrapper,
          isMyMessage ? styles.myMessageWrapper : styles.theirMessageWrapper,
        ]}>
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myMessage : styles.theirMessage,
          ]}>
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : styles.theirMessageText,
            ]}>
            {msg.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMyMessage ? styles.myMessageTime : styles.theirMessageTime,
            ]}>
            {msg.time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* If needed, adjust status bar on Android */}
      {Platform.OS === 'android' && (
        <View style={{ height: StatusBar.currentHeight }} />
      )}
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>👨</Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {conversation?.senderName || 'Ali Hassan'}
                </Text>
                <Text style={styles.userStatus}>Online</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.menuButton}>
            <Text style={styles.menuIcon}>⋯</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.jobInfoBar}>
          <Text style={styles.jobTitle}>
            {conversation?.jobTitle || 'Bathroom Plumbing Repair'}
          </Text>
          <View style={styles.jobMeta}>
            <Text style={styles.location}>📍 DHA Phase 5, Lahore</Text>
            <Text style={styles.budget}>Rs 10,000</Text>
          </View>
          <Text style={styles.todayLabel}>Today</Text>
        </View>

        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}>
          {messages.map(renderMessage)}
        </ScrollView>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachButton}>
              <Text style={styles.attachIcon}>📎</Text>
            </TouchableOpacity>

            <TextInput
              style={styles.messageInput}
              placeholder="Type a message..."
              value={message}
              onChangeText={setMessage}
              placeholderTextColor={colors.textSecondary}
              multiline
              maxLength={1000}
            />

            <TouchableOpacity
              style={[styles.sendButton, message.trim() && styles.sendButtonActive]}
              onPress={sendMessage}
              disabled={!message.trim()}>
              <Text style={styles.sendIcon}>✈️</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  backArrow: {
    fontSize: 24,
    color: colors.text,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  userStatus: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 20,
    color: colors.text,
  },
  jobInfoBar: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  jobTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  jobMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  budget: {
    fontSize: 13,
    color: colors.splashGreen,
    fontWeight: '500',
  },
  todayLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  myMessageWrapper: {
    alignItems: 'flex-end',
  },
  theirMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  myMessage: {
    backgroundColor: '#E8F5E9',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    backgroundColor: colors.background,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: colors.text,
  },
  theirMessageText: {
    color: colors.text,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  myMessageTime: {
    color: '#666',
  },
  theirMessageTime: {
    color: colors.textSecondary,
  },
  inputContainer: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  attachIcon: {
    fontSize: 20,
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
    marginLeft: 8,
    opacity: 0.5,
  },
  sendButtonActive: {
    opacity: 1,
  },
  sendIcon: {
    fontSize: 20,
  },
});

export default ConversationScreen;
