# Changelog — NSGram Platform

All notable changes to the NSGram workspace will be documented in this file.

---

## [1.1.0] — 2026-07-11

### Added
- Added `requireFirebaseAuth` middleware to enforce token checks on profile routes.
- Introduced composite `editingBlogSlug` controls on admin panel, allowing complete blog post edits.
- Added full support for the standard RESTful `PUT` endpoint inside the blog router.

### Changed
- Refactored the Socket.IO presence engine `onlineUsers` inside `server.ts` to map `userId -> Set<string>` to handle multiple tab registrations safely.
- Exchanged raw comparison strings for constant-time buffer matches in the admin verification gateway.
- Excluded the `role` parameter on user profile endpoints, securing the default profile setup.

### Fixed
- Fixed email template vulnerabilities by HTML-escaping contact form inputs.
- Resolved type compilation issue in express routers returning response handlers directly.
- Wrapped JSON local storage parsing in safety try-catch blocks to prevent hydration page crashes.
- Connected the active server indicator in the NSGram dashboard to display live WebSocket connection states instead of a static green status.

---

## [1.0.0] — 2026-06-15

### Added
- Created the core NSGram workspace layout.
- Integrated Firebase Authentication (Email/Password registration and Google Sign-In support).
- Built search features to query active directory users.
- Established real-time Direct Message channels, message threads, reply parameters, and emoji reactions using Firestore.
- Added support for recording and sending Cloudinary-hosted audio voice messages.
- Programmed peer-to-peer audio and video calls using WebRTC signaling.
