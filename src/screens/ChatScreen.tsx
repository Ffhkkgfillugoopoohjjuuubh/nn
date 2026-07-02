import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Clipboard,
} from 'react-native';
import { COLORS } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import { useRealtimeMessages } from '../hooks/useRealtimeMessages';
import {
  sendMessage,
  acknowledgeDelivery,
  markMessagesReadOnServer,
  deleteForEveryone,
  editMessageOnServer,
} from '../services/messageService';
import {
  getMessagesForChat,
  insertMessage,
  upsertChat,
  markChatRead,
  updateMessageContent,
  softDeleteMessageForMe,
  editMessageLocal,
} from '../services/localDatabase';
import { supabase } from '../services/supabaseClient';
import ChatBubble from '../components/ChatBubble';
import ChatInput from '../components/ChatInput';
import MessageActionsSheet from '../components/MessageActionsSheet';
import { LocalMessage, Message, Profile } from '../types';

interface ChatScreenProps {
  navigation: any;
  route: any;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ navigation, route }) => {
  const { contactId, contactName, contactPhone } = route.params || {};
  const { user } = useAuth();
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [recipientProfile, setRecipientProfile] = useState<Profile | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const [selectedMessage, setSelectedMessage] = useState<LocalMessage | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [editingMessage, setEditingMessage] = useState<LocalMessage | null>(null);

  useEffect(() => {
    navigation.setOptions({
      title: contactName,
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.white,
    });
  }, [contactName, navigation]);

  useEffect(() => {
    const load = async () => {
      try {
        if (!contactId) {
          setLoadError('No contact ID provided');
          setLoading(false);
          return;
        }

        const localMsgs = await getMessagesForChat(contactId);
        const seenIds = new Set(localMsgs.map(m => m.id));

        const { data: remoteMsgs } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${contactId},recipient_id.eq.${contactId}`)
          .order('created_at', { ascending: true });

        if (remoteMsgs) {
          for (const rm of remoteMsgs) {
            if (!seenIds.has(rm.id)) {
              await insertMessage({
                id: rm.id,
                chat_id: contactId,
                sender_id: rm.sender_id,
                content: rm.content,
                timestamp: new Date(rm.created_at).getTime(),
                is_sent: rm.sender_id === user?.id ? 1 : 0,
                is_read: rm.is_read ? 1 : 0,
                delivery_status: rm.is_read ? 'read' : rm.delivered_at ? 'delivered' : 'sent',
                is_edited: rm.is_edited ? 1 : 0,
                edited_at: rm.edited_at ? new Date(rm.edited_at).getTime() : undefined,
              });
            }
          }
        }

        const merged = await getMessagesForChat(contactId);
        setMessages(merged);
        setLoading(false);
        await markChatRead(contactId);
        if (user) {
          await markMessagesReadOnServer(contactId, user.id);
        }
      } catch (err) {
        setLoadError('Failed to load messages');
        setLoading(false);
      }
    };
    load();
  }, [contactId, user?.id]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!contactId) return;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', contactId)
          .single();
        if (data) setRecipientProfile(data as Profile);
      } catch (err) {
        // profile fetch failed silently
      }
    };
    fetchProfile();
  }, [contactId]);

  const onRealtimeMessage = useCallback(async (message: Message) => {
    if (message.sender_id === contactId) {
      const msgTime = new Date(message.created_at).getTime();
      const localMsg: LocalMessage = {
        id: message.id,
        chat_id: message.sender_id,
        sender_id: message.sender_id,
        content: message.content,
        timestamp: msgTime,
        is_sent: 0,
        is_read: 0,
        delivery_status: 'delivered',
        is_edited: message.is_edited ? 1 : 0,
        edited_at: message.edited_at ? new Date(message.edited_at).getTime() : undefined,
      };
      try {
        await insertMessage(localMsg);
        setMessages(prev => [...prev, localMsg]);
        await acknowledgeDelivery(message.id);

        await upsertChat({
          id: contactId,
          contact_name: contactName,
          contact_phone: contactPhone,
          last_message: message.content,
          last_message_time: msgTime,
          unread_count: 0,
        });
      } catch (err) {
        // realtime message handling failed silently
      }
    }
  }, [contactId, contactName, contactPhone]);

  useRealtimeMessages(user?.id || '', onRealtimeMessage);

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
  }, []);

  const handleEditSave = async (text: string) => {
    if (!editingMessage) return;
    const msgId = editingMessage.id;
    try {
      await editMessageOnServer(msgId, text);
      await editMessageLocal(msgId, text);
      setMessages(prev =>
        prev.map(m =>
          m.id === msgId ? { ...m, content: text, is_edited: 1, edited_at: Date.now() } : m
        )
      );
    } catch (err) {
      // edit failed silently
    }
    setEditingMessage(null);
  };

  const handleSend = async (text: string) => {
    if (editingMessage) {
      await handleEditSave(text);
      return;
    }
    if (!user || !recipientProfile) return;

    const localId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random() * 16 | 0; const v = c === 'x' ? r : (r & 0x3 | 0x8); return v.toString(16); });
    const tempMsg: LocalMessage = {
      id: localId,
      chat_id: contactId,
      sender_id: user.id,
      content: text,
      timestamp: Date.now(),
      is_sent: 1,
      is_read: 0,
      delivery_status: 'sending',
    };

    setMessages(prev => [...prev, tempMsg]);

    try {
      await sendMessage(user.id, contactId, text, localId, recipientProfile);
      setMessages(prev =>
        prev.map(m =>
          m.id === localId ? { ...m, delivery_status: 'sent' as const } : m
        )
      );
    } catch (err) {
      // send failed silently
    }
  };

  const handleLongPress = useCallback((item: LocalMessage) => {
    setSelectedMessage(item);
    setShowActions(true);
  }, []);

  const handleCloseActions = useCallback(() => {
    setShowActions(false);
    setSelectedMessage(null);
  }, []);

  const handleCopy = useCallback(async () => {
    if (selectedMessage) {
      Clipboard.setString(selectedMessage.content);
    }
    handleCloseActions();
  }, [selectedMessage, handleCloseActions]);

  const handleEdit = useCallback(() => {
    if (selectedMessage) {
      setEditingMessage(selectedMessage);
    }
    handleCloseActions();
  }, [selectedMessage, handleCloseActions]);

  const handleDeleteMe = useCallback(async () => {
    if (!selectedMessage) { handleCloseActions(); return; }
    try {
      await softDeleteMessageForMe(selectedMessage.id);
      setMessages(prev => prev.filter(m => m.id !== selectedMessage.id));
    } catch (err) {
      // delete failed silently
    }
    handleCloseActions();
  }, [selectedMessage, handleCloseActions]);

  const handleDeleteEveryone = useCallback(async () => {
    if (!selectedMessage) { handleCloseActions(); return; }
    try {
      await deleteForEveryone(selectedMessage.id);
      await updateMessageContent(selectedMessage.id, 'This message was deleted.');
      setMessages(prev =>
        prev.map(m =>
          m.id === selectedMessage.id ? { ...m, content: 'This message was deleted.' } : m
        )
      );
    } catch (err) {
      // delete for everyone failed silently
    }
    handleCloseActions();
  }, [selectedMessage, handleCloseActions]);

  const handleMessageInfo = useCallback(() => {
    if (selectedMessage) {
      navigation.navigate('MessageInfo', {
        message: selectedMessage,
        isOwn: selectedMessage.is_sent === 1,
      });
    }
    handleCloseActions();
  }, [selectedMessage, navigation, handleCloseActions]);

  const isWithin15Min = useCallback((timestamp: number): boolean => {
    return Date.now() - timestamp < 15 * 60 * 1000;
  }, []);

  const isWithin24Hours = useCallback((timestamp: number): boolean => {
    return Date.now() - timestamp < 24 * 60 * 60 * 1000;
  }, []);

  const renderItem = useCallback(({ item }: { item: LocalMessage }) => {
    if (!item) return null;
    return (
      <ChatBubble
        content={item.content || ''}
        isSent={item.is_sent === 1}
        timestamp={item.timestamp || 0}
        deliveryStatus={item.delivery_status || 'sent'}
        onLongPress={() => handleLongPress(item)}
        isEdited={item.is_edited === 1}
      />
    );
  }, [handleLongPress]);

  const isOwnSelected = selectedMessage?.is_sent === 1;
  const canDeleteEveryone = isOwnSelected && selectedMessage ? isWithin24Hours(selectedMessage.timestamp) : false;
  const canEdit = isOwnSelected && selectedMessage ? isWithin15Min(selectedMessage.timestamp) : false;

  if (loadError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{loadError}</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        extraData={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
        showsVerticalScrollIndicator={false}
      />
      <ChatInput
        onSend={handleSend}
        editMessage={editingMessage?.content}
        onCancelEdit={handleCancelEdit}
      />
      <MessageActionsSheet
        visible={showActions}
        isOwn={isOwnSelected}
        canDeleteEveryone={canDeleteEveryone}
        canEdit={canEdit}
        onClose={handleCloseActions}
        onCopy={handleCopy}
        onDeleteMe={handleDeleteMe}
        onDeleteEveryone={handleDeleteEveryone}
        onMessageInfo={handleMessageInfo}
        onEdit={handleEdit}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: 8,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default ChatScreen;
