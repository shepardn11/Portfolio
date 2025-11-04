const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

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
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email, username, display_name, city, is_active')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user || !user.is_active) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token',
        },
      });
    }

    // Update last active timestamp
    await supabase
      .from('profiles')
      .update({ last_active: new Date().toISOString() })
      .eq('id', user.id);

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
