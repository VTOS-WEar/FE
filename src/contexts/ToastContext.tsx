import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Notify } from "../components/ui/notify";

type Variant = "error" | "success" | "info";

interface ToastData {
  title: string;
  message: string;
  variant: Variant;
  durationMs?: number;
}

interface ToastContextValue {
  showToast: (data: ToastData) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastData | null>(null);

  const showToast = useCallback((data: ToastData) => {
    setToast(data);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Notify
        open={!!toast}
        title={toast?.title || ""}
        message={toast?.message}
        variant={toast?.variant}
        durationMs={toast?.durationMs ?? 5000}
        onClose={() => setToast(null)}
      />
    </ToastContext.Provider>
  );
}
