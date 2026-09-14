import api from './api';

export const bookDoctorAppointment = async (payload) => {
  const response = await api.post('/doctor-appointments', payload);
  return response.data;
};

export const getDoctorAppointments = async () => {
  const response = await api.get('/doctor-appointments');
  return response.data;
};

export const updateDoctorAppointmentStatus = async (id, status) => {
  const response = await api.put(`/doctor-appointments/${id}/status`, null, { params: { status } });
  return response.data;
};
