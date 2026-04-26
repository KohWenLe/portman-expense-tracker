import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { CheckCircle2, XCircle } from "lucide-react";

type ToastKind = "success" | "error";
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastCtx {
  toast: (kind: ToastKind, message: string) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((kind: ToastKind, message: string) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((i) => i.id !== id));
    }, 3000);
  }, []);

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2">
        {items.map((i) => (
          <div
            key={i.id}
            className={`pointer-events-auto flex items-center gap-2 rounded-lg px-4 py-3 text-sm shadow-lg ring-1 ${
              i.kind === "success"
                ? "bg-emerald-50 text-emerald-800 ring-emerald-600/20"
                : "bg-red-50 text-red-800 ring-red-600/20"
            }`}
          >
            {i.kind === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0" />
            )}
            {i.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast must be used inside ToastProvider");
  return v.toast;
}
