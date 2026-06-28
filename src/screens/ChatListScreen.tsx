import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../utils/constants';
import { supabase } from '../services/supabaseClient';
import { getAllChats, upsertChat, insertMessage } from '../services/localDatabase';
import { getContacts } from '../services/contactService';
import { useAuth } from '../hooks/useAuth';
import { useRealtimeMessages } from '../hooks/useRealtimeMessages';
import { acknowledgeDelivery } from '../services/messageService';
import ContactItem from '../components/ContactItem';
import { LocalChat, Message } from '../types';

interface ChatListScreenProps {
  navigation: any;
}

const ChatListScreen: React.FC<ChatListScreenProps> = ({ navigation }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<LocalChat[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChats = useCallback(async () => {
    if (!user) return;

    const localChats = await getAllChats();
    console.log('[ChatList] localChats count:', localChats.length);

    const localChatMap = new Map(localChats.map(c => [c.id, c]));

    const contacts = await getContacts(user.id);
    console.log('[ChatList] Supabase contacts count:', contacts.length);

    for (const { contact } of contacts) {
      if (!localChatMap.has(contact.id)) {
        console.log('[ChatList] creating local_chat for contact', contact.id);
        const newChat: LocalChat = {
          id: contact.id,
          contact_name: contact.display_name,
          contact_phone: contact.phone_number,
          last_message: '',
          last_message_time: 0,
          unread_count: 0,
        };
        await upsertChat(newChat);
        localChatMap.set(contact.id, newChat);
      }
    }

    const mergedChats = Array.from(localChatMap.values()).sort((a, b) => {
      if (a.last_message_time !== b.last_message_time) {
        return b.last_message_time - a.last_message_time;
      }
      return a.contact_name.localeCompare(b.contact_name);
    });

    console.log('[ChatList] mergedChats count:', mergedChats.length);
    setChats(mergedChats);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadChats();
    }, [loadChats])
  );

  useRealtimeMessages(user?.id || '', async (message: Message) => {
    const msgTime = new Date(message.created_at).getTime();
    await insertMessage({
      id: message.id,
      chat_id: message.sender_id,
      sender_id: message.sender_id,
      content: message.content,
      timestamp: msgTime,
      is_sent: 0,
      is_read: 0,
      delivery_status: 'delivered',
    });

    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('display_name, phone_number')
      .eq('id', message.sender_id)
      .single();

    await upsertChat({
      id: message.sender_id,
      contact_name: senderProfile?.display_name || 'Unknown',
      contact_phone: senderProfile?.phone_number || '',
      last_message: message.content,
      last_message_time: msgTime,
      unread_count: 1,
    });

    await acknowledgeDelivery(message.id);
    loadChats();
  });

  const handleChatPress = (chat: LocalChat) => {
    navigation.navigate('Chat', {
      contactId: chat.id,
      contactName: chat.contact_name,
      contactPhone: chat.contact_phone,
    });
  };

  const renderItem = ({ item }: { item: LocalChat }) => (
    <ContactItem
      name={item.contact_name}
      phone={item.contact_phone}
      lastMessage={item.last_message}
      lastMessageTime={item.last_message_time}
      unreadCount={item.unread_count}
      onPress={() => handleChatPress(item)}
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
    <View style={styles.container}>
      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No chats yet</Text>
          <Text style={styles.emptySubtitle}>
            Tap the + button to add a contact and start chatting
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewChat')}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabIcon: {
    fontSize: 28,
    color: COLORS.white,
    lineHeight: 30,
    fontWeight: '300',
  },
});

export default ChatListScreen;
