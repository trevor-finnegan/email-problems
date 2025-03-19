const { Pool } = require("pg");

const pool = new Pool({
  user: "email_user",
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
