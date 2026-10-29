"use client";

import type { Dispatch, SetStateAction } from "react";
import { displayUserName } from "@/lib/app-helpers";
import { FormEvent } from "react";

export type ProfileModalProps = {
  currentUserEmail: string;
  profileModalOpen: boolean;
  profileName: string;
  saveUserProfile: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  setProfileModalOpen: Dispatch<SetStateAction<boolean>>;
  setProfileName: Dispatch<SetStateAction<string>>;
};

export function ProfileModal({
  currentUserEmail,
  profileModalOpen,
  profileName,
  saveUserProfile,
  setProfileModalOpen,
  setProfileName
}: ProfileModalProps) {
  return (
    <>
        {profileModalOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title" onClick={() => setProfileModalOpen(false)}>
            <form className="modal-card profile-card" onSubmit={saveUserProfile} onClick={(event) => event.stopPropagation()}>
              <div className="section-header">
                <div>
                  <p className="eyebrow">Usuário</p>
                  <h2 id="profile-modal-title">Editar Usuário</h2>
                </div>
                <button className="button ghost" type="button" onClick={() => setProfileModalOpen(false)}>Fechar</button>
              </div>
              <div className="fields-grid">
                <label className="wide">Nome exibido<input value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder={displayUserName(currentUserEmail)} autoFocus /></label>
                <label className="wide">E-mail corporativo<input value={currentUserEmail} readOnly /></label>
              </div>
              <div className="modal-actions">
                <button className="button ghost" type="button" onClick={() => setProfileModalOpen(false)}>Cancelar</button>
                <button className="button primary" type="submit">Salvar</button>
              </div>
            </form>
          </div>
        )}
    </>
  );
}
