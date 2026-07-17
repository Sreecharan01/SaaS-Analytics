import { createContext, useContext, useState, useEffect } from 'react';
import api, { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load stored auth on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedBusiness = localStorage.getItem('business');
    if (token && storedBusiness) {
      try {
        setBusiness(JSON.parse(storedBusiness));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('business');
      }
    }
    setLoading(false);
  }, []);

  const login = async (ownerEmail, password) => {
    const res = await api.post('/auth/login', { ownerEmail, password });
    const { token, ...businessData } = res.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('business', JSON.stringify(businessData));
    setBusiness(businessData);
    return res.data;
  };

  const register = async (storeName, ownerEmail, password) => {
    const res = await api.post('/auth/register', {
      storeName,
      ownerEmail,
      password,
    });
    const { token, ...businessData } = res.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('business', JSON.stringify(businessData));
    setBusiness(businessData);
    return res.data;
  };

  const fetchProfile = async () => {
    try {
      const res = await authAPI.getProfile();
      const businessData = res.data.data;
      localStorage.setItem('business', JSON.stringify(businessData));
      setBusiness(businessData);
      return businessData;
    } catch (error) {
      console.error('Failed to fetch profile', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('business');
    setBusiness(null);
  };

  return (
    <AuthContext.Provider
      value={{
        business,
        loading,
        isAuthenticated: !!business,
        login,
        register,
        logout,
        fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
