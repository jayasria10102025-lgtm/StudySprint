import axios from 'axios';

// Resolve and normalize the API base URL
export const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  let url = envUrl || (import.meta.env.DEV ? '/api' : 'https://studysprint-pjlu.onrender.com/api');

  // Strip trailing slashes
  url = url.trim().replace(/\/+$/, '');

  // If absolute HTTP/HTTPS URL and missing the /api route prefix, append /api
  if (/^https?:\/\//i.test(url) && !url.endsWith('/api')) {
    url = `${url}/api`;
  }

  return url;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Authorization header and sanitize duplicate /api prefixes
api.interceptors.request.use(
  (config) => {
    // In case baseURL was dynamically resolved
    if (!config.baseURL) {
      config.baseURL = getBaseURL();
    }
    // Prevent accidental /api/api double prefix
    if (config.baseURL && config.baseURL.endsWith('/api') && config.url && config.url.startsWith('/api/')) {
      config.url = config.url.replace(/^\/api/, '');
    }
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
      // If unauthorized and we had a token, clear it and redirect to login
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
