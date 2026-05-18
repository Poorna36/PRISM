import { motion } from 'framer-motion';
import Prism from '../components/Prism';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: 'easeOut' },
});

const FEATURES = [
  {
    icon: '🧠',
    title: 'NLP Intelligence Pipeline',
    desc: 'Every review is automatically classified for sentiment, sarcasm detection, and key feature extraction using state-of-the-art language models.',
  },
  {
    icon: '📊',
    title: 'Multi-Platform Aggregation',
    desc: 'Collects and normalises feedback from Amazon, Flipkart, JioMart, and brand websites into a single unified data stream.',
  },
  {
    icon: '🔍',
    title: 'Trust Scoring & Spam Filtering',
    desc: 'A dedicated trust layer detects fake reviews, duplicate submissions, and spam before any data enters the analytics pipeline.',
  },
  {
    icon: '⚡',
    title: 'Real-Time Ingestion',
    desc: 'Reviews are processed the moment they are submitted, with embeddings and scores computed in milliseconds.',
  },
  {
    icon: '📈',
    title: 'Complaint Trend Analytics',
    desc: 'Automatically identifies complaint intensity spikes, recurring themes, and product-level regression signals over time.',
  },
  {
    icon: '🌐',
    title: 'Multi-Language Support',
    desc: 'Handles reviews in multiple Indian languages through transliteration and translation fallbacks, ensuring complete market coverage.',
  },
];

const TEAM = [
  { name: 'INFERENTIA', role: 'DEVELOPED BY' },
];

