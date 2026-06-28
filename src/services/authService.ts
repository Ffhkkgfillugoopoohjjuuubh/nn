import { supabase } from './supabaseClient';
import { Profile } from '../types';

export const loginWithUsername = async (
  username: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: Profile }> => {
  const email = `${username}@quarisme.app`;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: error.message };
  if (!data.user) return { success: false, error: 'No user returned' };

  const profile = await getProfile(data.user.id);
  return { success: true, user: profile || undefined };
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

  const profile = await getProfile(data.user.id);

  if (profile && profile.display_name !== displayName) {
    await supabase.from('profiles').update({ display_name: displayName }).eq('id', data.user.id);
  }

  const updatedProfile = await getProfile(data.user.id);
  return { success: true, user: updatedProfile || undefined };
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
    .update({
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
