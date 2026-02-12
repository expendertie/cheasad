
import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { authService, LoginCredentials, RegisterCredentials } from '../services/authService';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials, stayLoggedIn: boolean) => Promise<User>;
  logout: () => void;
  register: (credentials: RegisterCredentials) => Promise<User>;
  updateUserAvatar: (newUrl: string) => Promise<void>;
  updateUserAvatarColor: (newColor: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  changePassword: (oldPw: string, newPw: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Check local storage for session ID
      const sessionStr = localStorage.getItem('auth_session_token') || sessionStorage.getItem('auth_session_token');
      
      if (sessionStr) {
          const { uid } = JSON.parse(sessionStr);
          // 2. Fetch full user data from API
          const user = await authService.getUserByUid(uid);
          setCurrentUser(user);
      } else {
          setCurrentUser(null);
      }
    } catch (error) {
      console.error("Auth check failed", error);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials: LoginCredentials, stayLoggedIn: boolean): Promise<User> => {
    const user = await authService.login(credentials, stayLoggedIn);
    setCurrentUser(user);
    return user;
  };

  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const register = async (credentials: RegisterCredentials): Promise<User> => {
    const newUser = await authService.register(credentials);
    // Automatically log in the user after successful registration
    const user = await login({ identifier: newUser.username, password: credentials.password }, false);
    return user;
  };

  const updateUserAvatar = async (newUrl: string) => {
    if (currentUser) {
        try {
            await authService.updateAvatar(currentUser.uid, newUrl);
            setCurrentUser({ ...currentUser, avatarUrl: newUrl });
        } catch (e) {
            console.error("Failed to update avatar in context", e);
            throw e; // Propagate error so UI can handle it if needed
        }
    }
  };

  const updateUserAvatarColor = async (newColor: string) => {
    if (currentUser) {
        try {
            await authService.updateAvatarColor(currentUser.uid, newColor);
            setCurrentUser({ ...currentUser, avatarColor: newColor });
        } catch (e) {
            console.error("Failed to update avatar color in context", e);
            throw e;
        }
    }
  };

  const updateProfile = async (data: Partial<User>) => {
      if (currentUser) {
          try {
              const updatedUser = await authService.updateUserProfile(currentUser.uid, data);
              setCurrentUser(updatedUser);
          } catch (e) {
              console.error("Failed to update profile", e);
              throw e;
          }
      }
  }

  const changePassword = async (oldPw: string, newPw: string) => {
      if (currentUser) {
          await authService.changePassword(currentUser.uid, oldPw, newPw);
      }
  }

  const value: AuthContextType = {
    currentUser,
    isAuthenticated: !!currentUser,
    isLoading,
    login,
    logout,
    register,
    updateUserAvatar,
    updateUserAvatarColor,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
