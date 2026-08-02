import axios from 'axios';

/**
 * AI Health Assistant service — communicates with the backend
 * which proxies requests to Google Gemini API.
 * Uses a standalone axios instance (no auth token required)
 * since this endpoint is public.
 */
const healthApi = axios.create({
  baseURL: '/api',
});

/**
 * Send a symptom check request (initial or follow-up).
 * @param {string} message - User's symptom description or follow-up message
 * @param {Array} conversationHistory - Previous messages [{role, content}]
 * @param {number|null} age - Optional patient age
 * @param {string|null} gender - Optional patient gender
 * @returns {Promise<Object>} SymptomCheckResponse
 */
export const checkSymptoms = async (message, conversationHistory = [], age = null, gender = null) => {
  const payload = { message, conversationHistory };
  if (age) payload.age = age;
  if (gender) payload.gender = gender;

  const response = await healthApi.post('/health-assistant/check', payload);
  return response.data;
};
