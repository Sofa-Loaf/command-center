import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  title: string;
  body: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel = "Delete",
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    confirmRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="overlay" onMouseDown={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onMouseDown={(event) => event.stopPropagation()}
        style={{ width: "min(440px, 100%)" }}
      >
        <div className="modal-hd">
          <h2 id="confirm-title">{title}</h2>
        </div>
        <div className="modal-bd">
          <p style={{ margin: 0, color: "var(--text-muted)" }}>{body}</p>
        </div>
        <div className="modal-ft">
          <button className="btn" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={danger ? "btn btn-danger" : "btn btn-accent"}
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
