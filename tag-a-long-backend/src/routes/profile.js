const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { updateProfileSchema } = require('../utils/validators');
const profileController = require('../controllers/profileController');
const upload = require('../config/multer');

const router = express.Router();

router.get('/search', profileController.searchUsers);
router.get('/me', authenticateToken, profileController.getMyProfile);
router.get('/by-id/:id', profileController.getProfileById);
router.get('/:username', profileController.getProfileByUsername);
router.put('/me', authenticateToken, validate(updateProfileSchema), profileController.updateProfile);
router.post('/me/photo', authenticateToken, upload.single('photo'), profileController.uploadProfilePhoto);

module.exports = router;
