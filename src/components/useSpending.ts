"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import type { StoryWithCampaigns } from "@/lib/campaigns/campaigns";
import type { Department } from "@/lib/stories";

export type SpendingListState =
  | { status: "loading" }
  | { status: "ready"; stories: StoryWithCampaigns[]; departments: Department[]; department: string | null }
  | { status: "error"; department: string | null };

export type SpendingDetailState =
  | { status: "loading" }
  | { status: "ready"; story: StoryWithCampaigns; id: string }
  | { status: "error"; id: string };

export function useSpending(department: string | null): SpendingListState {
  const [state, setState] = useState<SpendingListState>({ status: "loading" });

  useEffect(() => {
    let live = true;
    const query = department ? `?department=${encodeURIComponent(department)}` : "";
    Promise.all([
      apiFetch<StoryWithCampaigns[]>(`/api/spending${query}`),
      apiFetch<Department[]>("/api/departments"),
    ]).then(
      ([stories, departments]) => live && setState({ status: "ready", stories, departments, department }),
      () => live && setState({ status: "error", department }),
    );
    return () => { live = false; };
  }, [department]);

  return state.status === "loading" || state.department === department ? state : { status: "loading" };
}

export function useSpendingDetail(id: string): SpendingDetailState {
  const [state, setState] = useState<SpendingDetailState>({ status: "loading" });

  useEffect(() => {
    let live = true;
    apiFetch<StoryWithCampaigns>(`/api/spending/${encodeURIComponent(id)}`).then(
      (story) => live && setState({ status: "ready", story, id }),
      () => live && setState({ status: "error", id }),
    );
    return () => { live = false; };
  }, [id]);

  return state.status === "loading" || state.id === id ? state : { status: "loading" };
}
