const prisma = require('../config/database');
const { uploadToS3 } = require('../services/imageService');

const getFeed = async (req, res, next) => {
  try {
    const { city, limit = 50, offset = 0, sort = 'recent' } = req.query;

    // Build where clause
    const where = {
      is_active: true,
      expires_at: { gt: new Date() },
      user_id: { not: req.user.id }, // Exclude own listings
    };

    // Optionally filter by city if provided
    if (city) {
      where.city = city;
    }

    // Get listings
    const listings = await prisma.listing.findMany({
      where,
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: { date: 'asc' }, // Sort by date ascending (soonest first)
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

    // Get all unique tagged user IDs
    const allTaggedUserIds = [...new Set(listings.flatMap(l => l.tagged_users || []))];

    // Fetch tagged user details
    const taggedUsersMap = new Map();
    if (allTaggedUserIds.length > 0) {
      const taggedUsers = await prisma.user.findMany({
        where: { id: { in: allTaggedUserIds } },
        select: {
          id: true,
          username: true,
          display_name: true,
          profile_photo_url: true,
        },
      });
      taggedUsers.forEach(user => taggedUsersMap.set(user.id, user));
    }

    // Format response and filter out activities whose date/time has passed
    const now = new Date();
    const formattedListings = listings
      .filter(listing => {
        // Check if activity date/time has passed
        if (listing.date) {
          const activityDate = new Date(listing.date);

          if (listing.time) {
            // Has specific time - check date + time
            const [hours, minutes] = listing.time.split(':');
            activityDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
            return activityDate > now;
          } else {
            // No time - check if date has passed (end of day)
            activityDate.setHours(23, 59, 59, 999);
            return activityDate > now;
          }
        }
        // No date specified - rely on expires_at (already filtered in query)
        return true;
      })
      .map(listing => ({
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
        tagged_users: (listing.tagged_users || [])
          .map(userId => taggedUsersMap.get(userId))
          .filter(Boolean),
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

const getListingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get listing by ID
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            profile_photo_url: true,
          },
        },
        requests: {
          where: { requester_id: req.user.id },
          select: { id: true, status: true },
        },
      },
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

    // Fetch tagged user details
    let taggedUsers = [];
    if (listing.tagged_users && listing.tagged_users.length > 0) {
      taggedUsers = await prisma.user.findMany({
        where: { id: { in: listing.tagged_users } },
        select: {
          id: true,
          username: true,
          display_name: true,
          profile_photo_url: true,
        },
      });
    }

    // Format response
    const formattedListing = {
      id: listing.id,
      user_id: listing.user_id,
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
      username: listing.user.username,
      display_name: listing.user.display_name,
      profile_photo_url: listing.user.profile_photo_url,
      has_requested: listing.requests.length > 0,
      request_status: listing.requests.length > 0 ? listing.requests[0].status : null,
      tagged_users: taggedUsers,
    };

    res.json({
      success: true,
      data: formattedListing,
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
      tagged_users,
    } = req.body;

    // Calculate expiration based on activity date/time (with 10-minute grace period)
    let expires_at;
    if (date) {
      const activityDate = new Date(date);

      // If time is provided, combine date + time for exact expiration
      if (time) {
        const [hours, minutes] = time.split(':');
        activityDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        // Add 10-minute grace period
        activityDate.setMinutes(activityDate.getMinutes() + 10);
        expires_at = activityDate;
      } else {
        // No time specified, expire at end of day (11:59 PM) + 10 minutes
        activityDate.setHours(23, 59, 59, 999);
        activityDate.setMinutes(activityDate.getMinutes() + 10);
        expires_at = activityDate;
      }
    } else {
      // No date specified, expire 24 hours from now
      expires_at = new Date();
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
        tagged_users: tagged_users || [],
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

    // Filter by status if provided, otherwise show only active (non-expired) by default
    if (status === 'expired') {
      where.expires_at = { lte: new Date() };
    } else {
      // Default: show only active (non-expired) listings
      where.is_active = true;
      where.expires_at = { gt: new Date() };
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

    // Filter out activities whose date/time has passed (for status !== 'expired')
    const now = new Date();
    const filteredListings = status === 'expired'
      ? listings
      : listings.filter(listing => {
          // Check if activity date/time has passed
          if (listing.date) {
            const activityDate = new Date(listing.date);

            if (listing.time) {
              // Has specific time - check date + time
              const [hours, minutes] = listing.time.split(':');
              activityDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
              return activityDate > now;
            } else {
              // No time - check if date has passed (end of day)
              activityDate.setHours(23, 59, 59, 999);
              return activityDate > now;
            }
          }
          // No date specified - rely on expires_at (already filtered in query)
          return true;
        });

    res.json({
      success: true,
      data: filteredListings,
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
  getListingById,
  createListing,
  getMyListings,
  deleteListing,
};
