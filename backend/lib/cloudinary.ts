import './env';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  secureUrl: string;
}

export interface UploadOptions {
  folder?: string;
  transformation?: string;
  resourceType?: 'image' | 'video' | 'auto' | 'raw';
  quality?: 'auto' | number;
  fetch_format?: 'auto' | string;
  publicId?: string;
  access_mode?: 'public' | 'authenticated';
}

/**
 * Upload a file buffer to Cloudinary
 */
export async function uploadBuffer(
  buffer: Buffer,
  options: UploadOptions = {}
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const isRaw = options.resourceType === 'raw';
    const params: any = {
      folder: options.folder || 'hiiinishant',
      resource_type: options.resourceType || 'image',
      public_id: options.publicId,
      access_mode: options.access_mode || 'public',
    };
    if (!isRaw) {
      if (options.transformation) params.transformation = options.transformation;
      params.quality = options.quality || 'auto';
      params.fetch_format = options.fetch_format || 'auto';
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      params,
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.url,
            publicId: result.public_id,
            width: result.width || 0,
            height: result.height || 0,
            format: result.format || '',
            bytes: result.bytes || 0,
            secureUrl: result.secure_url,
          });
        }
      }
    );

    const stream = Readable.from(buffer);
    stream.pipe(uploadStream);
  });
}

/**
 * Upload a base64 string to Cloudinary
 */
export async function uploadBase64(
  base64: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const isRaw = options.resourceType === 'raw';
    const params: any = {
      folder: options.folder || 'hiiinishant',
      resource_type: options.resourceType || 'image',
      public_id: options.publicId,
    };
    if (!isRaw) {
      if (options.transformation) params.transformation = options.transformation;
      params.quality = options.quality || 'auto';
      params.fetch_format = options.fetch_format || 'auto';
    }

    cloudinary.uploader.upload(
      base64,
      params,
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({
            url: result.url,
            publicId: result.public_id,
            width: result.width || 0,
            height: result.height || 0,
            format: result.format || '',
            bytes: result.bytes || 0,
            secureUrl: result.secure_url,
          });
        }
      }
    );
  });
}

/**
 * Delete a file/image from Cloudinary by public ID
 */
export async function deleteImage(
  publicId: string,
  options: { resourceType?: 'image' | 'video' | 'raw' } = {}
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(
      publicId,
      { resource_type: options.resourceType || 'image' },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result?.result === 'ok');
        }
      }
    );
  });
}

/**
 * Get optimized image URL with transformations
 */
export function getOptimizedUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
    crop?: string;
  } = {}
): string {
  const transformation = cloudinary.url(publicId, {
    transformation: [
      { width: options.width, height: options.height, crop: options.crop || 'limit' },
      { quality: options.quality || 'auto', fetch_format: options.format || 'auto' },
    ],
  });
  return transformation;
}

export default cloudinary;
