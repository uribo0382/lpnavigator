import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: () => boolean;
  autoLogin: (role?: 'admin' | 'user') => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const MOCK_USERS = [
  {
    id: '1',
    name: '管理者',
    email: 'admin@example.com',
    password: 'password',
    role: 'admin' as const,
  },
  {
    id: '2',
    name: '一般ユーザー',
    email: 'user@example.com',
    password: 'password',
    role: 'user' as const,
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored user on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem('lp_navigator_user');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user', error);
        localStorage.removeItem('lp_navigator_user');
      }
    }
    
    // ローカルストレージにユーザーがなければ、デモ用に一般ユーザーとして自動ログイン
    else {
      // デモ環境では自動ログイン
      const isDemo = localStorage.getItem('lp_navigator_demo_mode') === 'true';
      if (isDemo) {
        const demoUser = MOCK_USERS.find(user => user.role === 'user');
        if (demoUser) {
          const { password, ...userWithoutPassword } = demoUser;
          setCurrentUser(userWithoutPassword);
          localStorage.setItem('lp_navigator_user', JSON.stringify(userWithoutPassword));
        }
      }
    }
    
    setIsLoading(false);
  }, []);

  // 初回レンダリング時にデモモードを有効にする
  useEffect(() => {
    localStorage.setItem('lp_navigator_demo_mode', 'true');
  }, []);

  // Mock login function
  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    // Simulate network request
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const foundUser = MOCK_USERS.find(
          (user) => user.email === email && user.password === password
        );
        
        if (foundUser) {
          const { password, ...userWithoutPassword } = foundUser;
          setCurrentUser(userWithoutPassword);
          localStorage.setItem('lp_navigator_user', JSON.stringify(userWithoutPassword));
          setIsLoading(false);
          resolve();
        } else {
          setIsLoading(false);
          reject(new Error('Invalid email or password'));
        }
      }, 1000);
    });
  };

  // ユーザー登録機能
  const register = async (name: string, email: string, password: string): Promise<void> => {
    setIsLoading(true);
    
    // Simulate network request
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Check if email is already registered
        const existingUser = MOCK_USERS.find(
          (user) => user.email === email
        );
        
        if (existingUser) {
          setIsLoading(false);
          reject(new Error('このメールアドレスは既に登録されています。'));
          return;
        }
        
        // Create new user
        const newUser = {
          id: String(MOCK_USERS.length + 1),
          name,
          email,
          password,
          role: 'user' as const
        };
        
        // In a real app, this would be an API call to register the user
        MOCK_USERS.push(newUser);
        
        // Log in the new user
        const { password: _, ...userWithoutPassword } = newUser;
        setCurrentUser(userWithoutPassword);
        localStorage.setItem('lp_navigator_user', JSON.stringify(userWithoutPassword));
        
        setIsLoading(false);
        resolve();
      }, 1000);
    });
  };
  
  // パスワードリセット機能
  const resetPassword = async (email: string): Promise<void> => {
    setIsLoading(true);
    
    // Simulate network request
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const foundUser = MOCK_USERS.find(
          (user) => user.email === email
        );
        
        if (foundUser) {
          // In a real app, this would send a password reset email
          console.log(`Password reset email sent to ${email}`);
          setIsLoading(false);
          resolve();
        } else {
          setIsLoading(false);
          reject(new Error('このメールアドレスは登録されていません。'));
        }
      }, 1000);
    });
  };

  // 自動ログイン機能（デモ用）
  const autoLogin = (role: 'admin' | 'user' = 'user') => {
    const demoUser = MOCK_USERS.find(user => user.role === role);
    if (demoUser) {
      const { password, ...userWithoutPassword } = demoUser;
      setCurrentUser(userWithoutPassword);
      localStorage.setItem('lp_navigator_user', JSON.stringify(userWithoutPassword));
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('lp_navigator_user');
    // デモモードは維持
  };

  const isAdmin = () => {
    return currentUser?.role === 'admin';
  };

  const value = {
    currentUser,
    isLoading,
    login,
    logout,
    isAdmin,
    autoLogin,
    register,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};