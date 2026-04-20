const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  product_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  platform: {
    type: DataTypes.ENUM('amazon', 'flipkart', 'jiomart', 'brand'),
    allowNull: false,
  },
  review_text: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  transcript: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  normalized_text: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  detected_language: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 1, max: 5 },
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  media_type: {
    type: DataTypes.ENUM('none', 'image', 'video'),
    defaultValue: 'none',
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  // Pipeline outputs
  status: {
    type: DataTypes.ENUM('queued', 'processing', 'processed', 'flagged'),
    defaultValue: 'queued',
  },
  flag_reason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  text_hash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  embedding: {
    type: DataTypes.TEXT, // JSON stringified 384-dim float array
    allowNull: true,
  },
  features: {
    type: DataTypes.TEXT, // JSON: { feature_name: { sentiment, score, ambiguity } }
    allowNull: true,
  },
}, {
  tableName: 'reviews',
  timestamps: true,
});

module.exports = Review;
