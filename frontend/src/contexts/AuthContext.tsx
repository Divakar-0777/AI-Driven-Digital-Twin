import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

interface User {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  occupation?: string;
  educationLevel?: string;
  monthlyIncome: number;
  monthlyExpenseTarget: number;
  studyGoal?: string;
  dailyStudyHoursTarget: number;
  habitGoals?: string;
  profilePhotoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerUser: (data: any) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateUserProfile: (data: any) => Promise<User>;
  deleteUserAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  const refreshProfile = async () => {
    try {
      const res = await api.get('/profile');
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
    } catch (err) {
      logout();
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // Safe check
      }
      
      // Verify token/fetch fresh data
      api.get('/profile')
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('user', JSON.stringify(res.data));
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/login', { email, password });
    const { token: jwtToken, user: userData } = res.data;
    
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    setToken(jwtToken);
    setUser(userData);
  };

  const registerUser = async (data: any) => {
    const res = await api.post('/register', data);
    const { token: jwtToken, user: userData } = res.data;

    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));

    setToken(jwtToken);
    setUser(userData);
  };

  const updateUserProfile = async (data: any): Promise<User> => {
    const res = await api.put('/profile', data);
    const updatedUser = res.data.user;
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  };

  const deleteUserAccount = async () => {
    await api.delete('/profile');
    logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        registerUser,
        logout,
        refreshProfile,
        updateUserProfile,
        deleteUserAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
