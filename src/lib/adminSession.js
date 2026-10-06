let isAdminAuthenticated = false;
const listeners = new Set();

export function subscribeToAdminSession(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAdminSessionSnapshot() {
  return isAdminAuthenticated;
}

export function getServerAdminSessionSnapshot() {
  return false;
}

export function setAdminAuthenticated(authenticated) {
  isAdminAuthenticated = authenticated;
  listeners.forEach((listener) => listener());
}
