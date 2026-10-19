export const SESSION_EVENT = 'vault-session-change';

export function tokenExpiry(token) {
  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized));
    return Number.isFinite(decoded.exp) ? decoded.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

export function getValidToken() {
  const token = localStorage.getItem('vaultToken');
  if (!token) return null;
  if (tokenExpiry(token) <= Date.now()) {
    clearSession();
    return null;
  }
  return token;
}

export function setSession(token) {
  if (!token || tokenExpiry(token) <= Date.now()) return false;
  localStorage.setItem('vaultToken', token);
  window.dispatchEvent(new Event(SESSION_EVENT));
  return true;
}

export function clearSession() {
  if (!localStorage.getItem('vaultToken')) return;
  localStorage.removeItem('vaultToken');
  window.dispatchEvent(new Event(SESSION_EVENT));
}
