import pkg from 'whatsapp-web.js';
const { Client, MessageMedia } = pkg;
import qrcode from 'qrcode-terminal';
import path from 'path';
import fs from 'fs';

class WhatsappService {
  constructor() {
    this.clients = new Map();
  }

  createClient(sessionId) {
    // If client already exists, return it
    if (this.clients.has(sessionId)) {
      return this.clients.get(sessionId);
    }

    // Create new client
    const client = new Client({
      // You can add configuration options here if needed
    });

    // QR Code Event
    client.on('qr', (qr) => {
      console.log('QR Code Received for Session:', sessionId);
      // Generate QR in terminal for easy scanning
      qrcode.generate(qr, { small: true });
    });

    // Ready Event
    client.on('ready', () => {
      console.log(`WhatsApp Client ${sessionId} is ready!`);
    });

    // Authentication Failure
    client.on('auth_failure', (msg) => {
      console.error(`Authentication failure for ${sessionId}:`, msg);
    });

    // Disconnected Event
    client.on('disconnected', (reason) => {
      console.log(`Client ${sessionId} disconnected:`, reason);
      this.clients.delete(sessionId);
    });

    // Initialize the client
    client.initialize();

    // Store the client
    this.clients.set(sessionId, client);

    return client;
  }

  async sendMessage(sessionId, number, message) {
    const client = this.clients.get(sessionId);
    if (!client) {
      throw new Error(`Client ${sessionId} not initialized`);
    }

    try {
      const chatId = await client.getNumberId(number);
      if (!chatId) {
        throw new Error('Invalid number');
      }

      return await client.sendMessage(chatId._serialized, message);
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  getClientStatus(sessionId) {
    const client = this.clients.get(sessionId);
    return client ? client.state : 'DISCONNECTED';
  }

  async getChats(sessionId, limit = 3) {
    const client = this.clients.get(sessionId);
    if (!client) {
      throw new Error(`Client ${sessionId} not initialized`);
    }

    try {
      const chats = await client.getChats();
      return chats.slice(0, limit).map(chat => ({
        id: chat.id._serialized,
        name: chat.name || chat.pushname,
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount,
        lastMessage: chat.lastMessage ? {
          
          body: chat.lastMessage.body,
          timestamp: chat.lastMessage.timestamp
        } : null
      }));
    } catch (error) {
      console.error('Error retrieving chats:', error);
      throw error;
    }
  }

  async getChatMessages(sessionId, chatId, limit = 50) {
    const client = this.clients.get(sessionId);
    if (!client) {
      throw new Error(`Client ${sessionId} not initialized`);
    }

    try {
      const chat = await client.getChatById(chatId);
      const messages = await chat.fetchMessages({ limit });
      
      return messages.map(msg => ({
        id: msg.id._serialized,
        body: msg.body,
        timestamp: msg.timestamp,
        from: msg.from,
        to: msg.to,
        type: msg.type,
        isMedia: msg.hasMedia,
        isForwarded: msg.isForwarded
      }));
    } catch (error) {
      console.error('Error retrieving chat messages:', error);
      throw error;
    }
  }

  async getContacts(sessionId, limit = 100) {
    const client = this.clients.get(sessionId);
    if (!client) {
      throw new Error(`Client ${sessionId} not initialized`);
    }

    try {
      const contacts = await client.getContacts();
      return contacts.slice(0, limit).map(contact => ({
        id: contact.id._serialized,
        name: contact.name,
        pushname: contact.pushname,
        number: contact.number,
        isMe: contact.isMe,
        isUser: contact.isUser,
        isGroup: contact.isGroup,
        isWAContact: contact.isWAContact
      }));
    } catch (error) {
      console.error('Error retrieving contacts:', error);
      throw error;
    }
  }

  async sendMediaMessage(sessionId, number, mediaPath, caption = '') {
    const client = this.clients.get(sessionId);
    if (!client) {
      throw new Error(`Client ${sessionId} not initialized`);
    }

    try {
      // Create media from file
      const media = MessageMedia.fromFilePath(mediaPath);
      
      // Get chat ID
      const chatId = await client.getNumberId(number);
      if (!chatId) {
        throw new Error('Invalid number');
      }

      // Send media message
      return await client.sendMessage(chatId._serialized, media, { 
        caption: caption 
      });
    } catch (error) {
      console.error('Error sending media message:', error);
      throw error;
    }
  }

  async getGroups(sessionId, limit = 50) {
    const client = this.clients.get(sessionId);
    if (!client) {
      throw new Error(`Client ${sessionId} not initialized`);
    }

    try {
      const chats = await client.getChats();
      const groups = chats.filter(chat => chat.isGroup);
      
      return groups.slice(0, limit).map(group => ({
        id: group.id._serialized,
        name: group.name,
        participants: group.participants.map(p => ({
          id: p.id._serialized,
          isAdmin: p.isAdmin,
          isSuperAdmin: p.isSuperAdmin
        })),
        participantsCount: group.participants.length
      }));
    } catch (error) {
      console.error('Error retrieving groups:', error);
      throw error;
    }
  }
}

export default new WhatsappService();