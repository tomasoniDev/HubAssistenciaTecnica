"use client";

import { useEffect, useRef, useState } from "react";
import { composeServiceDateTime, parseServiceDateTime } from "@/lib/service-datetime";

type Props = {
  name: string;
  label: string;
  initialValue?: string | null;
};

// Seletores nativos de data e hora; o valor enviado no formulário continua sendo o
// mesmo texto de antes ("dd/mm/aa" ou "dd/mm/aa - hh:mm") num campo oculto.
export function ServiceDateTimeField({ name, label, initialValue }: Props) {
  const original = (initialValue ?? "").trim();
  const initial = parseServiceDateTime(original);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [touched, setTouched] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const next = parseServiceDateTime(initialValue);
    setDate(next.date);
    setTime(next.time);
    setTouched(false);
  }, [initialValue]);

  useEffect(() => {
    const form = wrapperRef.current?.closest("form");
    if (!form) return;
    function restore() {
      const next = parseServiceDateTime(initialValue);
      setDate(next.date);
      setTime(next.time);
      setTouched(false);
    }
    form.addEventListener("reset", restore);
    return () => form.removeEventListener("reset", restore);
  }, [initialValue]);

  // Sem mexer nos seletores, o valor original é mantido exatamente como estava.
  const submitted = touched ? composeServiceDateTime(date, time) : original;
  const showLegacyNotice = !touched && Boolean(original) && !initial.date;

  return (
    <div className="datetime-field" ref={wrapperRef}>
      <input
        type="date"
        aria-label={`${label} (data)`}
        value={date}
        required={Boolean(time)}
        onChange={(event) => { setDate(event.target.value); setTouched(true); }}
      />
      <input
        type="time"
        aria-label={`${label} (hora)`}
        value={time}
        onChange={(event) => { setTime(event.target.value); setTouched(true); }}
      />
      <input type="hidden" name={name} value={submitted} />
      <button
        className="datetime-clear"
        type="button"
        aria-label={`Limpar ${label}`}
        title="Limpar data e hora"
        tabIndex={date || time ? 0 : -1}
        style={{ visibility: date || time ? "visible" : "hidden" }}
        onClick={() => { setDate(""); setTime(""); setTouched(true); }}
      >
        ×
      </button>
      {showLegacyNotice && <small className="datetime-hint">Valor atual: {original}. Escolha uma data para substituir.</small>}
    </div>
  );
}
