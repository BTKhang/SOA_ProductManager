const axios = require('axios');
const jwt = require('jsonwebtoken');

const verifyToken = async (req, res, next) => {
    if (process.env.BYPASS_AUTH === 'true') {
        req.user = { id: 1, username: 'admin' };
        req.token = 'bypass_token';
        return next();
    }

    const authHeader = req.headers['authorization'] || req.headers['Authorization'];

    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'Thiếu token xác thực'
        });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            success: false,
            message: 'Token không đúng định dạng Bearer'
        });
    }

    const token = parts[1];
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3000/api/auth/verify';

    try {
        const response = await axios.post(authServiceUrl, { token }, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            timeout: 3000
        });

        if (response.status === 200 && response.data.success !== false) {
            req.user = response.data.user || response.data;
            req.token = token;
            return next();
        }

        return res.status(401).json({
            success: false,
            message: 'Xác thực không thành công'
        });

    } catch (error) {
        if (error.response) {
            return res.status(error.response.status || 401).json({
                success: false,
                message: error.response.data?.message || 'Token không hợp lệ hoặc đã hết hạn'
            });
        }

        // Fallback verify token bằng secret key nếu auth service tạm thời gián đoạn
        const jwtSecret = process.env.JWT_SECRET || 'supersecret_jwt_key_soa_2026';
        try {
            const decoded = jwt.verify(token, jwtSecret);
            req.user = decoded;
            req.token = token;
            return next();
        } catch (jwtErr) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ',
                details: jwtErr.message
            });
        }
    }
};

module.exports = {
    verifyToken
};
