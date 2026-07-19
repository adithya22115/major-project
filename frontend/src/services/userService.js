import api from './api';

export const getProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put('/users/profile', data);
  return response.data;
};

export const updatePincode = async (pincode) => {
  const response = await api.put('/users/profile/pincode', { pincode });
  return response.data;
};

export const updateLocation = async (latitude, longitude) => {
  const response = await api.put('/users/location', { latitude, longitude });
  return response.data;
};

export const lookupPincode = async (pincode) => {
  const response = await api.get(`/users/pincode/${pincode}/lookup`);
  return response.data;
};

export const changePassword = async (data) => {
  const response = await api.put('/users/profile/password', data);
  return response.data;
};
