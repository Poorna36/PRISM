const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Insight = sequelize.define('Insight', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  product_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  feature: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  issue_type: {
    type: DataTypes.ENUM('systemic', 'batch', 'isolated'),
    allowNull: false,
  },
  severity: {
    type: DataTypes.ENUM('high', 'medium', 'low'),
    allowNull: false,
  },
  confidence: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  confidence_level: {
    type: DataTypes.ENUM('green', 'yellow', 'red'),
    allowNull: false,
  },
  affected_pct: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  recommendation: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cluster_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'insights',
  timestamps: true,
});

module.exports = Insight;
