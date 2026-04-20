import { motion } from 'framer-motion';

const PLATFORMS = [
  { id: 'amazon', label: 'Amazon', icon: 'ð', color: '#FF9900' },
  { id: 'flipkart', label: 'Flipkart', icon: 'ð', color: '#2874F0' },
  { id: 'jiomart', label: 'JioMart', icon: 'ð', color: '#004B8D' },
  { id: 'brand', label: 'Brand Store', icon: 'ð', color: '#6B7A99' },
];

function HealthScoreRing({ score, size = 40, strokeWidth = 3 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#1C2537"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={score >= 80 ? '#00E5A0' : score >= 60 ? '#FF6B35' : '#FF3D5A'}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </svg>
  );
}

export default function PlatformToggle({ value, onChange, comparison }) {
  const scores = comparison || {};

  // Mock health scores for demo
  const mockScores = {
    amazon: { health_score: 85, top_features: ['app_performance', 'delivery', 'pricing'] },
    flipkart: { health_score: 72, top_features: ['ui_ux', 'customer_service', 'quality'] },
    jiomart: { health_score: 68, top_features: ['delivery', 'pricing', 'features'] },
    brand: { health_score: 91, top_features: ['quality', 'features', 'app_performance'] }
  };

  const platformScores = { ...mockScores, ...scores };

  return (
    <div className="space-y-4">
      {/* Section Label */}
      <div className="section-label">PLATFORM COMPARISON</div>
      
      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-4">
        {PLATFORMS.map((platform, index) => {
          const isActive = value === platform.id;
          const score = platformScores[platform.id]?.health_score || 75;
          const topFeatures = platformScores[platform.id]?.top_features || [];
          
          return (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onChange(platform.id)}
              className={`card cursor-pointer transition-all hover:border-accent-cyan/50 ${
                isActive ? 'border-accent-cyan glow-cyan' : ''
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Platform Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span 
                    className="text-xl"
                    style={{ color: platform.color }}
                  >
                    {platform.icon}
                  </span>
                  <h4 className="font-display font-semibold text-text-primary text-sm">
                    {platform.label}
                  </h4>
                </div>
                
                {/* Health Score Ring */}
                <div className="relative">
                  <HealthScoreRing score={score} size={32} strokeWidth={2} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-mono text-text-primary font-bold">
                      {score}
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Features */}
              <div className="space-y-2">
                <p className="text-xs font-mono text-text-secondary uppercase tracking-[0.15em]">
                  Top Features
                </p>
                <div className="flex flex-wrap gap-1">
                  {topFeatures.map((feature, idx) => (
                    <div
                      key={idx}
                      className="px-2 py-1 bg-bg-elevated rounded-industrial border border-border"
                    >
                      <span className="text-xs font-mono text-text-secondary capitalize">
                        {feature.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Indicator */}
              {isActive && (
                <motion.div
                  className="absolute top-2 right-2 w-2 h-2 bg-accent-cyan rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 pt-2 border-t border-border text-xs font-mono text-text-secondary">
        <div className="flex items-center gap-2">
          <HealthScoreRing score={85} size={16} strokeWidth={2} />
          <span>Excellent (80+)</span>
        </div>
        <div className="flex items-center gap-2">
          <HealthScoreRing score={70} size={16} strokeWidth={2} />
          <span>Good (60-79)</span>
        </div>
        <div className="flex items-center gap-2">
          <HealthScoreRing score={50} size={16} strokeWidth={2} />
          <span>Needs Attention (&lt;60)</span>
        </div>
      </div>
    </div>
  );
}
