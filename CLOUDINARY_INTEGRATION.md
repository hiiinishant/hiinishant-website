# Cloudinary Integration Guide

This project now uses Cloudinary for image storage instead of Firebase Storage.

## Overview

- **Backend**: Express.js with Cloudinary SDK for image uploads
- **Frontend**: Next.js that calls backend API endpoints
- **Database**: Firestore stores image URLs and metadata (Cloudinary public IDs)

## Setup Instructions

### 1. Backend Configuration

Add these environment variables to your backend `.env` file:

```env
CLOUDINARY_CLOUD_NAME=w0ttcxa2
CLOUDINARY_API_KEY=799785378251193
CLOUDINARY_API_SECRET=K_OuhXipohks_9PGgNwX_I-OEDE
```

### 2. Install Dependencies

Navigate to the backend directory and install the new packages:

```bash
cd backend
npm install
```

This will install:
- `cloudinary` - Cloudinary SDK
- `multer` - File upload middleware

### 3. Start Backend Server

```bash
npm run dev
```

The backend will now have these new API endpoints:
- `POST /api/gallery` - Upload gallery photos
- `GET /api/gallery` - Fetch all gallery photos
- `PUT /api/gallery` - Update gallery photo metadata
- `DELETE /api/gallery` - Delete gallery photos
- `POST /api/upload` - Generic image upload endpoint
- `DELETE /api/upload` - Delete image by public ID

### 4. Frontend Configuration

Ensure your frontend `.env.local` has the backend URL configured:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

For production (Vercel), set this to your Render backend URL.

## API Usage

### Gallery Upload (Admin Dashboard)

The admin dashboard now uses the backend API for gallery management:

1. Upload: Sends FormData with image file and metadata to `/api/gallery`
2. Delete: Sends JSON with photo ID to `/api/gallery` (DELETE method)
3. Fetch: GET request to `/api/gallery` to load all photos

### Blog Image Upload

Blog posts now support featured images:

1. Send FormData with `image` field and blog metadata to `/api/blog`
2. Image is uploaded to Cloudinary folder: `hiiinishant/blog`
3. Cloudinary URL and public ID are stored in Firestore

### Generic Upload Endpoint

Use `/api/upload` for custom image uploads:

```typescript
const formData = new FormData();
formData.append('image', file);
formData.append('type', 'profile'); // or 'project', 'nsgram', etc.
formData.append('folder', 'hiiinishant/custom-folder');

const response = await fetch(`${BACKEND_URL}/api/upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
  },
  body: formData,
});
```

## Cloudinary Folder Structure

Images are organized in Cloudinary folders:

- `hiiinishant/gallery` - Gallery photos
- `hiiinishant/blog` - Blog featured images
- `hiiinishant/profile` - User profile images (if implemented)
- `hiiinishant/nsgram` - Nsgram post images (if implemented)
- `hiiinishant/projects` - Project images (if implemented)

## Image Optimization

All uploads are automatically optimized:
- Quality: `auto` (Cloudinary auto-optimization)
- Format: `auto` (WebP/AVIF when supported)
- Responsive transformations available via Cloudinary URLs

## Deletion

When deleting images:
1. Backend deletes from Cloudinary using public ID
2. Backend deletes metadata from Firestore
3. Frontend updates UI to reflect deletion

## Migration from Firebase Storage

If you have existing images in Firebase Storage:

1. Export your Firebase Storage images
2. Upload them to Cloudinary manually or via script
3. Update Firestore documents with new Cloudinary URLs and public IDs
4. Remove Firebase Storage references from code

## Security Notes

- Cloudinary credentials are stored in backend environment variables only
- Frontend never has access to Cloudinary API secret
- Admin authentication required for upload/delete operations
- All uploads go through backend API, not directly to Cloudinary

## Troubleshooting

### Upload Fails

1. Check backend environment variables are set correctly
2. Verify Cloudinary account is active
3. Check backend logs for specific error messages

### Images Not Loading

1. Verify backend is running and accessible
2. Check `NEXT_PUBLIC_BACKEND_URL` is correct
3. Ensure CORS is configured on backend

### Gallery Shows Mock Data

1. Backend API may be unreachable
2. Check browser console for API errors
3. Verify backend `/api/gallery` endpoint is working

## Benefits of Cloudinary Integration

- **Automatic Optimization**: Images are automatically compressed and converted to modern formats
- **CDN Delivery**: Global CDN for fast image loading
- **Transformations**: Easy URL-based image manipulation (resize, crop, effects)
- **Cost Effective**: Pay only for storage and bandwidth used
- **No Firebase Storage Limits**: Separate from Firebase quotas
- **Better Performance**: Dedicated image infrastructure

## Next Steps

Consider implementing:
- Image transformations in frontend (lazy loading, responsive images)
- Bulk upload functionality
- Image editing before upload
- Cloudinary-based video uploads for vlogs
