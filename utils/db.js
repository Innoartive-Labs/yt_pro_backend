const mysql = require('mysql2');

const db = mysql.createConnection({
    // host: 'srv444.hstgr.io',
    // port: 3306,
    // user: 'u375651769_innoartive',
    // password: 'Inno2772,,Adnan',
    // database: 'u375651769_yt_pro'
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'yt_pro'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

module.exports = db; 