# NSGram Architecture Design

This document details the system design, context topologies, and WebRTC call logic underlying the NSGram real-time platform.

---

## 🏛️ Overall System Topology

NSGram operates as a decoupled client-server architecture with state synchronization handled by Firebase and real-time signalling/events managed via WebSockets (Socket.IO).

```mermaid
graph TD
    Client["Client (Next.js SPA)"]
    Backend["Backend Service (Express.js)"]
    Firestore[("Cloud Firestore")]
    FirebaseAuth["Firebase Auth"]
    Cloudinary["Cloudinary Storage"]

    Client -->|Rest API Profile/Files| Backend
    Client -->|Socket.IO Events & RTC Signaling| Backend
    Client -.->|Auth Check & Token| FirebaseAuth
    Client -.->|Direct Message Listener & Reads| Firestore
    Backend -->|Verify Tokens & DB Seed| Firestore
    Backend -->|Voice Note Uploads| Cloudinary
```

---

## 🧭 Client State & Context Layout

The frontend states are orchestrated under the `NsgramAuthProvider` Context located in [`frontend/src/components/nsgram/NsgramAuthProvider.tsx`](file:///c:/Users/sunil/OneDrive/Desktop/HIII-Nishant/frontend/src/components/nsgram/NsgramAuthProvider.tsx).

- **Authentication Watcher:** Automatically hooks into Firebase `onAuthStateChanged`.
- **User Document Subscription:** Subscribes to the specific Firestore user profile document via `onSnapshot` when authenticated.
- **Active Directory Watcher:** Fetches and filters active users lists to populate the messaging searches.
- **Socket Manager:** Instantiates a Socket.IO client connection when a profile is fetched, registering the socket to enable calling and message receipts.

---

## 📞 WebRTC Calls Flow Diagram

WebRTC voice/video calls utilize Socket.IO as the signaling channel, bypassing database writes to keep latency at a minimum. Peer connections are handled in [`frontend/src/components/nsgram/useVoiceCall.ts`](file:///c:/Users/sunil/OneDrive/Desktop/HIII-Nishant/frontend/src/components/nsgram/useVoiceCall.ts).

```mermaid
sequenceDiagram
    autonumber
    actor Caller as Caller User
    participant Server as Socket.IO Server
    actor Callee as Callee User

    Caller->>Server: call-user (callerId, calleeId, Name, Avatar, etc.)
    Note over Server: Looks up callee's socket ID in active registry
    alt Callee is Offline
        Server-->>Caller: call-declined (reason: offline)
    else Callee is Online
        Server->>Callee: incoming-call (callerId, Name, Avatar)
        Note over Callee: Starts ringing using Web Audio API
        alt Callee Declines Call
            Callee->>Server: call-declined (callerId, reason: declined)
            Server-->>Caller: call-declined (reason: declined)
        else Callee Accepts Call
            Callee->>Server: call-accepted (callerId, calleeId)
            Server-->>Caller: call-accepted (calleeId)
            Note over Caller, Callee: Establish PeerConnection local stream
            Caller->>Server: webrtc-offer (senderId, targetId, offer)
            Server->>Callee: webrtc-offer (offer, senderId)
            Callee->>Server: webrtc-answer (senderId, targetId, answer)
            Server->>Caller: webrtc-answer (answer, senderId)
            Note over Caller, Callee: Exchange ICE candidates
            Caller->>Server: webrtc-ice (senderId, targetId, candidate)
            Server->>Callee: webrtc-ice (candidate, senderId)
            Note over Caller, Callee: P2P Call Connected
        end
    end
```
