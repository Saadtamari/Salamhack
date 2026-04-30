"use client";
import { useState, useCallback } from "react";

export interface Toast {
  id: number;
  message: string;
  type: string;
  title?: string;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type = "success", title = "") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type, title }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  return { toasts, toast };
}
