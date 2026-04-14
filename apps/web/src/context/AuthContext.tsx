import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import { User } from '@stockhome/shared';
import { api } from '../services/api';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

type AuthAction =
  | { type: 'SET_USER'; user: User }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_LOADING'; value: boolean };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.user, isAuthenticated: true, isLoading: false };
    case 'CLEAR_USER':
      return { ...state, user: null, isAuthenticated: false, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.value };
    default:
      return state;
  }
}

interface LoginDto {
  email: string;
  password: string;
}

interface RegisterDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (dto: LoginDto) => Promise<void>;
  register: (dto: RegisterDto) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    // The access token cookie is sent automatically — just try to fetch the user
    api
      .get<User>('/users/me')
      .then((user) => dispatch({ type: 'SET_USER', user }))
      .catch(() => dispatch({ type: 'CLEAR_USER' }));
  }, []);

  const login = useCallback(async (dto: LoginDto) => {
    const response = await api.post<{ user: User }>('/auth/login', dto);
    dispatch({ type: 'SET_USER', user: response.user });
  }, []);

  const register = useCallback(async (dto: RegisterDto): Promise<{ message: string }> => {
    return api.post<{ message: string }>('/auth/register', dto);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore — clear state regardless
    }
    localStorage.removeItem('selectedHouseholdId');
    dispatch({ type: 'CLEAR_USER' });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await api.get<User>('/users/me');
      dispatch({ type: 'SET_USER', user });
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
