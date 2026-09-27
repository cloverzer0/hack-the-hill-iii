"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import type { Breakdown } from "@/shared/breakdown";

export type BreakdownState = { status: "loading" } | { status: "ready"; breakdown: Breakdown } | { status: "error" };

// One request per page load, shared by every screen (receipt, category, detail).
let request: Promise<Breakdown> | null = null;

/**
 * Purpose:
 *	Fetch GET /api/breakdown once and reuse the same promise; a failed request is forgotten so the next call retries.
 *
 * Args:
 *	(none)
 *
 * Returns:
 *	Promise<Breakdown>: the 2024-25 breakdown from the database
 */
function loadBreakdown(): Promise<Breakdown> {
  request ??= apiFetch<Breakdown>("/api/breakdown").catch((error: unknown) => {
    request = null;
    throw error;
  });
  return request;
}

/**
 * Purpose:
 *	React hook giving a screen the spending breakdown (total federal spending and the biggest programs).
 *
 * Args:
 *	(none)
 *
 * Returns:
 *	BreakdownState: loading, ready with the breakdown, or error
 */
export function useBreakdown(): BreakdownState {
  const [state, setState] = useState<BreakdownState>({ status: "loading" });
  useEffect(() => {
    let live = true;
    loadBreakdown().then(
      (breakdown) => live && setState({ status: "ready", breakdown }),
      () => live && setState({ status: "error" }),
    );
    return () => {
      live = false;
    };
  }, []);
  return state;
}
