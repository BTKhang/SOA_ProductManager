const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
});

app.get('/', (req, res) => {
    res.json({
        service: 'auth-service',
        status: 'running',
        port: PORT
    });
});

app.use('/', authRoutes);
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`Auth service running on http://localhost:${PORT}`);
});

module.exports = app;
