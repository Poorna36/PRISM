import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Orb from '../components/Orb';

export default function LandingPage({ onEnter, onGetStarted }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const handleGetStarted = () => {
    setIsAnimating(true);
    if (onGetStarted) onGetStarted();
    setTimeout(() => {
      onEnter();
    }, 5900); // 6.0 second transition
  };

  return (
    <motion.div 
      className="fixed inset-0 flex flex-col items-center select-none z-50" 
      animate={{ backgroundColor: isAnimating ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,1)' }}
      transition={{ duration: 4.0, ease: 'easeInOut' }}
      style={{ backgroundColor: 'black', margin: 0, padding: 0 }}
    >
      <AnimatePresence mode="wait">
        {!showAbout ? (
          <motion.div
            key="hero"
            className="absolute inset-0 flex flex-col items-center justify-center"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* About Us - Top Right */}
            <motion.p
              animate={{ opacity: isAnimating ? 0 : 1 }}
              transition={{ duration: 0.3 }}
              onClick={() => setShowAbout(true)}
              className="absolute top-6 right-8 z-20 text-white/60 hover:text-white text-sm font-mono tracking-widest cursor-pointer transition-colors duration-300 select-auto"
            >
              ABOUT US
            </motion.p>

            {/* Background Orb */}
            <motion.div 
              className="absolute inset-0 z-0"
              animate={{ opacity: isAnimating ? 0 : 1 }}
              transition={{ duration: 3.0 }}
            >
              <Orb
                hoverIntensity={2}
                rotateOnHover
                hue={0}
                forceHoverState={false}
                backgroundColor="#000000"
              />
            </motion.div>

            <div className="relative z-10 flex flex-col items-center pointer-events-none">
              <motion.h1 
                animate={
                  isAnimating 
                    ? { scale: 500, opacity: [1, 1, 0] } 
                    : { scale: 1, opacity: 1 }
                }
                transition={{ 
                  duration: 6.0, 
                  ease: [0.4, 0, 0.2, 1],
                  opacity: { times: [0, 0.75, 1] } 
                }}
                className="text-white text-6xl md:text-8xl lg:text-9xl font-display font-bold tracking-widest mb-12 origin-center"
              >
                PRSIM
              </motion.h1>
              
              <div className="pointer-events-auto">
                <motion.button 
                  animate={{ opacity: isAnimating ? 0 : 1, scale: isAnimating ? 0.8 : 1 }}
                  transition={{ duration: 0.3 }}
                  onClick={handleGetStarted}
                  disabled={isAnimating}
                  className={`px-8 py-3 bg-accent-cyan text-bg-base font-bold text-lg rounded-full hover:bg-white transition-colors duration-300 shadow-[0_0_15px_rgba(0,212,255,0.5)] hover:shadow-[0_0_25px_rgba(255,255,255,0.8)] ${isAnimating ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  Get Started
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="about"
            className="absolute inset-0 overflow-y-auto bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="min-h-screen w-full flex items-center justify-center px-6 py-24">
              <motion.div 
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="max-w-4xl w-full"
              >
                <h2 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 tracking-wide">About PRISM</h2>
                <div className="w-20 h-1 bg-accent-cyan rounded-full mb-8" />
                <p className="text-white/80 text-lg md:text-xl leading-relaxed mb-8">
                  PRISM is an AI-powered Customer Review Intelligence Platform that ingests noisy, multilingual e-commerce reviews from simulated platform pages, processes them through a full backend intelligence pipeline, and delivers feature-level sentiment analysis, graph-based issue classification, trend detection, and prioritized recommendations through an enterprise dashboard.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="text-accent-cyan text-2xl mb-3">🎯</div>
                    <h3 className="text-white font-display font-bold text-lg mb-2">Sentiment Analysis</h3>
                    <p className="text-white/60 text-sm leading-relaxed">Feature-level sentiment breakdown with granular insights across every product dimension.</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="text-accent-cyan text-2xl mb-3">🕸️</div>
                    <h3 className="text-white font-display font-bold text-lg mb-2">Issue Classification</h3>
                    <p className="text-white/60 text-sm leading-relaxed">Graph-based network analysis to cluster and classify emerging issues automatically.</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="text-accent-cyan text-2xl mb-3">📈</div>
                    <h3 className="text-white font-display font-bold text-lg mb-2">Trend Detection</h3>
                    <p className="text-white/60 text-sm leading-relaxed">Weekly trend tracking with real-time alerts and prioritized recommendations.</p>
                  </div>
                </div>

                {/* AI & NLP Powering PRISM */}
                <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-6 tracking-wide">Powered By AI</h3>

                {/* Sarvam AI — Hero Card */}
                <div className="relative bg-gradient-to-br from-accent-cyan/20 via-accent-cyan/10 to-transparent border border-accent-cyan/30 rounded-2xl p-8 mb-6 overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-accent-cyan/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">🧠</span>
                      <h4 className="text-2xl font-display font-bold text-accent-cyan">Sarvam AI</h4>
                      <span className="ml-2 px-3 py-1 bg-accent-cyan/20 border border-accent-cyan/40 rounded-full text-accent-cyan text-xs font-mono tracking-wider">CORE ENGINE</span>
                    </div>
                    <p className="text-white/90 text-base leading-relaxed mb-4">
                      The backbone of PRISM's intelligence pipeline. Sarvam AI powers <span className="text-accent-cyan font-semibold">Stage 1 — Language Normalization</span>, the critical first step that makes every downstream analysis possible. Without it, the rest of the pipeline would be processing noise.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div className="flex items-start gap-2">
                        <span className="text-accent-cyan mt-0.5">▸</span>
                        <span className="text-white/70 text-sm"><span className="text-white font-semibold">Multilingual translation</span> — English, Hindi, Hinglish, Kannada & more</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-accent-cyan mt-0.5">▸</span>
                        <span className="text-white/70 text-sm"><span className="text-white font-semibold">Code-switching handling</span> — seamlessly processes mixed-language text</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-accent-cyan mt-0.5">▸</span>
                        <span className="text-white/70 text-sm"><span className="text-white font-semibold">Slang & emoji normalization</span> — converts informal text to clean English</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-accent-cyan mt-0.5">▸</span>
                        <span className="text-white/70 text-sm"><span className="text-white font-semibold">Broken grammar repair</span> — fixes incomplete sentences & typos</span>
                      </div>
                    </div>
                    <p className="text-white/50 text-xs font-mono">Every review enters noisy — Sarvam AI ensures it leaves clean, structured, and ready for analysis.</p>
                  </div>
                </div>

                {/* NLP + Gemini — Smaller Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">🔬</span>
                      <h4 className="text-lg font-display font-bold text-white">NLP Embeddings</h4>
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed mb-3">
                      Semantic feature extraction using <span className="text-white/80 font-semibold">all-MiniLM-L6-v2</span> sentence embeddings. Goes beyond keyword matching — detects paraphrases, synonyms, and domain-specific language to identify which product features a review discusses.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white/50 text-xs font-mono">384-dim vectors</span>
                      <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white/50 text-xs font-mono">cosine similarity</span>
                      <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white/50 text-xs font-mono">~30ms/embedding</span>
                    </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">✨</span>
                      <h4 className="text-lg font-display font-bold text-white">Gemini API</h4>
                    </div>
                    <p className="text-white/60 text-sm leading-relaxed mb-3">
                      Powers <span className="text-white/80 font-semibold">Stage 7 — Adaptive Feedback</span>. Generates contextual follow-up survey questions based on detected issues, enabling targeted clarification and continuous pipeline improvement.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white/50 text-xs font-mono">survey generation</span>
                      <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white/50 text-xs font-mono">adaptive feedback</span>
                      <span className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-white/50 text-xs font-mono">confidence tuning</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-10">
                  <h3 className="text-white font-display font-bold text-lg mb-3">How It Works</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/70 leading-relaxed">
                    <div>
                      <span className="text-accent-cyan font-bold">1.</span> Simulation pages post real-world e-commerce reviews to the ingestion API
                    </div>
                    <div>
                      <span className="text-accent-cyan font-bold">2.</span> Sarvam AI normalizes multilingual, noisy input into clean English
                    </div>
                    <div>
                      <span className="text-accent-cyan font-bold">3.</span> NLP embeddings extract features & score sentiment per feature
                    </div>
                    <div>
                      <span className="text-accent-cyan font-bold">4.</span> Gemini generates adaptive follow-up surveys for issue validation
                    </div>
                  </div>
                </div>

                <p className="text-white/40 text-xs font-mono tracking-wider text-center mb-10">
                  PRECISION INDUSTRIAL INTELLIGENCE PLATFORM
                </p>

                {/* Back to Home Button */}
                <div className="flex justify-center">
                  <motion.button 
                    onClick={() => setShowAbout(false)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-8 py-3 border border-white/30 text-white font-bold text-lg rounded-full hover:bg-white/10 transition-colors duration-300 cursor-pointer"
                  >
                    Back to Home
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
