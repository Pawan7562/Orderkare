const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;
const configuredMenuUrl = process.env.EXPO_PUBLIC_MENU_URL;

export const API_BASE_URL = configuredApiUrl || 'https://orderkare-3.onrender.com/api/v1';
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
// Points to the live website customer menu domain
export const MENU_BASE_URL = configuredMenuUrl || 'https://orderkare.co.in';
