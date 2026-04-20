/**
 * Stage 4 — Graph Integration
 * Creates graph nodes for reviews, draws weighted edges to existing nodes,
 * classifies clusters (systemic / batch / isolated).
 */
const { v4: uuidv4 } = require('uuid');
const { GraphNode, GraphEdge } = require('../models');
const embeddings = require('./embeddings');

/**
 * Edge weight formula:
 *   edge_weight = (feature_overlap × 0.5) + (sentiment_match × 0.3) + (week_proximity × 0.2)
 * Optional: +0.1 bonus if embedding cosine > 0.80
 * Threshold: edge_weight > ~0.30 (denser graph for demo analytics)
 */
const EDGE_THRESHOLD = 0.30;

function getWeekString(date) {
  const d = new Date(date);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + yearStart.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function weekDistance(w1, w2) {
  const [y1, wn1] = w1.split('-W').map(Number);
  const [y2, wn2] = w2.split('-W').map(Number);
  return Math.abs((y1 * 52 + wn1) - (y2 * 52 + wn2));
}

function featureKeysBySimilarity(extractResult) {
  return Object.entries(extractResult.features || {})
    .sort(
      (a, b) =>
        (b[1].similarity_score ?? b[1].score ?? 0) -
        (a[1].similarity_score ?? a[1].score ?? 0)
    )
    .map(([k]) => k);
}

async function processGraph(review, extractResult) {
  const features = featureKeysBySimilarity(extractResult);
  const sentiments = {};
  for (const [f, data] of Object.entries(extractResult.features || {})) {
    sentiments[f] = data.sentiment;
  }

  const week = getWeekString(review.timestamp || new Date());

  // Create graph node
  const node = await GraphNode.create({
    id: uuidv4(),
    review_id: review.id,
    product_id: review.product_id,
    platform: review.platform,
    features: JSON.stringify(features),
    sentiments: JSON.stringify(sentiments),
    week,
    embedding: extractResult.embedding ? JSON.stringify(extractResult.embedding) : null,
  });

  // Find existing nodes for this product and compute edges
  const existingNodes = await GraphNode.findAll({
    where: { product_id: review.product_id },
  });

  const newEdges = [];
  for (const existing of existingNodes) {
    if (existing.id === node.id) continue;

    const existFeatures = JSON.parse(existing.features || '[]');
    const existSentiments = JSON.parse(existing.sentiments || '{}');

    // Feature overlap
    const sharedFeatures = features.filter(f => existFeatures.includes(f));
    const allFeatures = new Set([...features, ...existFeatures]);
    const featureOverlap = allFeatures.size > 0 ? sharedFeatures.length / allFeatures.size : 0;

    // Sentiment match on shared features
    let sentimentMatch = 0;
    if (sharedFeatures.length > 0) {
      const matches = sharedFeatures.filter(f => sentiments[f] === existSentiments[f]);
      sentimentMatch = matches.length / sharedFeatures.length;
    }

    // Week proximity (1.0 if same week, 0.0 at 4+ week gap)
    const wDist = weekDistance(week, existing.week);
    const weekProximity = Math.max(0, 1 - wDist / 4);

    let edgeWeight = (featureOverlap * 0.5) + (sentimentMatch * 0.3) + (weekProximity * 0.2);

    // Semantic neighbours: link reviews that are close in embedding space (issue overlap optional)
    if (extractResult.embedding && existing.embedding) {
      try {
        const existEmb = JSON.parse(existing.embedding);
        const sim = embeddings.cosineSimilarity(extractResult.embedding, existEmb);
        if (sim > 0.78) {
          edgeWeight = Math.min(1.0, edgeWeight + 0.14);
        } else if (sim > 0.62) {
          edgeWeight = Math.min(1.0, edgeWeight + 0.10);
        } else if (sim > 0.52) {
          edgeWeight = Math.min(1.0, edgeWeight + 0.06);
        }
        // Pure semantic edge when little feature overlap but same-week + similar text
        if (featureOverlap === 0 && sim > 0.55 && weekProximity >= 0.5) {
          edgeWeight = Math.max(edgeWeight, sim * 0.42 + weekProximity * 0.18);
        }
      } catch { /* skip */ }
    }

    if (edgeWeight > EDGE_THRESHOLD) {
      const edge = await GraphEdge.create({
        id: uuidv4(),
        source_node_id: node.id,
        target_node_id: existing.id,
        weight: +edgeWeight.toFixed(3),
        product_id: review.product_id,
      });
      newEdges.push(edge);
    }
  }

  // Classify clusters
  await classifyClusters(review.product_id);

  return {
    node_id: node.id,
    edges_created: newEdges.length,
    cluster_type: node.cluster_type,
  };
}

async function classifyClusters(productId) {
  const nodes = await GraphNode.findAll({ where: { product_id: productId } });
  const edges = await GraphEdge.findAll({ where: { product_id: productId } });

  // Build adjacency list
  const adj = {};
  for (const n of nodes) adj[n.id] = [];
  for (const e of edges) {
    if (adj[e.source_node_id]) adj[e.source_node_id].push(e.target_node_id);
    if (adj[e.target_node_id]) adj[e.target_node_id].push(e.source_node_id);
  }

  // Connected components via BFS
  const visited = new Set();
  const clusters = [];

  for (const n of nodes) {
    if (visited.has(n.id)) continue;
    const component = [];
    const queue = [n.id];
    while (queue.length > 0) {
      const curr = queue.shift();
      if (visited.has(curr)) continue;
      visited.add(curr);
      component.push(curr);
      for (const neighbor of (adj[curr] || [])) {
        if (!visited.has(neighbor)) queue.push(neighbor);
      }
    }
    clusters.push(component);
  }

  // Classify each cluster
  const nodeMap = {};
  for (const n of nodes) nodeMap[n.id] = n;

  for (const component of clusters) {
    const clusterNodes = component.map(id => nodeMap[id]).filter(Boolean);
    const weeks = new Set(clusterNodes.map(n => n.week));
    const clusterId = uuidv4();

    let clusterType;
    if (clusterNodes.length >= 8 && weeks.size >= 3) {
      clusterType = 'systemic';
    } else if (clusterNodes.length >= 5 && weeks.size <= 2) {
      clusterType = 'batch';
    } else if (clusterNodes.length <= 1) {
      clusterType = 'isolated';
    } else {
      clusterType = weeks.size >= 3 ? 'systemic' : 'batch';
    }

    for (const n of clusterNodes) {
      await n.update({ cluster_id: clusterId, cluster_type: clusterType });
    }
  }
}

async function processDemo(review, extractResult) {
  return {
    features_detected: Object.keys(extractResult.features || {}),
    message: 'Graph node created, edges computed, clusters classified',
  };
}

module.exports = { process: processGraph, processDemo, classifyClusters };
