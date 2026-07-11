# NSGram Security Specifications

Security design specifications for NSGram authentication, validation, and route guards.

---

## 🔐 Identity & Authentication

Authentication is verified using Firebase Auth tokens on the client side:
- **Email/Password Verification:** SignUp requests default to `isActivated: false`. The user's account is verified when they complete the Firebase email verification link. A background listener (`autoCheckVerification`) and a foreground validation query check for verification status and request profile activation at `/api/users/profile`.
- **Google Sign-In Security:** Sign-in via Google is treated as pre-verified. The authentication provider initiates a registration callback with `isActivated: true`.

---

## 🛡️ Backend Guards (REST API)

### 1. Admin Authorization (`requireAuth`)
Located in [`backend/middleware/auth.ts`](file:///c:/Users/sunil/OneDrive/Desktop/HIII-Nishant/backend/middleware/auth.ts).
- Validates the custom JWT token issued under `/api/auth/login`.
- If the token is missing, expired, or carries an incorrect signature, routes return `401 Unauthorized`.
- Controls administrative endpoints (like gallery changes, resume deletions, subscriber lists, blog post publications, and updates).

### 2. User Profile Authorization (`requireFirebaseAuth`)
Located in [`backend/routes/users.ts`](file:///c:/Users/sunil/OneDrive/Desktop/HIII-Nishant/backend/routes/users.ts).
- Restricts profile mutation endpoints to the matching authenticated Firebase User.
- Authenticated requests verify the JWT ID token against the Firebase Admin authentication engine (`admin.auth().verifyIdToken(token)`).
- Intercepts and rejects requests if the token UID does not match the target document UID, returning a `403 Forbidden` response.
- Excludes the `role` parameter from requests to prevent privilege escalation (defaulting roles to `'user'`).

---

## 🛜 Socket Connection Guards

- **Join Room checks:** Sockets are forbidden from joining message rooms under `join-room` unless the connecting user's UID is listed in the conversation's `participants` list in Firestore.
- **Direct Signaling checks:** Caller connections are matched against the in-memory active registry (`onlineUsers`) which checks the user's current session state before forwarding dialing offers or candidate packages.

---

## 🦠 Input Sanitization & escaping

- **HTML Injection (XSS):** Data sent via the `/api/contact` email notification endpoint is sanitized using an escaping utility to convert dynamic strings (`<`, `>`, `&`, `"`, `'`) to HTML entities, protecting email clients from XSS scripts.
- **Database Safety:** Firestore writes bypass raw query interpolation, avoiding SQL injection attacks by design.
