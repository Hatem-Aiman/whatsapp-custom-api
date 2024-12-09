import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

const {Client, MessageMedia, LocalAuth} = pkg;

class WhatsappService {
    constructor() {
        this.clients = new Map();
    }

    createClient(sessionId) {
        return new Promise((resolve, reject) => {
            if (this.clients.has(sessionId)) {
                return resolve('done');
            }

            const client = new Client({
                // authStrategy: new LocalAuth({
                //     clientId: sessionId
                // })
            });

            client.on('qr', (qr) => {
                console.log('QR Code Received for Session:', qr);
                qrcode.generate(qr, {small: true});
                resolve(qr);
            });

            client.on('ready', () => {
                console.log(`WhatsApp Client ${sessionId} is ready!`);
            });

            client.on('auth_failure', (msg) => {
                console.error(`Authentication failure for ${sessionId}:`, msg);
                reject(new Error(`Authentication failure for ${sessionId}: ${msg}`));
            });

            client.on('disconnected', (reason) => {
                console.log(`Client ${sessionId} disconnected:`, reason);
                this.clients.delete(sessionId);
            });

            client.initialize().then(r => {});

            this.clients.set(sessionId, client);
        });
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
        let client = this.clients.get(sessionId);
        if (!client) {
            this.createClient(sessionId).then(() => {
                return 'Connected';
            });
        }
        return 'Connected';
    }

    async getAllChat(sessionId) {
        const client = this.clients.get(sessionId);
        if (!client) {
            throw new Error(`Client ${sessionId} not initialized`);
        }
        try {
            const chats = await client.getChats();
            return chats.map(chat => ({
                id: chat.id._serialized,
                name: chat.name || chat.pushname,
                isGroup: chat.isGroup,
                unreadCount: chat.unreadCount,
                isReadOnly: chat.isReadOnly,
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
            const options = {
                limit: 50,
            };
            const messages = await chat.fetchMessages(options);

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

    async sendMediaMessage(sessionId, number, mediaPath, caption = '') {
        const client = this.clients.get(sessionId);
        if (!client) {
            throw new Error(`Client ${sessionId} not initialized`);
        }

        try {
            const media = MessageMedia.fromFilePath(mediaPath);

            const chatId = await client.getNumberId(number);
            if (!chatId) {
                throw new Error('Invalid number');
            }

            return await client.sendMessage(chatId._serialized, media, {
                caption: caption
            });
        } catch (error) {
            console.error('Error sending media message:', error);
            throw error;
        }
    }
    async getMediaMessage(sessionId, messageId) {
        const client = this.clients.get(sessionId);
        if (!client) {
            throw new Error(`Client ${sessionId} not initialized`);
        }

        try {
            const chat = await client.getChatById("201091095506@c.us");
            const options = {
                limit: 50,
            };
            const messages = await chat.fetchMessages(options);
            const findMsg = messages.find(msg => msg.id._serialized === "true_201091095506@c.us_3EB026549692B1C976B222");
            console.log(findMsg);
            const message = await findMsg.downloadMedia();
            console.log(message);

            return message.data;
        } catch (error) {
            console.error('Error retrieving image:', error);
            throw error;
        }
    }

}

export default new WhatsappService();