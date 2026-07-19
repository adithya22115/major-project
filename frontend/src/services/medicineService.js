import api from './api';

export const getMedicines = async (params) => {
  const response = await api.get('/medicines', { params });
  return response.data;
};

export const getMedicineById = async (id) => {
  const response = await api.get(`/medicines/${id}`);
  return response.data;
};

export const createMedicine = async (data) => {
  const response = await api.post('/medicines', data);
  return response.data;
};

export const updateMedicine = async (id, data) => {
  const response = await api.put(`/medicines/${id}`, data);
  return response.data;
};

export const deleteMedicine = async (id) => {
  const response = await api.delete(`/medicines/${id}`);
  return response.data;
};
