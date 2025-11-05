const jwt = require('jsonwebtoken');

// Create a test JWT token for local testing
const payload = {
  email: 'admin@test.com',
  sub: 'test-user-id',
  'cognito:groups': ['admin'],
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
};

const token = jwt.sign(payload, 'test-secret-key');

console.log('Test JWT Token:');
console.log(token);
console.log('\nUse this token in your API tests by setting:');
console.log(`Authorization: Bearer ${token}`);

module.exports = token;