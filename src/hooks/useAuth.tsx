import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../services/supabaseClient';
import { AuthState, Profile } from '../types';
import { getProfile } from '../services/authService';

interface AuthContextType extends AuthState {
  setUser: (user: Profile | null) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  isLoading: true,
  setUser: () => {},
  refreshUser: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
  });

  const setUser = (user: Profile | null) => {
    setState({
      isAuthenticated: !!user,
      user,
      isLoading: false,
    });
  };

  const refreshUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const profile = await getProfile(user.id);
      setState({
        isAuthenticated: true,
        user: profile,
        isLoading: false,
      });
    } else {
      setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
      });
    }
  };

  useEffect(() => {
    refreshUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const profile = await getProfile(session.user.id);
          setState({
            isAuthenticated: true,
            user: profile,
            isLoading: false,
          });
        } else {
          setState({
            isAuthenticated: false,
            user: null,
            isLoading: false,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
