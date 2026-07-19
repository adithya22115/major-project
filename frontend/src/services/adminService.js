import api from './api';

export const getDashboard = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

export const getOverview = async (city) => {
  const params = {};
  if (city) params.city = city;
  const response = await api.get('/admin/overview', { params });
  return response.data;
};

export const getUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const updateUserStatus = async (id, data) => {
  const response = await api.put(`/admin/users/${id}/status`, data);
  return response.data;
};
