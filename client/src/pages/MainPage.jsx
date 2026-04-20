import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { fetchDashboard, fetchDashboardAll } from '../api';
import { PRODUCTS, productNameMap } from '../constants/products';

import HealthScoreCard from '../components/Dashboard/HealthScoreCard';
import ProductLeaderboard from '../components/Dashboard/ProductLeaderboard';
import ProductSummaryBanner from '../components/Dashboard/ProductSummaryBanner';
import FeatureSentimentBars from '../components/Dashboard/FeatureSentimentBars';
import TrendChart from '../components/Dashboard/TrendChart';
import WhatChangedStrip from '../components/Dashboard/WhatChangedStrip';
import GraphNetwork from '../components/Dashboard/GraphNetwork';
import IssueList from '../components/Dashboard/IssueList';
import PlatformToggle from '../components/Dashboard/PlatformToggle';
import ReviewDrilldown from '../components/Dashboard/ReviewDrilldown';
import FlaggedCounter from '../components/Dashboard/FlaggedCounter';
import LiveReviewCounter from '../components/Dashboard/LiveReviewCounter';
import PDFExportButton from '../components/Dashboard/PDFExportButton';
import AlertCenter from '../components/Dashboard/AlertCenter';
import DemoCenter from '../components/DemoCenter/DemoCenter';
import DashboardSkeleton from '../components/Dashboard/DashboardSkeleton';

const NAVIGATION_ITEMS = [
  { id: 'overview', name: 'Overview', icon: '📊' },
  { id: 'features', name: 'Features', icon: '🎯' },
  { id: 'graph', name: 'Graph', icon: '🕸️' },
  { id: 'trends', name: 'Trends', icon: '📈' },
  { id: 'alerts', name: 'Alerts', icon: '🚨' },
  { id: 'demo', name: 'Demo Center', icon: '🧪' },
  { id: 'reports', name: 'Reports', icon: '📄' },
];

const ROLE_CONFIG = {
  product: {
    name: 'PRODUCT TEAM',
    color: '#00D4FF',
    visibleSections: ['all']
  },
  operations: {
    name: 'OPERATIONS',
    color: '#FF6B35',
    visibleSections: ['command-strip', 'leaderboard', 'issues', 'platform-comparison', 'alerts']
  },
  management: {
    name: 'MANAGEMENT',
    color: '#00E5A0',
    visibleSections: ['command-strip', 'leaderboard', 'health', 'summary', 'pdf', 'alerts']
  },
  support: {
    name: 'CX/SUPPORT',
    color: '#FF3D5A',
    visibleSections: ['command-strip', 'features', 'what-changed', 'alerts', 'reviews']
  }
};

