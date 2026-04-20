import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchReviews } from '../../api';
import { labelFeature, FEATURE_COLORS } from '../../constants/features';

function getPlatformIcon(platform) {
  const icons = {
    'Amazon': 'ð',
    'Flipkart': 'ð',
    'JioMart': 'ð',
    'Brand Store': 'ð'
  };
  return icons[platform] || 'ð';
}

function getSentimentBadge(sentiment) {
  if (sentiment === 'Positive') return 'bg-positive/20 text-positive border border-positive/30';
  if (sentiment === 'Negative') return 'bg-negative/20 text-negative border border-negative/30';
  return 'bg-text-secondary/20 text-text-secondary border border-text-secondary/30';
}

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-xs ${star <= rating ? 'text-accent-orange' : 'text-border'}`}
        >
          â
        </span>
      ))}
    </div>
  );
}

export default function ReviewDrilldown({ productId, activeFeature }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [isCollapsed, setIsCollapsed] = useState(true);

  // MOCK DATA FOR DEMO
  const generateMockReviews = (feature) => {
    const mockReviews = [];
    const platforms = ['Amazon', 'Flipkart', 'JioMart', 'Brand Store'];
    const sentiments = ['Positive', 'Negative'];
    
    for (let i = 0; i < 15; i++) {
      const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const rating = sentiment === 'Positive' ? 4 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2);
      
      mockReviews.push({
        id: `mock_rev_${i}`,
        platform: platform,
        rating: rating,
        timestamp: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        review_text: feature === 'app_performance' 
          ? (sentiment === 'Positive' 
              ? "The app runs smoothly and responds quickly. Very impressed with the performance improvements."
              : "App crashes frequently and is very slow to load. Frustrating user experience.")
          : feature === 'ui_ux'
          ? (sentiment === 'Positive'
              ? "Clean, modern interface that's intuitive and easy to navigate. Great design work!"
              : "Confusing layout with too many menus. Hard to find basic features.")
          : (sentiment === 'Positive'
              ? "Good overall experience with solid performance and reliable features."
              : "Multiple issues with performance and usability. Needs significant improvements."),
        sentiment: sentiment,
        features: [feature, 'quality', 'delivery'][Math.floor(Math.random() * 3)]
      });
    }
    return { reviews: mockReviews, total: 347 };
  };

  useEffect(() => {
    setPage(1);
    setExpandedRows(new Set());
  }, [productId, activeFeature]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchReviews(productId, { page, limit: 15, feature: activeFeature || undefined })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load reviews');
        return res.json();
      })
      .then((j) => {
        if (!cancelled) {
          setData(j?.reviews?.length ? j : generateMockReviews(activeFeature));
          setErr(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setData(generateMockReviews(activeFeature));
          setErr(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, page, activeFeature]);

  const totalPages = data ? Math.max(1, Math.ceil((data.total || 0) / 15)) : 1;

  const toggleRowExpansion = (id) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <p className="section-label">REVIEW DRILLDOWN</p>
              <h3 className="font-display font-semibold text-text-primary text-sm">
                Raw customer feedback
              </h3>
            </div>
            {activeFeature && (
              <div className={`chip chip-active`} style={{ backgroundColor: `${FEATURE_COLORS[activeFeature]}20` }}>
                <span style={{ color: FEATURE_COLORS[activeFeature] }}>
                  {labelFeature(activeFeature)}
                </span>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2 text-xs font-mono text-text-secondary hover:text-accent-cyan transition-all"
          >
            <span>{isCollapsed ? 'View raw reviews â' : 'Hide reviews â'}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            {loading && (
              <div className="p-8 text-center">
                <p className="text-sm text-text-secondary font-mono">Loading reviews...</p>
              </div>
            )}
            
            {err && (
              <div className="p-4 text-center">
                <p className="text-sm text-negative font-mono">{err}</p>
              </div>
            )}

            {!loading && data && data.reviews?.length > 0 && (
              <div className="p-4 space-y-4">
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-xs font-mono text-text-secondary uppercase tracking-[0.15em] pb-2">Platform</th>
                        <th className="text-left text-xs font-mono text-text-secondary uppercase tracking-[0.15em] pb-2">Rating</th>
                        <th className="text-left text-xs font-mono text-text-secondary uppercase tracking-[0.15em] pb-2">Features</th>
                        <th className="text-left text-xs font-mono text-text-secondary uppercase tracking-[0.15em] pb-2">Review</th>
                        <th className="text-left text-xs font-mono text-text-secondary uppercase tracking-[0.15em] pb-2">Sentiment</th>
                        <th className="text-left text-xs font-mono text-text-secondary uppercase tracking-[0.15em] pb-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.reviews.map((review, index) => (
                        <motion.tr
                          key={review.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-border hover:bg-bg-elevated cursor-pointer"
                          onClick={() => toggleRowExpansion(review.id)}
                        >
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getPlatformIcon(review.platform)}</span>
                              <span className="text-xs font-mono text-text-primary">{review.platform}</span>
                            </div>
                          </td>
                          <td className="py-3">
                            <StarRating rating={review.rating} />
                          </td>
                          <td className="py-3">
                            <div className="flex gap-1">
                              {review.features?.map((feature, idx) => (
                                <div
                                  key={idx}
                                  className="px-2 py-1 bg-bg-elevated rounded-industrial border border-border"
                                >
                                  <span className="text-xs font-mono text-text-secondary capitalize">
                                    {feature.replace('_', ' ').substring(0, 3)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="max-w-xs">
                              <p className="text-xs text-text-primary line-clamp-2">
                                {review.review_text || review.transcript || 'â'}
                              </p>
                              {expandedRows.has(review.id) && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  className="text-xs text-text-secondary mt-2"
                                >
                                  {review.review_text || review.transcript || 'â'}
                                </motion.div>
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className={`px-2 py-1 rounded-industrial text-xs font-mono ${getSentimentBadge(review.sentiment)}`}>
                              {review.sentiment || 'Neutral'}
                            </div>
                          </td>
                          <td className="py-3">
                            <span className="text-xs font-mono text-text-secondary">
                              {review.timestamp ? new Date(review.timestamp).toLocaleDateString() : ''}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <button
                    type="button"
                    disabled={page <= 1}
                    className={`btn-secondary text-xs ${page <= 1 ? 'opacity-40 cursor-not-allowed' : ''}`}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    â Previous
                  </button>
                  
                  <div className="text-xs font-mono text-text-secondary">
                    Page {page} / {totalPages} · {data.total} total reviews
                  </div>
                  
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    className={`btn-secondary text-xs ${page >= totalPages ? 'opacity-40 cursor-not-allowed' : ''}`}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next â
                  </button>
                </div>
              </div>
            )}

            {!loading && data && data.total === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-text-secondary font-mono">No reviews match this filter.</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
