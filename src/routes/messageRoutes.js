import express from 'express';
import MessageController from '../controllers/messageController.js';
import multer from "multer";

const router = express.Router();
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage: storage });

router.post('/:sessionId/initialize', MessageController.initializeClient);
router.post('/:sessionId/logOut', MessageController.logOut);
router.post('/:sessionId/send', MessageController.sendMessage);
router.get('/:sessionId/status', MessageController.getClientStatus);
router.get('/:sessionId/chats', MessageController.getAllChats);
router.get('/:sessionId/chats/:chatId/messages', MessageController.getChatMessages);
router.get('/:sessionId/contacts', MessageController.getContacts);
router.get('/:sessionId/groups', MessageController.getGroups);
router.post('/:sessionId/send-media', upload.single('file') , MessageController.sendMediaMessage);
router.get('/:sessionId/media/:messageId', MessageController.getMediaMessage);


export default router;