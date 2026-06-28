import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
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
  const { contactId, contactName, contactPhone } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipientProfile, setRecipientProfile] = useState<Profile | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    navigation.setOptions({
      title: contactName,
      headerStyle: { backgroundColor: COLORS.primary },
      headerTintColor: COLORS.white,
    });
  }, [contactName]);

  useEffect(() => {
    const load = async () => {
      const msgs = await getMessagesForChat(contactId);
      setMessages(msgs);
      setLoading(false);
      await markChatRead(contactId);
    };
    load();
  }, [contactId]);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', contactId)
        .single();
      if (data) setRecipientProfile(data as Profile);
    };
    fetchProfile();
  }, [contactId]);

  useRealtimeMessages(user?.id || '', async (message: Message) => {
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
  });

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

    await sendMessage(user.id, contactId, text, localId, recipientProfile);
    setMessages(prev =>
      prev.map(m =>
        m.id === localId ? { ...m, delivery_status: 'sent' as const } : m
      )
    );
  };

  const renderItem = ({ item }: { item: LocalMessage }) => (
    <ChatBubble
      content={item.content}
      isSent={item.is_sent === 1}
      timestamp={item.timestamp}
      deliveryStatus={item.delivery_status}
    />
  );

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
});

export default ChatScreen;
