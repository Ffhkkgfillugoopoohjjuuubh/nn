export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  online_status?: boolean;
  last_seen?: string;
  created_at?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  delivered_at?: string;
  read_at?: string;
  edited_at?: string;
  is_edited?: boolean;
  deleted_for_everyone?: boolean;
}

export interface Contact {
  id: string;
  user_id: string;
  contact_user_id: string;
  created_at: string;
}

export interface LocalChat {
  id: string;
  contact_name: string;
  contact_phone: string;
  last_message: string;
  last_message_time: number;
  unread_count: number;
}

export interface LocalMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  timestamp: number;
  is_sent: number;
  is_read: number;
  delivery_status: 'sending' | 'sent' | 'delivered' | 'read';
  edited_at?: number;
  is_edited?: number;
  is_deleted_for_me?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: Profile | null;
  isLoading: boolean;
}
