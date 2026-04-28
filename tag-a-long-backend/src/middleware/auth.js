const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'NO_TOKEN',
        message: 'Access token is required',
      },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        city: true,
        is_active: true,
        last_active: true,
        token_version: true,
      },
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
    }

    // Reject tokens issued before the user logged out (token invalidation)
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== user.token_version) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_REVOKED',
          message: 'Token has been revoked',
        },
      });
    }

    // Only update last_active if it's been more than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (!user.last_active || user.last_active < fiveMinutesAgo) {
      await prisma.user.update({
        where: { id: user.id },
        data: { last_active: new Date() },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'TOKEN_VERIFICATION_FAILED',
        message: 'Failed to authenticate token',
      },
    });
  }
};

module.exports = { authenticateToken };
