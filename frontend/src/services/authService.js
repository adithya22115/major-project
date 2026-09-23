import api from './api';

/**
 * Check whether an email exists or is available in real time.
 * Returns: { email, exists, formatValid, domainValid, available, message }
 */
export const checkEmailAvailability = async (email) => {
  if (!email || !email.trim()) {
    return {
      email: '',
      exists: false,
      formatValid: false,
      domainValid: false,
      available: false,
      message: 'Email cannot be empty'
    };
  }

  const response = await api.get('/auth/check-email', {
    params: { email: email.trim() }
  });
  return response.data;
};
