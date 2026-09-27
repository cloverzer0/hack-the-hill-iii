"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import type { Campaign } from "@/lib/campaigns";

export function useCampaigns(storyId?: string) {
  const [state, setState] = useState<{ status: "loading" | "ready" | "error"; campaigns: Campaign[] }>({ status: "loading", campaigns: [] });
  useEffect(() => {
    let stale = false;
    apiFetch<Campaign[]>(`/api/campaigns${storyId ? `?story=${encodeURIComponent(storyId)}` : ""}`).then((campaigns) => { if (!stale) setState({ status: "ready", campaigns }); }).catch(() => { if (!stale) setState({ status: "error", campaigns: [] }); });
    return () => { stale = true; };
  }, [storyId]);
  return state;
}
