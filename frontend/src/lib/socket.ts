export const getSocketUrl = (): string => {
  const configuredWs = import.meta.env.VITE_WS_URL?.trim();
  if (configuredWs) return configuredWs;

  const configuredApi = import.meta.env.VITE_API_URL?.trim();
  if (configuredApi) {
    return configuredApi.replace(/\/api\/v1\/?$/, '').replace(/\/api\/?$/, '');
  }

  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000';
  }

  return 'https://orderkare-3.onrender.com';
};
