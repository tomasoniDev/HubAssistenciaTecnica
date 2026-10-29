// Limitador em memória (por instância do servidor). Funciona como camada extra:
// em ambiente serverless cada instância tem a sua contagem, então o limite real
// por IP deve ser configurado também no firewall (Cloudflare).

type Bucket = { hits: number[] };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;

function prune(now: number, windowMs: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (!bucket.hits.some((time) => now - time < windowMs)) buckets.delete(key);
  }
}

function recentHits(key: string, now: number, windowMs: number) {
  const bucket = buckets.get(key);
  if (!bucket) return [];
  bucket.hits = bucket.hits.filter((time) => now - time < windowMs);
  return bucket.hits;
}

export type RateLimitOptions = { limit: number; windowMs: number };

/** Indica se a chave já atingiu o limite, sem registrar nova ocorrência. */
export function isRateLimited(key: string, { limit, windowMs }: RateLimitOptions, now = Date.now()) {
  return recentHits(key, now, windowMs).length >= limit;
}

/** Registra uma ocorrência (por exemplo, uma tentativa falha). */
export function recordHit(key: string, { windowMs }: RateLimitOptions, now = Date.now()) {
  prune(now, windowMs);
  const hits = recentHits(key, now, windowMs);
  hits.push(now);
  buckets.set(key, { hits });
}

/** Verifica o limite e já registra a ocorrência. Retorna true se ainda pode prosseguir. */
export function consume(key: string, options: RateLimitOptions, now = Date.now()) {
  if (isRateLimited(key, options, now)) return false;
  recordHit(key, options, now);
  return true;
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}

export function clearAllRateLimits() {
  buckets.clear();
}

export function clientIp(request: Request) {
  const cloudflare = request.headers.get("cf-connecting-ip");
  if (cloudflare) return cloudflare.trim();
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "desconhecido";
}
