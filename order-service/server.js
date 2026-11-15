const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const orderRoutes = require('./routes/orderRoutes');
const orderItemRoutes = require('./routes/orderItemRoutes');
const pool = require('./config/db');

const app = express();
const PORT = process.env.ORDER_PORT || (process.env.PORT && process.env.PORT !== '3000' && process.env.PORT !== '3001' ? process.env.PORT : 3002);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
});

// Health check
app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            status: 'ok',
            service: 'order-service',
            database: 'connected',
            port: PORT,
            uptime: process.uptime()
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            service: 'order-service',
            database: 'disconnected',
            error: err.message
        });
    }
});

app.get('/', (req, res) => {
    res.json({
        service: 'order-service',
        status: 'running',
        port: PORT
    });
});

// Mount routes
app.use('/orders', orderRoutes);
app.use('/order_items', orderItemRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint không tồn tại'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Lỗi máy chủ'
    });
});

app.listen(PORT, () => {
    console.log(`Order service running on http://localhost:${PORT}`);
});

module.exports = app;
