const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware
const auth = async(req, res, next) => {
    try {
        // This syntax won't get auto-formatted wrong
        const authHeader = req.header('Authorization');
        const token = authHeader && authHeader.startsWith('Bearer ') ?
            authHeader.substring(7) :
            null;

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Attach user to request
        req.user = user;
        req.userId = user._id;
        next();

    } catch (error) {
        console.error('Auth middleware error:', error.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Admin middleware
const adminAuth = async(req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        const token = authHeader && authHeader.startsWith('Bearer ') ?
            authHeader.substring(7) :
            null;

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        // Check if user is admin
        if (user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        req.user = user;
        req.userId = user._id;
        next();

    } catch (error) {
        console.error('Admin middleware error:', error.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = { auth, adminAuth };