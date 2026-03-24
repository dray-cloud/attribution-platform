import { createCipheriv, createDecipheriv, randomBytes, createHmac } from "crypto";

function getKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY;
  if (!key) throw new Error("TOKEN_ENCRYPTION_KEY is not set");
  return Buffer.from(key, "hex");
}

export function encrypt(text: string): { encrypted: string; iv: string } {
  const iv = randomBytes(16);
  const key = getKey();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    encrypted: Buffer.concat([encrypted, tag]).toString("hex"),
    iv: iv.toString("hex"),
  };
}

export function decrypt(encrypted: string, iv: string): string {
  const key = getKey();
  const ivBuf = Buffer.from(iv, "hex");
  const data = Buffer.from(encrypted, "hex");
  const tag = data.subarray(data.length - 16);
  const encryptedData = data.subarray(0, data.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", key, ivBuf);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]).toString("utf8");
}

export function signState(data: string): string {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret) throw new Error("OAUTH_STATE_SECRET is not set");
  const hmac = createHmac("sha256", secret);
  hmac.update(data);
  const sig = hmac.digest("hex");
  return `${data}.${sig}`;
}

export function verifyState(signed: string): string | null {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return null;
  const data = signed.substring(0, lastDot);
  const expected = signState(data);
  if (signed !== expected) return null;
  return data;
}
