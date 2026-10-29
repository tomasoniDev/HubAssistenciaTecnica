"use client";


export type ConfirmDialogProps = {
  answerConfirm: (accepted: boolean) => void;
  confirmDialog: { title: string; message: string; confirmLabel: string; destructive: boolean; } | null;
};

export function ConfirmDialog({
  answerConfirm,
  confirmDialog
}: ConfirmDialogProps) {
  return (
    <>
        {confirmDialog && (
          <div className="modal-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-message" onClick={() => answerConfirm(false)}>
            <div className="modal-card confirm-card" onClick={(event) => event.stopPropagation()}>
              <h2 id="confirm-dialog-title">{confirmDialog.title}</h2>
              <p id="confirm-dialog-message">{confirmDialog.message}</p>
              <div className="modal-actions">
                <button className="button ghost" type="button" onClick={() => answerConfirm(false)}>Cancelar</button>
                <button className={confirmDialog.destructive ? "button danger-button" : "button primary"} type="button" autoFocus onClick={() => answerConfirm(true)}>{confirmDialog.confirmLabel}</button>
              </div>
            </div>
          </div>
        )}
    </>
  );
}
