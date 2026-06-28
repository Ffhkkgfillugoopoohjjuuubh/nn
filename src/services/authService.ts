import { supabase, getSupabaseUrl, getSupabaseAnonKey } from './supabaseClient';
import { Profile } from '../types';

export const loginWithUsername = async (
  username: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: Profile }> => {
  const email = `${username}@quarisme.local`;
  const maskedPass = password ? password.substring(0, 1) + '***' : '';

  console.log('[AUTH] loginWithUsername called');
  console.log('[AUTH]   username entered:', `"${username}"`);
  console.log('[AUTH]   generated email:', email);
  console.log('[AUTH]   Supabase URL:', getSupabaseUrl());
  console.log('[AUTH]   Supabase anon key prefix:', getSupabaseAnonKey().substring(0, 30) + '...');
  console.log('[AUTH]   password (masked):', maskedPass);

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  console.log('[AUTH]   response received');
  console.log('[AUTH]   error:', error ? JSON.stringify(error) : 'null');
  console.log('[AUTH]   error.message:', error ? error.message : 'null');
  console.log('[AUTH]   data.user:', data?.user?.id || 'null');
  console.log('[AUTH]   data.session:', data?.session ? 'present' : 'null');

  if (error) return { success: false, error: error.message };
  if (!data.user) return { success: false, error: 'No user returned' };

  const profile = await getProfile(data.user.id);
  console.log('[AUTH]   profile loaded:', profile ? profile.username : 'null');

  return { success: true, user: profile || undefined };
};

export const registerWithUsername = async (
  username: string,
  password: string,
  displayName: string
): Promise<{ success: boolean; error?: string; user?: Profile }> => {
  const email = `${username}@quarisme.local`;
  const maskedPass = password ? password.substring(0, 1) + '***' : '';

  console.log('[AUTH] registerWithUsername called');
  console.log('[AUTH]   username entered:', `"${username}"`);
  console.log('[AUTH]   displayName entered:', `"${displayName}"`);
  console.log('[AUTH]   generated email:', email);
  console.log('[AUTH]   Supabase URL:', getSupabaseUrl());
  console.log('[AUTH]   password (masked):', maskedPass);

  const existing = await checkUsernameAvailable(username);
  console.log('[AUTH]   username available:', existing);

  if (!existing) {
    return { success: false, error: 'Username already taken' };
  }

  const { data, error } = await supabase.auth.signUp({ email, password });

  console.log('[AUTH]   signUp response received');
  console.log('[AUTH]   error:', error ? JSON.stringify(error) : 'null');
  console.log('[AUTH]   error.message:', error ? error.message : 'null');
  console.log('[AUTH]   data.user:', data?.user?.id || 'null');
  console.log('[AUTH]   data.session:', data?.session ? 'present' : 'null');

  if (error) {
    const msg = error.message;
    if (msg === '{}' || msg?.includes('23505') || msg?.includes('duplicate')) {
      return { success: false, error: 'Username already taken' };
    }
    return { success: false, error: msg || 'Signup failed' };
  }
  if (!data.user) return { success: false, error: 'No user returned' };

  let profile: Profile | null = null;
  for (let i = 0; i < 5; i++) {
    profile = await getProfile(data.user.id);
    if (profile) break;
    await new Promise(r => setTimeout(r, 500 * (i + 1)));
  }
  console.log('[AUTH]   profile after signup:', profile ? profile.username : 'null (retries exhausted)');

  if (profile && profile.display_name !== displayName) {
    console.log('[AUTH]   updating display_name to:', displayName);
    await supabase.from('profiles').update({ display_name: displayName }).eq('id', data.user.id);
  }

  const updatedProfile = profile ? await getProfile(data.user.id) : null;
  console.log('[AUTH]   updatedProfile:', updatedProfile ? updatedProfile.username : 'null');

  return { success: true, user: updatedProfile || undefined };
};

const checkUsernameAvailable = async (username: string): Promise<boolean> => {
  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .maybeSingle();
  return !data;
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
