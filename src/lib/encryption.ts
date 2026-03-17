/**
 * LIKEFOOD - Field-Level Encryption Utility
 * AES-256-GCM authenticated encryption for sensitive data
 * 
 * Usage:
 *   import { encrypt, decrypt, isEncrypted } from '@/lib/encryption';
 *   const encrypted = encrypt("0912345678");    // "enc:v1:iv:tag:ciphertext"
 *   const plain     = decrypt(encrypted);        // "0912345678"
 */

import crypto from "crypto";
import { logger } from "./logger";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // GCM recommended
const TAG_LENGTH = 16;
const PREFIX = "enc:v1:"; // Versioned prefix to detect encrypted values

/**
 * Derive 256-bit key from NEXTAUTH_SECRET using HKDF
 * Cached so it's only computed once per process lifetime
 */
let _cachedKey: Buffer | null = null;

function getEncryptionKey(): Buffer {
  if (_cachedKey) return _cachedKey;

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required for encryption");
  }

  // HKDF: derive a 256-bit key from the secret
  _cachedKey = Buffer.from(
    crypto.hkdfSync(
      "sha256",
      Buffer.from(secret, "utf-8"),
      Buffer.from("likefood-field-encryption", "utf-8"), // salt
      Buffer.from("aes-256-gcm-field-key", "utf-8"),     // info
      32 // 256 bits
    )
  );

  return _cachedKey;
}

/**
 * Encrypt a plaintext string → "enc:v1:<iv_hex>:<tag_hex>:<ciphertext_hex>"
 * Returns null if input is null/undefined/empty
 */
export function encrypt(plaintext: string | null | undefined): string | null {
  if (!plaintext || plaintext.trim() === "") return null;
  
  // Already encrypted? Return as-is
  if (isEncrypted(plaintext)) return plaintext;

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
      authTagLength: TAG_LENGTH,
    });

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag().toString("hex");

    return `${PREFIX}${iv.toString("hex")}:${tag}:${encrypted}`;
  } catch (error) {
    logger.error("[ENCRYPTION] Failed to encrypt", error as Error);
    // Fail-safe: return original value rather than losing data
    return plaintext;
  }
}

/**
 * Decrypt an encrypted string → original plaintext
 * If input is not encrypted (no prefix), returns as-is (backward compatible)
 */
export function decrypt(encrypted: string | null | undefined): string | null {
  if (!encrypted || encrypted.trim() === "") return null;

  // Not encrypted? Return as-is (backward compatible with pre-encryption data)
  if (!isEncrypted(encrypted)) return encrypted;

  try {
    const key = getEncryptionKey();
    const payload = encrypted.slice(PREFIX.length); // Remove "enc:v1:"
    const parts = payload.split(":");
    
    if (parts.length !== 3) {
      logger.warn("[ENCRYPTION] Malformed encrypted value, returning as-is");
      return encrypted;
    }

    const [ivHex, tagHex, ciphertextHex] = parts;
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
      authTagLength: TAG_LENGTH,
    });
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    logger.error("[ENCRYPTION] Failed to decrypt", error as Error);
    // Return original string if decryption fails (e.g. key changed)
    return encrypted;
  }
}

/**
 * Decrypt for display on UI – never returns encrypted string to the client.
 * If decryption fails or value is malformed, returns empty string so the UI
 * never shows "enc:v1:..." to the user.
 */
export function decryptForDisplay(value: string | null | undefined): string {
  if (!value || value.trim() === "") return "";
  const plain = decrypt(value);
  if (!plain) return "";
  if (isEncrypted(plain)) return ""; // decrypt failed, returned original
  return plain;
}

/**
 * Check if a value is already encrypted (has our prefix)
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false;
  return value.startsWith(PREFIX);
}

/**
 * Encrypt a value only if it's not already encrypted
 * Useful for idempotent migrations and saves
 */
export function ensureEncrypted(value: string | null | undefined): string | null {
  if (!value || value.trim() === "") return null;
  if (isEncrypted(value)) return value;
  return encrypt(value);
}

/**
 * Mask a decrypted value for display purposes
 * "0912345678" → "091****678"
 * "123 Main St" → "123 ****"
 */
export function maskValue(value: string | null | undefined, type: "phone" | "address" = "phone"): string {
  if (!value) return "";
  
  // First decrypt if encrypted
  const plain = isEncrypted(value) ? decrypt(value) : value;
  if (!plain) return "";
  
  if (type === "phone") {
    if (plain.length <= 4) return "****";
    return plain.slice(0, 3) + "****" + plain.slice(-3);
  }
  
  // Address: show first part, mask rest
  if (plain.length <= 8) return "****";
  return plain.slice(0, Math.min(10, Math.floor(plain.length / 3))) + " ****";
}
