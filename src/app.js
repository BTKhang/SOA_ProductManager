const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const productRoutes = require('./routes/productRoutes');
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT && process.env.PORT !== '3000' ? process.env.PORT : 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Giao diện web
app.use(express.static(path.join(__dirname, '../public')));

// Log request
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
            database: 'connected',
            uptime: process.uptime()
        });
    } catch (err) {
        res.status(500).json({
            status: 'error',
            database: 'disconnected',
            error: err.message
        });
    }
});

// Sinh token test
app.post('/dev/token', (req, res) => {
    const payload = req.body.payload || {
        id: 1,
        username: 'admin'
    };
    const secret = process.env.JWT_SECRET || 'supersecret_jwt_key_soa_2026';
    const token = jwt.sign(payload, secret, { expiresIn: '24h' });

    res.json({
        success: true,
        token
    });
});

// Routes sản phẩm
app.use('/products', productRoutes);

// Fallback trang SPA
app.use((req, res) => {
    if (req.accepts('html')) {
        return res.sendFile(path.join(__dirname, '../public/index.html'));
    }
    res.status(404).json({
        success: false,
        message: 'Endpoint không tồn tại'
    });
});

// Xử lý lỗi tập trung
app.use((err, req, res, next) => {
    console.error(err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Lỗi máy chủ'
    });
});

app.listen(PORT, () => {
    console.log(`Product service running on http://localhost:${PORT}`);
});

module.exports = app;
