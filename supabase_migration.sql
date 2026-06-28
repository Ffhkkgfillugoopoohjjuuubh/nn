-- ============================================================
-- QUARISME - SUPABASE MIGRATION
-- Run ALL of these queries in order in the Supabase SQL Editor
-- ============================================================

-- 1. Create profiles table (references auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  online_status BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
-- Anyone can read profiles (needed for search)
CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  contact_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, contact_user_id)
);

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Policies for contacts
-- Users can read their own contacts
CREATE POLICY "Users can read own contacts"
  ON contacts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own contacts
CREATE POLICY "Users can insert own contacts"
  ON contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own contacts
CREATE POLICY "Users can delete own contacts"
  ON contacts FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Create messages table (temporary routing table)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  delivered_at TIMESTAMPTZ
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policies for messages
-- Sender can insert messages
CREATE POLICY "Users can insert messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Sender and recipient can read messages involving them
CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Recipient can update delivered_at and is_read
CREATE POLICY "Recipient can update message status"
  ON messages FOR UPDATE
  USING (auth.uid() = recipient_id);

-- 4. Create function to auto-delete delivered messages
CREATE OR REPLACE FUNCTION delete_delivered_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When delivered_at is set (not null), delete the message after a short delay
  IF NEW.delivered_at IS NOT NULL AND OLD.delivered_at IS NULL THEN
    DELETE FROM messages WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- 5. Create trigger that fires after update on messages
DROP TRIGGER IF EXISTS trigger_delete_delivered_message ON messages;
CREATE TRIGGER trigger_delete_delivered_message
  AFTER UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION delete_delivered_message();

-- 6. Enable realtime for messages table
-- IMPORTANT: In Supabase Dashboard, go to Database > Replication
-- and enable replication for the "messages" table
-- OR run:
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- 7. Function to create profile on user signup (automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone_number, display_name)
  VALUES (
    NEW.id,
    NEW.phone,
    ''
  );
  RETURN NEW;
END;
$$;

-- Trigger to auto-create profile after auth signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- END OF MIGRATION
-- ============================================================
