# NSGram Defect Logs & Known Constraints

Log of solved bugs and existing design constraints.

---

## 🛠️ Solved Defects

### 1. Open User Profile Mutations (Critical Security Fix)
- **Defect:** `POST /api/users/profile` did not verify authentication tokens, allowing any visitor to create profiles, change usernames, or escalate their `role` to `admin` by submitting matching UIDs.
- **Solution:** Added a Firebase ID token validation middleware (`requireFirebaseAuth`). Verified tokens are validated via the Firebase Admin SDK, restricting updates to the authenticated owner. Ignore client-submitted roles, forcing the role to default to `'user'`.

### 2. Multi-Tab Ghost Disconnects (High Severity Fix)
- **Defect:** Socket registries stored a single string mapping `userId -> socketId`. If a user had two tabs open, registering the second tab overwrote the first. Disconnecting either tab caused the server to emit an `'offline'` status event, even if the other tab was still active.
- **Solution:** Re-engineered the presence registry into a `Map<string, Set<string>>` tracking sets of socket IDs per user. The `'offline'` status is now only broadcast once the user's active sockets count drops to zero.

### 3. Contact Form XSS Vulnerability (Medium Severity Fix)
- **Defect:** Unescaped strings in contact form messages were interpolated directly into html notification templates, introducing HTML injection and XSS hazards in the admin's email client.
- **Solution:** Integrated an HTML sanitization utility into the endpoint to escape user inputs before parsing them into templates.

---

## ⚠️ Known Design Constraints

### 1. In-Memory Socket Registry
- **Constraint:** `onlineUsers` maps are stored in the server's memory. When the backend service scales horizontally or restarts (e.g. Render spin-down), user status maps are cleared.
- **Mitigation:** The frontend Socket.IO client automatically executes a `register` event payload on reconnect, restoring the server's state seamlessly. For high-scale deployments, transitioning to a Redis-backed adapter is recommended (see [ROADMAP.md](ROADMAP.md)).

### 2. Lack of Persistent Call logs
- **Constraint:** WebRTC call rings and signaling bypass Firestore logs entirely to optimize for speed. Call duration, missed calls, and call history are not stored in the database.
