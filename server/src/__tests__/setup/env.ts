// Runs before the test framework installs. Sets environment variables so that
// env.ts (a module-level singleton) finds them on first import in each worker.
process.env['NODE_ENV'] = 'test';
process.env['JWT_SECRET'] = 'test-super-secret-jwt-key-for-testing-only';
process.env['PORT'] = '5001';
process.env['CLIENT_URL'] = 'http://localhost:3000';
process.env['CORS_ORIGINS'] = 'http://localhost:3000';
process.env['AI_SERVICE_URL'] = 'http://localhost:8000';
