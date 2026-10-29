import { beforeEach, describe, expect, it } from "vitest";
import { clearAllRateLimits, clientIp, consume, isRateLimited, recordHit, resetRateLimit } from "@/lib/rate-limit";

const options = { limit: 3, windowMs: 1000 };

beforeEach(() => clearAllRateLimits());

describe("limitador de tentativas", () => {
  it("bloqueia depois de atingir o limite", () => {
    expect(consume("a", options, 0)).toBe(true);
    expect(consume("a", options, 10)).toBe(true);
    expect(consume("a", options, 20)).toBe(true);
    expect(consume("a", options, 30)).toBe(false);
  });

  it("libera de novo quando a janela passa", () => {
    for (let i = 0; i < 3; i++) consume("a", options, i);
    expect(consume("a", options, 500)).toBe(false);
    expect(consume("a", options, 1100)).toBe(true);
  });

  it("chaves diferentes não se afetam", () => {
    for (let i = 0; i < 3; i++) consume("a", options, i);
    expect(consume("b", options, 10)).toBe(true);
  });

  it("falhas contam e o reset limpa", () => {
    for (let i = 0; i < 3; i++) recordHit("login", options, i);
    expect(isRateLimited("login", options, 10)).toBe(true);
    resetRateLimit("login");
    expect(isRateLimited("login", options, 10)).toBe(false);
  });
});

describe("IP do cliente", () => {
  it("prefere o cabeçalho da Cloudflare", () => {
    const request = new Request("http://x", { headers: { "cf-connecting-ip": "1.1.1.1", "x-forwarded-for": "2.2.2.2" } });
    expect(clientIp(request)).toBe("1.1.1.1");
  });

  it("usa o primeiro IP do x-forwarded-for", () => {
    const request = new Request("http://x", { headers: { "x-forwarded-for": "2.2.2.2, 3.3.3.3" } });
    expect(clientIp(request)).toBe("2.2.2.2");
  });

  it("devolve um valor padrão sem cabeçalhos", () => {
    expect(clientIp(new Request("http://x"))).toBe("desconhecido");
  });
});
