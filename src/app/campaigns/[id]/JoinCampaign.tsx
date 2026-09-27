"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, apiFetch } from "@/lib/apiFetch";

function messageFor(error: unknown): string {
  const code = error instanceof ApiError ? error.code : "";
  if (code === "invalid_postal") return "Enter a postal code like K1P 1A4.";
  if (code === "riding_required") return "Enter your postal code so we can find your riding.";
  if (code === "riding_not_found") return "We couldn't find that postal code.";
  if (code === "lookup_failed") return "Couldn't reach the MP directory. Try again in a minute.";
  return "We couldn't join this campaign. Try again.";
}

export function JoinCampaign({ id }: { id: string }) {
  const router = useRouter();
  const [postalCode, setPostalCode] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/api/campaigns/${id}/members`, {
        method: "POST",
        body: { ...(postalCode.trim() ? { postalCode: postalCode.trim() } : {}), consent: true },
      });
      router.refresh();
    } catch (caught) {
      setError(messageFor(caught));
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 rounded-xl border border-line bg-paper p-5">
      <h2 className="font-semibold">Join this campaign</h2>
      <label className="mt-4 block">
        <span className="text-sm font-medium">Postal code</span>
        <span className="mt-1 block text-xs text-muted">Used to identify your riding for the MP we ask to sponsor this campaign. Only your riding is saved.</span>
        <input
          value={postalCode}
          onChange={(event) => setPostalCode(event.target.value)}
          placeholder="K1P 1A4"
          autoComplete="postal-code"
          className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"
        />
      </label>
      <label className="mt-4 flex gap-2 text-sm">
        <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
        <span>Email me about this campaign, and share my name, email and riding with the MP we ask to sponsor it.</span>
      </label>
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={busy || !consent}
        className="mt-5 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-60"
      >
        {busy ? "Joining…" : "Join campaign"}
      </button>
    </form>
  );
}
