import { useStore } from "../state/store";

export function Toasts() {
  const { toasts, dismissToast } = useStore();
  if (toasts.length === 0) return null;
  return (
    <div className="toasts">
      {toasts.map((toast) => (
        <div className={`toast ${toast.tone === "warn" ? "warn" : ""}`} key={toast.id}>
          <span>{toast.message}</span>
          {toast.undo ? (
            <button
              type="button"
              onClick={() => {
                toast.undo?.();
                dismissToast(toast.id);
              }}
            >
              Undo
            </button>
          ) : (
            <button type="button" onClick={() => dismissToast(toast.id)}>
              Dismiss
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
