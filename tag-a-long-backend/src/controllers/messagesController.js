const prisma = require('../config/database');

// Get all conversations for the current user
const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get conversations where user is either participant1 or participant2
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1: userId },
          { participant2: userId },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            display_name: true,
            profile_photo_url: true,
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            display_name: true,
            profile_photo_url: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { created_at: 'desc' },
          select: {
            content: true,
            created_at: true,
            sender_id: true,
            is_read: true,
          },
        },
      },
      orderBy: { updated_at: 'desc' },
    });

    // Format conversations with the other user's info and last message
    const formattedConversations = conversations.map(conv => {
      const otherUser = conv.participant1 === userId ? conv.user2 : conv.user1;
      const lastMessage = conv.messages[0] || null;

      // Count unread messages
      return prisma.message.count({
        where: {
          conversation_id: conv.id,
          sender_id: { not: userId },
          is_read: false,
        },
      }).then(unreadCount => ({
        id: conv.id,
        other_user: otherUser,
        last_message: lastMessage,
        unread_count: unreadCount,
        updated_at: conv.updated_at,
      }));
    });

    const results = await Promise.all(formattedConversations);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// Get or create a conversation between two users
const getOrCreateConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { other_user_id } = req.body;

    if (!other_user_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: 'other_user_id is required',
        },
      });
    }

    if (userId === other_user_id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_USER',
          message: 'Cannot create conversation with yourself',
        },
      });
    }

    // Ensure consistent ordering for unique constraint
    const [participant1, participant2] = [userId, other_user_id].sort();

    // Try to find existing conversation
    let conversation = await prisma.conversation.findUnique({
      where: {
        participant1_participant2: {
          participant1,
          participant2,
        },
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            display_name: true,
            profile_photo_url: true,
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            display_name: true,
            profile_photo_url: true,
          },
        },
      },
    });

    // Create if doesn't exist
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participant1,
          participant2,
        },
        include: {
          user1: {
            select: {
              id: true,
              username: true,
              display_name: true,
              profile_photo_url: true,
            },
          },
          user2: {
            select: {
              id: true,
              username: true,
              display_name: true,
              profile_photo_url: true,
            },
          },
        },
      });
    }

    const otherUser = conversation.participant1 === userId ? conversation.user2 : conversation.user1;

    res.json({
      success: true,
      data: {
        id: conversation.id,
        other_user: otherUser,
        created_at: conversation.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get messages in a conversation
const getMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversation_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verify user is part of the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversation_id },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        },
      });
    }

    if (conversation.participant1 !== userId && conversation.participant2 !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not part of this conversation',
        },
      });
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: { conversation_id },
      take: parseInt(limit),
      skip: parseInt(offset),
      orderBy: { created_at: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            display_name: true,
            profile_photo_url: true,
          },
        },
      },
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversation_id,
        sender_id: { not: userId },
        is_read: false,
      },
      data: { is_read: true },
    });

    res.json({
      success: true,
      data: messages.reverse(), // Reverse to show oldest first
    });
  } catch (error) {
    next(error);
  }
};

// Send a message
const sendMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversation_id, content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_MESSAGE',
          message: 'Message content cannot be empty',
        },
      });
    }

    // Verify user is part of the conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversation_id },
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        },
      });
    }

    if (conversation.participant1 !== userId && conversation.participant2 !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not part of this conversation',
        },
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversation_id,
        sender_id: userId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            display_name: true,
            profile_photo_url: true,
          },
        },
      },
    });

    // Update conversation updated_at
    await prisma.conversation.update({
      where: { id: conversation_id },
      data: { updated_at: new Date() },
    });

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
};
