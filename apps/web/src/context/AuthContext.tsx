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
  logout: () => void;
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
    const token = localStorage.getItem('accessToken');
    if (!token) {
      dispatch({ type: 'SET_LOADING', value: false });
      return;
    }
    api
      .get<User>('/users/me')
      .then((user) => dispatch({ type: 'SET_USER', user }))
      .catch(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        dispatch({ type: 'CLEAR_USER' });
      });
  }, []);

  const login = useCallback(async (dto: LoginDto) => {
    const response = await api.post<{ tokens: { accessToken: string; refreshToken: string }; user: User }>(
      '/auth/login',
      dto,
    );
    localStorage.setItem('accessToken', response.tokens.accessToken);
    localStorage.setItem('refreshToken', response.tokens.refreshToken);
    dispatch({ type: 'SET_USER', user: response.user });
  }, []);

  const register = useCallback(async (dto: RegisterDto): Promise<{ message: string }> => {
    return api.post<{ message: string }>('/auth/register', dto);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
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
