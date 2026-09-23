import api from './api';

export const createDonationQr = async (donationId, payload) => {
  const response = await api.post(`/donations/${donationId}/qr`, payload);
  return response.data;
};

export const scanDonationQr = async (qrCodeToken, requestId) => {
  const response = await api.post('/donations/scan', { qrCodeToken, requestId });
  return response.data;
};
