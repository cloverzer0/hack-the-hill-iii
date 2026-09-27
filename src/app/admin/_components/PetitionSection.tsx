"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { ApiError, apiFetch } from "@/lib/apiFetch";
import type { CampaignDetail } from "@/lib/campaigns/campaigns";
import { SIGNATURES_NEEDED } from "@/lib/campaigns/rules";
import { formatDate, formatDateTime } from "../format";
import { attachErrorFor, attachMessage, PETITION_STATUS_LABELS, syncSummary, type AttachSync } from "./petitionMessages";

type Props = { campaign: CampaignDetail };
type AttachResult = { sync: AttachSync; campaign: CampaignDetail };
type SyncResult = { synced: number; notFound: number; failed: number };

const inputClass = "mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm font-normal";

export function PetitionSection({ campaign }: Props) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const petition = campaign.petition;
  const [number, setNumber] = useState(petition?.number ?? "");
  const [title, setTitle] = useState(petition?.title ?? campaign.title);
  const [url, setUrl] = useState(petition?.url ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function attach(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const result = await apiFetch<AttachResult>(`/api/admin/campaigns/${campaign.id}/petition`, {
        method: "PUT",
        body: { number, title },
      });
      setMessage(attachMessage(result.sync, result.campaign.petition?.number ?? number.trim()));
      startRefresh(() => router.refresh());
    } catch (caught) {
      setError(attachErrorFor(caught instanceof ApiError ? caught.code : ""));
    } finally {
      setBusy(false);
    }
  }

  async function refreshAll() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      setMessage(syncSummary(await apiFetch<SyncResult>("/api/admin/petitions/sync", { method: "POST" })));
      startRefresh(() => router.refresh());
    } catch {
      setError("Couldn't reach ourcommons.ca. Try again later.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!petition) return;
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      await apiFetch(`/api/petitions/${encodeURIComponent(petition.number)}`, { method: "DELETE" });
      startRefresh(() => router.refresh());
    } catch {
      setError("Couldn't remove that petition. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const sponsor = petition?.sponsorName
    ? `${petition.sponsorName}${petition.sponsorRiding ? ` (${petition.sponsorRiding})` : ""}`
    : "—";

  return (
    <section>
      <h2 className="text-lg font-semibold">Official petition</h2>
      {petition ? (
        <div className="mt-3 rounded-xl border border-line bg-paper p-4 text-sm">
          <a href={petition.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
            {`${petition.number}: ${petition.title}`}
          </a>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <Row label="Status" value={PETITION_STATUS_LABELS[petition.status]} />
            <Row label="Signatures" value={`${petition.signatures.toLocaleString("en-CA")} of ${SIGNATURES_NEEDED}`} />
            <Row label="Sponsor" value={sponsor} />
            <Row label="Opened" value={formatDate(petition.openedAt)} />
            <Row label="Closes" value={formatDate(petition.closesAt)} />
            <Row label="Presented" value={formatDate(petition.presentedAt)} />
            <Row label="Government response" value={formatDate(petition.responseTabledAt)} />
            <Row label="Last updated" value={formatDateTime(petition.syncedAt)} />
          </dl>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted">
          After a team member creates the petition on ourcommons.ca, attach its number here.
        </p>
      )}

      <form onSubmit={attach} className="mt-4 grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
        <label className="text-sm font-semibold">
          Number
          <input value={number} onChange={(event) => setNumber(event.target.value)} placeholder="e-7203" className={inputClass} />
        </label>
        <label className="text-sm font-semibold">
          Title on ourcommons.ca
          <input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} />
        </label>
        <label className="text-sm font-semibold">
          Official URL
          <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.ourcommons.ca/..." className={inputClass} />
        </label>
        <button
          type="submit"
          disabled={busy || refreshing}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-60"
        >
          {petition ? "Replace" : "Attach"}
        </button>
      </form>
      <button
        type="button"
        onClick={refreshAll}
        disabled={busy || refreshing}
        className="mt-3 text-sm underline disabled:opacity-60"
      >
        Refresh from ourcommons.ca
      </button>
      {petition && <button type="button" onClick={remove} disabled={busy || refreshing} className="ml-4 mt-3 text-sm text-danger underline disabled:opacity-60">Remove petition</button>}
      {message && <p className="mt-2 text-sm">{message}</p>}
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
