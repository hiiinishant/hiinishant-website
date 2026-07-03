# Firebase Configuration Guide

This project uses Firebase for Authentication and Firestore Database. Cloudinary is used for image storage instead of Firebase Storage.

## Environment Variables

### Frontend (`.env.local`)

Add these variables to your frontend `.env.local` file:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Backend (`.env`)

Add these variables to your backend `.env` file:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

Alternatively, you can set:

```env
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

## Getting Firebase Credentials

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable **Authentication** → Sign-in method → **Email/Password**
4. Enable **Firestore Database** → Create database

### 2. Get Frontend Configuration

1. In Firebase Console, go to Project Settings
2. Scroll to "Your apps" section
3. Add a Web app (if not already added)
4. Copy the firebaseConfig object values

### 3. Get Backend Service Account

1. In Firebase Console, go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract values for:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (replace `\n` with `\\n` in .env)

**Important**: Never commit service account keys to git!

## Firebase Services Configuration

### Authentication

- **Method**: Email/Password
- **Enabled**: Yes (configure in Firebase Console)
- **Usage**: 
  - Frontend: `firebase/auth` for user signup/login
  - Backend: Firebase Admin SDK for token verification

### Firestore Database

- **Database**: Cloud Firestore
- **Rules**: See `backend/firestore.rules`
- **Collections**:
  - `users` - User profiles
  - `conversations` - Chat conversations
  - `messages` - Chat messages
  - `gallery` - Gallery photos (with Cloudinary URLs)
  - `blogs` - Blog posts
  - `updateItems` - Updates/News
  - `futurePlans` - Future plans
  - `dailyStatus` - Daily status updates
  - `musicSettings` - Music playlist settings
  - `newsletter` - Newsletter subscriptions

### Storage

- **Status**: Not used
- **Replacement**: Cloudinary for all image storage
- **Reason**: Better optimization, CDN, and cost-effectiveness

## Initialization

### Frontend

Firebase is initialized once in `frontend/src/lib/firebase.ts`:

```typescript
import { app, auth, db, isConfigured } from '@/lib/firebase';
```

The service checks if environment variables are configured and initializes:
- Firebase App (single instance)
- Firestore Database
- Authentication

### Backend

Firebase Admin SDK is initialized once in `backend/lib/firebaseAdmin.ts`:

```typescript
import { firestore } from './lib/firebaseAdmin';
```

The service checks for:
1. Service account credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)
2. Or GOOGLE_APPLICATION_CREDENTIALS environment variable

## Security Rules

Firestore security rules are defined in `backend/firestore.rules`:

- Users can read/write their own profiles
- Conversations and messages are restricted to participants
- Admin can manage all collections

## Common Issues

### Firebase not configured on frontend

**Symptom**: Console warning about missing environment variables

**Solution**: Add Firebase config to `frontend/.env.local` and restart dev server

### Backend Firestore operations fail

**Symptom**: "Firestore operations will fail until configured" warning

**Solution**: Add Firebase Admin credentials to `backend/.env` and restart server

### Authentication not working

**Symptom**: Login/signup fails

**Solution**: 
1. Enable Email/Password authentication in Firebase Console
2. Verify frontend environment variables are correct
3. Check browser console for specific error messages

### Private key format issues

**Symptom**: Firebase Admin initialization fails

**Solution**: Ensure private key in `.env` has proper line breaks:
- Replace actual newlines with `\n`
- Wrap in quotes
- Example: `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`

## Testing Configuration

### Frontend Test

```typescript
import { isConfigured, db } from '@/lib/firebase';

console.log('Firebase configured:', isConfigured);
console.log('Firestore instance:', db);
```

### Backend Test

```typescript
import { firestore } from './lib/firebaseAdmin';

console.log('Firestore instance:', firestore);
```

## Production Deployment

### Frontend (Vercel)

Add Firebase environment variables in Vercel project settings:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Backend (Render)

Add Firebase environment variables in Render environment:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

## Architecture

```
Frontend (Next.js)
├── Firebase Client SDK
│   ├── Authentication (Email/Password)
│   └── Firestore (real-time data)
└── Cloudinary (image uploads via backend API)

Backend (Express)
├── Firebase Admin SDK
│   └── Firestore (admin operations)
├── Cloudinary SDK
│   └── Image storage
└── Custom JWT (admin authentication)
```

## Best Practices

1. **Never commit credentials**: Keep Firebase keys in `.env` files
2. **Use environment-specific configs**: Different keys for dev/prod
3. **Monitor usage**: Check Firebase Console for quota and usage
4. **Security rules**: Regularly review Firestore security rules
5. **Backup data**: Export Firestore data periodically
