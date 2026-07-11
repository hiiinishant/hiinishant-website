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

// Map to track online users: userId -> Set of socketIds
// Fix #18 NOTE: This is stored in-memory. If server restarts (e.g. Render cold start),
// this state is cleared. Sockets will re-register on client reconnect.
const onlineUsers = new Map<string, Set<string>>();

// Get the latest socket ID for a user
function getUserSocketId(userId: string): string | undefined {
  const sockets = onlineUsers.get(userId);
  if (!sockets || sockets.size === 0) return undefined;
  return Array.from(sockets).pop();
}

// Cache conversation participants to avoid Firestore reads on every join-room
const convoParticipantsCache = new Map<string, string[]>();

// ── Bug 3 fix: 5-second grace period before marking a user as offline ─────────
// Map of pending offline timers: userId -> NodeJS.Timeout
// When a socket drops and quickly reconnects (WebSocket→polling fallback, mobile
// network blips, Render cold-start), the timer is cancelled in 'register' so the
// user never appears offline. The timer only fires if they truly disconnect.
const disconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // ── Register online status ────────────────────────────────────────────────
  socket.on('register', (userId: string) => {
    if (!userId) return;

    // Cancel any pending offline timer — this user reconnected in time
    const existingTimer = disconnectTimers.get(userId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      disconnectTimers.delete(userId);
      console.log(`Cancelled pending offline timer for ${userId} (reconnected)`);
    }

    let sockets = onlineUsers.get(userId);
    if (!sockets) {
      sockets = new Set<string>();
      onlineUsers.set(userId, sockets);
    }
    sockets.add(socket.id);
    console.log(`User registered online: ${userId} (${socket.id}). Active sockets: ${sockets.size}`);

    // Clear lastSeen in Firestore — user is now online
    if (firestore) {
      firestore.collection('users').doc(userId).set(
        { lastSeen: null },
        { merge: true }
      ).catch(() => {});
    }
    io.emit('user-status', { userId, status: 'online', lastSeen: null });
  });

  // ── Query specific user's online status ──────────────────────────────────
  socket.on('check-online-status', (targetUserId: string, callback: (isOnline: boolean) => void) => {
    const sockets = onlineUsers.get(targetUserId);
    const isOnline = !!(sockets && sockets.size > 0);
    callback(isOnline);
  });

  // ── Join direct conversation room ─────────────────────────────────────────
  // Uses in-memory participant cache; falls back to Firestore only on first join.
  // If the conversation document doesn't exist yet (client write still propagating),
  // we retry once after a short delay to handle the race condition between
  // profile/[id]/page.tsx setDoc() and router.push() navigating immediately.
  socket.on('join-room', async (data: { conversationId: string; userId: string }) => {
    const { conversationId, userId } = data;
    if (!conversationId || !userId || !firestore) return;

    const tryJoin = async (attempt: number): Promise<void> => {
      try {
        let participants = convoParticipantsCache.get(conversationId);
        if (!participants) {
          console.log(`[join-room] Cache miss — fetching Firestore for convo: ${conversationId} (attempt ${attempt})`);
          const convoDoc = await firestore!.collection('conversations').doc(conversationId).get();
          if (!convoDoc.exists) {
            if (attempt < 2) {
              // Retry once after 600ms — the client setDoc may still be propagating
              console.warn(`[join-room] Doc not found yet for ${conversationId}, retrying in 600ms...`);
              await new Promise(resolve => setTimeout(resolve, 600));
              return tryJoin(attempt + 1);
            }
            console.warn(`[join-room] DROPPED — conversation doc does NOT exist: ${conversationId}. Socket ${socket.id} for user ${userId} NOT joined.`);
            return;
          }
          participants = convoDoc.data()?.participants || [];
          convoParticipantsCache.set(conversationId, participants);
          console.log(`[join-room] Participants fetched:`, participants);
        } else {
          console.log(`[join-room] Cache hit for convo: ${conversationId}`);
        }

        if (participants.includes(userId)) {
          socket.join(conversationId);
          const roomSize = io.sockets.adapter.rooms.get(conversationId)?.size ?? 0;
          console.log(`[join-room] SUCCESS — user ${userId} joined room ${conversationId}. Room size now: ${roomSize}`);
        } else {
          console.warn(`Auth mismatch: User ${userId} tried to join convo ${conversationId}`);
        }
      } catch (err) {
        console.error('Error joining socket room:', err);
      }
    };

    await tryJoin(1);
  });

  // ── Leave direct conversation room ────────────────────────────────────────
  socket.on('leave-room', (data: { conversationId: string }) => {
    socket.leave(data.conversationId);
    console.log(`Socket ${socket.id} left room ${data.conversationId}`);
  });

  // ── Typing indicator — relay inside conversation room (no DB write) ───────
  socket.on('typing-start', (data: { conversationId: string; userId: string }) => {
    const { conversationId, userId } = data;
    if (!conversationId || !userId) return;
    console.log(`[typing-start] User ${userId} is typing in room ${conversationId}`);
    socket.to(conversationId).emit('user-typing', { conversationId, userId, isTyping: true });
  });

  socket.on('typing-stop', (data: { conversationId: string; userId: string }) => {
    const { conversationId, userId } = data;
    if (!conversationId || !userId) return;
    console.log(`[typing-stop] User ${userId} stopped typing in room ${conversationId}`);
    socket.to(conversationId).emit('user-typing', { conversationId, userId, isTyping: false });
  });

  // ── WebRTC Voice Call Signaling ───────────────────────────────────────────
  socket.on('call-user', (data: { callerId: string; calleeId: string; callerName: string; callerAvatar: string; conversationId: string; callType: 'voice' | 'video' }) => {
    const { callerId, calleeId, callerName, callerAvatar, conversationId, callType } = data;
    const calleeSocketId = getUserSocketId(calleeId);
    if (calleeSocketId) {
      io.to(calleeSocketId).emit('incoming-call', { callerId, callerName, callerAvatar, conversationId, callType });
    } else {
      socket.emit('call-declined', { reason: 'offline' });
    }
  });

  socket.on('call-accepted', (data: { callerId: string; calleeId: string }) => {
    const callerSocketId = getUserSocketId(data.callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit('call-accepted', { calleeId: data.calleeId });
    }
  });

  socket.on('call-declined', (data: { callerId: string; reason?: string }) => {
    const callerSocketId = getUserSocketId(data.callerId);
    if (callerSocketId) {
      io.to(callerSocketId).emit('call-declined', { reason: data.reason });
    }
  });

  socket.on('call-ended', (data: { targetId: string }) => {
    const targetSocketId = getUserSocketId(data.targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('call-ended');
    }
  });

  socket.on('webrtc-offer', (data: { senderId: string; targetId: string; offer: any }) => {
    const targetSocketId = getUserSocketId(data.targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-offer', { offer: data.offer, senderId: data.senderId });
    }
  });

  socket.on('webrtc-answer', (data: { senderId: string; targetId: string; answer: any }) => {
    const targetSocketId = getUserSocketId(data.targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-answer', { answer: data.answer, senderId: data.senderId });
    }
  });

  socket.on('webrtc-ice', (data: { senderId: string; targetId: string; candidate: any }) => {
    const targetSocketId = getUserSocketId(data.targetId);
    if (targetSocketId) {
      io.to(targetSocketId).emit('webrtc-ice', { candidate: data.candidate, senderId: data.senderId });
    }
  });

  // ── Send message ──────────────────────────────────────────────────────────
  // Supports text messages, replies (replyTo), and voice notes (audioUrl).
  // Bug 1 & 2 fix: tempId is stored in Firestore so the frontend onSnapshot
  // dedup can match it and replace the optimistic placeholder without duplication.
  socket.on('send-message', async (data: {
    conversationId: string;
    text: string;
    senderId: string;
    recipientId: string;
    replyTo?: { id: string; text: string; senderId: string; senderName: string };
    audioUrl?: string;
    tempId?: string;
  }) => {
    const { conversationId, text, senderId, replyTo, audioUrl, tempId } = data;
    console.log('Received send-message from socket:', { conversationId, senderId, tempId });
    if (!conversationId || !senderId || !firestore) return;

    try {
      const timestamp = new Date();
      const messageData: any = {
        senderId,
        text: audioUrl ? '🎤 Voice note' : text,
        createdAt: timestamp.toISOString(),
        read: false,
        reactions: {},
      };

      if (replyTo) messageData.replyTo = replyTo;
      if (audioUrl) messageData.audioUrl = audioUrl;
      // Store tempId in the Firestore document so client onSnapshot can match it
      if (tempId) messageData.tempId = tempId;

      const convoRef = firestore.collection('conversations').doc(conversationId);

      // Parallel write: message document + conversation metadata.
      // NOTE: participants must be set here too (with merge:true it is additive),
      // so the conversation document is always fully populated even if the client
      // setDoc raced and lost. This ensures join-room can always find participants.
      const [msgRef] = await Promise.all([
        convoRef.collection('messages').add(messageData),
        convoRef.set({
          participants: [senderId, data.recipientId].sort(),
          lastMessage: audioUrl ? '🎤 Voice note' : text,
          lastMessageAt: timestamp.toISOString(),
          lastMessageBy: senderId,
          lastMessageRead: false,
        }, { merge: true }),
      ]);

      console.log('Message saved to Firestore with ID:', msgRef.id);

      // Confirm to sender — includes tempId so client swaps the optimistic placeholder
      socket.emit('message-sent', {
        id: msgRef.id,
        tempId: tempId ?? null,
        ...messageData,
      });

      // Broadcast to recipient (and any other participants in the room)
      const roomSize = io.sockets.adapter.rooms.get(conversationId)?.size ?? 0;
      console.log(`[send-message] Broadcasting receive-message to room ${conversationId}. Room size (excluding sender): ${roomSize - 1}`);
      if (roomSize <= 1) {
        console.warn(`[send-message] WARNING: Only sender is in room ${conversationId}. Recipient may not have joined. Message will NOT be received in real-time via socket.`);
      }
      socket.to(conversationId).emit('receive-message', {
        id: msgRef.id,
        ...messageData,
      });
    } catch (err) {
      console.error('Error handling socket message:', err);
    }
  });

  // ── React to message ──────────────────────────────────────────────────────
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

      // Toggle: same emoji again = remove it; different/new = set it
      if (currentReactions[userId] === reaction) {
        delete currentReactions[userId];
      } else {
        currentReactions[userId] = reaction;
      }

      await msgRef.update({ reactions: currentReactions });

      // Broadcast to entire conversation room (includes sender)
      io.to(conversationId).emit('message-reacted', { messageId, reactions: currentReactions });
    } catch (err) {
      console.error('Error reacting to message:', err);
    }
  });

  // ── Mark as read ──────────────────────────────────────────────────────────
  socket.on('mark-as-read', async (payload: { conversationId: string; userId: string }) => {
    const { conversationId, userId } = payload;
    if (!conversationId || !userId || !firestore) return;
    try {
      const messagesRef = firestore
        .collection('conversations')
        .doc(conversationId)
        .collection('messages');

      const snapshot = await messagesRef
        .where('senderId', '!=', userId)
        .where('read', '==', false)
        .get();

      if (snapshot.empty) return;

      const batch = firestore.batch();
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
      await batch.commit();

      await firestore
        .collection('conversations')
        .doc(conversationId)
        .set({ lastMessageRead: true }, { merge: true });

      // Notify the sender that their messages have been read
      const senderId = snapshot.docs[0].data().senderId;
      const senderSocketId = senderId ? getUserSocketId(senderId) : undefined;
      if (senderSocketId) {
        io.to(senderSocketId).emit('messages-read', { conversationId });
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
  // Bug 3 fix: 5-second grace period. If the user's socket drops but they
  // reconnect within 5 seconds (transport switch, network blip, Render cold-start),
  // the offline event is cancelled. The timer fires only on a genuine disconnect.
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    let disconnectedUserId: string | null = null;
    for (const [userId, sockets] of onlineUsers.entries()) {
      if (sockets.has(socket.id)) {
        disconnectedUserId = userId;
        sockets.delete(socket.id);
        console.log(`Removed socket ${socket.id} for user ${userId}. Remaining: ${sockets.size}`);
        if (sockets.size === 0) {
          onlineUsers.delete(userId);
        }
        break;
      }
    }

    if (!disconnectedUserId) return;

    const userId = disconnectedUserId;

    // Check if the user is truly offline (no remaining sockets under this userId)
    const remainingSockets = onlineUsers.get(userId);
    if (remainingSockets && remainingSockets.size > 0) {
      return;
    }

    const timer = setTimeout(() => {
      disconnectTimers.delete(userId);
      // Double check they didn't reconnect in the meantime
      const activeSockets = onlineUsers.get(userId);
      if (activeSockets && activeSockets.size > 0) {
        return;
      }
      
      const lastSeen = new Date().toISOString();
      console.log(`User went offline: ${userId} at ${lastSeen}`);
      if (firestore) {
        firestore.collection('users').doc(userId).set(
          { lastSeen },
          { merge: true }
        ).catch(() => {});
      }
      io.emit('user-status', { userId, status: 'offline', lastSeen });
    }, 5000);

    disconnectTimers.set(userId, timer);
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
