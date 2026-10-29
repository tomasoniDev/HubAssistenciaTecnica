"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Erro global na interface", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: "Arial, Helvetica, sans-serif", background: "#f7f8fa", color: "#111" }}>
        <main style={{ display: "grid", minHeight: "100vh", placeItems: "center", padding: 24 }}>
          <section style={{ maxWidth: 420, textAlign: "center" }}>
            <h1>Algo deu errado</h1>
            <p>Não foi possível carregar o aplicativo. Tente novamente em instantes.</p>
            <button
              type="button"
              onClick={reset}
              style={{ minHeight: 40, border: 0, borderRadius: 8, background: "#1268d8", color: "#fff", padding: "0 20px", fontWeight: 700, cursor: "pointer" }}
            >
              Tentar novamente
            </button>
            {error.digest && <p style={{ color: "#646a73", fontSize: 13 }}>Código do erro: {error.digest}</p>}
          </section>
        </main>
      </body>
    </html>
  );
}
