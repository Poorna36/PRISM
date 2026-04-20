import { useEffect, useRef, useState, useMemo, useLayoutEffect } from 'react';
import * as d3 from 'd3';
import { motion, AnimatePresence } from 'framer-motion';
import { FEATURE_COLORS, FEATURE_ORDER, labelFeature } from '../../constants/features';

function sentimentColor(s) {
  const t = (s || '').toLowerCase();
  if (t.includes('pos')) return '#00E5A0';
  if (t.includes('neg')) return '#FF3D5A';
  return '#6B7A99';
}

function getClusterType(feature) {
  // Cluster assignment based on actual feature keys
  const clusterMap = {
    'performance': 'systemic',
    'battery_life': 'systemic',
    'build_quality': 'systemic',
    'value_for_money': 'isolated',
    'customer_support': 'isolated',
    'delivery_speed': 'batch',
    'packaging': 'batch'
  };
  return clusterMap[feature] || 'isolated';
}

function getClusterColor(type) {
  switch (type) {
    case 'systemic': return '#FF3D5A';
    case 'batch': return '#FF6B35';
    case 'isolated': return '#6B7A99';
    default: return '#6B7A99';
  }
}

export default function GraphNetwork({ graphData, activeFeature, height = 400 }) {
  const ref = useRef(null);
  const wrapRef = useRef(null);
  const [dims, setDims] = useState({ width: 800, height });
  const [tooltip, setTooltip] = useState(null);
  const [clusterFilter, setClusterFilter] = useState('all');

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setDims({ width: Math.max(400, Math.min(w - 16, 1200)), height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  const { width } = dims;

  const { nodes, links, clusters } = useMemo(() => {
    // MOCK DATA FOR DEMO with cluster information
    const demoNodes = [];
    const demoEdges = [];
    const demoClusters = { systemic: [], batch: [], isolated: [] };
    
    // Create 60 random nodes with cluster assignments
    for (let i = 0; i < 60; i++) {
      const feature = FEATURE_ORDER[Math.floor(Math.random() * FEATURE_ORDER.length)];
      const clusterType = getClusterType(feature);
      const node = {
        id: `node_${i}`,
        feature: feature,
        sentiment: Math.random() > 0.4 ? 'Positive' : 'Negative',
        features: [feature],
        week: `2026-W${15 + Math.floor(Math.random() * 4)}`,
        cluster: clusterType,
        reviewCount: 1 + Math.floor(Math.random() * 20)
      };
      demoNodes.push(node);
      demoClusters[clusterType].push(node);
    }

    // Create realistic clustered edges
    for (let i = 0; i < demoNodes.length; i++) {
      for (let j = i + 1; j < demoNodes.length; j++) {
        const sameFeature = demoNodes[i].feature === demoNodes[j].feature;
        const sameCluster = demoNodes[i].cluster === demoNodes[j].cluster;
        
        if ((sameFeature && Math.random() > 0.3) || 
            (sameCluster && Math.random() > 0.7) ||
            (Math.random() > 0.92)) {
          demoEdges.push({
            source: demoNodes[i].id,
            target: demoNodes[j].id,
            weight: 0.2 + (Math.random() * 0.8)
          });
        }
      }
    }

    const rawNodes = graphData?.nodes?.length ? graphData.nodes : demoNodes;
    const rawEdges = graphData?.edges?.length ? graphData.edges : demoEdges;
    
    // Assign clusters to nodes if missing and build actual clusters
    const actualClusters = { systemic: [], batch: [], isolated: [] };
    rawNodes.forEach(n => {
      if (!n.cluster) {
        n.cluster = getClusterType(n.feature || '');
      }
      if (actualClusters[n.cluster]) {
        actualClusters[n.cluster].push(n);
      } else {
        actualClusters['isolated'].push(n);
        n.cluster = 'isolated';
      }
    });

    // Filter by active feature
    const filtered = activeFeature
      ? rawNodes.filter((n) => {
          const tags = Array.isArray(n.features) ? n.features : [];
          return n.feature === activeFeature || tags.includes(activeFeature);
        })
      : rawNodes;
    
    // Filter by cluster type
    const clusterFiltered = clusterFilter === 'all' 
      ? filtered 
      : filtered.filter(n => n.cluster === clusterFilter);
    
    const idSet = new Set(clusterFiltered.map((n) => n.id));
    const edges = rawEdges
      .filter((e) => idSet.has(e.source) && idSet.has(e.target))
      .map((e) => ({ ...e }));
    
    const resultNodes = clusterFiltered.map((n) => ({ ...n }));
    
    // Calculate cluster centers
    const clusterCenters = {};
    Object.entries(actualClusters).forEach(([type, clusterNodes]) => {
      const filteredClusterNodes = clusterNodes.filter(n => idSet.has(n.id));
      if (filteredClusterNodes.length > 0) {
        clusterCenters[type] = {
          x: width * (type === 'systemic' ? 0.25 : type === 'batch' ? 0.5 : 0.75),
          y: height * 0.5,
          nodes: filteredClusterNodes
        };
      }
    });
    
    return { nodes: resultNodes, links: edges, clusters: clusterCenters };
  }, [graphData, activeFeature, clusterFilter, width, height]);

  useEffect(() => {
    const svgEl = ref.current;
    if (!svgEl || !nodes.length) {
      if (svgEl) svgEl.innerHTML = '';
      return;
    }

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const gRoot = svg.append('g');

    // Zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.35, 4])
      .on('zoom', (ev) => {
        gRoot.attr('transform', ev.transform);
      });
    svg.call(zoom);

    // Cluster halos (background)
    const clusterGroup = gRoot.append('g').attr('class', 'clusters');
    Object.entries(clusters).forEach(([type, center]) => {
      if (center && center.nodes.length > 0) {
        clusterGroup
          .append('circle')
          .attr('cx', center.x)
          .attr('cy', center.y)
          .attr('r', 120)
          .attr('fill', getClusterColor(type))
          .attr('fill-opacity', 0.05)
          .attr('stroke', getClusterColor(type))
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '4 4')
          .attr('stroke-opacity', 0.3);
        
        // Cluster label
        clusterGroup
          .append('text')
          .attr('x', center.x)
          .attr('y', center.y - 140)
          .attr('text-anchor', 'middle')
          .attr('fill', getClusterColor(type))
          .attr('font-family', 'DM Mono')
          .attr('font-size', '10px')
          .attr('text-transform', 'uppercase')
          .text(type);
      }
    });

    // Force simulation with cluster centers
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance((d) => 30 + (1 - (d.weight || 0)) * 70)
          .strength((d) => 0.2 + (d.weight || 0) * 0.6)
      )
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d) => 5 + (d.reviewCount || 1) * 0.3));

    // Add cluster attraction forces
    Object.entries(clusters).forEach(([type, center]) => {
      if (center) {
        simulation.force(`cluster-${type}`, 
          d3.forceRadial(center.x, center.y, 80)
            .strength((d) => d.cluster === type ? 0.1 : 0)
        );
      }
    });

    // Edges
    const link = gRoot
      .append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#1C2537')
      .attr('stroke-opacity', (d) => 0.3 + (d.weight || 0) * 0.4)
      .attr('stroke-width', (d) => 0.5 + (d.weight || 0) * 2);

    // Nodes
    const node = gRoot
      .append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'grab');

    // Node circles with rings
    node.append('circle')
      .attr('r', (d) => 4 + (d.reviewCount || 1) * 0.4)
      .attr('fill', (d) => sentimentColor(d.sentiment))
      .attr('stroke', (d) => (d.feature ? FEATURE_COLORS[d.feature] || '#6B7A99' : '#6B7A99'))
      .attr('stroke-width', 2)
      .attr('opacity', 0.9);

    // Node rings for sentiment
    node.append('circle')
      .attr('r', (d) => 6 + (d.reviewCount || 1) * 0.4)
      .attr('fill', 'none')
      .attr('stroke', (d) => sentimentColor(d.sentiment))
      .attr('stroke-width', 1)
      .attr('opacity', 0.5);

    // Drag behavior
    node.call(
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
        reviewCount: d.reviewCount,
        cluster: d.cluster
      });
    })
    .on('mousemove', (ev) => {
      setTooltip((t) => (t ? { ...t, x: ev.clientX, y: ev.clientY } : null));
    })
    .on('mouseleave', () => setTooltip(null));

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d) => d.source.x)
        .attr('y1', (d) => d.source.y)
        .attr('x2', (d) => d.target.x)
        .attr('y2', (d) => d.target.y);
      
      node.attr('transform', (d) => `translate(${d.x},${d.y})`);
    });

    // Smooth settle
    simulation.alpha(1).restart();
    const t = window.setTimeout(() => simulation.alphaTarget(0), 3000);

    return () => {
      clearTimeout(t);
      simulation.stop();
    };
  }, [nodes, links, clusters, width, height, activeFeature, clusterFilter]);

  if (!nodes.length) {
    return (
      <div className="card flex h-[400px] items-center justify-center">
        <div className="max-w-sm text-center">
          <p className="font-display font-semibold text-text-primary">No graph nodes yet</p>
          <p className="mt-2 text-xs text-text-secondary font-mono leading-relaxed">
            Ingest reviews through the simulation pages or wait for the pipeline to finish processing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="card p-0">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="section-label">NETWORK ANALYSIS</p>
            <h3 className="font-display font-semibold text-text-primary text-sm">
              Semantic similarity clusters
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs font-mono text-text-secondary">
              {nodes.length} nodes · {links.length} edges
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-text-secondary">Filter:</span>
            {['all', 'systemic', 'batch', 'isolated'].map((type) => (
              <button
                key={type}
                onClick={() => setClusterFilter(type)}
                className={`chip text-xs font-mono transition-all ${
                  clusterFilter === type ? 'chip-active' : ''
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-text-secondary">
            <span>Drag nodes · scroll to zoom</span>
          </div>
        </div>
      </div>

      {/* SVG */}
      <svg
        ref={ref}
        width={width}
        height={height}
        className="bg-bg-surface"
        role="img"
        aria-label="Review similarity network"
      >
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Custom Tooltip */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none fixed z-50 card p-3 shadow-lg max-w-xs"
            style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
          >
            <div className="space-y-2">
              <div>
                <p className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.15em]">Feature</p>
                <p className="font-display font-semibold text-accent-cyan text-sm">
                  {labelFeature(tooltip.feature)}
                </p>
              </div>
              
              {tooltip.allFeatures?.length > 1 && (
                <div>
                  <p className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.15em]">Also tagged</p>
                  <p className="text-xs text-text-secondary">
                    {tooltip.allFeatures.map((f) => labelFeature(f)).join(' · ')}
                  </p>
                </div>
              )}
              
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <p className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.15em]">Sentiment</p>
                  <span className={`font-mono ${tooltip.sentiment === 'Positive' ? 'text-positive' : 'text-negative'}`}>
                    {tooltip.sentiment}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.15em]">Reviews</p>
                  <span className="font-mono text-text-primary">{tooltip.reviewCount}</span>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.15em]">Week</p>
                  <span className="font-mono text-text-primary">{tooltip.week}</span>
                </div>
              </div>
              
              <div>
                <p className="text-[10px] font-mono text-text-secondary uppercase tracking-[0.15em]">Cluster</p>
                <span 
                  className="text-xs font-mono"
                  style={{ color: getClusterColor(tooltip.cluster) }}
                >
                  {tooltip.cluster}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center justify-center gap-6 text-xs font-mono text-text-secondary">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-positive rounded-full" />
            <span>Positive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-negative rounded-full" />
            <span>Negative</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 border-2 border-negative/30 rounded-full" />
            <span>Systemic</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 border-2 border-accent-orange/30 rounded-full" />
            <span>Batch</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 border-2 border-text-secondary/30 rounded-full" />
            <span>Isolated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
