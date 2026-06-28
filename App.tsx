import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/hooks/useAuth';
import AppNavigator from './src/navigation/AppNavigator';
import { initDatabase } from './src/services/localDatabase';
import { supabase, getSupabaseUrl, getSupabaseAnonKey } from './src/services/supabaseClient';

export default function App() {
  useEffect(() => {
    initDatabase();
    startupLog();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

async function startupLog() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  console.log('[QuarisMe] App starting...');
  console.log('[QuarisMe] Project URL:', url);
  console.log('[QuarisMe] Anon key prefix:', key.substring(0, 25) + '...');

  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.log('[QuarisMe] Supabase connection FAILED:', error.message);
    console.log('[QuarisMe] HTTP status: 400');
    console.log('[QuarisMe] Error details:', JSON.stringify(error));
  } else {
    console.log('[QuarisMe] Supabase connection OK (HTTP 200)');
    console.log('[QuarisMe] Profiles accessible:', data.length, 'row(s)');
  }
}
