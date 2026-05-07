describe('config/env', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('returns a valid config object when JWT_SECRET is set', () => {
    process.env['JWT_SECRET'] = 'a-valid-secret';
    process.env['PORT'] = '4000';
    process.env['MONGO_URI'] = 'mongodb://test/db';

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const env = require('../../../config/env').default as Record<string, unknown>;

    expect(env['jwtSecret']).toBe('a-valid-secret');
    expect(env['port']).toBe(4000);
    expect(env['mongoUri']).toBe('mongodb://test/db');
    expect(env['nodeEnv']).toBe('test');
  });

  it('throws when JWT_SECRET is missing', () => {
    jest.mock('dotenv', () => ({ config: jest.fn() }));
    delete process.env['JWT_SECRET'];

    expect(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('../../../config/env');
    }).toThrow('JWT_SECRET is required');
  });

  it('parses comma-separated CORS_ORIGINS into an array', () => {
    process.env['JWT_SECRET'] = 'secret';
    process.env['CORS_ORIGINS'] = 'http://a.com,http://b.com';

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const env = require('../../../config/env').default as { corsOrigins: string[] };

    expect(env.corsOrigins).toEqual(['http://a.com', 'http://b.com']);
  });

  it('defaults port to 5000 when PORT is unset', () => {
    process.env['JWT_SECRET'] = 'secret';
    delete process.env['PORT'];

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const env = require('../../../config/env').default as { port: number };

    expect(env.port).toBe(5000);
  });
});
