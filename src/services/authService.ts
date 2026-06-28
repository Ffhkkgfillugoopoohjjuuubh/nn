import { supabase } from './supabaseClient';
import { Profile } from '../types';

export const sendOTP = async (phoneNumber: string): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase.auth.signInWithOtp({
    phone: phoneNumber,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const verifyOTP = async (
  phoneNumber: string,
  token: string
): Promise<{ success: boolean; error?: string; user?: Profile }> => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phoneNumber,
    token,
    type: 'sms',
  });
  if (error) return { success: false, error: error.message };
  if (data.user) {
    const profile = await getProfile(data.user.id);
    return { success: true, user: profile || undefined };
  }
  return { success: false, error: 'No user returned' };
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
