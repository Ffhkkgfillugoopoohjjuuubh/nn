import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gbudaayrpoorzncgqbkc.supabase.co';
const supabaseAnonKey = 'sb_publishable_pTz5zYvOnPDxzy05JTp09Q_BBoaCu8K';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const getSupabaseUrl = () => supabaseUrl;
export const getSupabaseAnonKey = () => supabaseAnonKey;
