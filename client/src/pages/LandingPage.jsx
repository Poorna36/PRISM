import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Prism from '../components/Prism';
import AboutPage from './AboutPage';
import TutorialShowcase from '../components/TutorialShowcase';


export default function LandingPage({ onEnter }) {
  const [activePage, setActivePage] = useState('home');
  const [showTutorial, setShowTutorial] = useState(false);

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
      {/* Pulse dot keyframe */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }
        @keyframes watch-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); }
          50% { box-shadow: 0 0 20px 4px rgba(99,102,241,0.45); }
        }
      `}</style>

      {/* Tutorial Showcase */}
      <AnimatePresence>
        {showTutorial && <TutorialShowcase onClose={() => setShowTutorial(false)} />}
      </AnimatePresence>

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {/* Watch Tutorial button — special style */}
          <button
            id="watch-tutorial-btn"
            onClick={() => setShowTutorial(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.2))',
              border: '1px solid rgba(99,102,241,0.5)',
              borderRadius: '999px',
              padding: '8px 20px',
              color: '#c4b5fd',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.25s ease',
              textTransform: 'uppercase',
              animation: 'watch-glow 3s ease-in-out infinite',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(168,85,247,0.4))';
              e.currentTarget.style.color = '#ede9fe';
              e.currentTarget.style.transform = 'scale(1.04)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.2))';
              e.currentTarget.style.color = '#c4b5fd';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {/* Play icon */}
            <svg width="9" height="11" viewBox="0 0 9 11" fill="currentColor">
              <path d="M0 0L9 5.5L0 11V0Z" />
            </svg>
            Watch Tutorial
          </button>

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
