import { UserSchema } from '@/schema/user.schema';
import { create } from 'zustand';
import { TOKEN_KEY } from '@/lib/constants';

interface AuthState {
  user: UserSchema | null;
  setUser: (user: UserSchema) => void;
  token: string | null;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  setUser: (user: UserSchema) => set({ user }),
  setToken: (token: string) => {
    if (typeof window !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
    set({ token });
  },
  logout: () => {
    if (typeof window !== 'undefined') localStorage.removeItem(TOKEN_KEY);

    set({ user: null, token: null });
  },
}));
