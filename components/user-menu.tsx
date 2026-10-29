"use client";

import { LogOutIcon, MoreIcon, PdfDownloadIcon } from "@/components/icons";
import { displayUserName, initialsFromEmail, remoteAccessStatusClass } from "@/lib/app-helpers";
import type { RemoteAccessStatus } from "@/lib/app-helpers";

type UserMenuProps = {
  /** "side": no rodapé do menu lateral. "top": ao lado dos ícones do cabeçalho (telas estreitas). */
  variant: "side" | "top";
  open: boolean;
  onToggle: () => void;
  email: string;
  name: string;
  role: string | null;
  canUseRemoteAccess: boolean;
  remoteAccessStatus: RemoteAccessStatus;
  onStatusChange: (status: RemoteAccessStatus) => void;
  canDownloadBackup: boolean;
  onBackup: () => void;
  onSignOut: () => void;
};

export function UserMenu({
  variant,
  open,
  onToggle,
  email,
  name,
  role,
  canUseRemoteAccess,
  remoteAccessStatus,
  onStatusChange,
  canDownloadBackup,
  onBackup,
  onSignOut
}: UserMenuProps) {
  return (
    <div className={`user-menu user-menu-${variant}`}>
      <button className="user-menu-trigger" type="button" onClick={onToggle} aria-expanded={open} aria-label={`Menu do usuário ${name || displayUserName(email)}`}>
        <span className="avatar">{initialsFromEmail(email)}</span>
        <span className="user-meta">
          <strong>{name || displayUserName(email)}</strong>
          <small>{role || "Usuário autorizado"}</small>
          {canUseRemoteAccess && (
            <span className="remote-status-line">
              <span className={`remote-status-dot ${remoteAccessStatusClass(remoteAccessStatus)}`} />
              {remoteAccessStatus}
            </span>
          )}
        </span>
        <MoreIcon />
      </button>
      {open && (
        <div className="user-menu-content">
          {canUseRemoteAccess && (
            <>
              <button type="button" onClick={() => onStatusChange("Online")}><span className="menu-status-dot online" /> Online</button>
              <button type="button" onClick={() => onStatusChange("Ocupado")}><span className="menu-status-dot busy" /> Ocupado</button>
              <button type="button" onClick={() => onStatusChange("Offline")}><span className="menu-status-dot offline" /> Offline</button>
            </>
          )}
          {canDownloadBackup && <button type="button" onClick={onBackup}><PdfDownloadIcon /> Backup SharePoint</button>}
          <button type="button" onClick={onSignOut}><LogOutIcon /> Sair</button>
        </div>
      )}
    </div>
  );
}
