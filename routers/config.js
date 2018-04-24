exports.DATABASE_URL = process.env.DATABASE_URL ||
                       global.DATABASE_URL ||
                       'mongodb://localhost/budge-my-life';
exports.TEST_DATABASE_URL = (
  process.env.TEST_DATABASE_URL ||
  'mongodb://localhost/test-budge-my-life');
exports.PORT = process.env.PORT || 8080;
exports.JWT_SECRET = process.env.JWT_SECRET || 'BUDGE_MY_LIFE';
exports.JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
exports.API_BASE_URL = process.env.APP_API_BASE_URL || 'http://localhost:8080/api';