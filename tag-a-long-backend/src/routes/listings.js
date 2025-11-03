const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { createListingSchema } = require('../utils/validators');
const { createListingLimiter } = require('../middleware/rateLimiter');
const listingsController = require('../controllers/listingsController');
const upload = require('../config/multer');

const router = express.Router();

router.get('/feed', authenticateToken, listingsController.getFeed);
router.get('/my-listings', authenticateToken, listingsController.getMyListings);

router.post(
  '/',
  authenticateToken,
  createListingLimiter,
  validate(createListingSchema),
  listingsController.createListing
);

router.delete('/:id', authenticateToken, listingsController.deleteListing);

module.exports = router;
