const express = require('express');
const { validate } = require('../middleware/validation');
const { signupSchema, loginSchema } = require('../utils/validators');
const { authLimiter } = require('../middleware/rateLimiter');
const { authenticateToken } = require('../middleware/auth');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/signup', authLimiter, validate(signupSchema), authController.signup);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/logout', authenticateToken, authController.logout);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authLimiter, authController.resetPassword);
router.delete('/account', authenticateToken, authController.deleteAccount);

module.exports = router;
