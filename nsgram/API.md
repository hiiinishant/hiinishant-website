# NSGram REST API Documentation

This documentation details the REST API endpoints associated with user profile creation, activation, and retrieval located in [`backend/routes/users.ts`](file:///c:/Users/sunil/OneDrive/Desktop/HIII-Nishant/backend/routes/users.ts).

---

## 🔐 Authentication Middleware

Endpoints marked with 🔐 require a Firebase ID Token in the request headers:
```http
Authorization: Bearer <Firebase_ID_Token>
```
The token is decoded on the backend and validated against Firebase Auth.

---

## 📥 1. Create or Synchronize Profile

Synchronizes and activates the user profile in Cloud Firestore once authenticated or verified.

- **Route:** `/api/users/profile`
- **Method:** `POST`
- **Auth Required:** Yes (🔐)
- **Request Headers:** `Content-Type: application/json`
- **Request Body:**

```json
{
  "uid": "USER_FIREBASE_UID",
  "email": "user@example.com",
  "displayName": "John Doe",
  "username": "johndoe",
  "bio": "Coding at 2 AM",
  "avatar": "boy",
  "isActivated": true
}
```

*Note: All parameters except `uid` and `email` are optional when updating. If `role` is supplied, it is ignored by the API to prevent privilege escalation.*

- **Response (200 OK):**

```json
{
  "success": true,
  "profile": {
    "uid": "USER_FIREBASE_UID",
    "email": "user@example.com",
    "displayName": "John Doe",
    "username": "johndoe",
    "bio": "Coding at 2 AM",
    "avatar": "boy",
    "role": "user",
    "isActivated": true,
    "createdAt": "2026-07-11T10:00:00.000Z",
    "updatedAt": "2026-07-11T10:01:00.000Z",
    "lastLoginAt": "2026-07-11T10:01:00.000Z"
  }
}
```

- **Error Responses:**
  - `401 Unauthorized`: Token missing or invalid.
  - `403 Forbidden`: Token UID does not match requested profile UID.
  - `400 Bad Request`: Missing `uid` or `email` fields.
  - `500 Server Error`: Firebase Admin SDK or database failure.

---

## 📤 2. Fetch User Profile

Retrieves user profile metadata (public info, used for chat views and search page).

- **Route:** `/api/users/profile/:uid`
- **Method:** `GET`
- **Auth Required:** No
- **Response (200 OK):**

```json
{
  "id": "USER_FIREBASE_UID",
  "uid": "USER_FIREBASE_UID",
  "email": "user@example.com",
  "displayName": "John Doe",
  "username": "johndoe",
  "bio": "Coding at 2 AM",
  "avatar": "boy",
  "role": "user",
  "isActivated": true,
  "lastSeen": "2026-07-11T10:05:00.000Z"
}
```

- **Error Responses:**
  - `400 Bad Request`: Missing parameters.
  - `404 Not Found`: Profile does not exist in Firestore.

---

## ✏️ 3. Partial Update Profile

Allows users to update their metadata partial fields (e.g. bio, avatar choice).

- **Route:** `/api/users/profile/:uid`
- **Method:** `PUT`
- **Auth Required:** Yes (🔐)
- **Request Body:**

```json
{
  "displayName": "Johnny Doe",
  "bio": "Building edtech tools.",
  "avatar": "boy"
}
```

- **Response (200 OK):**

```json
{
  "success": true,
  "profile": {
    "uid": "USER_FIREBASE_UID",
    "email": "user@example.com",
    "displayName": "Johnny Doe",
    "username": "johndoe",
    "bio": "Building edtech tools.",
    "avatar": "boy",
    "role": "user",
    "isActivated": true,
    "updatedAt": "2026-07-11T10:02:00.000Z"
  }
}
```

- **Error Responses:**
  - `401 Unauthorized`: Token missing or invalid.
  - `403 Forbidden`: Attempting to edit another user's profile.
  - `404 Not Found`: User profile does not exist.
