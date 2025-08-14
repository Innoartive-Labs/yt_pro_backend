const express = require('express');
const cors = require('cors');
const db = require('./utils/db');
const path = require('path');

const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(express.json());

const authRoutes = require('./routes/auth');
const authenticateJWT = require('./middleware/auth');

app.use(cors());

app.get('/', (req, res) => {
    res.send('Hello World with MySQL!');
});

// Test route to verify uploads directory
app.get('/test-uploads', (req, res) => {
    const fs = require('fs');
    const uploadsPath = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadsPath)) {
        res.json({ 
            message: 'Uploads directory exists',
            path: uploadsPath,
            contents: fs.readdirSync(uploadsPath)
        });
    } else {
        res.json({ message: 'Uploads directory not found' });
    }
});
app.use('/auth', authRoutes);
// Serve uploads directory without authentication - must be before auth middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(authenticateJWT);
app.use('/users', require('./routes/users'));
app.use('/roles', require('./routes/roles'));
app.use('/my_companies', require('./routes/my_companies'));
app.use('/accessible_modules', require('./routes/accessible_modules'));
app.use('/user_companies', require('./routes/user_companies'));
app.use('/companies', require('./routes/companies'));
app.use('/categories', require('./routes/categories'));
app.use('/finishes', require('./routes/finishes'));
app.use('/woods', require('./routes/woods'));
app.use('/thicknesses', require('./routes/thicknesses'));
app.use('/units', require('./routes/units'));
app.use('/colors', require('./routes/colors'));
app.use('/warehouses', require('./routes/warehouses'));
app.use('/product_types', require('./routes/product_types'));
app.use('/products', require('./routes/products'));
app.use('/product_dimensions', require('./routes/product_dimensions'));
app.use('/product_stocks', require('./routes/product_stocks'));
app.use('/product_prices', require('./routes/product_prices'));
app.use('/purchase_prices', require('./routes/purchase_prices'));
app.use('/product_sides', require('./routes/product_sides'));
app.use('/vehicles', require('./routes/vehicles'));
app.use('/drivers', require('./routes/drivers'));
app.use('/payment_terms', require('./routes/payment_terms'));
app.use('/banks', require('./routes/banks'));
app.use('/bank_accounts', require('./routes/bank_accounts'));
app.use('/suppliers', require('./routes/suppliers'));
app.use('/customers', require('./routes/customers'));
app.use('/expense_types', require('./routes/expense_types'));
app.use('/expenses', require('./routes/expenses'));

// Purchase Order and Sales Routes
app.use('/purchase_orders', require('./routes/purchase_orders'));
app.use('/received_purchases', require('./routes/received_purchases'));
app.use('/received_products', require('./routes/received_products'));
app.use('/returned_products', require('./routes/returned_products'));
app.use('/sales_orders', require('./routes/sales_orders'));
app.use('/sales_invoices', require('./routes/sales_invoices'));
app.use('/sales_warehouse_movements', require('./routes/sales_warehouse_movements'));
app.use('/cut_pieces', require('./routes/cut_pieces'));

// Daily Counter Routes
app.use('/daily_counter', require('./routes/daily_counter'));
app.use('/daily_counter_details', require('./routes/daily_counter_details'));

// Payment Routes
app.use('/payment_in', require('./routes/payment_in'));
app.use('/payment_out', require('./routes/payment_out'));
app.use('/cheques', require('./routes/cheques'));

// Start Server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
