import WhatsappService from '../services/whatsappService.js';
import path from 'path';

class MessageController {
  initializeClient(req, res) {
    try {
      const { sessionId } = req.params;
      WhatsappService.createClient(sessionId);
      res.status(200).json({ 
        message: 'Client initialization started, check console for QR code' ,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async sendMessage(req, res) {
    try {
      const { sessionId } = req.params;
      const { number, message } = req.body;

      const result = await WhatsappService.sendMessage(sessionId, number, message);
      res.status(200).json({ 
        message: 'Message sent successfully', 
        messageId: result?.id?._serialized || 'Unknown' 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  getClientStatus(req, res) {
    try {
      const { sessionId } = req.params;
      const status = WhatsappService.getClientStatus(sessionId);
      res.status(200).json({ status });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  async getChats(req, res) {
    try {
      const { sessionId } = req.params;
      const { limit } = req.query;
      
      const chats = await WhatsappService.getChats(sessionId,3);
      res.json(chats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getChatMessages(req, res) {
    try {
      const { sessionId, chatId } = req.params;
      const { limit } = req.query;
      
      const messages = await WhatsappService.getChatMessages(
        sessionId, 
        chatId, 
        Number(limit)
      );
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getContacts(req, res) {
    try {
      const { sessionId } = req.params;
      const { limit } = req.query;
      
      const contacts = await WhatsappService.getContacts(
        sessionId, 
        Number(limit)
      );
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async sendMediaMessage(req, res) {
    try {
      const { sessionId } = req.params;
      const { number, caption } = req.body;
      
      // Assuming file is sent via multipart/form-data
      if (!req.file) {
        return res.status(400).json({ error: 'No media file uploaded' });
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
      res.status(500).json({ error: error.message });
    }
  }

  async getGroups(req, res) {
    try {
      const { sessionId } = req.params;
      const { limit } = req.query;
      
      const groups = await WhatsappService.getGroups(
        sessionId, 
        Number(limit)
      );
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new MessageController();