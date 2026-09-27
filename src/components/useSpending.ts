"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiFetch";
import type { Department, Story } from "@/lib/stories";

export type SpendingListState =
  | { status: "loading" }
  | { status: "ready"; stories: Story[]; departments: Department[]; department: string | null }
  | { status: "error"; department: string | null };

export type SpendingDetailState =
  | { status: "loading" }
  | { status: "ready"; story: Story; id: string }
  | { status: "error"; id: string };

export function useSpending(department: string | null): SpendingListState {
  const [state, setState] = useState<SpendingListState>({ status: "loading" });

  useEffect(() => {
    let live = true;
    const query = department ? `?department=${encodeURIComponent(department)}` : "";
    Promise.all([
      apiFetch<Story[]>(`/api/spending${query}`),
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
    apiFetch<Story>(`/api/spending/${encodeURIComponent(id)}`).then(
      (story) => live && setState({ status: "ready", story, id }),
      () => live && setState({ status: "error", id }),
    );
    return () => { live = false; };
  }, [id]);

  return state.status === "loading" || state.id === id ? state : { status: "loading" };
}
