require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('../utils/db');

const app = express();

// Middleware to parse JSON requests
app.use(express.json());
app.use(cors());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'YT Pro Backend API',
        status: 'running',
        timestamp: new Date().toISOString()
    });
});

// Import routes
const authRoutes = require('./auth');
const authenticateJWT = require('../middleware/auth');

// Public routes (no authentication required)
app.use('/auth', authRoutes);

// Protected routes (authentication required)
app.use('/users', authenticateJWT, require('./users'));
app.use('/roles', authenticateJWT, require('./roles'));
app.use('/my_companies', authenticateJWT, require('./my_companies'));
app.use('/accessible_modules', authenticateJWT, require('./accessible_modules'));
app.use('/user_companies', authenticateJWT, require('./user_companies'));
app.use('/companies', authenticateJWT, require('./companies'));
app.use('/categories', authenticateJWT, require('./categories'));
app.use('/finishes', authenticateJWT, require('./finishes'));
app.use('/woods', authenticateJWT, require('./woods'));
app.use('/thicknesses', authenticateJWT, require('./thicknesses'));
app.use('/units', authenticateJWT, require('./units'));
app.use('/colors', authenticateJWT, require('./colors'));
app.use('/warehouses', authenticateJWT, require('./warehouses'));
app.use('/product_types', authenticateJWT, require('./product_types'));
app.use('/products', authenticateJWT, require('./products'));
app.use('/product_dimensions', authenticateJWT, require('./product_dimensions'));
app.use('/product_stocks', authenticateJWT, require('./product_stocks'));
app.use('/product_prices', authenticateJWT, require('./product_prices'));
app.use('/purchase_prices', authenticateJWT, require('./purchase_prices'));
app.use('/product_sides', authenticateJWT, require('./product_sides'));
app.use('/vehicles', authenticateJWT, require('./vehicles'));
app.use('/drivers', authenticateJWT, require('./drivers'));
app.use('/payment_terms', authenticateJWT, require('./payment_terms'));
app.use('/banks', authenticateJWT, require('./banks'));
app.use('/bank_accounts', authenticateJWT, require('./bank_accounts'));
app.use('/suppliers', authenticateJWT, require('./suppliers'));
app.use('/customers', authenticateJWT, require('./customers'));
app.use('/expense_types', authenticateJWT, require('./expense_types'));
app.use('/expenses', authenticateJWT, require('./expenses'));

// Purchase Order and Sales Routes
app.use('/purchase_orders', authenticateJWT, require('./purchase_orders'));
app.use('/received_purchases', authenticateJWT, require('./received_purchases'));
app.use('/received_products', authenticateJWT, require('./received_products'));
app.use('/returned_products', authenticateJWT, require('./returned_products'));
app.use('/sales_orders', authenticateJWT, require('./sales_orders'));
app.use('/sales_invoices', authenticateJWT, require('./sales_invoices'));
app.use('/sales_warehouse_movements', authenticateJWT, require('./sales_warehouse_movements'));
app.use('/cut_pieces', authenticateJWT, require('./cut_pieces'));

// Daily Counter Routes
app.use('/daily_counter', authenticateJWT, require('./daily_counter'));
app.use('/daily_counter_details', authenticateJWT, require('./daily_counter_details'));

// Payment Routes
app.use('/payment_in', authenticateJWT, require('./payment_in'));
app.use('/payment_out', authenticateJWT, require('./payment_out'));
app.use('/cheques', authenticateJWT, require('./cheques'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found'
    });
});

// Export for Vercel serverless
module.exports = app;
