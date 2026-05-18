import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import PrismaticBurst from '../components/PrismaticBurst';

const inputStyle = {
  width: '100%', padding: '11px 14px',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px', color: '#fff',
  fontSize: '0.9rem', outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};
const labelStyle = {
  display: 'block', marginBottom: '6px',
  fontSize: '0.75rem', fontWeight: 600,
  color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em',
  textTransform: 'uppercase',
};

export default function AuthPage() {
  const { login, loginError, register, registerError } = useAuthStore();
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  // Login fields
  const [empId, setEmpId] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [regEmpId, setRegEmpId] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regLocalError, setRegLocalError] = useState('');

  const [submitting, setSubmitting] = useState(false);

  async function onLogin(e) {
    e.preventDefault();
    setSubmitting(true);
    await login(empId, password);
    setSubmitting(false);
  }

  async function onRegister(e) {
    e.preventDefault();
    setRegLocalError('');
    if (regPassword !== regConfirm) {
      setRegLocalError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    await register(regEmpId, regFullName, regEmail, regPassword);
    setSubmitting(false);
  }

  function switchMode(m) {
    setMode(m);
    setRegLocalError('');
  }

  const error = mode === 'login' ? loginError : (regLocalError || registerError);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>

      {/* PrismaticBurst background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <PrismaticBurst
          animationType="rotate3d"
          intensity={2}
          speed={0.5}
          distort={0}
          paused={false}
          offset={{ x: 0, y: 0 }}
          hoverDampness={0.25}
          rayCount={0}
          mixBlendMode="normal"
          colors={['#A855F7', '#7C3AED', '#6366F1', '#3B82F6', '#ffffff']}
        />
      </div>

      {/* Dark overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
      }} />

      {/* Card */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}>
        <motion.div
          key={mode}
          initial={{ y: 20, opacity: 0, scale: 0.97 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
          style={{
            width: '100%', maxWidth: '420px',
            background: 'rgba(10, 10, 20, 0.75)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '20px', padding: '36px 40px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: '28px', textAlign: 'center' }}>
            <h1 style={{
              fontSize: '2rem', fontWeight: 900, letterSpacing: '0.15em',
              color: '#fff', margin: '0 0 4px', fontFamily: '"Orbitron", sans-serif',
            }}>
              PRISM
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', letterSpacing: '0.05em' }}>
              Customer Review Intelligence
            </p>
          </div>

          {/* Mode Tabs */}
          <div style={{
            display: 'flex', marginBottom: '28px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '10px', padding: '4px',
          }}>
            {[['login', 'Sign In'], ['register', 'Create Account']].map(([m, label]) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                style={{
                  flex: 1, padding: '9px',
                  background: mode === m ? 'rgba(124,58,237,0.7)' : 'transparent',
                  border: 'none', borderRadius: '8px',
                  color: mode === m ? '#fff' : 'rgba(255,255,255,0.45)',
                  fontSize: '0.8rem', fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s',
                  letterSpacing: '0.03em',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Forms */}
          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onSubmit={onLogin}
                style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
              >
                <div>
                  <label style={labelStyle}>Employee ID</label>
                  <input
                    style={inputStyle} placeholder="npd570"
                    value={empId} onChange={e => setEmpId(e.target.value)}
                    autoComplete="username"
                    onFocus={e => e.target.style.borderColor = 'rgba(167,139,250,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Password</label>
                  <input
                    type="password" style={inputStyle}
                    value={password} onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password"
                    onFocus={e => e.target.style.borderColor = 'rgba(167,139,250,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                </div>
                {error && <p style={{ margin: 0, textAlign: 'center', fontSize: '0.82rem', color: '#f87171' }}>{error}</p>}
                <motion.button
                  type="submit" disabled={submitting}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{
                    marginTop: '4px', padding: '13px',
                    background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                    border: 'none', borderRadius: '10px', color: '#fff',
                    fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.08em',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.6 : 1,
                    boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                  }}
                >
                  {submitting ? 'Signing in…' : 'Sign In'}
                </motion.button>
              </motion.form>
            ) : (
              <motion.form
                key="register-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={onRegister}
                style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
              >
                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    style={inputStyle} placeholder="Your full name"
                    value={regFullName} onChange={e => setRegFullName(e.target.value)}
                    onFocus={e => e.target.style.borderColor = 'rgba(167,139,250,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Employee ID</label>
                  <input
                    style={inputStyle} placeholder="e.g. emp001"
                    value={regEmpId} onChange={e => setRegEmpId(e.target.value)}
                    onFocus={e => e.target.style.borderColor = 'rgba(167,139,250,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email" style={inputStyle} placeholder="you@company.com"
                    value={regEmail} onChange={e => setRegEmail(e.target.value)}
                    onFocus={e => e.target.style.borderColor = 'rgba(167,139,250,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Password</label>
                  <input
                    type="password" style={inputStyle} placeholder="Min. 6 characters"
                    value={regPassword} onChange={e => setRegPassword(e.target.value)}
                    onFocus={e => e.target.style.borderColor = 'rgba(167,139,250,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Confirm Password</label>
                  <input
                    type="password" style={inputStyle} placeholder="Repeat password"
                    value={regConfirm} onChange={e => setRegConfirm(e.target.value)}
                    onFocus={e => e.target.style.borderColor = 'rgba(167,139,250,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                </div>
                {error && <p style={{ margin: 0, textAlign: 'center', fontSize: '0.82rem', color: '#f87171' }}>{error}</p>}
                <motion.button
                  type="submit" disabled={submitting}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  style={{
                    marginTop: '4px', padding: '13px',
                    background: 'linear-gradient(135deg, #7C3AED, #6366F1)',
                    border: 'none', borderRadius: '10px', color: '#fff',
                    fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.08em',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.6 : 1,
                    boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
                  }}
                >
                  {submitting ? 'Creating account…' : 'Create Account'}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
