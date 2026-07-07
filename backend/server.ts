import './lib/env';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { connectDB, firestore } from './lib/db';
import { seedDatabase } from './lib/seed';

// Route imports
import authRoutes from './routes/auth';
import blogRoutes from './routes/blog';
import contactRoutes from './routes/contact';
import futurePlansRoutes from './routes/futurePlans';
import statusRoutes from './routes/status';
import updatesRoutes from './routes/updates';
import musicRoutes from './routes/music';
import newsletterRoutes from './routes/newsletter';
import galleryRoutes from './routes/gallery';
import uploadRoutes from './routes/upload';
import usersRoutes from './routes/users';
import resumeRoutes from './routes/resume';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://hiiinishant.com",
    "https://www.hiiinishant.com",
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json());

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/future-plans', futurePlansRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/updates', updatesRoutes);
app.use('/api/music', musicRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/resume', resumeRoutes);

const httpServer = createServer(app);
const io = new Server(httpServer, {
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
const onlineUsers = new Map<string, string>();

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Register online status
  socket.on('register', (userId: string) => {
    if (!userId) return;
    onlineUsers.set(userId, socket.id);
    console.log(`User registered online: ${userId} (${socket.id})`);
    io.emit('user-status', { userId, status: 'online' });
  });

  // Query specific user's status
  socket.on('check-online-status', (targetUserId: string, callback: (isOnline: boolean) => void) => {
    const isOnline = onlineUsers.has(targetUserId);
    callback(isOnline);
  });

  // Join direct conversation room (secure check)
  socket.on('join-room', async (data: { conversationId: string; userId: string }) => {
    const { conversationId, userId } = data;
    if (!conversationId || !userId || !firestore) return;

    try {
      const convoDoc = await firestore.collection('conversations').doc(conversationId).get();
      if (convoDoc.exists) {
        const participants: string[] = convoDoc.data()?.participants || [];
        if (participants.includes(userId)) {
          socket.join(conversationId);
          console.log(`Socket ${socket.id} joined room ${conversationId}`);
        } else {
          console.warn(`Auth mismatch: User ${userId} tried to join convo ${conversationId}`);
        }
      }
    } catch (err) {
      console.error('Error joining socket room:', err);
    }
  });

  // Leave direct conversation room
  socket.on('leave-room', (data: { conversationId: string }) => {
    socket.leave(data.conversationId);
    console.log(`Socket ${socket.id} left room ${data.conversationId}`);
  });

  // Send message
  socket.on('send-message', async (data: { conversationId: string; text: string; senderId: string; recipientId: string }) => {
    const { conversationId, text, senderId } = data;
    if (!conversationId || !text || !senderId || !firestore) return;

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
      const convoRef = firestore.collection('conversations').doc(conversationId);
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
    } catch (err) {
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
  await connectDB();
  await seedDatabase();
  httpServer.listen(port, () => {
    console.log("Backend server running on port " + port);
  });
};

start();
