'use client';
import { createContext, useCallback, useContext, useState } from 'react';

export type ToastKind = 'success' | 'info' | 'error' | 'celebrate';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  durationMs?: number;
}

interface Ctx {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id'>) => void;
  celebrate: (message: string) => void;
}

const ToastCtx = createContext<Ctx | null>(null);

export function useToasts(): Ctx {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToasts must be used inside ToastProvider');
  return ctx;
}

let id = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const remove = useCallback((x: number) => {
    setToasts((t) => t.filter((y) => y.id !== x));
  }, []);
  const push = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const my = ++id;
      setToasts((arr) => [...arr, { ...t, id: my }]);
      setTimeout(() => remove(my), t.durationMs ?? 3500);
    },
    [remove]
  );
  const celebrate = useCallback(
    (message: string) => push({ kind: 'celebrate', message, durationMs: 2500 }),
    [push]
  );

  return (
    <ToastCtx.Provider value={{ toasts, push, celebrate }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-lg shadow-lg text-sm min-w-[240px] max-w-[360px] flex items-center gap-3 animate-slide-in ${
              t.kind === 'success'
                ? 'bg-emerald-600 text-white'
                : t.kind === 'error'
                  ? 'bg-red-600 text-white'
                  : t.kind === 'celebrate'
                    ? 'bg-gradient-to-r from-brand-600 to-emerald-500 text-white'
                    : 'bg-slate-800 text-white'
            }`}
          >
            <span className="text-lg">
              {t.kind === 'celebrate' ? '🎉' : t.kind === 'error' ? '⚠' : t.kind === 'success' ? '✓' : 'ℹ'}
            </span>
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
