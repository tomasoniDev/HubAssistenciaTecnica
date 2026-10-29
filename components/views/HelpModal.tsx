"use client";

import type { Dispatch, SetStateAction } from "react";
import { RegistryTab, View, helpSections, helpText } from "@/lib/app-helpers";

export type HelpModalProps = {
  helpOpen: boolean;
  registryTab: RegistryTab;
  setHelpOpen: Dispatch<SetStateAction<boolean>>;
  view: View;
};

export function HelpModal({
  helpOpen,
  registryTab,
  setHelpOpen,
  view
}: HelpModalProps) {
  return (
    <>
        {helpOpen && (
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="help-modal-title" onClick={() => setHelpOpen(false)}>
            <section className="modal-card help-card" onClick={(event) => event.stopPropagation()}>
              <div className="section-header">
                <div>
                  <p className="eyebrow">Ajuda</p>
                  <h2 id="help-modal-title">Como usar esta tela</h2>
                </div>
                <button className="button ghost" type="button" onClick={() => setHelpOpen(false)}>Fechar</button>
              </div>
              <p>{helpText(view, registryTab)}</p>
              <div className="help-topic-list">
                {helpSections(view, registryTab).map(([title, body]) => (
                  <article key={title}>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
    </>
  );
}
