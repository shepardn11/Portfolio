const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { blockUser, unblockUser, getBlockedUsers, isBlocked, reportUser, getMyReports } = require('../controllers/safetyController');

const router = express.Router();

router.post('/block', authenticateToken, blockUser);
router.delete('/block/:userId', authenticateToken, unblockUser);
router.get('/blocked', authenticateToken, getBlockedUsers);
router.get('/is-blocked/:userId', authenticateToken, isBlocked);
router.post('/report', authenticateToken, reportUser);
router.get('/my-reports', authenticateToken, getMyReports);

module.exports = router;
