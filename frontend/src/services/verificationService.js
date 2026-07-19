import api from './api';

export const submitVerification = async (data) => {
  const response = await api.post('/pharmacy-verification', data);
  return response.data;
};

export const getMyVerification = async () => {
  const response = await api.get('/pharmacy-verification/me');
  return response.data;
};

export const getPendingVerifications = async () => {
  const response = await api.get('/pharmacy-verification/admin/pending');
  return response.data;
};

export const getAllVerificationsByStatus = async (status) => {
  const response = await api.get('/pharmacy-verification/admin/all', { params: { status } });
  return response.data;
};

export const approveVerification = async (id, remarks) => {
  const response = await api.put(`/pharmacy-verification/admin/${id}/approve`, { remarks });
  return response.data;
};

export const rejectVerification = async (id, remarks) => {
  const response = await api.put(`/pharmacy-verification/admin/${id}/reject`, { remarks });
  return response.data;
};

export const verifyDonation = async (id, data) => {
  const response = await api.put(`/verification/${id}`, data);
  return response.data;
};
