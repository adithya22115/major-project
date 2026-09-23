import api from './api';

export const getInventory = async () => {
  const response = await api.get('/inventory');
  return response.data;
};

export const adjustInventoryQuantity = async (medicineId, quantity, type, reason) => {
  const response = await api.patch('/inventory/adjust', {
    medicineId,
    quantity,
    type,
    reason,
  });
  return response.data;
};
