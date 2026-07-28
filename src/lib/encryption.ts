import crypto from "crypto";

const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || "velicham-secure-aes-256-gcm-master-key-32-bytes-length!!";

// Derive a 32-byte key from ENCRYPTION_SECRET
function getEncryptionKey(): Buffer {
  return crypto.createHash("sha256").update(ENCRYPTION_SECRET).digest();
}

/**
 * Encrypts plaintext string using AES-256-GCM
 * Returns formatted string: ivHex:authTagHex:encryptedHex
 */
export function encryptText(text: string): string {
  if (!text) return "";
  const iv = crypto.randomBytes(12); // 96-bit IV for GCM
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts string encrypted with encryptText
 */
export function decryptText(encryptedData: string): string | null {
  if (!encryptedData) return null;
  try {
    const parts = encryptedData.split(":");
    if (parts.length !== 3) return null;

    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encryptedText = parts[2];

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Failed to decrypt API key:", error);
    return null;
  }
}

/**
 * Safely masks API key for display in UI (e.g. sk-or-v1-••••••••1234)
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey) return "";
  const trimmed = apiKey.trim();
  if (trimmed.length <= 8) return "••••••••";
  const start = trimmed.slice(0, 10);
  const end = trimmed.slice(-4);
  return `${start}••••••••${end}`;
}
