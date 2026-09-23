import api from './api';

export const submitDoctorVerification = async (data) => {
  const response = await api.post('/doctor-verification', data);
  return response.data;
};

export const getMyDoctorVerification = async () => {
  const response = await api.get('/doctor-verification/me');
  return response.data;
};

export const getPendingDoctorVerifications = async () => {
  const response = await api.get('/doctor-verification/admin/pending');
  return response.data;
};

export const getAllDoctorVerificationsByStatus = async (status) => {
  const response = await api.get('/doctor-verification/admin/all', { params: { status } });
  return response.data;
};

export const approveDoctorVerification = async (id, remarks) => {
  const response = await api.put(`/doctor-verification/admin/${id}/approve`, { remarks });
  return response.data;
};

export const rejectDoctorVerification = async (id, remarks) => {
  const response = await api.put(`/doctor-verification/admin/${id}/reject`, { remarks });
  return response.data;
};
