import { supabase } from './supabaseClient';
import { Profile } from '../types';

export const loginWithUsername = async (
  username: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: Profile }> => {
  const { data: profile, error: lookupError } = await supabase
    .from('profiles')
    .select('*')
    .eq('display_name', username)
    .single();

  if (lookupError || !profile) {
    return { success: false, error: 'User not found' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: profile.phone_number,
    password,
  });

  if (error) return { success: false, error: error.message };
  return { success: true, user: profile as Profile };
};

export const registerWithUsername = async (
  username: string,
  password: string,
  displayName: string
): Promise<{ success: boolean; error?: string; user?: Profile }> => {
  const email = `${username}@quarisme.app`;

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { success: false, error: error.message };
  if (!data.user) return { success: false, error: 'No user returned' };

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: data.user.id,
    display_name: displayName,
    phone_number: email,
  });

  if (profileError) {
    console.log('[auth] profile upsert error:', profileError.message);
  }

  const profile = await getProfile(data.user.id);
  return { success: true, user: profile || undefined };
};

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
};

export const updateProfile = async (profile: {
  id: string;
  display_name: string;
  avatar_url?: string;
}): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: profile.id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url || null,
    })
    .eq('id', profile.id);
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const signOut = async (): Promise<void> => {
  await supabase.auth.signOut();
};