export default function MainPage() {
  const { employeeId, logout } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState([]);
  const [productId, setProductId] = useState(PRODUCTS[0].product_id);
  const [platform, setPlatform] = useState('');
  const [activeFeature, setActiveFeature] = useState(null);
  const [dash, setDash] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoHealth, setDemoHealth] = useState(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alertCount, setAlertCount] = useState(3);
  const [reviewCount, setReviewCount] = useState(550);

  const userRole = localStorage.getItem('prism_role') || 'product';
  const roleConfig = ROLE_CONFIG[userRole];

  const names = useMemo(() => productNameMap(), []);
  const currentProductMeta = PRODUCTS.find((p) => p.product_id === productId);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchDashboardAll()
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setLeaderboard(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchDashboard(productId, { platform: platform || undefined })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load dashboard');
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setDash(data);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [productId, platform]);

  const productLabel = names[productId] || dash?.product_id;

  const platformFs = useMemo(() => {
    if (!platform || !dash?.platform_comparison?.[platform]?.feature_sentiment) {
      return dash?.feature_sentiment;
    }
    return dash.platform_comparison[platform].feature_sentiment;
  }, [dash, platform]);

  const isSectionVisible = (section) => {
    return roleConfig.visibleSections.includes('all') || roleConfig.visibleSections.includes(section);
  };

  const CommandStrip = () => (
    <div className="flex items-center gap-0 px-6 py-4 bg-bg-surface border-t border-b border-border">
      {[
        { label: 'Health Score', value: dash?.health_score || 0, color: 'text-positive' },
        { label: 'Reviews Analyzed', value: reviewCount.toLocaleString(), color: 'text-accent-cyan' },
        { label: 'Flagged & Excluded', value: dash?.flagged_count || 0, color: 'text-accent-orange' },
        { label: 'Platforms', value: '4', color: 'text-text-primary' },
        { label: 'Active Alerts', value: alertCount, color: 'text-negative' }
      ].map((chip, index) => (
        <div key={chip.label} className="flex items-center">
          {index > 0 && <div className="w-px h-8 bg-border mx-4" />}
          <div className="flex flex-col">
            <span className="text-xs font-mono text-text-secondary uppercase tracking-[0.15em]">
              {chip.label}
            </span>
            <span className={`text-xl font-display font-bold ${chip.color} animate-count`}>
              {chip.value}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-bg-base flex">
      {/* Sidebar */}
      <motion.div
        className={`fixed left-0 top-0 h-full bg-bg-surface border-r border-border z-50 ${sidebarExpanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}
        animate={{ width: sidebarExpanded ? 220 : 60 }}
        transition={{ duration: 0.2 }}
      >
        <div className="p-4">
          <div className="flex items-center mb-8">
            <div className="w-3 h-3 bg-accent-cyan rounded-sm flex-shrink-0" />
            {sidebarExpanded && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="ml-3 font-display font-bold text-text-primary"
              >
                PRISM
              </motion.span>
            )}
          </div>
          
          <nav className="space-y-2">
            {NAVIGATION_ITEMS.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  const el = document.getElementById(item.id);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className={`w-full flex items-center px-3 py-2 rounded-industrial transition-all ${
                  activeSection === item.id
                    ? 'bg-accent-cyan/20 border-l-3 border-accent-cyan text-accent-cyan'
                    : 'text-text-secondary hover:text-text-primary hover:bg-bg-elevated'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarExpanded && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="ml-3 font-mono text-sm"
                  >
                    {item.name}
                  </motion.span>
                )}
              </motion.button>
            ))}
          </nav>
        </div>
        
        <div
          className="absolute bottom-4 left-4 right-4 cursor-pointer"
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
        >
          <div className="flex items-center justify-center w-12 h-12 bg-bg-elevated rounded-industrial border border-border hover:border-accent-cyan transition-all">
            <span className="text-text-secondary">{sidebarExpanded ? 'â' : 'â'}</span>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarExpanded ? 'ml-56' : 'ml-16'} transition-all duration-200`}>
        {/* Top Bar */}
        <header className="fixed top-0 left-0 right-0 h-12 bg-bg-surface border-b border-border z-40 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-accent-cyan rounded-sm mr-2" />
              <span className="font-display font-bold text-text-primary">PRISM</span>
            </div>
            
            {/* Product Selector */}
            <div className="flex items-center gap-1 bg-bg-elevated rounded-industrial p-1">
              {PRODUCTS.map((p) => (
                <button
                  key={p.product_id}
                  onClick={() => {
                    setProductId(p.product_id);
                    setActiveFeature(null);
                  }}
                  className={`px-3 py-1 rounded-industrial text-xs font-mono transition-all ${
                    productId === p.product_id
                      ? 'bg-accent-cyan text-bg-base'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {p.emoji} {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Platform Toggle */}
            <div className="flex items-center gap-1 bg-bg-elevated rounded-industrial p-1">
              {['All', 'Amazon', 'Flipkart', 'JioMart', 'Brand'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPlatform(p === 'All' ? '' : p.toLowerCase())}
                  className={`px-2 py-1 rounded-industrial text-xs font-mono transition-all ${
                    (platform === '' && p === 'All') || platform === p.toLowerCase()
                      ? 'bg-accent-cyan text-bg-base'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Live Review Counter */}
            <motion.div
              className="flex items-center gap-2 px-3 py-1 bg-accent-cyan/20 rounded-industrial border border-accent-cyan/30"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-2 h-2 bg-accent-cyan rounded-full animate-pulse-cyan" />
              <span className="text-xs font-mono text-accent-cyan">{reviewCount.toLocaleString()} reviews</span>
            </motion.div>

            {/* Alert Bell - Floating Drawer */}
            <AlertCenter productId={productId} />

            {/* Clock */}
            <div className="font-mono text-xs text-text-secondary">
              {currentTime.toLocaleTimeString('en-US', { hour12: false })}
            </div>

            {/* Role Badge */}
            <div
              className="px-3 py-1 rounded-industrial text-xs font-mono"
              style={{
                backgroundColor: `${roleConfig.color}20`,
                color: roleConfig.color,
                border: `1px solid ${roleConfig.color}50`
              }}
            >
              â {roleConfig.name} VIEW
            </div>

            {/* Switch Role */}
            <button
              onClick={async () => {
                await logout();
              }}
              className="text-xs font-mono text-text-secondary hover:text-accent-cyan transition-all"
            >
              Switch role
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="pt-12 px-6 pb-6">
          {error && (
            <motion.div
              className="mb-4 p-4 bg-negative/20 border border-negative/50 rounded-industrial text-negative text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.div>
          )}

          {loading ? (
            <DashboardSkeleton />
          ) : (
            <div className="space-y-6">
              {/* Command Strip */}
              {isSectionVisible('command-strip') && (
                <div id="overview">
                  <CommandStrip />
                </div>
              )}

              {/* Product Health & Leaderboard */}
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                  <div className="card">
                    <div className="section-label">PRODUCT HEALTH</div>
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <motion.div
                          className="text-6xl font-display font-bold text-gradient"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.8 }}
                        >
                          {dash?.health_score || 0}
                        </motion.div>
                        <div className="mt-4 text-sm font-mono text-text-secondary italic">
                          {dash?.product_summary || 'Analyzing customer sentiment patterns...'}
                        </div>
                        {/* Confidence Band */}
                        <div className="mt-6 w-full h-2 bg-bg-elevated rounded-industrial overflow-hidden">
                          <div className="flex h-full">
                            <div className="bg-positive flex-1" />
                            <div className="bg-accent-orange flex-1" />
                            <div className="bg-negative flex-1" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="card">
                    <div className="section-label">LEADERBOARD</div>
                    <ProductLeaderboard
                      items={leaderboard}
                      selectedId={productId}
                      onSelect={(id) => {
                        setProductId(id);
                        setActiveFeature(null);
                      }}
                      nameById={names}
                    />
                  </div>
                </div>
              </div>

              {/* Feature Sentiment Panel */}
              {isSectionVisible('features') && (
                <div id="features" className="card">
                  <div className="section-label">FEATURE SENTIMENT</div>
                  <FeatureSentimentBars
                    featureSentiment={platformFs}
                    activeFeature={activeFeature}
                    onFeatureClick={setActiveFeature}
                  />
                </div>
              )}

              {/* Trend Chart */}
              {isSectionVisible('trends') && (
                <div id="trends" className="card">
                  <div className="section-label">WEEKLY TRENDS</div>
                  <TrendChart
                    weeklyTrends={dash?.weekly_trends}
                    timeseriesVisual={dash?.timeseries_visual}
                    activeFeature={activeFeature}
                  />
                </div>
              )}

              {/* What Changed Strip */}
              {isSectionVisible('what-changed') && (
                <WhatChangedStrip whatChanged={dash?.what_changed_this_week} />
              )}

              {/* Issue Intelligence Panel */}
              {isSectionVisible('issues') && (
                <div className="card">
                  <div className="section-label">ISSUE INTELLIGENCE</div>
                  <IssueList issues={dash?.issues} />
                </div>
              )}

              {/* Graph Network */}
              <div id="graph" className="card">
                <div className="section-label">NETWORK ANALYSIS</div>
                <GraphNetwork graphData={dash?.graph_data} activeFeature={activeFeature} />
              </div>

              {/* Platform Comparison */}
              {isSectionVisible('platform-comparison') && (
                <div className="card">
                  <div className="section-label">PLATFORM COMPARISON</div>
                  <PlatformToggle
                    value={platform}
                    onChange={setPlatform}
                    comparison={dash?.platform_comparison}
                  />
                </div>
              )}

              {/* Review Drilldown */}
              {isSectionVisible('reviews') && (
                <ReviewDrilldown productId={productId} activeFeature={activeFeature} />
              )}

              {/* Demo Center */}
              <div id="demo">
                <DemoCenter
                  leaderboard={leaderboard}
                  productNames={names}
                  onHealthDelta={(h) => {
                    setDemoHealth(h);
                  }}
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
