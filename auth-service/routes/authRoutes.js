const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-2fa', authController.verify2FA);
router.post('/auth', authController.verifyToken);
router.post('/api/auth/verify', authController.verifyToken);
router.get('/auth', authController.verifyToken);
router.get('/hello', requireAuth, authController.helloWorld);

module.exports = router;
