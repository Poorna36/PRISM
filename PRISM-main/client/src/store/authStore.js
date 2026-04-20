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
    // Fallback: check if we have a stored session for offline demo mode
    const demoAuth = localStorage.getItem('prism_demo_auth');
    if (demoAuth) {
      set({
        isAuthenticated: true,
        employeeId: 'npd570',
        isCheckingSession: false,
        loginError: null,
      });
      return;
    }
    set({ isAuthenticated: false, employeeId: null, isCheckingSession: false });
  },

  login: async (employeeId, password) => {
    set({ loginError: null });
    
    try {
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
    } catch (error) {
      console.log('API login failed, using fallback:', error.message);
      // Fallback authentication for demo
      if (employeeId === 'npd570' && password === 'notre570') {
        localStorage.setItem('prism_demo_auth', 'true');
        set({
          isAuthenticated: true,
          employeeId: employeeId,
          loginError: null,
        });
        return true;
      } else {
        set({ loginError: 'Authentication Failed' });
        return false;
      }
    }
  },

  logout: async () => {
    try {
      await apiLogout();
    } catch (e) {
      // ignore network errors on logout
    }
    localStorage.removeItem('prism_demo_auth');
    set({ isAuthenticated: false, employeeId: null });
  },
}));
