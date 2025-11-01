const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { updateProfileSchema } = require('../utils/validators');
const profileController = require('../controllers/profileController');
const upload = require('../config/multer');

const router = express.Router();

// All specific routes MUST come before the catch-all /:username route
router.get('/test-route-v3', (req, res) => {
  res.json({ message: 'Routes working - v3', timestamp: Date.now() });
});

router.get('/search-users', profileController.searchUsers);
router.get('/by-id/:id', profileController.getProfileById);
router.get('/me', authenticateToken, profileController.getMyProfile);

// PUT and POST routes
router.put('/me', authenticateToken, validate(updateProfileSchema), profileController.updateProfile);
router.post('/me/photo', authenticateToken, upload.single('photo'), profileController.uploadProfilePhoto);

// IMPORTANT: This catch-all route MUST be last
router.get('/:username', profileController.getProfileByUsername);

module.exports = router;
