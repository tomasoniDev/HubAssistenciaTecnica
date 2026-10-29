import { describe, expect, it, vi } from "vitest";
import { randomBytes } from "crypto";
import {
  countPlaintextSecrets,
  decryptCredentialRow,
  decryptSecret,
  encryptSecret,
  isEncryptedSecret,
  parseEncryptionKey
} from "@/lib/credential-crypto";

const key = randomBytes(32);

describe("chave de criptografia", () => {
  it("aceita base64 e hexadecimal de 32 bytes", () => {
    expect(parseEncryptionKey(key.toString("base64"))?.length).toBe(32);
    expect(parseEncryptionKey(key.toString("hex"))?.length).toBe(32);
  });

  it("sem chave devolve null; chave de tamanho errado falha com mensagem clara", () => {
    expect(parseEncryptionKey("")).toBeNull();
    expect(parseEncryptionKey(undefined)).toBeNull();
    expect(() => parseEncryptionKey("curta")).toThrow("CREDENTIAL_ENCRYPTION_KEY inválida");
  });
});

describe("cifrar e decifrar senhas", () => {
  it("faz o ciclo completo sem perder caracteres especiais", () => {
    for (const secret of ["senha123", "Çã!@#$%¨&*()_+ ção 日本語", "a".repeat(500)]) {
      const encrypted = encryptSecret(secret, key)!;
      expect(isEncryptedSecret(encrypted)).toBe(true);
      expect(encrypted).not.toContain(secret.slice(0, 6));
      expect(decryptSecret(encrypted, key)).toBe(secret);
    }
  });

  it("a mesma senha gera textos diferentes a cada vez (IV aleatório)", () => {
    expect(encryptSecret("igual", key)).not.toBe(encryptSecret("igual", key));
  });

  it("não cifra duas vezes", () => {
    const once = encryptSecret("abc", key)!;
    expect(encryptSecret(once, key)).toBe(once);
  });

  it("valores vazios ou nulos passam direto", () => {
    expect(encryptSecret(null, key)).toBeNull();
    expect(encryptSecret("", key)).toBe("");
    expect(decryptSecret(null, key)).toBeNull();
  });

  it("sem chave configurada, nada muda (recurso desligado)", () => {
    expect(encryptSecret("texto", null)).toBe("texto");
  });

  it("senhas antigas em texto continuam sendo lidas", () => {
    expect(decryptSecret("senha-antiga", key)).toBe("senha-antiga");
  });

  it("chave errada ou texto adulterado falham em vez de devolver lixo", () => {
    const encrypted = encryptSecret("segredo", key)!;
    expect(() => decryptSecret(encrypted, randomBytes(32))).toThrow();
    const tampered = encrypted.slice(0, -2) + (encrypted.endsWith("A") ? "BB" : "AA");
    expect(() => decryptSecret(tampered, key)).toThrow();
  });

  it("cifrado sem chave configurada falha com mensagem clara", () => {
    expect(() => decryptSecret(encryptSecret("x", key), null)).toThrow("CREDENTIAL_ENCRYPTION_KEY");
  });
});

describe("linhas de credenciais", () => {
  it("decifra só os campos de senha e mantém o resto", () => {
    const original = { vnc_user: "admin", vnc_password: encryptSecret("p1", key), sinema_password: "antiga", vnc_vm_password: null };
    process.env.CREDENTIAL_ENCRYPTION_KEY = key.toString("base64");
    const row = decryptCredentialRow(original);
    delete process.env.CREDENTIAL_ENCRYPTION_KEY;
    expect(row).toEqual({ vnc_user: "admin", vnc_password: "p1", sinema_password: "antiga", vnc_vm_password: null });
  });

  it("uma senha que não decifra vira null sem derrubar a linha", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    process.env.CREDENTIAL_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    const row = decryptCredentialRow({ vnc_password: encryptSecret("x", key), vnc_user: "u" });
    delete process.env.CREDENTIAL_ENCRYPTION_KEY;
    expect(row.vnc_password).toBeNull();
    expect((row as { vnc_user: string }).vnc_user).toBe("u");
    spy.mockRestore();
  });

  it("conta senhas ainda em texto", () => {
    const rows = [
      { vnc_password: "a", vnc_vm_password: encryptSecret("b", key), sinema_password: "" },
      { vnc_password: null, sinema_password: "c" }
    ];
    expect(countPlaintextSecrets(rows)).toBe(2);
  });
});
