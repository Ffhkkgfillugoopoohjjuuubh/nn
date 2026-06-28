import { supabase } from './supabaseClient';
import { Profile } from '../types';

export const searchByPhone = async (
  phoneNumber: string
): Promise<{ success: boolean; profile?: Profile; error?: string }> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('phone_number', phoneNumber)
    .single();

  if (error || !data) {
    return { success: false, error: 'User not found on QuarisMe' };
  }
  return { success: true, profile: data as Profile };
};

export const getContacts = async (
  userId: string
): Promise<{ contact: Profile; contactId: string }[]> => {
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, contact_user_id')
    .eq('user_id', userId);

  if (!contacts || contacts.length === 0) return [];

  const contactIds = contacts.map(c => c.contact_user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', contactIds);

  if (!profiles) return [];

  return profiles.map(p => ({
    contact: p as Profile,
    contactId: contacts.find(c => c.contact_user_id === p.id)?.id || '',
  }));
};

export const addContact = async (
  userId: string,
  contactUserId: string
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase.from('contacts').insert({
    user_id: userId,
    contact_user_id: contactUserId,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
};

export const removeContact = async (
  userId: string,
  contactUserId: string
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('user_id', userId)
    .eq('contact_user_id', contactUserId);
  if (error) return { success: false, error: error.message };
  return { success: true };
};
