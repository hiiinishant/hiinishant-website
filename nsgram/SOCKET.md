# NSGram Real-Time Socket Gateway

The WebSocket gateway is built with Socket.IO inside [`backend/server.ts`](file:///c:/Users/sunil/OneDrive/Desktop/HIII-Nishant/backend/server.ts). It serves as the presence registry, typing indicator relay, and WebRTC signaling platform.

---

## 🛜 Gateway Connection Settings

- **Namespace:** Root (`/`)
- **Transports:** `websocket`, `polling` (with auto fallback)
- **Reconnection Delays:** 1s min / 5s max (client-side)

---

## 📥 Inbound Socket Events (Client to Server)

### 1. `register`
Associates socket connection with user's ID. Supports multiple simultaneous tab connections.

- **Payload:** `userId: string`
- **Behavior:** Adds `socket.id` to the user's registry Set, cancels pending disconnect timers, updates Firestore status, and broadcasts `user-status` as `'online'`.

---

### 2. `check-online-status`
Checks target user's current status.

- **Payload:** `targetUserId: string`
- **Response Callback:** `(isOnline: boolean) => void`

---

### 3. `join-room`
Subscribes the socket to conversation room notifications.

- **Payload:**
```json
{
  "conversationId": "CONV_ID",
  "userId": "CURRENT_USER_UID"
}
```
- **Security Check:** Verifies participant list in database cache before letting socket subscribe.

---

### 4. `leave-room`
Leaves a conversation room.

- **Payload:** `{ "conversationId": "CONV_ID" }`

---

### 5. `typing-start` / `typing-stop`
Relays writing animations inside a chat room (does not hit database).

- **Payload:**
```json
{
  "conversationId": "CONV_ID",
  "userId": "CURRENT_USER_UID"
}
```

---

### 6. `send-message`
Broadcasts direct message.

- **Payload:**
```json
{
  "conversationId": "CONV_ID",
  "text": "Hello world",
  "senderId": "SENDER_UID",
  "recipientId": "RECIPIENT_UID",
  "tempId": "TEMP_CLIENT_ID_OPTIONAL",
  "audioUrl": "CLOUDINARY_URL_OPTIONAL",
  "replyTo": {
    "id": "MSG_ID",
    "text": "Original text",
    "senderId": "ORIG_SENDER_UID",
    "senderName": "Name"
  }
}
```

---

### 7. `react-message`
Reacts to a message with emoji.

- **Payload:**
```json
{
  "conversationId": "CONV_ID",
  "messageId": "MSG_ID",
  "userId": "CURRENT_USER_UID",
  "reaction": "❤️"
}
```

---

### 8. `mark-as-read`
Updates message receipts.

- **Payload:**
```json
{
  "conversationId": "CONV_ID",
  "userId": "CURRENT_USER_UID"
}
```

---

## 📳 WebRTC Calling Signalling Events

The calling engine uses direct routing between sockets (`onlineUsers` lookup).

| Event Name | Role | Payload Parameters |
|---|---|---|
| `call-user` | Initiates Dial | `{ callerId, calleeId, callerName, callerAvatar, conversationId }` |
| `call-accepted` | Accept Dial | `{ callerId, calleeId }` |
| `call-declined` | Reject Dial | `{ callerId, reason }` |
| `call-ended` | Terminate Session | `{ targetId }` |
| `webrtc-offer` | Relays SDP Offer | `{ senderId, targetId, offer }` |
| `webrtc-answer` | Relays SDP Answer | `{ senderId, targetId, answer }` |
| `webrtc-ice` | Relays Candidate | `{ senderId, targetId, candidate }` |

---

## 📤 Outbound Socket Events (Server to Client)

| Event Name | Description | Payload Schema |
|---|---|---|
| `user-status` | Broadcasts state changes | `{ userId: string, status: 'online' \| 'offline', lastSeen: string \| null }` |
| `user-typing` | Relays typing indicator | `{ conversationId: string, userId: string, isTyping: boolean }` |
| `message-sent` | Confirms database write | `{ id: string, tempId: string \| null, senderId, text, createdAt, ... }` |
| `receive-message` | Relays incoming messages | Message object schema |
| `message-reacted` | Relays emoji changes | `{ messageId: string, reactions: { [userId]: emoji } }` |
| `messages-read` | Broadcasts read receipts | `{ conversationId: string }` |
| `incoming-call` | Signals incoming ring | `{ callerId, callerName, callerAvatar, conversationId }` |
