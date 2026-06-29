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
}

export interface AuthState {
  isAuthenticated: boolean;
  user: Profile | null;
  isLoading: boolean;
}
