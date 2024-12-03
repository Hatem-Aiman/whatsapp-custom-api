import express from 'express';
import MessageController from '../controllers/messageController.js';

const router = express.Router();

// Existing routes
router.post('/:sessionId/initialize', MessageController.initializeClient);
router.post('/:sessionId/send', MessageController.sendMessage);
router.get('/:sessionId/status', MessageController.getClientStatus);

// New routes
router.get('/:sessionId/chats', MessageController.getChats);
router.get('/:sessionId/chats/:chatId/messages', MessageController.getChatMessages);
router.get('/:sessionId/contacts', MessageController.getContacts);
router.post('/:sessionId/send-media', MessageController.sendMediaMessage);
router.get('/:sessionId/groups', MessageController.getGroups);


export default router;