import express from 'express';
import MessageController from '../controllers/messageController.js';

const router = express.Router();

router.post('/:sessionId/initialize', MessageController.initializeClient);
router.post('/:sessionId/send', MessageController.sendMessage);
router.get('/:sessionId/status', MessageController.getClientStatus);
router.get('/:sessionId/chats', MessageController.getAllChats);
router.get('/:sessionId/chats/:chatId/messages', MessageController.getChatMessages);
router.get('/:sessionId/contacts', MessageController.getContacts);
router.get('/:sessionId/groups', MessageController.getGroups);


export default router;