import api from './api';

export const submitPharmacyVerification = async (data) => {
  const response = await api.post('/pharmacy-verification', data);
  return response.data;
};

export const getMyPharmacyVerification = async () => {
  const response = await api.get('/pharmacy-verification/me');
  return response.data;
};

export const getPendingPharmacyVerifications = async () => {
  const response = await api.get('/pharmacy-verification/admin/pending');
  return response.data;
};

export const getAllPharmacyVerificationsByStatus = async (status) => {
  const response = await api.get('/pharmacy-verification/admin/all', { params: { status } });
  return response.data;
};

export const approvePharmacyVerification = async (id, remarks) => {
  const response = await api.put(`/pharmacy-verification/admin/${id}/approve`, { remarks });
  return response.data;
};

export const rejectPharmacyVerification = async (id, remarks) => {
  const response = await api.put(`/pharmacy-verification/admin/${id}/reject`, { remarks });
  return response.data;
};
