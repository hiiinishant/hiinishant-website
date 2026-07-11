# NSGram Platform Roadmap

Current status and planned iterations for the NSGram engagement ecosystem.

---

## 🗺️ Execution Phases

### Phase 1: Core Communication Layer (Completed)
- [x] Secure registration and login flow (Google Auth + Email Verification checks).
- [x] Multi-tab Socket.IO presence registry (fixes ghost disconnects).
- [x] Direct peer-to-peer real-time text chat with replies, typing states, and read receipts.
- [x] Dynamic voice notes messaging integrated with Cloudinary.
- [x] WebRTC call signaling for audio/video calling.
- [x] Security-hardened REST API for profiles.

### Phase 2: Community MVPs (Short-term)
- [ ] **Community Posts Board:**
  - Create simple MVPs for text-only posts (maximum 500 characters).
  - Add simple likes and nested comment models on posts.
- [ ] **Push Notification Services:**
  - Hook in FCM (Firebase Cloud Messaging) to alert users on incoming messages or call rings when the app is in the background.

### Phase 3: Media & Enrichment (Medium-term)
- [ ] **Media attachments in Chat:**
  - Allow sending picture messages (JPEG, PNG) using Cloudinary upload buffers.
- [ ] **Group Chat Channels:**
  - Introduce conversation groups with active participant lists.
- [ ] **Direct Message Search:**
  - Client-side or Firestore-backed text search queries within individual conversations.

### Phase 4: Security & Scalability (Long-term)
- [ ] **End-to-End Encryption (E2EE):**
  - Implement client-side key exchange for messages to enable fully private conversations.
- [ ] **Horizontal Socket Scaling:**
  - Transition presence registry to Redis Adapter for multi-instance socket deployments.
