import { useEffect, useRef, useState, useMemo, useLayoutEffect } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { FEATURE_COLORS, FEATURE_ORDER, labelFeature } from '../../constants/features';

function sentimentColor(s) {
  const t = (s || '').toLowerCase();
  if (t.includes('pos')) return '#22c55e';
  if (t.includes('neg')) return '#ef4444';
  return '#94a3b8';
}

export default function GraphNetwork({ graphData, activeFeature, height = 380 }) {
  const ref = useRef(null);
  const wrapRef = useRef(null);
  const [dims, setDims] = useState({ width: 560, height });
  const [tooltip, setTooltip] = useState(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setDims({ width: Math.max(280, Math.min(w - 8, 960)), height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  const { nodes, links, batchCount, systemicCount, featureCount } = useMemo(() => {
    // Fallback demo nodes if backend has not ingested yet
    const demoNodes = [];
    const demoEdges = [];
    for (let i = 0; i < 45; i++) {
      const feature = FEATURE_ORDER[i % FEATURE_ORDER.length];
      const isNeg = i < 15;
      const isBatch = isNeg && i < 10;
      demoNodes.push({
        id: `demo_node_${i}`,
        feature,
        sentiment: isNeg ? 'negative' : 'positive',
        features: [feature],
        week: isBatch ? '2026-W18' : '2026-W15',
        cluster_type: isBatch ? 'batch' : isNeg ? 'systemic' : 'feature_cluster',
      });
    }
    for (let i = 0; i < demoNodes.length; i++) {
      for (let j = i + 1; j < demoNodes.length; j++) {
        if (demoNodes[i].feature === demoNodes[j].feature && demoNodes[i].sentiment === demoNodes[j].sentiment) {
          demoEdges.push({
            source: demoNodes[i].id,
            target: demoNodes[j].id,
            weight: 0.75,
          });
        }
      }
    }

    const rawNodes = graphData?.nodes?.length ? graphData.nodes : demoNodes;
    const rawEdges = graphData?.edges?.length ? graphData.edges : demoEdges;

    const filtered = activeFeature
      ? rawNodes.filter((n) => {
          const tags = Array.isArray(n.features) ? n.features : [];
          return n.feature === activeFeature || tags.includes(activeFeature);
        })
      : rawNodes;

    const idSet = new Set(filtered.map((n) => n.id));
    const edges = [];

    // Safely extract string IDs so D3 mutating e.source to an object never drops edges
    for (const e of rawEdges) {
      const sId = typeof e.source === 'object' && e.source !== null ? e.source.id : e.source;
      const tId = typeof e.target === 'object' && e.target !== null ? e.target.id : e.target;
      if (idSet.has(sId) && idSet.has(tId)) {
        edges.push({
          source: sId,
          target: tId,
          weight: typeof e.weight === 'number' ? e.weight : 0.65,
        });
      }
    }

    const resultNodes = filtered.map((n) => ({ ...n }));

    let bCount = 0;
    let sCount = 0;
    let fCount = 0;
    for (const n of resultNodes) {
      if (n.cluster_type === 'batch') bCount++;
      else if (n.cluster_type === 'systemic') sCount++;
      else fCount++;
    }

    return {
      nodes: resultNodes,
      links: edges,
      batchCount: bCount,
      systemicCount: sCount,
      featureCount: fCount,
    };
  }, [graphData, activeFeature]);

  const { width } = dims;

  useEffect(() => {
    const svgEl = ref.current;
    if (!svgEl || !nodes.length) {
      if (svgEl) svgEl.innerHTML = '';
      return;
    }

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const gRoot = svg.append('g');

    const zoom = d3
      .zoom()
      .scaleExtent([0.35, 4])
      .on('zoom', (ev) => {
        gRoot.attr('transform', ev.transform);
      });
    svg.call(zoom);

    // D3 Force Simulation tuned for tight, readable semantic clusters
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((d) => 24 + (1 - Math.min(1, d.weight || 0.65)) * 36)
          .strength((d) => 0.85 + (d.weight || 0.65) * 0.25)
      )
      .force('charge', d3.forceManyBody().strength(-75))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(12));

    // Links
    const link = gRoot
      .append('g')
      .attr('stroke', '#64748b')
      .attr('stroke-opacity', 0.55)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', (d) => Math.max(1, (d.weight || 0.5) * 2.2));

    // Batch anomaly halos (distinct glowing red rings indicating manufacturing lot defects)
    const batchHalo = gRoot
      .append('g')
      .selectAll('circle')
      .data(nodes.filter((n) => n.cluster_type === 'batch'))
      .join('circle')
      .attr('r', 13)
      .attr('fill', 'rgba(239, 68, 68, 0.15)')
      .attr('stroke', '#ef4444')
      .attr('stroke-width', 1.6)
      .attr('stroke-dasharray', '3,2');

    // Systemic defect rings (subtle amber dashed rings)
    const systemicHalo = gRoot
      .append('g')
      .selectAll('circle')
      .data(nodes.filter((n) => n.cluster_type === 'systemic'))
      .join('circle')
      .attr('r', 11)
      .attr('fill', 'rgba(245, 158, 11, 0.10)')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 1.2)
      .attr('stroke-dasharray', '2,2');

    // Nodes
    const node = gRoot
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 6.5)
      .attr('stroke', (d) => (d.feature ? FEATURE_COLORS[d.feature] || '#64748b' : '#64748b'))
      .attr('stroke-width', 1.8)
      .attr('fill', (d) => sentimentColor(d.sentiment))
      .style('cursor', 'grab')
      .call(
        d3
          .drag()
          .on('start', (ev, d) => {
            if (!ev.active) simulation.alphaTarget(0.35).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (ev, d) => {
            d.fx = ev.x;
            d.fy = ev.y;
          })
          .on('end', (ev, d) => {
            if (!ev.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on('mouseenter', (ev, d) => {
        const tags = Array.isArray(d.features) && d.features.length ? d.features : [d.feature].filter(Boolean);
        setTooltip({
          x: ev.clientX,
          y: ev.clientY,
          feature: d.feature,
          allFeatures: tags,
          sentiment: d.sentiment,
          week: d.week,
          clusterType: d.cluster_type,
        });
      })
      .on('mousemove', (ev) => {
        setTooltip((t) => (t ? { ...t, x: ev.clientX, y: ev.clientY } : null));
      })
      .on('mouseleave', () => setTooltip(null));

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);
      batchHalo.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
      systemicHalo.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
      node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
    });

    simulation.alpha(1).restart();
    const t = window.setTimeout(() => simulation.alphaTarget(0), 2200);

    return () => {
      clearTimeout(t);
      simulation.stop();
    };
  }, [nodes, links, width, height, activeFeature]);

  if (!nodes.length) {
    return (
      <div className="panel flex h-[380px] items-center justify-center p-6 text-sm text-slate-500">
        <div className="max-w-sm text-center">
          <p className="font-medium text-slate-400">No graph nodes yet</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Ingest reviews through the simulation pages or run the pipeline. Clustered network nodes will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="panel relative overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-700/60 bg-slate-950/40 px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-400/90">Graph Topology</p>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
              {nodes.length} nodes · {links.length} edges
            </span>
          </div>
          <h3 className="text-sm font-semibold text-slate-100">Semantic Defect & Feature Network</h3>
        </div>

        {/* Dynamic Cluster Classification Badges */}
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-0.5 font-medium text-red-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500"></span>
            Batch Defect ({batchCount})
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-medium text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
            Systemic ({systemicCount})
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Healthy ({featureCount})
          </span>
        </div>
      </div>

      <svg
        ref={ref}
        width={width}
        height={height}
        className="mx-auto block touch-none bg-[#090e17]"
        role="img"
        aria-label="Review similarity network"
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed z-50 max-w-xs rounded-lg border border-slate-600 bg-slate-900/95 px-3 py-2.5 text-xs text-slate-100 shadow-xl backdrop-blur"
            style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Topic</span>
              {tooltip.clusterType === 'batch' ? (
                <span className="rounded bg-red-950/80 px-1.5 py-0.5 text-[10px] font-bold text-red-400 border border-red-700/50">
                  ⚠️ BATCH DEFECT
                </span>
              ) : tooltip.clusterType === 'systemic' ? (
                <span className="rounded bg-amber-950/80 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-700/50">
                  ⚡ SYSTEMIC ISSUE
                </span>
              ) : (
                <span className="rounded bg-emerald-950/80 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-700/50">
                  FEATURE CLUSTER
                </span>
              )}
            </div>
            <p className="mt-1 font-semibold text-sky-300">{labelFeature(tooltip.feature)}</p>
            {tooltip.allFeatures?.length > 1 && (
              <p className="mt-1 text-[11px] leading-snug text-slate-400">
                <span className="text-slate-500">Related tags: </span>
                {tooltip.allFeatures.map((f) => labelFeature(f)).join(', ')}
              </p>
            )}
            <div className="mt-2.5 flex items-center justify-between border-t border-slate-800 pt-1.5 text-[11px] text-slate-400">
              <span>Sentiment: <strong className={tooltip.sentiment === 'negative' ? 'text-red-400' : 'text-emerald-400'}>{tooltip.sentiment || '—'}</strong></span>
              <span className="text-slate-500">Week: {tooltip.week || '—'}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
