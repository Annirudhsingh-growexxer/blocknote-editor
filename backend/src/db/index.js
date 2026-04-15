const { Pool } = require('pg');

// Support either a single DATABASE_URL connection string or individual
// environment variables (DB_USER, DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT).
// This makes it easier to configure local development (and to use SQLTools).
const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER || process.env.PGUSER || 'postgres',
      host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
      database: process.env.DB_NAME || process.env.PGDATABASE || 'postgres',
      password: process.env.DB_PASSWORD || process.env.PGPASSWORD || '',
      port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432', 10),
    };

const pool = new Pool(poolConfig);

// Test connection on startup
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Database connection failed:', err.stack);
    process.exit(1);
  } else {
    console.log('Database connected successfully');
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
