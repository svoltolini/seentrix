"use client";

import { createContext, useContext } from "react";

/**
 * Global open/close state for the "+ New Product" side sheet.
 *
 * Any affordance (topbar button, dashboard get-started step, empty-state CTA)
 * calls `useCreateProduct().open()` to reveal the sheet INSTANTLY via React
 * state — no route navigation, no query-param round-trip, so there's no
 * client-navigation jank before the sheet animates in. The `?new=product`
 * query param is still honoured for deep-links, but it's no longer on the
 * critical path for the common in-app open.
 */
export interface CreateProductContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const CreateProductContext =
  createContext<CreateProductContextValue | null>(null);

export function useCreateProduct(): CreateProductContextValue {
  const ctx = useContext(CreateProductContext);
  if (!ctx) {
    throw new Error(
      "useCreateProduct must be used inside <CreateProductSheet> — it is mounted in src/app/[locale]/app/layout.tsx.",
    );
  }
  return ctx;
}
