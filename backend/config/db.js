const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Karunya@26', // Your MySQL password
  database: 'blinkit_clone',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

pool.getConnection()
  .then((conn) => {
    console.log('✅ Successfully connected to MySQL database: blinkit_clone');
    conn.release();
  })
  .catch((err) => {
    console.error('❌ Database Connection Error:', err.message);
  });

module.exports = pool;