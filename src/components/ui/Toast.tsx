import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

type ToastType = 'success' | 'info' | 'warning';
interface Toast { id: string; message: string; type: ToastType }

interface ToastCtx {
  notify: (message: string, type?: ToastType) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, type: ToastType = 'success') => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const remove = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <Ctx.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2 sm:left-5 sm:translate-x-0 sm:items-start">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-slide-up flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-card-hover dark:border-neutral-700 dark:bg-neutral-800"
          >
            {t.type === 'success' && <CheckCircle2 className="h-5 w-5 shrink-0 text-success-500" />}
            {t.type === 'info' && <Info className="h-5 w-5 shrink-0 text-secondary-500" />}
            {t.type === 'warning' && <AlertTriangle className="h-5 w-5 shrink-0 text-warning-500" />}
            <span className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{t.message}</span>
            <button onClick={() => remove(t.id)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
