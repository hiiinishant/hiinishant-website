"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./lib/env");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const db_1 = require("./lib/db");
const seed_1 = require("./lib/seed");
// Route imports
const auth_1 = __importDefault(require("./routes/auth"));
const blog_1 = __importDefault(require("./routes/blog"));
const contact_1 = __importDefault(require("./routes/contact"));
const futurePlans_1 = __importDefault(require("./routes/futurePlans"));
const status_1 = __importDefault(require("./routes/status"));
const updates_1 = __importDefault(require("./routes/updates"));
const music_1 = __importDefault(require("./routes/music"));
const newsletter_1 = __importDefault(require("./routes/newsletter"));
const gallery_1 = __importDefault(require("./routes/gallery"));
const upload_1 = __importDefault(require("./routes/upload"));
const users_1 = __importDefault(require("./routes/users"));
const resume_1 = __importDefault(require("./routes/resume"));
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
app.use((0, cors_1.default)({
    origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://hiiinishant.com",
        "https://www.hiiinishant.com",
        process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
}));
app.use(express_1.default.json());
// Mount routes
app.use('/api/auth', auth_1.default);
app.use('/api/blog', blog_1.default);
app.use('/api/contact', contact_1.default);
app.use('/api/future-plans', futurePlans_1.default);
app.use('/api/status', status_1.default);
app.use('/api/updates', updates_1.default);
app.use('/api/music', music_1.default);
app.use('/api/newsletter', newsletter_1.default);
app.use('/api/gallery', gallery_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/users', users_1.default);
app.use('/api/resume', resume_1.default);
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://hiiinishant.com",
            "https://www.hiiinishant.com",
            process.env.FRONTEND_URL,
        ].filter(Boolean),
        credentials: true,
    }
});
// Map to track online users: userId -> socketId
const onlineUsers = new Map();
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    // Register online status
    socket.on('register', (userId) => {
        if (!userId)
            return;
        onlineUsers.set(userId, socket.id);
        console.log(`User registered online: ${userId} (${socket.id})`);
        io.emit('user-status', { userId, status: 'online' });
    });
    // Query specific user's status
    socket.on('check-online-status', (targetUserId, callback) => {
        const isOnline = onlineUsers.has(targetUserId);
        callback(isOnline);
    });
    // Join direct conversation room (secure check)
    socket.on('join-room', async (data) => {
        const { conversationId, userId } = data;
        if (!conversationId || !userId || !db_1.firestore)
            return;
        try {
            const convoDoc = await db_1.firestore.collection('conversations').doc(conversationId).get();
            if (convoDoc.exists) {
                const participants = convoDoc.data()?.participants || [];
                if (participants.includes(userId)) {
                    socket.join(conversationId);
                    console.log(`Socket ${socket.id} joined room ${conversationId}`);
                }
                else {
                    console.warn(`Auth mismatch: User ${userId} tried to join convo ${conversationId}`);
                }
            }
        }
        catch (err) {
            console.error('Error joining socket room:', err);
        }
    });
    // Leave direct conversation room
    socket.on('leave-room', (data) => {
        socket.leave(data.conversationId);
        console.log(`Socket ${socket.id} left room ${data.conversationId}`);
    });
    // Send message
    socket.on('send-message', async (data) => {
        const { conversationId, text, senderId } = data;
        if (!conversationId || !text || !senderId || !db_1.firestore)
            return;
        try {
            const timestamp = new Date();
            const messageData = {
                senderId,
                text,
                createdAt: timestamp.toISOString(),
                read: false,
                reactions: {},
            };
            // Store in firestore collection conversations/{convoId}/messages
            const convoRef = db_1.firestore.collection('conversations').doc(conversationId);
            const msgRef = await convoRef.collection('messages').add(messageData);
            // Update parent conversation doc
            await convoRef.set({
                lastMessage: text,
                lastMessageAt: timestamp.toISOString(),
                lastMessageBy: senderId,
            }, { merge: true });
            // Emit message directly back to sender (bypasses room-join requirement)
            socket.emit('message-sent', {
                id: msgRef.id,
                ...messageData,
            });
            // Emit to everyone else in the room (recipient if online)
            socket.to(conversationId).emit('receive-message', {
                id: msgRef.id,
                ...messageData,
            });
        }
        catch (err) {
            console.error('Error handling socket message:', err);
        }
    });
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        for (const [userId, socketId] of onlineUsers.entries()) {
            if (socketId === socket.id) {
                onlineUsers.delete(userId);
                console.log(`User went offline: ${userId}`);
                io.emit('user-status', { userId, status: 'offline' });
                break;
            }
        }
    });
});
// Start server
const start = async () => {
    await (0, db_1.connectDB)();
    await (0, seed_1.seedDatabase)();
    httpServer.listen(port, () => {
        console.log("Backend server running on port " + port);
    });
};
start();
