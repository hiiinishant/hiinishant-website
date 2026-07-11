# NSGram — Private Community & Engagement Workspace

NSGram is a premium, real-time private community portal integrated into the digital identity of Nishant Kumar. It enables verified students, creators, and professionals to interact directly through dynamic text conversations, voice messaging, and WebRTC-based voice/video calls.

---

## 🚀 Key Features

* **Real-time Direct Chat:** Instant messaging with text, emoji reactions, message replies, and read receipts.
* **Voice Messaging:** Record and send high-fidelity voice notes directly within chat rooms.
* **WebRTC Voice Calling:** Real-time peer-to-peer voice and video calls with Web Audio API dialing ringtones.
* **User Profiles:** Distinct customizable profiles with avatars (👦 Boy / 👧 Girl), bios, and roles.
* **Global Search Directory:** Discover and connect with verified community members via display names or usernames.
* **Secure Authentication:** Built-in Firebase Authentication supporting verified Email/Password signup and Google Sign-in.

---

## 🛠️ Technology Stack

### Frontend (Next.js App)
- **Framework:** Next.js (React, TypeScript)
- **Styling:** Tailwind CSS (Custom HSL Dark Mode & Glassmorphism)
- **State Management:** React Context (Auth and Realtime Listener hooks)
- **Real-time Client:** Socket.IO Client & Firebase Firestore SDK

### Backend (Node.js & Express)
- **Runtime:** Node.js, Express, TypeScript
- **Real-time Server:** Socket.IO (Signaling & Presence engine)
- **Database Engine:** Firebase Admin SDK (Cloud Firestore)

---

## 📂 Documentation Guide

For deep implementation insights, navigate to specific modules:

1. **[Architecture Design](ARCHITECTURE.md)** — Architectural diagrams, frontend-backend split, WebRTC connection cycle.
2. **[Database Schema](DATABASE.md)** — Firestore collections, index constraints, rules and structures.
3. **[REST API Docs](API.md)** — Profile endpoints, validation models, request/response objects.
4. **[Socket & Signaling Docs](SOCKET.md)** — Event payloads, room management, call signaling, presence heartbeat.
5. **[Security Protocols](SECURITY.md)** — Token verification middlewares, CORS, rate limits, sanitizer rules.
6. **[Product Roadmap](ROADMAP.md)** — Current status, next iterations, planned integrations.
7. **[Defect & Bug log](BUGS.md)** — Tracking of solved issues, known constraints.
8. **[Changelog](CHANGELOG.md)** — Historical overview of releases.
