import api from './api';

export const verifyDonation = async (id, data) => {
  const response = await api.put(`/verification/${id}`, data);
  return response.data;
};
