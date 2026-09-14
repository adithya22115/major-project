import api from './api';

export const createDonation = async (formData) => {
  const response = await api.post('/donations', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const analyzeMedicineImage = async (image, medicineName = '', dosage = '') => {
  const data = new FormData();
  data.append('image', image);
  if (medicineName) data.append('medicineName', medicineName);
  if (dosage) data.append('dosage', dosage);
  const response = await api.post('/medicines/analyze-image', data, {
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

export const getAvailableDonations = async (city, state) => {
  const params = {};
  if (city) params.city = city;
  if (state) params.state = state;
  const response = await api.get('/donations/available', { params });
  return response.data;
};

export const findNearestLocations = async (medicineId, latitude, longitude, city, state) => {
  const params = { medicineId };
  if (latitude != null) params.latitude = latitude;
  if (longitude != null) params.longitude = longitude;
  if (city) params.city = city;
  if (state) params.state = state;
  const response = await api.get('/donations/nearest', { params });
  return response.data;
};
