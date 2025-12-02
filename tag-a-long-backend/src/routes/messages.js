const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const messagesController = require('../controllers/messagesController');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all conversations
router.get('/conversations', messagesController.getConversations);

// Get or create a conversation
router.post('/conversations', messagesController.getOrCreateConversation);

// Get messages in a conversation
router.get('/conversations/:conversation_id/messages', messagesController.getMessages);

// Send a message
router.post('/messages', messagesController.sendMessage);

module.exports = router;
