import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fqomeulnjitkachsnqik.supabase.co';
const supabaseAnonKey = 'sb_publishable_KOFWuJdDxG_sVqBdxYiHiQ_M_H5okqF';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const getSupabaseUrl = () => supabaseUrl;
export const getSupabaseAnonKey = () => supabaseAnonKey;
