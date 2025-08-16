const mysql = require('mysql2');

// Database configuration with environment variable support
const dbConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'yt_pro',
    // Connection pool settings for serverless
    connectionLimit: 10,
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true
};

// Create connection pool for better serverless performance
const pool = mysql.createPool(dbConfig);

// Create a promise wrapper for the pool
const db = pool.promise();

// Test connection
const testConnection = async () => {
    try {
        const [rows] = await db.execute('SELECT 1 as test');
        console.log('Database connected successfully');
        return true;
    } catch (error) {
        console.error('Database connection error:', error);
        return false;
    }
};

// Initialize connection test
testConnection();

module.exports = db; 