import api from './api';

export const uploadFile = async (formData, folder = 'uploads') => {
  const response = await api.post(`/files/upload?folder=${folder}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const uploadMultipleFiles = async (formData, folder = 'uploads') => {
  const response = await api.post(`/files/upload/multiple?folder=${folder}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
