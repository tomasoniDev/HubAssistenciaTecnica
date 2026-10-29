"use client";

import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Erro na interface", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <main className="login-page">
      <section className="login-card">
        <h1>Algo deu errado</h1>
        <p>Não foi possível exibir esta tela. Seus dados salvos não foram afetados.</p>
        <button className="button primary" type="button" onClick={reset}>Tentar novamente</button>
        {error.digest && <span className="form-message">Código do erro: {error.digest}</span>}
      </section>
    </main>
  );
}
