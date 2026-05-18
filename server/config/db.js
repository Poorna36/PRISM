const { Sequelize } = require('sequelize');
const path = require('path');
try { require('sqlite3'); } catch(e) {} // Force Vercel to bundle sqlite3

let sequelize;

if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  sequelize = new Sequelize(url, {
    dialect: 'postgres',
    dialectModule: require('pg'),
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  });
} else {
  const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: isVercel ? '/tmp/prism.sqlite' : path.join(__dirname, '..', 'data', 'prism.sqlite'),
    logging: false,
  });
}

module.exports = sequelize;
