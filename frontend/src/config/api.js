const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export const getApiUrl = (endpoint = '') => {
  const baseUrl = API_URL.replace(/\/$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
};

export default API_URL;


