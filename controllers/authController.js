const db = require('../utils/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.login = (req, res) => {
    const { user_name, password } = req.body;
    db.query('SELECT * FROM users WHERE user_name = ? AND is_deleted = 0', [user_name], (err, results) => {
        if (err) return res.status(500).json({ message: 'Database error' });
        if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
        const user = results[0];
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err || !isMatch) return res.status(401).json({ message: 'Invalid credentials' });
            const token = jwt.sign({ id: user.id, role_id: user.role_id, user_name: user.user_name }, 'Q3JhZnRlZCBCeSBJbm5vYXJ0aXZlTGFicw==', { expiresIn: '8h' });
            db.query('SELECT role_name, accessible_modules FROM roles WHERE id = ? AND is_deleted = 0', [user.role_id], (err, roleResults) => {
                if (err) return res.status(500).json({ message: 'Database error' });
                if (roleResults.length === 0) return res.status(404).json({ message: 'Role not found' });
                const role = roleResults[0];
                let accessible_modules = role.accessible_modules;
                try {
                    accessible_modules = JSON.parse(accessible_modules);
                } catch (e) {}
                // Fetch companies the user has access to
                db.query('SELECT uc.company_id, mc.company_name FROM user_companies uc JOIN my_companies mc ON uc.company_id = mc.id WHERE uc.user_id = ? AND uc.is_deleted = 0 AND mc.is_deleted = 0', [user.id], (err, companyResults) => {
                    if (err) return res.status(500).json({ message: 'Database error' });
                    res.json({
                        token,
                        user: {
                            ...user,
                            role_name: role.role_name,
                            accessible_modules,
                            companies: companyResults // Array of {company_id, company_name}
                        }
                    });
                });
            });
        });
    });
};

exports.logout = (req, res) => {
    // JWT is stateless; client should just delete token
    res.json({ message: 'Logged out successfully' });
};