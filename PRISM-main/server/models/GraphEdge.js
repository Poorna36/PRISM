const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const GraphEdge = sequelize.define('GraphEdge', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  source_node_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  target_node_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  product_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  tableName: 'graph_edges',
  timestamps: true,
});

module.exports = GraphEdge;
