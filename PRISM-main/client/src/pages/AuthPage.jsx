import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';

const ROLES = [
  {
    id: 'product',
    name: 'Product Team',
    description: 'Full access to all intelligence panels, feature analysis, and system metrics',
    color: '#00D4FF'
  },
  {
    id: 'operations',
    name: 'Operations',
    description: 'Focus on operational metrics, batch issues, platform performance, and alerts',
    color: '#FF6B35'
  },
  {
    id: 'management',
    name: 'Management',
    description: 'Executive dashboard with health scores, summaries, and strategic insights',
    color: '#00E5A0'
  },
  {
    id: 'support',
    name: 'CX/Support',
    description: 'Customer sentiment, feature feedback, and review drilldown capabilities',
    color: '#FF3D5A'
  }
];

export default function AuthPage() {
  const { login, loginError } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dots, setDots] = useState([]);

  useEffect(() => {
    const generateDots = () => {
      const newDots = [];
      for (let i = 0; i < 50; i++) {
        newDots.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 3 + 1,
          duration: Math.random() * 20 + 10
        });
      }
      setDots(newDots);
    };
    generateDots();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    
    // Validate credentials via store
    const trimmedEmployeeId = employeeId.trim();
    const trimmedPassword = password.trim();
    
    console.log('Attempting login with:', { employeeId: trimmedEmployeeId, password: trimmedPassword });
    
    const success = await login(trimmedEmployeeId, trimmedPassword);
    console.log('Login result:', success);
    
    if (success) {
      // Store role in localStorage only on successful login
      localStorage.setItem('prism_role', selectedRole.id);
    } else {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-base relative overflow-hidden">
      {/* Animated Grid Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-grid animate-grid" />
      </div>
      
      {/* Animated Dots */}
      {dots.map(dot => (
        <motion.div
          key={dot.id}
          className="absolute w-2 h-2 bg-accent-cyan rounded-full"
          style={{
            left: `${dot.x}%`,
            top: `${dot.y}%`,
            width: `${dot.size}px`,
            height: `${dot.size}px`
          }}
          animate={{
            x: [0, 20, 0],
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{
            duration: dot.duration,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}

      <motion.div
        className="relative min-h-screen flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="w-full max-w-2xl card p-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          {/* Logo */}
          <div className="flex items-center mb-8">
            <div className="w-3 h-3 bg-accent-cyan rounded-sm mr-3" />
            <h1 className="text-3xl font-display font-bold text-text-primary">PRISM</h1>
          </div>

          {/* Role Selection Tabs */}
          <div className="mb-8">
            <div className="section-label">SELECT ROLE</div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {ROLES.map((role) => (
                <motion.button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`chip text-xs font-mono transition-all ${
                    selectedRole.id === role.id ? 'chip-active' : ''
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    borderColor: selectedRole.id === role.id ? role.color : undefined
                  }}
                >
                  {role.name}
                </motion.button>
              ))}
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedRole.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="p-3 bg-bg-elevated rounded-industrial border border-border"
              >
                <p className="text-xs text-text-secondary">{selectedRole.description}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Login Form */}
          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="section-label">EMPLOYEE ID</label>
              <input
                type="text"
                className="w-full bg-bg-elevated border border-border px-4 py-3 rounded-industrial text-text-primary placeholder-text-secondary focus:border-accent-cyan focus:outline-none focus:ring-1 focus:ring-accent-cyan/50 transition-all"
                placeholder="Enter employee ID"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                autoComplete="username"
              />
            </div>
            
            <div>
              <label className="section-label">PASSWORD</label>
              <input
                type="password"
                className="w-full bg-bg-elevated border border-border px-4 py-3 rounded-industrial text-text-primary placeholder-text-secondary focus:border-accent-cyan focus:outline-none focus:ring-1 focus:ring-accent-cyan/50 transition-all"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <p className="mt-2 text-xs text-text-secondary font-mono">ID: npd570 | Password: notre570</p>
            </div>

            <AnimatePresence mode="wait">
              {loginError ? (
                <motion.p
                  key="err"
                  className="text-center text-sm text-negative"
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
              disabled={submitting || !employeeId || !password}
              className="w-full btn-primary py-3 text-base font-display font-bold"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                backgroundColor: submitting ? 'var(--text-secondary)' : undefined,
                cursor: submitting || !employeeId || !password ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <motion.div
                    className="w-4 h-4 border-2 border-bg-base border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  AUTHENTICATING...
                </span>
              ) : (
                'ACCESS PLATFORM'
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-xs text-text-secondary font-mono">
              PRECISION INDUSTRIAL INTELLIGENCE PLATFORM
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
