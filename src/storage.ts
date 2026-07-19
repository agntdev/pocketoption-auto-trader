import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    return Buffer.from("0000000000000000000000000000000000000000000000000000000000000000", "hex");
  }
  return Buffer.from(key, "hex").length === 32
    ? Buffer.from(key, "hex")
    : Buffer.from(key.padEnd(32, "\0"), "utf8");
}

export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(ciphertext: string): string {
  const key = getEncryptionKey();
  const [ivHex, encHex] = ciphertext.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

export interface UserProfile {
  telegramUserId: number;
  chatId: number;
}

export interface Credentials {
  email: string;
  encryptedPassword: string;
}

export interface TradeSettings {
  accountType: "real" | "demo";
  tradeAmount: number;
  timeframe: "1m" | "5m" | "30m" | "1h";
}

export interface TradingSession {
  loginStatus: "idle" | "logging_in" | "logged_in" | "login_failed";
  autoTradingEnabled: boolean;
  tradesExecuted: number;
  winCount: number;
  lossCount: number;
  pnl: number;
}

export interface UserData {
  profile: UserProfile;
  credentials: Credentials;
  settings: TradeSettings;
  session: TradingSession;
}

const store = new Map<string, UserData>();

export function getUserData(telegramUserId: number): UserData | undefined {
  return store.get(String(telegramUserId));
}

export function saveUserData(telegramUserId: number, data: UserData): void {
  store.set(String(telegramUserId), data);
}

export function createDefaultUserData(telegramUserId: number, chatId: number): UserData {
  return {
    profile: { telegramUserId, chatId },
    credentials: { email: "", encryptedPassword: "" },
    settings: { accountType: "demo", tradeAmount: 1, timeframe: "1m" },
    session: {
      loginStatus: "idle",
      autoTradingEnabled: false,
      tradesExecuted: 0,
      winCount: 0,
      lossCount: 0,
      pnl: 0,
    },
  };
}
