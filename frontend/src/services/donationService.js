import api from './api';

export const createDonation = async (formData) => {
  const response = await api.post('/donations', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getDonations = async () => {
  const response = await api.get('/donations');
  return response.data;
};

export const getDonationById = async (id) => {
  const response = await api.get(`/donations/${id}`);
  return response.data;
};
