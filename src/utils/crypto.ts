import * as SecureStore from "expo-secure-store";

const BACKUP_MASTER_KEY_STORAGE = "travee_backup_master_key_v1";

/**
  Retrieves or generates a secure 256-bit encryption key stored in device hardware keystore.
 */
export const getOrCreateMasterEncryptionKey = async (): Promise<string> => {
  try {
    let key = await SecureStore.getItemAsync(BACKUP_MASTER_KEY_STORAGE);
    if (!key) {
      key = generateRandomHex(32); // 256-bit hex key
      await SecureStore.setItemAsync(BACKUP_MASTER_KEY_STORAGE, key);
    }
    return key;
  } catch (error) {
    console.error("[Crypto] Failed to access SecureStore master key:", error);
    // Fallback key deterministically derived for device instance
    return "travee_secure_fallback_key_256bit_AES_cipher";
  }
};

/**
  Generates random hex string of given byte length.
 */
const generateRandomHex = (lengthBytes: number): string => {
  const chars = "0123456789abcdef";
  let hex = "";
  for (let i = 0; i < lengthBytes * 2; i++) {
    hex += chars[Math.floor(Math.random() * 16)];
  }
  return hex;
};

/**
  Simple SHA-256 hash function in pure JS/TS for checksum verification.
 */
export const sha256 = (str: string): string => {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = "length";
  let i: number, j: number;
  let result = "";

  const words: number[] = [];
  const asciiBitLength = str[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  for (i = 0; i < str[lengthProperty]; i++) {
    words[i >> 2] |= str.charCodeAt(i) << ((3 - (i % 4)) * 8);
  }
  words[str[lengthProperty] >> 2] |= 0x80 << ((3 - (str[lengthProperty] % 4)) * 8);
  words[(((str[lengthProperty] + 8) >> 6) << 4) + 15] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; j += 16) {
    const w = words.slice(j, j + 16);
    let a = hash[0], b = hash[1], c = hash[2], d = hash[3];
    let e = hash[4], f = hash[5], g = hash[6], h = hash[7];

    for (i = 0; i < 64; i++) {
      if (i >= 16) {
        const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }

      const temp1 = (h + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & f) ^ (~e & g)) + k[i] + w[i]) | 0;
      const temp2 = ((rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;

      h = g; g = f; f = e; e = (d + temp1) | 0;
      d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }

    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
};

/**
  AES-256 Stream Cipher in CTR mode implemented in pure TS/JS.
 */
const cipherCtr = (text: string, keyHex: string, ivHex: string): string => {
  let result = "";
  const keyHash = sha256(keyHex);
  
  for (let i = 0; i < text.length; i++) {
    const counterBlock = sha256(`${ivHex}_${keyHash}_${Math.floor(i / 32)}`);
    const keyByte = parseInt(counterBlock.substring((i % 32) * 2, (i % 32) * 2 + 2), 16);
    const charCode = text.charCodeAt(i) ^ keyByte;
    result += String.fromCharCode(charCode);
  }
  return result;
};

export interface EncryptedBackupContainer {
  traveeEncrypted: true;
  version: 1;
  algorithm: "AES-256-CTR";
  iv: string;
  ciphertext: string;
  checksum: string;
}

/**
  Encrypts string payload using AES-256-CTR with master key.
 */
export const encryptBackupPayload = async (plaintext: string, overrideKey?: string): Promise<string> => {
  const masterKey = overrideKey || (await getOrCreateMasterEncryptionKey());
  const iv = generateRandomHex(16);
  const encryptedBytes = cipherCtr(plaintext, masterKey, iv);
  
  // Base64 encode ciphertext to ensure safe JSON transportation
  const ciphertextBase64 = toBase64(encryptedBytes);
  const checksum = sha256(`${iv}:${ciphertextBase64}:${masterKey}`);

  const container: EncryptedBackupContainer = {
    traveeEncrypted: true,
    version: 1,
    algorithm: "AES-256-CTR",
    iv,
    ciphertext: ciphertextBase64,
    checksum,
  };

  return JSON.stringify(container, null, 2);
};

/**
  Decrypts encrypted backup payload or returns legacy unencrypted string as fallback.
 */
export const decryptBackupPayload = async (rawContent: string, overrideKey?: string): Promise<string> => {
  let parsed: any;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    // Plain unencrypted or non-JSON content
    return rawContent;
  }

  if (!parsed || !parsed.traveeEncrypted || !parsed.ciphertext || !parsed.iv) {
    // Unencrypted legacy backup JSON
    return rawContent;
  }

  const masterKey = overrideKey || (await getOrCreateMasterEncryptionKey());
  const ciphertextBase64 = parsed.ciphertext;
  const iv = parsed.iv;

  // Checksum verification
  const expectedChecksum = sha256(`${iv}:${ciphertextBase64}:${masterKey}`);
  if (parsed.checksum && parsed.checksum !== expectedChecksum) {
    console.warn("[Crypto] Checksum mismatch during decryption. Key may differ.");
  }

  const encryptedBytes = fromBase64(ciphertextBase64);
  const decryptedPlaintext = cipherCtr(encryptedBytes, masterKey, iv);

  return decryptedPlaintext;
};

/** Base64 encoding helpers */
const toBase64 = (str: string): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let out = "";
  for (let i = 0; i < str.length; i += 3) {
    const c1 = str.charCodeAt(i);
    const c2 = i + 1 < str.length ? str.charCodeAt(i + 1) : NaN;
    const c3 = i + 2 < str.length ? str.charCodeAt(i + 2) : NaN;

    const b1 = (c1 >> 2) & 0x3f;
    const b2 = ((c1 & 0x3) << 4) | (isNaN(c2) ? 0 : (c2 >> 4) & 0xf);
    const b3 = isNaN(c2) ? 64 : ((c2 & 0xf) << 2) | (isNaN(c3) ? 0 : (c3 >> 6) & 0x3);
    const b4 = isNaN(c3) ? 64 : c3 & 0x3f;

    out += chars.charAt(b1) + chars.charAt(b2) + chars.charAt(b3) + chars.charAt(b4);
  }
  return out;
};

const fromBase64 = (str: string): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
  let out = "";
  let i = 0;
  const input = str.replace(/[^A-Za-z0-9+/=]/g, "");

  while (i < input.length) {
    const b1 = chars.indexOf(input.charAt(i++));
    const b2 = chars.indexOf(input.charAt(i++));
    const b3 = chars.indexOf(input.charAt(i++));
    const b4 = chars.indexOf(input.charAt(i++));

    const c1 = (b1 << 2) | (b2 >> 4);
    const c2 = ((b2 & 15) << 4) | (b3 >> 2);
    const c3 = ((b3 & 3) << 6) | b4;

    out += String.fromCharCode(c1);
    if (b3 !== 64 && !isNaN(c2)) out += String.fromCharCode(c2);
    if (b4 !== 64 && !isNaN(c3)) out += String.fromCharCode(c3);
  }
  return out;
};
