import { motion } from 'framer-motion';
import { FEATURE_ORDER, FEATURE_COLORS, labelFeature } from '../../constants/features';

export default function FeatureSentimentBars({
  featureSentiment,
  activeFeature,
  onFeatureClick,
}) {
  const keys = FEATURE_ORDER.filter((k) => featureSentiment && featureSentiment[k]);

  if (!keys.length) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-text-secondary font-mono">No feature-level sentiment yet â run the pipeline on more reviews.</p>
      </div>
    );
  }

  const getTrendDirection = (key) => {
    // Mock trend data - in real implementation this would come from API
    const trends = {
      'app_performance': 'â',
      'ui_ux': 'â',
      'customer_service': 'â',
      'delivery': 'â',
      'pricing': 'â',
      'quality': 'â',
      'features': 'â'
    };
    return trends[key] || 'â';
  };

  const getTrendColor = (direction) => {
    if (direction === 'â') return 'text-positive';
    if (direction === 'â') return 'text-negative';
    return 'text-text-secondary';
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-text-secondary font-mono">Click a feature to filter all panels</p>
      
      <div className="space-y-3">
        {keys.map((key, index) => {
          const row = featureSentiment[key];
          const pos = row.positive ?? 0;
          const neg = row.negative ?? 0;
          const active = activeFeature === key;
          const color = FEATURE_COLORS[key] || '#6B7A99';
          const trendDirection = getTrendDirection(key);
          const trendColor = getTrendColor(trendDirection);

          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
              className={`relative cursor-pointer transition-all ${
                active ? 'border-l-3 border-accent-cyan bg-accent-cyan/5' : ''
              }`}
              onClick={() => onFeatureClick(active ? null : key)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className={`chip text-xs font-mono transition-all ${
                      active ? 'chip-active' : ''
                    }`}
                    style={{
                      borderColor: active ? color : undefined,
                      backgroundColor: active ? `${color}20` : undefined
                    }}
                  >
                    {labelFeature(key)}
                  </button>
                  
                  <motion.span
                    className={`text-lg font-mono ${trendColor}`}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.3, delay: index * 0.08 + 0.6 }}
                  >
                    {trendDirection}
                  </motion.span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-xs text-text-secondary font-mono">
                    {row.count} reviews
                  </span>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-positive">{Math.round(pos * 100)}%</span>
                    <span className="text-text-secondary">/</span>
                    <span className="text-negative">{Math.round(neg * 100)}%</span>
                  </div>
                </div>
              </div>
              
              {/* Horizontal Track */}
              <div className="relative h-3 bg-bg-elevated rounded-industrial overflow-hidden">
                {/* Background track */}
                <div className="absolute inset-0 bg-bg-elevated border border-border rounded-industrial" />
                
                {/* Positive fill */}
                <motion.div
                  className="absolute left-0 top-0 h-full bg-positive rounded-industrial"
                  initial={{ width: 0 }}
                  animate={{ width: `${pos * 100}%` }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.08,
                    ease: "easeOut"
                  }}
                />
                
                {/* Negative fill */}
                <motion.div
                  className="absolute right-0 top-0 h-full bg-negative rounded-industrial"
                  initial={{ width: 0 }}
                  animate={{ width: `${neg * 100}%` }}
                  transition={{ 
                    duration: 0.6, 
                    delay: index * 0.08 + 0.1,
                    ease: "easeOut"
                  }}
                />
                
                {/* Active indicator */}
                {active && (
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-1 bg-accent-cyan"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.08 + 0.3 }}
                  />
                )}
              </div>
              
              {/* Hover effect overlay */}
              <motion.div
                className="absolute inset-0 bg-accent-cyan/10 rounded-industrial pointer-events-none"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              />
            </motion.div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-positive rounded-industrial" />
          <span className="text-xs font-mono text-text-secondary">Positive</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-negative rounded-industrial" />
          <span className="text-xs font-mono text-text-secondary">Negative</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg text-positive font-mono">â</span>
          <span className="text-xs font-mono text-text-secondary">Improving</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg text-negative font-mono">â</span>
          <span className="text-xs font-mono text-text-secondary">Declining</span>
        </div>
      </div>
    </div>
  );
}
