import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// Criptografia das senhas de acesso remoto (VNC/SINEMA) guardadas no banco.
// AES-256-GCM, chave em CREDENTIAL_ENCRYPTION_KEY (32 bytes em base64 ou 64 hex).
//
// Compatibilidade: sem a chave configurada, nada muda (senhas seguem em texto).
// Valores antigos em texto continuam sendo lidos; só os novos ficam cifrados
// ("enc:v1:..."). Perder a chave significa perder as senhas cifradas.

const PREFIX = "enc:v1:";
const IV_BYTES = 12;
const TAG_BYTES = 16;

export const CREDENTIAL_PASSWORD_FIELDS = ["vnc_password", "vnc_vm_password", "sinema_password"] as const;
export type CredentialPasswordField = (typeof CREDENTIAL_PASSWORD_FIELDS)[number];

export function parseEncryptionKey(raw?: string | null) {
  const value = raw?.trim();
  if (!value) return null;
  const key = /^[0-9a-fA-F]{64}$/.test(value) ? Buffer.from(value, "hex") : Buffer.from(value, "base64");
  if (key.length !== 32) {
    throw new Error("CREDENTIAL_ENCRYPTION_KEY inválida: use 32 bytes em base64 (ou 64 caracteres hexadecimais).");
  }
  return key;
}

export function encryptionKeyFromEnv() {
  return parseEncryptionKey(process.env.CREDENTIAL_ENCRYPTION_KEY);
}

export function isEncryptionConfigured() {
  try {
    return encryptionKeyFromEnv() !== null;
  } catch {
    return false;
  }
}

export function isEncryptedSecret(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(PREFIX);
}

export function encryptSecret(value: string | null | undefined, key: Buffer | null = encryptionKeyFromEnv()) {
  if (value === null || value === undefined || value === "") return value ?? null;
  if (isEncryptedSecret(value)) return value;
  if (!key) return value;

  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, encrypted]).toString("base64url");
}

/** Devolve o texto original. Valores antigos (sem prefixo) passam direto. Lança erro se não for possível decifrar. */
export function decryptSecret(value: string | null | undefined, key: Buffer | null = encryptionKeyFromEnv()) {
  if (value === null || value === undefined || value === "") return value ?? null;
  if (!isEncryptedSecret(value)) return value;
  if (!key) throw new Error("Senha cifrada, mas CREDENTIAL_ENCRYPTION_KEY não está configurada.");

  const data = Buffer.from(value.slice(PREFIX.length), "base64url");
  if (data.length < IV_BYTES + TAG_BYTES + 1) throw new Error("Senha cifrada em formato inválido.");

  const iv = data.subarray(0, IV_BYTES);
  const tag = data.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const encrypted = data.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function canDecryptSecret(value: string | null | undefined) {
  try {
    decryptSecret(value);
    return true;
  } catch {
    return false;
  }
}

/** Decifra os campos de senha de uma linha. Falhas viram null (e são registradas sem expor valores). */
export function decryptCredentialRow<T extends Partial<Record<CredentialPasswordField, string | null>>>(row: T): T {
  const result = { ...row };
  for (const field of CREDENTIAL_PASSWORD_FIELDS) {
    if (!(field in result)) continue;
    try {
      result[field] = decryptSecret(result[field] as string | null | undefined) as T[CredentialPasswordField];
    } catch (error) {
      console.error("Não foi possível decifrar uma senha de acesso", { field, reason: error instanceof Error ? error.message : "erro" });
      result[field] = null as T[CredentialPasswordField];
    }
  }
  return result;
}

/** Quantas senhas ainda estão em texto (não cifradas). */
export function countPlaintextSecrets(rows: Array<Partial<Record<CredentialPasswordField, string | null>>>) {
  let count = 0;
  for (const row of rows) {
    for (const field of CREDENTIAL_PASSWORD_FIELDS) {
      const value = row[field];
      if (typeof value === "string" && value !== "" && !isEncryptedSecret(value)) count += 1;
    }
  }
  return count;
}
