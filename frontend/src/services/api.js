import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Authorization header if token exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('studysprint_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and we had a token, clear it
      const hadToken = !!localStorage.getItem('studysprint_token');
      if (hadToken && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('studysprint_token');
        localStorage.removeItem('studysprint_user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

