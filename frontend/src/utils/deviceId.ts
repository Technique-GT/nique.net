const DEVICE_ID_KEY = 'nique_device_id';

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `dev_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
};

export const getDeviceId = () => {
  if (typeof window === 'undefined') return '';
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const next = generateId();
  window.localStorage.setItem(DEVICE_ID_KEY, next);
  return next;
};
