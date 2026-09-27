"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/apiFetch";

export function CampaignJoin({ campaignId, joined }: { campaignId: string; joined: boolean }) {
  const [isJoined, setIsJoined] = useState(joined);
  const [postal, setPostal] = useState("");
  const [riding, setRiding] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function find() { try { const mp = await apiFetch<{ riding: string }>(`/api/mp?postal=${encodeURIComponent(postal)}`); setRiding(mp.riding); setError(""); } catch { setError("Enter a valid Canadian postal code."); } }
  async function join() { if (!riding || !consent) { setError("Find your riding and give consent to join."); return; } setBusy(true); try { await apiFetch(`/api/campaigns/${campaignId}`, { method: "POST", body: { riding, consent } }); setIsJoined(true); } catch { setError("We couldn't join this campaign. Try again."); } finally { setBusy(false); } }
  if (isJoined) return <div className="campaign-card mt-6 p-5"><strong>You&apos;re a member</strong><p className="mt-1 text-sm text-[#716d64]">Your riding is represented in this campaign.</p></div>;
  return <div className="campaign-card mt-6 p-5"><h2 className="text-2xl">Join this campaign</h2><p className="mt-1 text-sm text-[#716d64]">Bring your riding into the conversation.</p><div className="mt-4 flex gap-2"><input className="campaign-input" placeholder="K1A 0B1" value={postal} onChange={(e) => setPostal(e.target.value.toUpperCase())} /><button type="button" className="rounded-sm border border-[#716d64] px-4 text-sm" onClick={find}>Find</button></div>{riding && <p className="mt-2 text-sm text-[#5d7661]">Your riding: {riding}</p>}<label className="mt-4 flex gap-3 text-sm"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" /> <span>Email me about this campaign, and share my name, email and riding with the MP we ask to sponsor it.</span></label>{error && <p role="alert" className="mt-3 text-sm text-[#b54834]">{error}</p>}<button className="campaign-primary mt-4" onClick={join} disabled={busy}>{busy ? "Joining…" : "Join campaign"}</button></div>;
}
