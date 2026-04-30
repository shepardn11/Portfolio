const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { blockUser, unblockUser, getBlockedUsers, isBlocked } = require('../controllers/safetyController');

const router = express.Router();

router.post('/block', authenticateToken, blockUser);
router.delete('/block/:userId', authenticateToken, unblockUser);
router.get('/blocked', authenticateToken, getBlockedUsers);
router.get('/is-blocked/:userId', authenticateToken, isBlocked);

module.exports = router;
