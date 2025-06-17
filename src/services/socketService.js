// services/socketService.js - Mobile Compatible Version
import AsyncStorage from '@react-native-async-storage/async-storage';
import {VITE_API_BASE_URL} from '@env'; // Make sure to add this to your .env

let socket = null;
let reconnectInterval = null;
let pingInterval = null;

// Event listeners storage
const eventListeners = new Map();

export const initializeSocket = async () => {
  try {
    const token = await AsyncStorage.getItem('ACCESS_TOKEN');
    const userString = await AsyncStorage.getItem('USER_DATA');

    if (!token || !userString) {
      console.warn('Cannot initialize socket - missing token or user data');
      return null;
    }

    const user = JSON.parse(userString);

    if (!user?.id) {
      console.warn('Cannot initialize socket - missing user ID');
      return null;
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log('Socket already connected');
      return socket;
    }

    // Close existing socket if any
    if (socket) {
      socket.close();
    }

    // Create WebSocket connection (since React Native doesn't support socket.io directly)
    const wsUrl = `${VITE_API_BASE_URL.replace(
      'http',
      'ws',
    )}/socket.io/?EIO=4&transport=websocket&token=${token}&userId=${user.id}`;

    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('Socket connected');
      clearInterval(reconnectInterval);

      // Start ping interval to keep connection alive
      startPingInterval();

      // Emit connection event
      emitEvent('connect', {userId: user.id});

      // Request status sync after connection
      setTimeout(() => {
        emitEvent('syncStatus', {});
      }, 1000);
    };

    socket.onmessage = event => {
      try {
        const data = JSON.parse(event.data);
        console.log('Socket message received:', data);

        // Handle different message types
        if (data.type && eventListeners.has(data.type)) {
          const listeners = eventListeners.get(data.type);
          listeners.forEach(callback => callback(data.payload || data));
        }
      } catch (error) {
        console.error('Error parsing socket message:', error);
      }
    };

    socket.onerror = error => {
      console.error('Socket error:', error);
    };

    socket.onclose = event => {
      console.log('Socket disconnected:', event.code, event.reason);
      clearInterval(pingInterval);

      // Attempt to reconnect
      if (event.code !== 1000) {
        // Not a normal closure
        scheduleReconnect();
      }
    };

    return socket;
  } catch (error) {
    console.error('Failed to initialize socket:', error);
    return null;
  }
};

const startPingInterval = () => {
  clearInterval(pingInterval);
  pingInterval = setInterval(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      emitEvent('ping', {timestamp: Date.now()});
    }
  }, 30000); // Ping every 30 seconds
};

const scheduleReconnect = () => {
  clearInterval(reconnectInterval);
  reconnectInterval = setInterval(() => {
    console.log('Attempting to reconnect...');
    initializeSocket();
  }, 5000); // Reconnect every 5 seconds
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    clearInterval(reconnectInterval);
    clearInterval(pingInterval);
    socket.close(1000, 'Manual disconnect');
    socket = null;
    eventListeners.clear();
    console.log('Socket disconnected manually');
  }
};

// Event listener management
export const addEventListener = (eventType, callback) => {
  if (!eventListeners.has(eventType)) {
    eventListeners.set(eventType, []);
  }
  eventListeners.get(eventType).push(callback);
};

export const removeEventListener = (eventType, callback) => {
  if (eventListeners.has(eventType)) {
    const listeners = eventListeners.get(eventType);
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
};

export const removeAllEventListeners = eventType => {
  if (eventType) {
    eventListeners.delete(eventType);
  } else {
    eventListeners.clear();
  }
};

// Emit events
const emitEvent = (eventType, data) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    const message = JSON.stringify({
      type: eventType,
      payload: data,
      timestamp: Date.now(),
    });
    socket.send(message);
    return true;
  }
  console.warn(`Cannot emit ${eventType} - socket not connected`);
  return false;
};

// Helper functions for chat functionality
export const joinConversation = conversationId => {
  console.log(`Joining conversation: ${conversationId}`);
  return emitEvent('joinConversation', {conversation_id: conversationId});
};

export const emitTyping = (conversationId, isTyping) => {
  console.log(
    `Emitting typing status: ${isTyping} for conversation: ${conversationId}`,
  );
  return emitEvent('typing', {
    conversation_id: conversationId,
    is_typing: isTyping,
  });
};

export const markMessagesAsRead = conversationId => {
  console.log(`Marking messages as read for conversation: ${conversationId}`);
  return emitEvent('markRead', {conversation_id: conversationId});
};

export const setViewingConversation = (conversationId, isViewing) => {
  console.log(
    `Setting viewing status: ${isViewing} for conversation: ${conversationId}`,
  );
  return emitEvent('viewingConversation', {
    conversation_id: conversationId,
    is_viewing: isViewing,
  });
};

export const syncUserStatus = () => {
  console.log('Requesting status sync...');
  return emitEvent('syncStatus', {});
};

export const getUserStatus = userId => {
  console.log(`Requesting status for user: ${userId}`);
  return emitEvent('getUserStatus', {user_id: userId});
};

// Connection status
export const isConnected = () => {
  return socket && socket.readyState === WebSocket.OPEN;
};
