const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const GraphNode = sequelize.define('GraphNode', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  review_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  product_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  platform: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  features: {
    type: DataTypes.TEXT, // JSON array of feature names
    allowNull: true,
  },
  sentiments: {
    type: DataTypes.TEXT, // JSON: { feature: sentiment }
    allowNull: true,
  },
  week: {
    type: DataTypes.STRING, // e.g. "2024-W10"
    allowNull: false,
  },
  embedding: {
    type: DataTypes.TEXT, // JSON stringified 384-dim float array
    allowNull: true,
  },
  cluster_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  cluster_type: {
    type: DataTypes.ENUM('systemic', 'batch', 'isolated'),
    allowNull: true,
  },
}, {
  tableName: 'graph_nodes',
  timestamps: true,
});

module.exports = GraphNode;
