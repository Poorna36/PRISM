import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

export default function AuthPage() {
  const { login, loginError } = useAuthStore();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    await login(employeeId, password);
    setSubmitting(false);
  }

  return (
    <motion.div
      className="flex min-h-screen items-center justify-center bg-canvas px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="w-full max-w-md rounded-xl border border-slate-700 bg-surface p-8 shadow-xl shadow-black/20"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      >
        <div className="mb-8 text-center">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-400/90">
            Enterprise
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">PRISM</h1>
          <p className="mt-1 text-sm text-slate-400">Customer Review Intelligence</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Employee ID</label>
            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2.5 text-sm text-white outline-none ring-sky-500/30 transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2"
              placeholder="npd570"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-400">Password</label>
            <input
              type="password"
              className="w-full rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-2.5 text-sm text-white outline-none ring-sky-500/30 transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <AnimatePresence mode="wait">
            {loginError ? (
              <motion.p
                key="err"
                className="text-center text-sm text-red-500"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: [0, -4, 4, -3, 3, 0] }}
                transition={{ x: { duration: 0.45 } }}
                exit={{ opacity: 0 }}
              >
                {loginError}
              </motion.p>
            ) : null}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-sky-600 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-60"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            {submitting ? 'Signing in…' : 'Sign In'}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}
