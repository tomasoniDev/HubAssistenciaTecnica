// Início e fim do atendimento continuam gravados como texto ("dd/mm/aa" ou
// "dd/mm/aa - hh:mm"), o mesmo formato usado no PDF, no e-mail e no histórico.
// Estas funções convertem entre esse texto e os valores dos seletores nativos
// de data (aaaa-mm-dd) e hora (hh:mm).

export type ServiceDateTimeParts = {
  /** aaaa-mm-dd, ou vazio */
  date: string;
  /** hh:mm, ou vazio */
  time: string;
  /** Texto antigo que não segue o formato (ex.: "05/11"); preservado até o usuário escolher uma data. */
  legacy: string;
};

const SERVICE_DATE_TIME = /^(\d{2})\/(\d{2})\/(\d{2}|\d{4})(?:\s*-\s*(\d{2}):(\d{2}))?$/;

export function parseServiceDateTime(value?: string | null): ServiceDateTimeParts {
  const text = (value ?? "").trim();
  if (!text) return { date: "", time: "", legacy: "" };

  const match = SERVICE_DATE_TIME.exec(text);
  if (!match) return { date: "", time: "", legacy: text };

  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  const date = `${year}-${match[2]}-${match[1]}`;
  const valid = !Number.isNaN(Date.parse(`${date}T00:00:00`)) && new Date(`${date}T00:00:00`).getDate() === Number(match[1]);
  if (!valid) return { date: "", time: "", legacy: text };

  const hour = match[4] === undefined ? null : Number(match[4]);
  const minute = match[5] === undefined ? null : Number(match[5]);
  const time = hour !== null && minute !== null && hour < 24 && minute < 60 ? `${match[4]}:${match[5]}` : "";
  return { date, time, legacy: "" };
}

export function composeServiceDateTime(date: string, time: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return "";
  const base = `${match[3]}/${match[2]}/${match[1].slice(2)}`;
  return /^\d{2}:\d{2}$/.test(time) ? `${base} - ${time}` : base;
}
