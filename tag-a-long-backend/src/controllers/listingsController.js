const prisma = require('../config/database');
const { uploadToS3 } = require('../services/imageService');

const getFeed = async (req, res, next) => {
  try {
    const { city, limit = 50, offset = 0, sort = 'recent' } = req.query;
    const userCity = city || req.user.city;

    // Build where clause
    const where = {
      city: userCity,
      is_active: true,
      expires_at: { gt: new Date() },
      user_id: { not: req.user.id }, // Exclude own listings
    };

    // Get listings
    const listings = await prisma.listing.findMany({
      where,
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: sort === 'recent'
        ? { created_at: 'desc' }
        : { time_text: 'asc' },
      include: {
        user: {
          select: {
            username: true,
            display_name: true,
            profile_photo_url: true,
          },
        },
        requests: {
          where: { requester_id: req.user.id },
          select: { id: true },
        },
      },
    });

    // Get total count for pagination
    const total = await prisma.listing.count({ where });

    // Format response
    const formattedListings = listings.map(listing => ({
      id: listing.id,
      title: listing.title,
      description: listing.description,
      category: listing.category,
      location: listing.location,
      date: listing.date,
      time: listing.time,
      max_participants: listing.max_participants,
      photo_url: listing.photo_url,
      caption: listing.caption,
      time_text: listing.time_text,
      city: listing.city,
      created_at: listing.created_at,
      expires_at: listing.expires_at,
      user: listing.user,
      has_requested: listing.requests.length > 0,
    }));

    res.json({
      success: true,
      data: {
        listings: formattedListings,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          has_more: parseInt(offset) + parseInt(limit) < total,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const createListing = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      location,
      date,
      time,
      max_participants,
      photo_url,
      caption,
      time_text,
    } = req.body;

    // Calculate expiration (24 hours after activity date, or 24 hours from now if no date)
    const expires_at = new Date();
    if (date) {
      const activityDate = new Date(date);
      expires_at.setTime(activityDate.getTime() + (24 * 60 * 60 * 1000)); // Add 24 hours
    } else {
      expires_at.setHours(expires_at.getHours() + 24);
    }

    // Create listing with new structure
    const listing = await prisma.listing.create({
      data: {
        user_id: req.user.id,
        title: title.trim(),
        description: description?.trim() || null,
        category: category || null,
        location: location?.trim() || null,
        date: date ? new Date(date) : null,
        time: time || null,
        max_participants: max_participants || null,
        photo_url: photo_url || null,
        caption: caption?.trim() || description?.trim() || null,
        time_text: time_text || time || null,
        city: req.user.city,
        expires_at,
      },
      include: {
        user: {
          select: {
            username: true,
            display_name: true,
            profile_photo_url: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: listing,
    });
  } catch (error) {
    next(error);
  }
};

const getMyListings = async (req, res, next) => {
  try {
    const { status } = req.query;

    // Build where clause
    const where = {
      user_id: req.user.id,
    };

    // Filter by status if provided
    if (status === 'active') {
      where.is_active = true;
      where.expires_at = { gt: new Date() };
    } else if (status === 'expired') {
      where.expires_at = { lte: new Date() };
    }

    // Get listings
    const listings = await prisma.listing.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            display_name: true,
            profile_photo_url: true,
          },
        },
        requests: {
          select: {
            id: true,
            status: true,
            requester: {
              select: {
                id: true,
                username: true,
                display_name: true,
                profile_photo_url: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      data: listings,
    });
  } catch (error) {
    next(error);
  }
};

const deleteListing = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check ownership
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { user_id: true },
    });

    if (!listing) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Listing not found',
        },
      });
    }

    if (listing.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only delete your own listings',
        },
      });
    }

    // Delete listing (cascade will delete requests)
    await prisma.listing.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Listing deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFeed,
  createListing,
  getMyListings,
  deleteListing,
};
