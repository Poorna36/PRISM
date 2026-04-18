import { create } from 'zustand';
import { getSession, login as apiLogin, logout as apiLogout } from '../api';

export const useAuthStore = create((set) => ({
  isAuthenticated: false,
  isCheckingSession: true,
  employeeId: null,
  loginError: null,

  checkSession: async () => {
    set({ isCheckingSession: true });
    try {
      const res = await getSession();
      if (res.ok) {
        const data = await res.json();
        set({
          isAuthenticated: true,
          employeeId: data.employee_id,
          isCheckingSession: false,
          loginError: null,
        });
        return;
      }
    } catch {
      /* network */
    }
    set({ isAuthenticated: false, employeeId: null, isCheckingSession: false });
  },

  login: async (employeeId, password) => {
    set({ loginError: null });
    const res = await apiLogin(employeeId, password);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      set({ loginError: data.error || 'Authentication Failed' });
      return false;
    }
    set({
      isAuthenticated: true,
      employeeId: data.employee_id || employeeId,
      loginError: null,
    });
    return true;
  },

  logout: async () => {
    await apiLogout();
    set({ isAuthenticated: false, employeeId: null });
  },
}));
