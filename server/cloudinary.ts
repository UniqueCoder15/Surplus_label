import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env if present
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

export const cleanEnv = (val?: string): string => {
  if (!val) return '';
  return val.trim().replace(/^["']|["']$/g, '').trim();
};

export const getCloudinaryCredentials = () => {
  return {
    cloud_name: cleanEnv(process.env.CLOUDINARY_CLOUD_NAME),
    api_key: cleanEnv(process.env.CLOUDINARY_API_KEY),
    api_secret: cleanEnv(process.env.CLOUDINARY_API_SECRET),
  };
};

export const isCloudinaryConfigured = (): boolean => {
  const { cloud_name, api_key, api_secret } = getCloudinaryCredentials();

  return !!(
    cloud_name &&
    cloud_name !== 'your_cloud_name_here' &&
    api_key &&
    api_key !== 'your_api_key_here' &&
    api_secret &&
    api_secret !== 'your_api_secret_here'
  );
};

export const configureCloudinary = (): boolean => {
  if (isCloudinaryConfigured()) {
    const creds = getCloudinaryCredentials();
    cloudinary.config({
      cloud_name: creds.cloud_name,
      api_key: creds.api_key,
      api_secret: creds.api_secret,
      secure: true,
    });
    return true;
  }
  return false;
};

// Configure Cloudinary SDK instance at startup
configureCloudinary();

export { cloudinary };
