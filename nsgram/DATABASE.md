# NSGram Database Schema

NSGram utilizes Google Cloud Firestore as its primary storage database. This document specifies the collection layouts, schemas, indices, and rules.

---

## 🗄️ Collections Schema

### 1. `users`
Documents are indexed by the user's Firebase Authentication UID (`doc.id === uid`).

| Field | Type | Description |
|---|---|---|
| `uid` | `string` | Unique identifier (matches Auth UID) |
| `displayName` | `string` | User's full name or screen name |
| `username` | `string` | Unique lowercase handle (e.g. `john_doe`) |
| `email` | `string` | User's registered email |
| `bio` | `string` | Optional profile description |
| `avatar` | `'boy' \| 'girl'` | Chosen avatar representation |
| `role` | `'admin' \| 'user'` | Privilege scope. Defaults to `user` |
| `isActivated` | `boolean` | Activates profile once email verification succeeds |
| `createdAt` | `string` | ISO timestamp of profile registration |
| `updatedAt` | `string` | ISO timestamp of profile updates |
| `lastLoginAt` | `string` | ISO timestamp of last sign-in |
| `lastSeen` | `string \| null` | ISO timestamp of last connection, or `null` if currently online |

---

### 2. `conversations`
Documents represent active direct chat rooms between two participants. Documents are named using alphabetical sorting of user UIDs to enforce uniqueness: `${uid1}_${uid2}` (where `uid1 < uid2`).

| Field | Type | Description |
|---|---|---|
| `participants` | `array<string>` | Exactly two UIDs containing the conversing parties |
| `lastMessage` | `string` | Preview text of the latest sent message |
| `lastMessageAt` | `string` | ISO timestamp of latest message |
| `lastMessageBy` | `string` | UID of the sender of the latest message |
| `lastMessageRead` | `boolean` | Read state of the latest message |

---

### 3. `conversations / {conversationId} / messages`
Subcollection under each conversation containing individual messages.

| Field | Type | Description |
|---|---|---|
| `senderId` | `string` | UID of the sender |
| `text` | `string` | Text content of the message |
| `createdAt` | `string` | ISO timestamp |
| `read` | `boolean` | Mark whether message is read |
| `tempId` | `string \| null` | Temporary ID mapped from the client for optimistic rendering deduplication |
| `audioUrl` | `string` | Optional voice message URL stored in Cloudinary |
| `reactions` | `map<string, string>` | Key-value mapping: `userId -> emojiChar` |
| `replyTo` | `map` | Optional reply reference containing `{ id, text, senderId, senderName }` |

---

## 🔒 Index Constraints

To query messages inside a conversation ordered by time, we need a composite query index. Ensure the following index is configured in Firestore:

- **Collection:** `messages` (Query Scope: Collection group or Subcollection)
- **Fields:**
  - `senderId` Ascending, `read` Ascending
  - `createdAt` Descending

---

## 🛡️ Security Rules (`firestore.rules`)

To secure the database, configure rules matching these principles:
- Users can write profiles only when matching their verified Auth ID.
- Users can query user documents but not create admin roles.
- Conversation and message documents can only be accessed or modified if the querying user's UID is included in the conversation's `participants` list.
