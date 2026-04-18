import { useEffect, useRef, useState, useMemo, useLayoutEffect } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { FEATURE_COLORS, labelFeature } from '../../constants/features';

function sentimentColor(s) {
  const t = (s || '').toLowerCase();
  if (t.includes('pos')) return '#22c55e';
  if (t.includes('neg')) return '#ef4444';
  return '#94a3b8';
}

export default function GraphNetwork({ graphData, activeFeature, height = 360 }) {
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

  const { nodes, links } = useMemo(() => {
    const rawNodes = graphData?.nodes || [];
    const rawEdges = graphData?.edges || [];
    const filtered = activeFeature
      ? rawNodes.filter((n) => {
          const tags = Array.isArray(n.features) ? n.features : [];
          return n.feature === activeFeature || tags.includes(activeFeature);
        })
      : rawNodes;
    const idSet = new Set(filtered.map((n) => n.id));
    const edges = rawEdges
      .filter((e) => idSet.has(e.source) && idSet.has(e.target))
      .map((e) => ({ ...e }));
    const nodes = filtered.map((n) => ({ ...n }));
    return { nodes, links: edges };
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

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((d) => 40 + (1 - (d.weight || 0)) * 90)
          .strength((d) => 0.15 + (d.weight || 0) * 0.65)
      )
      .force('charge', d3.forceManyBody().strength(-140))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(11));

    const link = gRoot
      .append('g')
      .attr('stroke', '#475569')
      .attr('stroke-opacity', 0.75)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', (d) => 0.6 + (d.weight || 0) * 4);

    const node = gRoot
      .append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 7)
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
      node.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
    });

    // Smooth settle: keep simulation "alive" briefly for organic motion
    simulation.alpha(1).restart();
    const t = window.setTimeout(() => simulation.alphaTarget(0), 2200);

    return () => {
      clearTimeout(t);
      simulation.stop();
    };
  }, [nodes, links, width, height, activeFeature]);

  if (!nodes.length) {
    return (
      <div className="panel flex h-[360px] items-center justify-center p-6 text-sm text-slate-500">
        <div className="max-w-sm text-center">
          <p className="font-medium text-slate-400">No graph nodes yet</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Ingest reviews through the simulation pages or wait for the pipeline to finish processing. Nodes appear
            here with embedding-based links.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="panel relative overflow-hidden p-0">
      <div className="flex items-start justify-between gap-4 border-b border-slate-700/60 bg-slate-950/30 px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-400/90">Graph</p>
          <h3 className="text-sm font-semibold text-slate-100">Semantic similarity network</h3>
          <p className="mt-0.5 text-xs text-slate-500">Drag nodes · scroll to zoom · stroke ∝ edge weight</p>
        </div>
      </div>
      <svg
        ref={ref}
        width={width}
        height={height}
        className="mx-auto block touch-none bg-[#0b1220]"
        role="img"
        aria-label="Review similarity network"
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" result="b" />
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
            className="pointer-events-none fixed z-50 max-w-xs rounded-lg border border-slate-600 bg-slate-900/95 px-3 py-2 text-xs text-slate-100 shadow-xl backdrop-blur"
            style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Primary topic</p>
            <p className="font-semibold text-sky-300">{labelFeature(tooltip.feature)}</p>
            {tooltip.allFeatures?.length > 1 && (
              <p className="mt-2 text-[11px] leading-snug text-slate-400">
                <span className="text-slate-500">Also tagged · </span>
                {tooltip.allFeatures.map((f) => labelFeature(f)).join(' · ')}
              </p>
            )}
            <p className="mt-2 text-slate-400">Sentiment: {tooltip.sentiment || '—'}</p>
            <p className="text-slate-500">Week: {tooltip.week || '—'}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
