const db = require('../utils/db');
const bcrypt = require('bcrypt');

async function createDevUser() {
  try {
    // 1. Create accessible module
    const [moduleResult] = await new Promise((resolve, reject) => {
      db.query('INSERT INTO accessible_modules (module_name) VALUES (?)', ['developer_module'], (err, result) => {
        if (err) reject(err); else resolve([result]);
      });
    });
    const accessibleModuleId = moduleResult.insertId;
    console.log('Accessible module created, id:', accessibleModuleId);

    // 2. Create role
    const [roleResult] = await new Promise((resolve, reject) => {
      db.query('INSERT INTO roles (role_name, accessible_modules) VALUES (?, JSON_ARRAY(?))', ['developer', accessibleModuleId], (err, result) => {
        if (err) reject(err); else resolve([result]);
      });
    });
    const roleId = roleResult.insertId;
    console.log('Role created, id:', roleId);

    // 3. Create user with hashed password
    const password = 'devpassword';
    const hash = await bcrypt.hash(password, 10);
    const [userResult] = await new Promise((resolve, reject) => {
      db.query('INSERT INTO users (first_name, last_name, user_name, password, email, phone, role_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ['Dev', 'User', 'developer', hash, 'dev@example.com', '1234567890', roleId],
        (err, result) => {
          if (err) reject(err); else resolve([result]);
        });
    });
    console.log('Developer user created, id:', userResult.insertId);
    console.log('Login credentials: user_name=developer, password=devpassword');
    process.exit(0);
  } catch (err) {
    console.error('Error creating dev user:', err);
    process.exit(1);
  }
}

createDevUser(); 