import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { updatePincode as apiUpdatePincode, updateLocation as apiUpdateLocation } from '../services/userService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper to decode JWT payload without a library
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      try {
        const decoded = decodeToken(token);
        if (decoded && decoded.exp * 1000 > Date.now()) {
          setUser(JSON.parse(storedUser));
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Invalid token', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password, rememberMe = false) => {
    const response = await api.post('/auth/login', { email, password, rememberMe });
    const data = response.data;
    const userInfo = {
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
    };
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(userInfo));
    setUser(userInfo);
    return { user: userInfo, token: data.token };
  };

  const register = async (formData) => {
    // Map roleId to RoleType enum name
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
    const userInfo = {
      userId: data.userId,
      name: data.name,
      email: data.email,
      role: data.role,
      city: data.city || formData.city || null,
      state: data.state || formData.state || null,
      pincode: data.pincode || formData.pincode || null,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      verified: data.verified || false,
    };
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(userInfo));
    setUser(userInfo);
    return { user: userInfo, token: data.token };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
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
      isGuest: true,
    };
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(userInfo));
    setUser(userInfo);
    return { user: userInfo, token: data.token };
  };

  const updateUserLocation = (city, state, pincode) => {
    setUser(prev => {
      const updated = { ...prev, city, state, pincode };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const updateLocation = async (latitude, longitude) => {
    const result = await apiUpdateLocation(latitude, longitude);
    const updated = {
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
      isGuest: user?.isGuest || false,
    };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
    return updated;
  };

  const setPincode = async (pincode) => {
    const result = await apiUpdatePincode(pincode);
    const updated = {
      userId: result.id,
      name: result.name,
      email: result.email,
      role: result.role,
      city: result.city || null,
      state: result.state || null,
      pincode: result.pincode || null,
      verified: result.isVerified || false,
    };
    localStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
    return updated;
  };

  const value = {
    user,
    login,
    register,
    logout,
    guestRegister,
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
