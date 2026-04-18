import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
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

  const names = useMemo(() => productNameMap(), []);
  const currentProductMeta = PRODUCTS.find((p) => p.product_id === productId);

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

  return (
    <div className="min-h-screen bg-grid">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-ink/85 shadow-sm shadow-black/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-3.5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-600 to-indigo-700 text-lg font-bold text-white shadow-lg shadow-sky-900/30">
              P
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400/90">PRISM</p>
              <h1 className="truncate text-base font-semibold tracking-tight text-white md:text-lg">
                Customer intelligence
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">
                <span className="text-slate-600">Overview</span>
                <span className="mx-1.5 text-slate-700">/</span>
                <span className="text-slate-400">Products</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <label className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-900/50 px-2 py-1.5">
              <span className="hidden text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:inline">
                Product
              </span>
              <select
                value={productId}
                onChange={(e) => {
                  setProductId(e.target.value);
                  setActiveFeature(null);
                }}
                className="focus-ring max-w-[200px] cursor-pointer bg-transparent text-sm font-medium text-slate-100"
              >
                {PRODUCTS.map((p) => (
                  <option key={p.product_id} value={p.product_id}>
                    {p.emoji} {p.name}
                  </option>
                ))}
              </select>
            </label>
            {demoHealth != null && (
              <motion.span
                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                Demo Δ health {demoHealth}
              </motion.span>
            )}
            <span className="hidden text-xs text-slate-500 sm:inline">{employeeId}</span>
            <button
              type="button"
              onClick={() => logout()}
              className="focus-ring rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1600px] px-4 py-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-500/35 bg-red-950/50 px-4 py-3 text-sm text-red-100 shadow-panel">
            {error}
          </div>
        )}

        <div className="lg:grid lg:grid-cols-[minmax(0,280px)_1fr] lg:gap-10">
          <aside className="mb-8 space-y-4 lg:mb-0">
            <div className="panel overflow-hidden p-0 shadow-panel">
              <div className="border-b border-slate-700/60 px-4 py-3">
                <p className="section-label">Scope</p>
                <p className="mt-1 text-sm font-medium text-slate-200">Portfolio</p>
                <p className="text-xs text-slate-500">Ranked by embedding-weighted health score</p>
              </div>
              <div className="p-3">
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
            <div className="panel p-4 shadow-panel">
              <p className="section-label mb-3">Data slice</p>
              <PlatformToggle
                value={platform}
                onChange={setPlatform}
                comparison={dash?.platform_comparison}
              />
            </div>
          </aside>

          <div className="min-w-0 space-y-10">
            {loading ? (
              <DashboardSkeleton />
            ) : (
              <>
                <section className="space-y-4">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="section-label">Executive</p>
                      <h2 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
                        {currentProductMeta?.emoji} {productLabel}
                      </h2>
                      <p className="mt-1 max-w-2xl text-sm text-slate-400">
                        Live metrics from processed reviews. Feature tags use sentence embeddings — select a feature to
                        filter charts and the review graph.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <HealthScoreCard score={dash?.health_score} productName={productLabel} />
                    <div className="panel space-y-3 p-4 shadow-panel">
                      <p className="section-label">Pipeline quality</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <FlaggedCounter count={dash?.flagged_count} />
                        <LiveReviewCounter count={dash?.review_count} />
                      </div>
                      <div className="border-t border-slate-700/50 pt-3">
                        <PDFExportButton productId={productId} platform={platform || 'all'} />
                      </div>
                    </div>
                  </div>

                  <ProductSummaryBanner text={dash?.product_summary} />
                </section>

                <section className="grid gap-8 xl:grid-cols-3">
                  <motion.div
                    className="space-y-6 xl:col-span-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="panel overflow-hidden p-0 shadow-panel">
                      <div className="border-b border-slate-700/60 px-4 py-3">
                        <p className="section-label">Features</p>
                        <h3 className="text-sm font-semibold text-white">Sentiment by topic</h3>
                      </div>
                      <div className="p-4">
                        <FeatureSentimentBars
                          featureSentiment={platformFs}
                          activeFeature={activeFeature}
                          onFeatureClick={setActiveFeature}
                        />
                      </div>
                    </div>
                    <WhatChangedStrip whatChanged={dash?.what_changed_this_week} />
                    <AlertCenter productId={productId} />
                  </motion.div>

                  <div className="space-y-8 xl:col-span-2">
                    <div className="panel overflow-hidden p-0 shadow-panel">
                      <div className="border-b border-slate-700/60 px-4 py-3">
                        <p className="section-label">Trends</p>
                        <h3 className="text-sm font-semibold text-white">Weekly sentiment</h3>
                      </div>
                      <div className="p-4">
                        <TrendChart
                          weeklyTrends={dash?.weekly_trends}
                          timeseriesVisual={dash?.timeseries_visual}
                          activeFeature={activeFeature}
                        />
                      </div>
                    </div>

                    <GraphNetwork graphData={dash?.graph_data} activeFeature={activeFeature} />

                    <div className="panel overflow-hidden p-0 shadow-panel">
                      <div className="border-b border-slate-700/60 px-4 py-3">
                        <p className="section-label">Insights</p>
                        <h3 className="text-sm font-semibold text-white">Ranked issues</h3>
                      </div>
                      <div className="p-4">
                        <IssueList issues={dash?.issues} />
                      </div>
                    </div>

                    <ReviewDrilldown productId={productId} activeFeature={activeFeature} />
                  </div>
                </section>

                <DemoCenter
                  leaderboard={leaderboard}
                  productNames={names}
                  onHealthDelta={(h) => {
                    setDemoHealth(h);
                  }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
