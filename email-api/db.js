const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "email_client",
  port: 5432,
});

pool.connect()
  .then(client => {
    console.log('Database connection successful');
    client.release();
  })
  .catch(err => {
    console.error('Database connection error', err);
  });

module.exports = pool;

// Enable query logging
pool.on('connect', (client) => {
  client.on('notice', (msg) => {
    console.log('DB NOTICE:', msg.message);
  });
});

// Add query event logging
pool.on('query', (query) => {
  console.log('DB QUERY:', query.text, query.values);
});