export function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function SaveIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v5h4" />
      <path d="m9 14 2 2 4-5" />
    </svg>
  );
}

export function PdfDownloadIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v5h4" />
      <path d="M12 10v6" />
      <path d="M9.5 13.5 12 16l2.5-2.5" />
      <path d="M9 19h6" />
    </svg>
  );
}

export function MoreIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="5" cy="12" r="1.5" fill="currentColor" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <circle cx="19" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 14h10l1-14" />
      <path d="M9 7V4h6v3" />
    </svg>
  );
}

export function EditIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z" />
    </svg>
  );
}

export function HelpIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.6 2.6 0 0 1 5 1.2c0 1.8-2.5 2.1-2.5 4" />
      <path d="M12 18h.01" />
    </svg>
  );
}

export type NavIconName = "home" | "overview" | "remote" | "schedule" | "registry" | "admin";

export const NAV_ICON_PATHS: Record<NavIconName, string[]> = {
  home: ["M3 11l9-8 9 8", "M5 10v10h14V10", "M10 20v-6h4v6"],
  overview: ["M4 4h6v6H4z", "M14 4h6v6h-6z", "M4 14h6v6H4z", "M14 14h6v6h-6z"],
  remote: ["M3 5h18v11H3z", "M8 20h8", "M12 16v4"],
  schedule: ["M4 6h16v14H4z", "M4 10h16", "M8 3v4", "M16 3v4"],
  registry: ["M5 4h14v16H5z", "M9 9h6", "M9 13h6", "M9 17h3"],
  admin: ["M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z", "M9 12l2 2 4-4"]
};

export function NavIcon({ name }: { name: NavIconName }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {NAV_ICON_PATHS[name].map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

export function SunIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

export function MoonIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M20 15.5A8.3 8.3 0 0 1 8.5 4 8.7 8.7 0 1 0 20 15.5z" />
    </svg>
  );
}

export function LogOutIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M21 3v18" />
    </svg>
  );
}

export function DetailIcon({ type }: { type: "client" | "location" | "serial" | "calendar" | "mechanical" | "software" | "remote" | "info" | "history" | "check" | "alert" | "mail" | "detail" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {type === "client" && <><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="7" r="4" /></>}
      {type === "location" && <><path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11Z" /><circle cx="12" cy="10" r="2.4" /></>}
      {type === "serial" && <><path d="M20 10 14 4 4 14l6 6 10-10Z" /><path d="m7.5 13.5 3 3" /></>}
      {type === "calendar" && <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></>}
      {type === "mechanical" && <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" /></>}
      {type === "software" && <><rect x="4" y="5" width="16" height="12" rx="2" /><path d="M8 21h8M12 17v4" /></>}
      {type === "remote" && <><path d="M5 13a10 10 0 0 1 14 0" /><path d="M8.5 16.5a5 5 0 0 1 7 0" /><path d="M12 20h.01" /></>}
      {type === "info" && <><circle cx="12" cy="12" r="9" /><path d="M12 10v6M12 7h.01" /></>}
      {type === "history" && <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>}
      {type === "check" && <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.6 2.6L16.5 9" /></>}
      {type === "alert" && <><circle cx="12" cy="12" r="9" /><path d="M8 8l8 8M16 8l-8 8" /></>}
      {type === "mail" && <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>}
      {type === "detail" && <><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></>}
    </svg>
  );
}
