const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    // Skip authentication for uploads
    if (req.path.startsWith('/uploads/')) {
        return next();
    }
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, 'Q3JhZnRlZCBCeSBJbm5vYXJ0aXZlTGFicw==', (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid or expired token' });
            }
            req.user = user;
            next();
        });
    } else {
        res.status(401).json({ message: 'Authorization header missing or malformed' });
    }
};

module.exports = authenticateJWT; 