export default function AboutPage({ onBack }) {
  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      overflowX: 'hidden',
    }}>

      {/* Fixed Prism WebGL background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <Prism
          animationType="rotate"
          timeScale={0.3}
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

      {/* Dark overlay so text is readable */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1,
        background: 'rgba(0,0,0,0.72)',
        backdropFilter: 'blur(2px)',
      }} />

      {/* All page content sits above the background */}
      <div style={{ position: 'relative', zIndex: 2 }}>

      {/* ── Top Nav ── */}
      <nav style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 48px',
        background: 'rgba(10,10,15,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '0.3em', color: '#fff' }}>
          PRISM
        </span>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: '999px',
            padding: '8px 22px',
            color: '#fff',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            textTransform: 'uppercase',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
        >
          ← Back
        </button>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        textAlign: 'center',
        padding: '100px 24px 80px',
        background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)',
      }}>
        <motion.div {...fadeUp(0)}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.35)',
            borderRadius: '999px',
            padding: '5px 18px',
            fontSize: '0.75rem',
            fontWeight: 600,
            letterSpacing: '0.15em',
            color: '#a5b4fc',
            textTransform: 'uppercase',
            marginBottom: '24px',
          }}>
            About the Platform
          </span>
        </motion.div>

        <motion.h1 {...fadeUp(0.1)} style={{
          fontSize: 'clamp(2.5rem, 7vw, 5rem)',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
          margin: '0 auto 24px',
          maxWidth: '800px',
          background: 'linear-gradient(135deg, #fff 40%, rgba(165,180,252,0.8))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          What is PRISM?
        </motion.h1>

        <motion.p {...fadeUp(0.2)} style={{
          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
          lineHeight: 1.75,
          color: 'rgba(255,255,255,0.55)',
          maxWidth: '680px',
          margin: '0 auto 40px',
        }}>
          PRISM — <strong style={{ color: 'rgba(255,255,255,0.8)' }}>Customer Review Intelligence</strong> — is
          an AI-powered analytics engine built to decode what customers actually think about products. It
          ingests reviews from e-commerce platforms, filters noise, extracts meaning, and surfaces the signals
          that matter most to product teams and brand strategists.
        </motion.p>

        <motion.div {...fadeUp(0.3)} style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          {['Amazon', 'Flipkart', 'JioMart', 'Brand Store'].map(p => (
            <span key={p} style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '999px',
              padding: '6px 16px',
              fontSize: '0.8rem',
              color: 'rgba(255,255,255,0.6)',
              fontWeight: 500,
            }}>
              {p}
            </span>
          ))}
        </motion.div>
      </section>

      {/* ── Product Demo ── */}
      <section style={{ padding: '0 24px 80px', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <motion.div {...fadeUp(0.4)} style={{
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}>
          <img 
            src="/prism_demo.png" 
            alt="PRISM Dashboard Snapshot" 
            style={{ width: '100%', height: 'auto', display: 'block' }} 
          />
        </motion.div>
      </section>

      {/* ── Mission ── */}
      <section style={{ padding: '80px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <motion.div {...fadeUp(0)} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
        }}>
          {[
            {
              title: 'The Problem',
              color: '#f87171',
              text: 'Brands receive thousands of reviews daily across platforms. Most go unread. The few that get seen are often cherry-picked. Real pain points get buried, products stagnate, and customers feel ignored.',
            },
            {
              title: 'Our Solution',
              color: '#34d399',
              text: 'PRISM automatically collects, normalises, and analyses every review. Its NLP pipeline scores sentiment, detects sarcasm, flags fake reviews, and clusters complaints — turning noise into clear, actionable intelligence.',
            },
            {
              title: 'The Impact',
              color: '#60a5fa',
              text: 'Product teams get daily briefings. Engineers see regression signals before they escalate. Brand managers know exactly which features customers love or hate — all from a single unified dashboard.',
            },
          ].map(({ title, color, text }) => (
            <div key={title} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '16px',
              padding: '28px',
            }}>
              <div style={{
                width: '40px',
                height: '4px',
                background: color,
                borderRadius: '2px',
                marginBottom: '16px',
              }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '10px', color: '#fff' }}>{title}</h3>
              <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'rgba(255,255,255,0.55)', margin: 0 }}>{text}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section style={{
        padding: '80px 24px',
        background: 'rgba(255,255,255,0.015)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <motion.h2 {...fadeUp(0)} style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
            fontWeight: 800,
            textAlign: 'center',
            marginBottom: '12px',
            letterSpacing: '-0.02em',
          }}>
            Core Capabilities
          </motion.h2>
          <motion.p {...fadeUp(0.1)} style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.45)',
            fontSize: '0.95rem',
            marginBottom: '56px',
          }}>
            Every layer of the pipeline is purpose-built for review intelligence.
          </motion.p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
          }}>
            {FEATURES.map(({ icon, title, desc }, i) => (
              <motion.div
                key={title}
                {...fadeUp(i * 0.05)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '16px',
                  padding: '28px',
                  transition: 'border-color 0.2s, background 0.2s',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
                  e.currentTarget.style.background = 'rgba(99,102,241,0.05)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '14px' }}>{icon}</div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px' }}>{title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: '80px 24px', maxWidth: '900px', margin: '0 auto' }}>
        <motion.h2 {...fadeUp(0)} style={{
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
          fontWeight: 800,
          textAlign: 'center',
          marginBottom: '56px',
          letterSpacing: '-0.02em',
        }}>
          How It Works
        </motion.h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {[
            { step: '01', title: 'Review Ingestion', desc: 'Customers submit reviews on simulated storefronts (Amazon, Flipkart, JioMart). Each submission is immediately POSTed to the PRISM backend API.' },
            { step: '02', title: 'Trust Filtering', desc: 'Incoming reviews pass through a spam and duplicate detection layer. Low-trust submissions are flagged or discarded before analysis.' },
            { step: '03', title: 'NLP Embedding & Scoring', desc: 'Valid reviews are embedded using transformer models. Sentiment, sarcasm probability, and complaint intensity are computed and stored.' },
            { step: '04', title: 'Dashboard Visualisation', desc: 'Scores, trends, and feature clusters are surfaced on the PRISM dashboard — with real-time charts, alerts, and AI-generated briefings.' },
          ].map(({ step, title, desc }, i) => (
            <motion.div key={step} {...fadeUp(i * 0.08)} style={{
              display: 'flex',
              gap: '24px',
              padding: '28px 0',
              borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
            }}>
              <div style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                color: 'rgba(99,102,241,0.8)',
                letterSpacing: '0.1em',
                minWidth: '32px',
                paddingTop: '4px',
              }}>
                {step}
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '8px', margin: '0 0 8px' }}>{title}</h3>
                <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, margin: 0 }}>{desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Built By ── */}
      <section style={{
        padding: '60px 24px',
        textAlign: 'center',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <motion.h2 {...fadeUp(0)} style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          marginBottom: '32px',
          color: 'rgba(255,255,255,0.8)',
        }}>
          Built By
        </motion.h2>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {TEAM.map(({ name, role }) => (
            <div key={name} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '20px 32px',
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>{name}</div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>{role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        textAlign: 'center',
        padding: '24px',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        fontSize: '0.75rem',
        color: 'rgba(255,255,255,0.25)',
        letterSpacing: '0.05em',
      }}>
        © {new Date().getFullYear()} PRISM — Customer Review Intelligence. All rights reserved.
      </footer>
      </div>{/* end zIndex:2 content wrapper */}
    </div>
  );
}
