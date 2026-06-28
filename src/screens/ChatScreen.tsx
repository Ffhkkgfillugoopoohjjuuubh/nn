import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../utils/constants';
import { useAuth } from '../hooks/useAuth';
import { useRealtimeMessages } from '../hooks/useRealtimeMessages';
import { sendMessage, acknowledgeDelivery } from '../services/messageService';
import {
  getMessagesForChat,
  insertMessage,
  upsertChat,
  markChatRead,
} from '../services/localDatabase';
import { supabase } from '../services/supabaseClient';
import ChatBubble from '../components/ChatBubble';
import ChatInput from '../components/ChatInput';
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

  console.log('[CHAT] ChatScreen mounted');
  console.log('[CHAT] contactId:', contactId);
  console.log('[CHAT] contactName:', contactName);
  console.log('[CHAT] contactPhone:', contactPhone);
  console.log('[CHAT] user:', user?.id);

  useEffect(() => {
    navigation.setOptions({
      title: contactName || 'Chat',
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.white,
    });
  }, [contactName, navigation]);

  useEffect(() => {
    const load = async () => {
      try {
        console.log('[CHAT] Loading messages for contactId:', contactId);
        if (!contactId) {
          console.error('[CHAT] No contactId provided');
          setLoadError('No contact ID provided');
          setLoading(false);
          return;
        }

        const localMsgs = await getMessagesForChat(contactId);
        console.log('[CHAT] Local messages:', localMsgs.length);
        const seenIds = new Set(localMsgs.map(m => m.id));

        try {
          const { data: remoteMsgs, error: remoteError } = await supabase
            .from('messages')
            .select('*')
            .or(`sender_id.eq.${contactId},recipient_id.eq.${contactId}`)
            .order('created_at', { ascending: true });

          if (remoteError) {
            console.error('[CHAT] Supabase query error:', remoteError.message);
          }

          if (remoteMsgs && remoteMsgs.length > 0) {
            console.log('[CHAT] Remote messages:', remoteMsgs.length);
            for (const rm of remoteMsgs) {
              if (!seenIds.has(rm.id)) {
                try {
                  await insertMessage({
                    id: rm.id,
                    chat_id: contactId,
                    sender_id: rm.sender_id,
                    content: rm.content,
                    timestamp: new Date(rm.created_at).getTime(),
                    is_sent: rm.sender_id === user?.id ? 1 : 0,
                    is_read: rm.is_read ? 1 : 0,
                    delivery_status: rm.is_read ? 'read' : rm.delivered_at ? 'delivered' : 'sent',
                  });
                } catch (insertErr) {
                  console.error('[CHAT] insertMessage error:', insertErr);
                }
              }
            }
          } else {
            console.log('[CHAT] No remote messages');
          }
        } catch (supabaseErr) {
          console.error('[CHAT] Supabase fetch error:', supabaseErr);
        }

        let merged: LocalMessage[] = [];
        try {
          merged = await getMessagesForChat(contactId);
        } catch (dbErr) {
          console.error('[CHAT] getMessagesForChat error:', dbErr);
        }

        console.log('[CHAT] Merged messages:', merged.length);
        setMessages(merged);
        setLoading(false);

        try {
          await markChatRead(contactId);
          console.log('[CHAT] Marked chat as read');
        } catch (markErr) {
          console.error('[CHAT] markChatRead error:', markErr);
        }
      } catch (err) {
        console.error('[CHAT] Load error:', err);
        setLoadError('Failed to load messages: ' + (err as Error).message);
        setLoading(false);
      }
    };
    load();
  }, [contactId, user?.id]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!contactId) return;
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', contactId)
          .single();
        if (error) {
          console.error('[CHAT] Profile fetch error:', error.message);
        }
        if (data) setRecipientProfile(data as Profile);
      } catch (err) {
        console.error('[CHAT] Profile fetch error:', err);
      }
    };
    fetchProfile();
  }, [contactId]);

  useRealtimeMessages(user?.id || '', useCallback(async (message: Message) => {
    try {
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
        };
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
      }
    } catch (err) {
      console.error('[CHAT] Realtime handler error:', err);
    }
  }, [contactId, contactName, contactPhone]));

  const handleSend = async (text: string) => {
    if (!user || !recipientProfile) return;

    const localId = `${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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
      console.error('[CHAT] sendMessage error:', err);
    }
  };

  const renderItem = ({ item }: { item: LocalMessage }) => {
    if (!item) return null;
    return (
      <ChatBubble
        content={item.content || ''}
        isSent={item.is_sent === 1}
        timestamp={item.timestamp || 0}
        deliveryStatus={item.delivery_status || 'sent'}
      />
    );
  };

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
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: false })
        }
        showsVerticalScrollIndicator={false}
      />
      <ChatInput onSend={handleSend} />
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
