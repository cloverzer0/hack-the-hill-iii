"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo, useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { hasWebAddress, wordCount } from "@/lib/campaignValidation";

const OPENING = "We, the undersigned, call upon the Government of Canada to";

export function CampaignForm({ storyId, storyTitle }: { storyId: string; storyTitle: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [issue, setIssue] = useState("Whereas ");
  const [request, setRequest] = useState("");
  const [postal, setPostal] = useState("");
  const [riding, setRiding] = useState("");
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const words = useMemo(() => wordCount(issue, request), [issue, request]);

  async function findRiding() {
    setError("");
    if (!/^[A-Z]\d[A-Z][ -]?\d[A-Z]\d$/i.test(postal.trim())) { setError("Enter a Canadian postal code, such as K1A 0B1."); return; }
    try {
      const mp = await apiFetch<{ riding: string }>(`/api/mp?postal=${encodeURIComponent(postal)}`);
      setRiding(mp.riding);
    } catch { setError("We couldn't find that postal code. Try again."); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (words > 250) return setError("The issue and request must be 250 words or fewer.");
    if (hasWebAddress(issue) || hasWebAddress(request)) return setError("Petitions can't include links.");
    if (!riding) return setError("Find your riding before starting the campaign.");
    if (!consent) return setError("Consent is required to join this campaign.");
    setSaving(true);
    try {
      const campaign = await apiFetch<{ id: string }>("/api/campaigns", { method: "POST", body: { storyId, title, issue, request, riding, consent } });
      router.push(`/campaigns/${campaign.id}`);
    } catch { setError("We couldn't save the campaign. Check the fields and try again."); setSaving(false); }
  }

  return <form className="campaign-form space-y-5" onSubmit={submit}>
    <Link href={`/decision/${storyId}`} className="inline-flex text-sm underline">← Back to story</Link>
    <div><p className="text-xs uppercase tracking-[.12em] text-[#716d64]">Start a campaign</p><h1 className="mt-2 text-4xl">Turn a spending story into a question.</h1><p className="mt-2 text-sm text-[#716d64]">Linked to: <strong className="text-[#201d19]">{storyTitle}</strong></p></div>
    <label className="block text-sm font-semibold">Title<input className="campaign-input mt-2" maxLength={250} value={title} onChange={(e) => setTitle(e.target.value)} /></label>
    <label className="block text-sm font-semibold">The issue<span className="mt-1 block text-xs font-normal text-[#716d64]">Facts only. Each point starts with “Whereas”.</span><textarea className="campaign-input mt-2 min-h-36" value={issue} onChange={(e) => setIssue(e.target.value)} /></label>
    <label className="block text-sm font-semibold">Requested action<span className="mt-1 block text-xs font-normal text-[#716d64]">{OPENING} …</span><textarea className="campaign-input mt-2 min-h-28" value={request} onChange={(e) => setRequest(e.target.value)} /></label>
    <div className="flex items-center justify-between text-xs text-[#716d64]"><span>{words} / 250 words</span>{(hasWebAddress(issue) || hasWebAddress(request)) && <span className="text-[#b54834]">Petitions can&apos;t include links</span>}</div>
    <div className="border-t border-[#d0c6b8] pt-5"><p className="text-sm font-semibold">Join as you start</p><p className="mt-1 text-xs text-[#716d64]">Your postal code finds your riding. We save only the riding, never the postal code.</p><div className="mt-3 flex gap-2"><input className="campaign-input" placeholder="K1A 0B1" value={postal} onChange={(e) => setPostal(e.target.value.toUpperCase())} /><button type="button" className="rounded-sm border border-[#716d64] px-4 text-sm" onClick={findRiding}>Find</button></div>{riding && <p className="mt-2 text-sm text-[#5d7661]">Your riding: {riding}</p>}</div>
    <label className="flex gap-3 text-sm"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" /> <span>Email me about this campaign, and share my name, email and riding with the MP we ask to sponsor it.</span></label>
    {error && <p role="alert" className="text-sm text-[#b54834]">{error}</p>}
    <button className="campaign-primary w-full" disabled={saving}>{saving ? "Saving…" : "Start campaign"}</button>
  </form>;
}
