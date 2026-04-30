const prisma = require('../config/database');

const blockUser = async (req, res, next) => {
  try {
    const { blocked_user_id } = req.body;
    const blockerId = req.user.id;

    if (!blocked_user_id) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_FIELD', message: 'blocked_user_id is required' } });
    }

    if (blocked_user_id === blockerId) {
      return res.status(400).json({ success: false, error: { code: 'INVALID', message: 'You cannot block yourself' } });
    }

    await prisma.block.upsert({
      where: { blocker_id_blocked_id: { blocker_id: blockerId, blocked_id: blocked_user_id } },
      update: {},
      create: { blocker_id: blockerId, blocked_id: blocked_user_id },
    });

    res.json({ success: true, message: 'User blocked' });
  } catch (error) {
    next(error);
  }
};

const unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    await prisma.block.deleteMany({
      where: { blocker_id: req.user.id, blocked_id: userId },
    });
    res.json({ success: true, message: 'User unblocked' });
  } catch (error) {
    next(error);
  }
};

const getBlockedUsers = async (req, res, next) => {
  try {
    const blocks = await prisma.block.findMany({
      where: { blocker_id: req.user.id },
      include: {
        blocked: {
          select: { id: true, username: true, display_name: true, profile_photo_url: true },
        },
      },
    });
    res.json({ success: true, data: blocks.map(b => b.blocked) });
  } catch (error) {
    next(error);
  }
};

const isBlocked = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const block = await prisma.block.findUnique({
      where: { blocker_id_blocked_id: { blocker_id: req.user.id, blocked_id: userId } },
    });
    res.json({ success: true, data: { is_blocked: !!block } });
  } catch (error) {
    next(error);
  }
};

const VALID_REASONS = ['harassment', 'spam', 'inappropriate_content', 'fake_account', 'other'];

const reportUser = async (req, res, next) => {
  try {
    const { reported_user_id, reason, description } = req.body;
    const reporterId = req.user.id;

    if (!reported_user_id || !reason) {
      return res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'reported_user_id and reason are required' },
      });
    }

    if (reported_user_id === reporterId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID', message: 'You cannot report yourself' },
      });
    }

    if (!VALID_REASONS.includes(reason)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REASON', message: 'Invalid report reason' },
      });
    }

    const report = await prisma.report.create({
      data: { reporter_id: reporterId, reported_user_id, reason, description },
    });

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

const getMyReports = async (req, res, next) => {
  try {
    const reports = await prisma.report.findMany({
      where: { reporter_id: req.user.id },
      orderBy: { created_at: 'desc' },
    });
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

module.exports = { blockUser, unblockUser, getBlockedUsers, isBlocked, reportUser, getMyReports };
