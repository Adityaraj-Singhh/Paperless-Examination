import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JWTPayload, TOKEN_CONFIG } from '@paperless/shared';

/**
 * Hash Password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, TOKEN_CONFIG.BCRYPT_SALT_ROUNDS);
};

/**
 * Compare Password
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate Access Token
 */
export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: TOKEN_CONFIG.ACCESS_TOKEN_EXPIRY,
  } as jwt.SignOptions);
};

/**
 * Generate Refresh Token
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: TOKEN_CONFIG.REFRESH_TOKEN_EXPIRY,
  } as jwt.SignOptions);
};

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JWTPayload;
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JWTPayload;
};

/**
 * Generate Random Token (for email verification, password reset)
 */
export const generateRandomToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Encrypt Data (AES-256)
 */
export const encryptData = (data: string): { encrypted: string; key: string } => {
  const algorithm = 'aes-256-cbc';
  const key = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Combine IV and encrypted data
  const combined = iv.toString('hex') + ':' + encrypted;

  return {
    encrypted: combined,
    key: key.toString('hex'),
  };
};

/**
 * Decrypt Data (AES-256)
 */
export const decryptData = (encrypted: string, keyHex: string): string => {
  const algorithm = 'aes-256-cbc';
  const parts = encrypted.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedData = parts[1];
  const key = Buffer.from(keyHex, 'hex');

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

/**
 * Generate TOTP Secret (for 2FA)
 */
export const generateTOTPSecret = (): string => {
  return crypto.randomBytes(20).toString('hex');
};
