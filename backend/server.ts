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

// Cache conversation participants to avoid Firestore reads on every join-room
const convoParticipantsCache = new Map<string, string[]>();

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Register online status
  socket.on('register', (userId: string) => {
    if (!userId) return;
    onlineUsers.set(userId, socket.id);
    console.log(`User registered online: ${userId} (${socket.id})`);
    // Clear lastSeen in Firestore — user is now online
    if (firestore) {
      firestore.collection('users').doc(userId).set(
        { lastSeen: null },
        { merge: true }
      ).catch(() => {});
    }
    io.emit('user-status', { userId, status: 'online', lastSeen: null });
  });

  // Query specific user's status
  socket.on('check-online-status', (targetUserId: string, callback: (isOnline: boolean) => void) => {
    const isOnline = onlineUsers.has(targetUserId);
    callback(isOnline);
  });

  // Join direct conversation room (uses in-memory cache, falls back to Firestore once)
  socket.on('join-room', async (data: { conversationId: string; userId: string }) => {
    const { conversationId, userId } = data;
    if (!conversationId || !userId || !firestore) return;

    try {
      // Check cache first (avoids Firestore read on every room join)
      let participants = convoParticipantsCache.get(conversationId);
      if (!participants) {
        const convoDoc = await firestore.collection('conversations').doc(conversationId).get();
        if (!convoDoc.exists) return;
        participants = convoDoc.data()?.participants || [];
        convoParticipantsCache.set(conversationId, participants);
      }

      if (participants.includes(userId)) {
        socket.join(conversationId);
      } else {
        console.warn(`Auth mismatch: User ${userId} tried to join convo ${conversationId}`);
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

  // Typing indicator — relay inside conversation room (no DB write needed)
  socket.on('typing-start', (data: { conversationId: string; userId: string }) => {
    const { conversationId, userId } = data;
    if (!conversationId || !userId) return;
    socket.to(conversationId).emit('user-typing', { conversationId, userId, isTyping: true });
  });

  socket.on('typing-stop', (data: { conversationId: string; userId: string }) => {
    const { conversationId, userId } = data;
    if (!conversationId || !userId) return;
    socket.to(conversationId).emit('user-typing', { conversationId, userId, isTyping: false });
  });

  // ── WebRTC Voice Call Signaling ──
  socket.on('call-user', (data: { callerId: string; calleeId: string; callerName: string; callerAvatar: string; conversationId: string }) => {
    const { callerId, calleeId, callerName, callerAvatar, conversationId } = data;
    const calleeSocketId = onlineUsers.get(calleeId);
    if (calleeSocketId) {
      // Relay incoming call to callee
      io.to(calleeSocketId).emit('incoming-call', { callerId, callerName, callerAvatar, conversationId });
    } else {
      // If callee is offline
      socket.emit('call-declined', { reason: 'offline' });
    }
  });

  socket.on('call-accepted', (data: { callerId: string; calleeId: string }) => {
    const callerSocketId = onlineUsers.get(data.callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit('call-accepted', { calleeId: data.calleeId });
    }
  });

  socket.on('call-declined', (data: { callerId: string; reason?: string }) => {
    const callerSocketId = onlineUsers.get(data.callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit('call-declined', { reason: data.reason });
    }
  });

  socket.on('call-ended', (data: { targetId: string }) => {
    const targetSocketId = onlineUsers.get(data.targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call-ended');
    }
  });

  socket.on('webrtc-offer', (data: { senderId: string; targetId: string; offer: any }) => {
    const targetSocketId = onlineUsers.get(data.targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-offer', { offer: data.offer, senderId: data.senderId });
    }
  });

  socket.on('webrtc-answer', (data: { senderId: string; targetId: string; answer: any }) => {
    const targetSocketId = onlineUsers.get(data.targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-answer', { answer: data.answer, senderId: data.senderId });
    }
  });

  socket.on('webrtc-ice', (data: { senderId: string; targetId: string; candidate: any }) => {
    const targetSocketId = onlineUsers.get(data.targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-ice', { candidate: data.candidate, senderId: data.senderId });
    }
  });

  // Send message (supports optional replyTo and audioUrl for voice notes)
  socket.on('send-message', async (data: { 
    conversationId: string; 
    text: string; 
    senderId: string; 
    recipientId: string;
    replyTo?: { id: string; text: string; senderId: string; senderName: string };
    audioUrl?: string;
    tempId?: string; // optimistic UI placeholder id from client
  }) => {
    const { conversationId, text, senderId, replyTo, audioUrl, tempId } = data;
    if (!conversationId || !senderId || !firestore) return;

    try {
      const timestamp = new Date();
      const messageData: any = {
        senderId,
        text: audioUrl ? "🎤 Voice note" : text,
        createdAt: timestamp.toISOString(),
        read: false,
        reactions: {},
      };

      if (replyTo) messageData.replyTo = replyTo;
      if (audioUrl) messageData.audioUrl = audioUrl;

      const convoRef = firestore.collection('conversations').doc(conversationId);

      // Run message write and conversation metadata update in parallel for speed
      const [msgRef] = await Promise.all([
        convoRef.collection('messages').add(messageData),
        convoRef.set({
          lastMessage: audioUrl ? "🎤 Voice note" : text,
          lastMessageAt: timestamp.toISOString(),
          lastMessageBy: senderId,
          lastMessageRead: false,
        }, { merge: true }),
      ]);

      // Emit confirmation back to sender — includes tempId so client can swap optimistic placeholder
      socket.emit('message-sent', {
        id: msgRef.id,
        tempId: tempId ?? null,
        ...messageData,
      });

      // Broadcast to all other sockets in the room (e.g. recipient)
      socket.to(conversationId).emit('receive-message', {
        id: msgRef.id,
        ...messageData,
      });
    } catch (err) {
      console.error('Error handling socket message:', err);
    }
  });

  // React to message (e.g. ❤️, 😂, 👍)
  socket.on('react-message', async (data: {
    conversationId: string;
    messageId: string;
    userId: string;
    reaction: string;
  }) => {
    const { conversationId, messageId, userId, reaction } = data;
    if (!conversationId || !messageId || !userId || !reaction || !firestore) return;

    try {
      const msgRef = firestore
        .collection('conversations')
        .doc(conversationId)
        .collection('messages')
        .doc(messageId);

      const msgDoc = await msgRef.get();
      if (!msgDoc.exists) return;

      const currentReactions = msgDoc.data()?.reactions || {};
      
      // Toggle logic: if user clicks same emoji, remove it; else set/change it.
      if (currentReactions[userId] === reaction) {
        delete currentReactions[userId];
      } else {
        currentReactions[userId] = reaction;
      }

      await msgRef.update({ reactions: currentReactions });

      // Broadcast reaction change to all sockets in the conversation room
      io.to(conversationId).emit('message-reacted', {
        messageId,
        reactions: currentReactions,
      });

      // Also send directly back to the react-initiator's socket
      socket.emit('message-reacted', {
        messageId,
        reactions: currentReactions,
      });
    } catch (err) {
      console.error('Error reacting to message:', err);
    }
  });

  // MARK AS READ — recipient notifies backend that they've opened a conversation
  socket.on('mark-as-read', async (payload: { conversationId: string; userId: string }) => {
    const { conversationId, userId } = payload;
    if (!conversationId || !userId || !firestore) return;
    try {
      const messagesRef = firestore
        .collection('conversations')
        .doc(conversationId)
        .collection('messages');
      // Batch update all messages where sender is NOT the current user and read === false
      const snapshot = await messagesRef
        .where('senderId', '!=', userId)
        .where('read', '==', false)
        .get();
      const batch = firestore.batch();
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();

      // Stamp conversation doc as read so inbox unread dots clear
      if (snapshot.docs.length > 0) {
        await firestore
          .collection('conversations')
          .doc(conversationId)
          .set({ lastMessageRead: true }, { merge: true });
      }

      // Notify the original sender (if online) that their messages are now read
      const senderId = snapshot.docs.length ? snapshot.docs[0].data().senderId : null;
      if (senderId && onlineUsers.has(senderId)) {
        const senderSocketId = onlineUsers.get(senderId);
        io.to(senderSocketId as string).emit('messages-read', { conversationId });
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        const lastSeen = new Date().toISOString();
        console.log(`User went offline: ${userId} at ${lastSeen}`);
        // Persist lastSeen to Firestore so other users can query it later
        if (firestore) {
          firestore.collection('users').doc(userId).set(
            { lastSeen },
            { merge: true }
          ).catch(() => {});
        }
        io.emit('user-status', { userId, status: 'offline', lastSeen });
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
