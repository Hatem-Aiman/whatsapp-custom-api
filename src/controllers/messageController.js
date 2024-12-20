import WhatsappService from '../services/whatsappService.js';

class MessageController {
    async initializeClient(req, res) {
        try {
            const {sessionId} = req.params;
            const qr = await WhatsappService.createClient(sessionId);
            res.status(200).json({
                message: qr,
            });
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    }

    async logOut(req, res) {
        try {
            const {sessionId} = req.params;
            await WhatsappService.logOut(sessionId);
            res.status(200).json({message: 'Logged out successfully'});
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    }

    async sendMessage(req, res) {
        try {
            const {sessionId} = req.params;
            const {number, message} = req.body;

            const result = await WhatsappService.sendMessage(sessionId, number, message);
            res.status(200).json({
                message: 'Message sent successfully',
                messageId: result?.id?._serialized || 'Unknown'
            });
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    }

    async getClientStatus(req, res) {
        try {
            const {sessionId} = req.params;
            const status = await WhatsappService.getClientStatus(sessionId);
            res.send(status);
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    }

    async getAllChats(req, res) {
        try {
            const {sessionId} = req.params;
            const {limit} = req.query;

            const chats = await WhatsappService.getAllChat(sessionId);
            res.json(chats);
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    }

    async getChatMessages(req, res) {
        try {
            const {sessionId, chatId} = req.params;
            const {limit} = req.query;

            const messages = await WhatsappService.getChatMessages(
                sessionId,
                chatId,
                Number(limit)
            );
            res.json(messages);
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    }

    async getContacts(req, res) {
        try {
            const {sessionId} = req.params;
            const {limit} = req.query;

            const contacts = await WhatsappService.getContacts(
                sessionId,
                Number(limit)
            );
            res.json(contacts);
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    }

    async getGroups(req, res) {
        try {
            const {sessionId} = req.params;
            const {limit} = req.query;

            const groups = await WhatsappService.getGroups(
                sessionId,
                Number(limit)
            );
            res.json(groups);
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    }

    async sendMediaMessage(req, res) {
        try {
            const {sessionId} = req.params;
            const {number, caption} = req.body;

            if (!req.file) {
                console.log(req.file);
                console.log(req.body);
                return res.status(400).json({error: 'No media file uploaded'});
            }

            const result = await WhatsappService.sendMediaMessage(
                sessionId,
                number,
                req.file.path,
                caption
            );

            res.json({
                message: 'Media message sent successfully',
                messageId: result?.id?._serialized || 'Unknown'
            });
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    }

    async getMediaMessage(req, res) {
        try {
            const {sessionId, messageId} = req.params;
            const media = await WhatsappService.getMediaMessage(sessionId, messageId);
            res.send(media);
        } catch (error) {
            res.status(500).json({error: error.message});
        }
    }

}

export default new MessageController();