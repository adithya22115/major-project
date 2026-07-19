import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import {
  updatePincode as apiUpdatePincode,
  updateLocation as apiUpdateLocation,
} from '../services/userService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingTwoFactorEmail, setPendingTwoFactorEmail] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        const decoded = decodeToken(token);
        if (decoded && decoded.exp * 1000 > Date.now()) {
          setUser(JSON.parse(storedUser));
        } else {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            refreshAccessToken(refreshToken);
          } else {
            clearAuth();
          }
        }
      } catch (error) {
        clearAuth();
      }
    }
    setLoading(false);
  }, []);

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const refreshAccessToken = async (refreshToken) => {
    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      const data = response.data;
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch {
      clearAuth();
    }
  };

  const login = async (email, password, rememberMe = false) => {
    const response = await api.post('/auth/login', { email, password, rememberMe });
    const data = response.data;

    if (data.twoFactorRequired) {
      setPendingTwoFactorEmail(email);
      return { twoFactorRequired: true, email };
    }

    const userInfo = buildUserInfo(data);
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(userInfo));
    setUser(userInfo);
    return { user: userInfo, token: data.token };
  };

  const verifyTwoFactor = async (code) => {
    if (!pendingTwoFactorEmail) {
      throw new Error('No pending 2FA session');
    }
    const response = await api.post('/auth/verify-2fa', {
      email: pendingTwoFactorEmail,
      code,
    });
    const data = response.data;
    const userInfo = buildUserInfo(data);
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(userInfo));
    setUser(userInfo);
    setPendingTwoFactorEmail(null);
    return { user: userInfo, token: data.token };
  };

  const register = async (formData) => {
    const roleMap = { '1': 'DONOR', '2': 'RECIPIENT', '3': 'PHARMACY' };
    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      role: roleMap[formData.roleId] || 'DONOR',
      address: formData.address,
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode,
    };
    const response = await api.post('/auth/register', payload);
    const data = response.data;
    const userInfo = buildUserInfo(data);
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(userInfo));
    setUser(userInfo);
    return { user: userInfo, token: data.token };
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await api.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch {
    } finally {
      clearAuth();
      setPendingTwoFactorEmail(null);
      window.location.href = '/';
    }
  };

  const guestRegister = async (name, role, phone, pincode, latitude, longitude) => {
    const payload = { name, role };
    if (phone) payload.phone = phone;
    if (pincode) payload.pincode = pincode;
    if (latitude != null) payload.latitude = latitude;
    if (longitude != null) payload.longitude = longitude;
    const response = await api.post('/auth/guest-register', payload);
    const data = response.data;
    const userInfo = {
      ...buildUserInfo(data),
      isGuest: true,
    };
    localStorage.setItem('token', data.token);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(userInfo));
    setUser(userInfo);
    return { user: userInfo, token: data.token };
  };

  const updateUserLocation = (city, state, pincode) => {
    setUser((prev) => {
      const updated = { ...prev, city, state, pincode };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const updateLocation = async (latitude, longitude) => {
    const result = await apiUpdateLocation(latitude, longitude);
    const updated = buildUserInfoFromResult(result);
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
    return updated;
  };

  const setPincode = async (pincode) => {
    const result = await apiUpdatePincode(pincode);
    const updated = buildUserInfoFromResult(result);
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
    return updated;
  };

  const buildUserInfo = (data) => ({
    userId: data.userId,
    name: data.name,
    email: data.email,
    role: data.role,
    city: data.city || null,
    state: data.state || null,
    pincode: data.pincode || null,
    latitude: data.latitude || null,
    longitude: data.longitude || null,
    verified: data.verified || false,
  });

  const buildUserInfoFromResult = (result) => ({
    userId: result.id,
    name: result.name,
    email: result.email,
    role: result.role,
    city: result.city || null,
    state: result.state || null,
    pincode: result.pincode || null,
    latitude: result.latitude || null,
    longitude: result.longitude || null,
    verified: result.isVerified || false,
    isTwoFactorEnabled: result.isTwoFactorEnabled || false,
    isGuest: user?.isGuest || false,
  });

  const value = {
    user,
    login,
    register,
    logout,
    guestRegister,
    verifyTwoFactor,
    pendingTwoFactorEmail,
    updateUserLocation,
    updateLocation,
    setPincode,
    isAuthenticated: !!user,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
