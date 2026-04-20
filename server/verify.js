// Quick server startup verification
// Tests: dotenv, db, models, routes, pipeline modules all load correctly
process.env.NODE_ENV = 'test';
require('dotenv').config();

const checks = [];

function check(name, fn) {
  try {
    fn();
    checks.push({ name, status: 'OK' });
  } catch (err) {
    checks.push({ name, status: 'FAIL', error: err.message });
  }
}

check('dotenv', () => require('dotenv'));
check('config/db', () => require('./config/db'));
check('config/auth.config', () => {
  const c = require('./config/auth.config');
  if (!c.EMPLOYEE_ID || !c.PASSWORD) throw new Error('Missing credentials');
});
check('models/Review', () => require('./models/Review'));
check('models/GraphNode', () => require('./models/GraphNode'));
check('models/GraphEdge', () => require('./models/GraphEdge'));
check('models/Insight', () => require('./models/Insight'));
check('models/Alert', () => require('./models/Alert'));
check('models/index', () => require('./models/index'));
check('middleware/authMiddleware', () => require('./middleware/authMiddleware'));
check('utils/socket', () => require('./utils/socket'));
check('utils/pdf', () => require('./utils/pdf'));
check('routes/auth', () => require('./routes/auth'));
check('routes/reviews', () => require('./routes/reviews'));
check('routes/dashboard', () => require('./routes/dashboard'));
check('routes/alerts', () => require('./routes/alerts'));
check('routes/demo', () => require('./routes/demo'));
check('routes/reports', () => require('./routes/reports'));
check('pipeline/embeddings', () => require('./pipeline/embeddings'));
check('pipeline/normalize', () => require('./pipeline/normalize'));
check('pipeline/trust', () => require('./pipeline/trust'));
check('pipeline/extract', () => require('./pipeline/extract'));
check('pipeline/graph', () => require('./pipeline/graph'));
check('pipeline/timeseries', () => require('./pipeline/timeseries'));
check('pipeline/confidence', () => require('./pipeline/confidence'));
check('pipeline/feedback', () => require('./pipeline/feedback'));
check('pipeline/index', () => require('./pipeline/index'));

const passed = checks.filter(c => c.status === 'OK').length;
const failed = checks.filter(c => c.status === 'FAIL');

console.log(`\nModule Verification: ${passed}/${checks.length} passed\n`);
if (failed.length > 0) {
  console.log('FAILURES:');
  failed.forEach(f => console.log(`  X ${f.name}: ${f.error}`));
} else {
  console.log('All modules load successfully!');
}

process.exit(failed.length > 0 ? 1 : 0);
