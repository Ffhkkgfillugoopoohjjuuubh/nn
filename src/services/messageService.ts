import { supabase } from './supabaseClient';
import { Message, Profile } from '../types';
import {
  insertMessage,
  updateMessageStatus,
  getPendingMessages,
  upsertChat,
  updateChatLastMessage,
} from './localDatabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export const sendMessage = async (
  senderId: string,
  recipientId: string,
  content: string,
  localMessageId: string,
  recipientProfile: Profile
): Promise<void> => {
  const timestamp = Date.now();

  await insertMessage({
    id: localMessageId,
    chat_id: recipientId,
    sender_id: senderId,
    content,
    timestamp,
    is_sent: 1,
    is_read: 0,
    delivery_status: 'sending',
  });

  await upsertChat({
    id: recipientId,
    contact_name: recipientProfile.display_name,
    contact_phone: recipientProfile.username,
    last_message: content,
    last_message_time: timestamp,
    unread_count: 0,
  });

  const { error } = await supabase.from('messages').insert({
    id: localMessageId,
    sender_id: senderId,
    recipient_id: recipientId,
    content,
  });

  if (error) {
    await updateMessageStatus(localMessageId, 'sending');
    return;
  }

  await updateMessageStatus(localMessageId, 'sent');
  await updateChatLastMessage(recipientId, content, timestamp, false);
};

export const subscribeToMessages = (
  currentUserId: string,
  onMessageReceived: (message: Message) => void
): (() => void) => {
  const topic = `messages-channel-${currentUserId}-${Date.now()}`;

  const channel = supabase
    .channel(topic)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${currentUserId}`,
      },
      (payload: RealtimePostgresChangesPayload<Message>) => {
        const newMessage = payload.new as Message;
        if (newMessage && newMessage.sender_id !== currentUserId) {
          onMessageReceived(newMessage);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const acknowledgeDelivery = async (messageId: string): Promise<void> => {
  await supabase
    .from('messages')
    .update({ delivered_at: new Date().toISOString() })
    .eq('id', messageId);
};

export const markAsRead = async (messageId: string): Promise<void> => {
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', messageId);
};

export const markMessagesReadOnServer = async (contactId: string, currentUserId: string): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('sender_id', contactId)
    .eq('recipient_id', currentUserId)
    .is('is_read', false);
  if (error) console.error('markMessagesReadOnServer error:', error.message);
};

export const deleteForEveryone = async (messageId: string): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .update({ content: 'This message was deleted.' })
    .eq('id', messageId);
  if (error) console.error('deleteForEveryone error:', error.message);
};

export const softDeleteForEveryone = async (messageId: string): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .update({
      content: 'This message was deleted.',
      deleted_for_everyone: true,
    })
    .eq('id', messageId);
  if (error) console.error('softDeleteForEveryone error:', error.message);
};

export const editMessageOnServer = async (messageId: string, content: string): Promise<void> => {
  const { error } = await supabase
    .from('messages')
    .update({
      content,
      is_edited: true,
      edited_at: new Date().toISOString(),
    })
    .eq('id', messageId);
  if (error) console.error('editMessageOnServer error:', error.message);
};

export const subscribeToSentMessageUpdates = (
  currentUserId: string,
  onMessageUpdated: (message: Message) => void
): (() => void) => {
  const topic = `sent-updates-${currentUserId}-${Date.now()}`;

  const channel = supabase
    .channel(topic)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `sender_id=eq.${currentUserId}`,
      },
      (payload: RealtimePostgresChangesPayload<Message>) => {
        const updated = payload.new as Message;
        if (updated) {
          onMessageUpdated(updated);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const subscribeToReceivedMessageUpdates = (
  currentUserId: string,
  onMessageUpdated: (message: Message) => void
): (() => void) => {
  const topic = `received-updates-${currentUserId}-${Date.now()}`;

  const channel = supabase
    .channel(topic)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${currentUserId}`,
      },
      (payload: RealtimePostgresChangesPayload<Message>) => {
        const updated = payload.new as Message;
        if (updated) {
          onMessageUpdated(updated);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const processPendingMessages = async (
  senderId: string,
  recipientProfile: Profile
): Promise<void> => {
  const pending = await getPendingMessages();
  for (const msg of pending) {
    await sendMessage(
      senderId,
      msg.chat_id,
      msg.content,
      msg.id,
      recipientProfile
    );
  }
};
