import { supabase } from './supabaseClient';
import { Profile } from '../types';

export const signIn = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: Profile }> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { success: false, error: error.message };
  if (!data.user) return { success: false, error: 'No user returned' };
  const profile = await getProfile(data.user.id);
  return { success: true, user: profile || undefined };
};

export const signUp = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: Profile }> => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { success: false, error: error.message };
  if (!data.user) return { success: false, error: 'No user returned' };

  const profile = await getProfile(data.user.id);
  if (!profile) {
    const { error: insertError } = await supabase.from('profiles').upsert({
      id: data.user.id,
      phone_number: email,
      display_name: '',
    });
    if (insertError) {
      console.log('[auth] profile upsert error:', insertError.message);
    }
    const newProfile = await getProfile(data.user.id);
    return { success: true, user: newProfile || undefined };
  }

  return { success: true, user: profile };
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
