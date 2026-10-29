"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ToastTone = "success" | "error" | "info";
export type Toast = { id: number; text: string; tone: ToastTone };

const ERROR_PATTERN = /não foi possível|nao foi possivel|erro|falha|negad|sem permiss|não pode|nao pode|só pode|so pode|inválid|invalid|obrigat|informe|expirad|limite|bloquead|apenas|modo demonstra|não (foi|está|estão)|nao (foi|esta|estao)|mas /i;
const SUCCESS_PATTERN = /sucesso|salv|enviad|atualizad|exclu[ií]d|criptografad|reiniciad|gerad|finalizad|liberad|habilitad|movido|alterad|assumid|encerrad|transferid/i;

export function toneForMessage(text: string): ToastTone {
  if (ERROR_PATTERN.test(text)) return "error";
  if (SUCCESS_PATTERN.test(text)) return "success";
  return "info";
}

const MAX_VISIBLE = 4;

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback((text: string) => {
    const id = nextId.current++;
    const tone = toneForMessage(text);
    setToasts((current) => [...current.slice(-(MAX_VISIBLE - 1)), { id, text, tone }]);
    timers.current.set(id, window.setTimeout(() => dismiss(id), tone === "error" ? 10000 : 5500));
  }, [dismiss]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  return { toasts, push, dismiss };
}

export function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.tone}`} role={toast.tone === "error" ? "alert" : "status"}>
          <span className="toast-text">{toast.text}</span>
          <button className="toast-close" type="button" aria-label="Fechar aviso" onClick={() => onDismiss(toast.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
