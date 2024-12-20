import pkg from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

const {Client, MessageMedia, LocalAuth, WAState} = pkg;

class WhatsappService {
    constructor() {
        this.clients = new Map();
    }

    createClient(sessionId) {
        return new Promise((resolve, reject) => {
            const existingClient = this.clients.get(sessionId);
            if (existingClient) {
                existingClient.logOut();
                this.clients.delete(sessionId);
            }

            const client = new Client({
                authStrategy: new LocalAuth({
                    clientId: sessionId,
                })
            });


            client.on('qr', (qr) => {
                qrcode.generate(qr, {small: true});
                resolve(qr);
            });

            client.on('message', (msg) => {
                console.log('Message Received:', msg);
                this.sendUpdateMessage(sessionId,msg.id.remote).then(r => {});
            });

            client.on('message_create', message => {
                console.log(message);
                this.sendUpdateMessage(sessionId,message.id.remote).then(r => {});
            });

            client.on('ready', () => {
                console.log(`WhatsApp Client ${sessionId} is ready!`);
                // this.sendUpdateSession(sessionId).then(r => {});
            });

            client.on('auth_failure', (msg) => {
                console.error(`Authentication failure for ${sessionId}:`, msg);
                reject(new Error(`Authentication failure for ${sessionId}: ${msg}`));
            });

            client.on('disconnected', (reason) => {
                console.log(`Client ${sessionId} disconnected:`, reason);
                this.clients.delete(sessionId);
            });

            client.initialize().then(r => {
            });
            this.clients.set(sessionId, client);
        });
    }

    generateQRCode(client) {
        return new Promise((resolve, reject) => {
            client.on('qr', (qr) => {
                console.log('QR Code Received:', qr);
                qrcode.generate(qr, {small: true});
                resolve(qr);
            });
        });
    }

    async logOut(sessionId) {
        const client = this.clients.get(sessionId);
        if (!client) {
            throw new Error(`Client ${sessionId} not initialized`);
        }

        try {
            await client.logout();
            this.clients.delete(sessionId);
        } catch (error) {
            console.error('Error logging out:', error);
            throw error;
        }
    }

    async getClientStatus(sessionId) {
        let client = this.clients.get(sessionId);
        try {
            if (client) {
                const state = await client.getState();
                return state;
            }
            return WAState.UNPAIRED;
        } catch (error) {
            return error;
        }
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


    async getAllChat(sessionId) {
        const client = this.clients.get(sessionId);
        if (!client) {
            throw new Error(`Client ${sessionId} not initialized`);
        }
        try {
            const chats = await client.getChats();
            return chats.map(chat => ({
                id: {
                    server: chat.id.server,
                    user: chat.id.user,
                    _serialized: chat.id._serialized
                },
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

            const messagesWithMedia = await Promise.all(messages.map(async (msg) => {
                let mediaData = null;
                if (msg.type === 'image' || msg.type === 'document' || msg.type === 'video' || msg.type === 'audio' || msg.type === 'sticker' || msg.type === 'ptt') {
                    mediaData = await this.getMediaMessage(sessionId, msg.id._serialized);
                }
                return {
                    id: msg.id._serialized,
                    body: msg.body,
                    timestamp: msg.timestamp,
                    from: msg.from,
                    to: msg.to,
                    type: msg.type,
                    isMedia: msg.hasMedia,
                    isForwarded: msg.isForwarded,
                    ack: msg.ack,
                    author: msg.author,
                    broadcast: msg.broadcast,
                    fromMe: msg.fromMe,
                    hasQuotedMsg: msg.hasQuotedMsg,
                    hasReaction: msg.hasReaction,
                    location: msg.location,
                    mentionedIds: msg.mentionedIds,
                    mediaData: mediaData?.data,
                    mediaName: mediaData?.filename || null,
                };
            }));
            return messagesWithMedia;
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
            throw error;
        }
    }

    async getMediaMessage(sessionId, messageId) {
        const client = this.clients.get(sessionId);
        if (!client) {
            throw new Error(`Client ${sessionId} not initialized`);
        }
        try {
            const msg = await client.getMessageById(messageId);
            const message = await msg.downloadMedia();
            console.log(messageId, message);
            return message;
        } catch (error) {
            throw error;
        }
    }

    async sendUpdateMessage(sessionId,msg) {
        const client = this.clients.get(sessionId);
        if (!client) {
            throw new Error(`Client ${sessionId} not initialized`);
        }
        try {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

            await fetch('https://localhost:4100/api/whatsapp-web/update/message/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    SessionId: sessionId,
                    Message: msg
                })
            })
                .then(response => response.json())
                .then(data => console.log('Success:', data))
                .catch(error => console.error('Error:', error));
        } catch (error) {
            console.error('Error sending update:', error);
            throw error;
        }
    }

    async sendUpdateSession(sessionId) {
        const client = this.clients.get(sessionId);
        if (!client) {
            throw new Error(`Client ${sessionId} not initialized`);
        }

        try {
            process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

            fetch('https://localhost:4100/api/whatsapp-web/update/session/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    SessionId: '1'
                })
            })
                .then(response => response.json())
                .then(data => console.log('Success:', data))
                .catch(error => console.error('Error:', error));
        } catch (error) {
            console.error('Error occurred while fetching:', error);
        }
    }
}

export default new WhatsappService();