import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Prism from '../components/Prism';
import AboutPage from './AboutPage';

export default function LandingPage({ onEnter }) {
  const [activePage, setActivePage] = useState('home');

  if (activePage === 'about') {
    return <AboutPage onBack={() => setActivePage('home')} />;
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#000',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {/* Full-screen Prism WebGL background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Prism
          animationType="rotate"
          timeScale={0.5}
          height={3.5}
          baseWidth={5.5}
          scale={3.6}
          hueShift={0}
          colorFrequency={1}
          noise={0}
          glow={1}
          bloom={1}
          transparent={true}
        />
      </div>

      {/* Top Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px 48px',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)'
        }}
      >
        {/* Logo */}
        <span style={{
          fontSize: '1.25rem',
          fontWeight: 800,
          letterSpacing: '0.3em',
          color: '#fff',
          opacity: 0.9
        }}>
          PRISM
        </span>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          {[
            { label: 'About', onClick: () => setActivePage('about') },
            { label: 'Login', onClick: onEnter, highlight: true },
            { label: 'Contact', onClick: null },
          ].map(({ label, onClick, highlight }) => (
            <button
              key={label}
              onClick={onClick || undefined}
              style={{
                background: highlight ? 'rgba(255,255,255,0.15)' : 'transparent',
                border: highlight ? '1px solid rgba(255,255,255,0.35)' : 'none',
                borderRadius: '999px',
                padding: highlight ? '8px 24px' : '4px 0',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: highlight ? 600 : 400,
                letterSpacing: '0.1em',
                cursor: onClick ? 'pointer' : 'default',
                opacity: onClick ? 1 : 0.65,
                backdropFilter: highlight ? 'blur(8px)' : 'none',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
              }}
              onMouseEnter={e => {
                if (highlight) e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              }}
              onMouseLeave={e => {
                if (highlight) e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </motion.nav>

      {/* Center — PRISM title only */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
          pointerEvents: 'none'
        }}
      >
        <motion.h1
          style={{
            fontSize: 'clamp(4rem, 12vw, 10rem)',
            fontWeight: 900,
            letterSpacing: '0.3em',
            color: '#ffffff',
            textShadow: '0 0 80px rgba(255,255,255,0.3), 0 0 20px rgba(255,255,255,0.5)',
            margin: 0,
            lineHeight: 1,
            fontFamily: '"Orbitron", sans-serif',
          }}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        >
          PRISM
        </motion.h1>

        <motion.p
          style={{
            marginTop: '1rem',
            fontSize: 'clamp(0.65rem, 1.5vw, 0.85rem)',
            letterSpacing: '0.35em',
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: 0.8, ease: 'easeOut' }}
        >
          Customer Review Intelligence
        </motion.p>
      </div>

      {/* Bottom Copyright */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 48px',
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
        }}
      >
        <p style={{
          margin: 0,
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          color: 'rgba(255,255,255,0.35)',
        }}>
          © {new Date().getFullYear()} PRISM — Customer Review Intelligence. All rights reserved.
        </p>
      </motion.footer>
    </div>
  );
}
