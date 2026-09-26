"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, apiFetch } from "@/lib/apiFetch";
import { normalizePostal } from "@/lib/mp/postal";
import { buildEmail, buildLetter, composeLinks } from "@/lib/mp/sponsorEmail";
import type { Mp } from "@/lib/mp/types";
import type { Draft } from "@/lib/petition";
import { LetterEditor } from "./LetterEditor";
import { MpCard } from "./MpCard";
import { MpSearch } from "./MpSearch";
import { SendOptions } from "./SendOptions";

const LOOKUP_ERRORS: Record<string, string> = {
  invalid_postal: "Enter a postal code like K1P 1A4.",
  not_found: "We couldn't find that postal code.",
};

export function SponsorStep({ draft }: { draft: Draft }) {
  const router = useRouter();
  const [mp, setMp] = useState<Mp | null>(draft.mp);
  // Set only when the MP was found from the user's own postal code, so the letter can say "constituent".
  const [postalCode, setPostalCode] = useState<string | null>(null);
  const [postalInput, setPostalInput] = useState("");
  const [finding, setFinding] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [letterOverride, setLetterOverride] = useState<string | null>(draft.sponsorEmail);
  const [saveError, setSaveError] = useState<string | null>(null);

  const patch = (body: object) =>
    apiFetch<Draft>(`/api/me/drafts/${draft.id}`, { method: "PATCH", body });

  async function chooseMp(next: Mp, fromPostal: string | null) {
    setMp(next);
    setPostalCode(fromPostal);
    setSearching(false);
    setSaveError(null);
    try {
      await patch({ mp: next });
    } catch {
      setSaveError("We couldn't save your MP choice. Try again.");
    }
  }

  async function find(event: FormEvent) {
    event.preventDefault();
    const code = normalizePostal(postalInput);
    if (!code) {
      setLookupError(LOOKUP_ERRORS.invalid_postal);
      return;
    }
    setFinding(true);
    setLookupError(null);
    try {
      await chooseMp(await apiFetch<Mp>(`/api/mp?postal=${code}`), code);
    } catch (error) {
      const code = error instanceof ApiError ? error.code : "";
      setLookupError(LOOKUP_ERRORS[code] ?? "Couldn't reach the MP directory. Try again.");
    } finally {
      setFinding(false);
    }
  }

  async function saveLetter(text: string | null) {
    setLetterOverride(text);
    try {
      await patch({ sponsorEmail: text });
    } catch {
      setSaveError("We couldn't save your letter. Try again.");
    }
  }

  function markSent() {
    patch({ sponsorRequested: true })
      .catch(() => {})
      .finally(() => router.push(`/petition/${draft.id}/submit`));
  }

  const letter = letterOverride ?? (mp ? buildLetter({ mp, title: draft.title, postalCode }) : "");
  const email = buildEmail({ letter, petition: draft });

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section>
        <h1 className="text-2xl font-semibold">Ask an MP to sponsor it</h1>
        <p className="mt-1 text-sm text-muted">
          Every House of Commons e-petition needs one Member of Parliament to authorize it. Any MP can, but your
          own is the usual first ask.
        </p>

        <form onSubmit={find} className="mt-6 flex gap-2">
          <input
            value={postalInput}
            onChange={(event) => setPostalInput(event.target.value)}
            placeholder="Postal code, e.g. K1P 1A4"
            aria-label="Postal code"
            className="flex-1 rounded-lg border border-line bg-paper px-3 py-2 text-sm"
          />
          <button type="submit" disabled={finding} className="rounded-lg border border-ink px-4 text-sm">
            {finding ? "Finding…" : "Find"}
          </button>
        </form>
        {lookupError && (
          <p className="mt-2 text-sm text-danger">
            {lookupError}{" "}
            {lookupError.includes("Try again") && (
              <button type="button" onClick={find} className="underline">
                Try again
              </button>
            )}
          </p>
        )}

        <div className="mt-6 space-y-3">
          {mp && <MpCard mp={mp} />}
          {searching ? (
            <MpSearch onPick={(picked) => chooseMp(picked, null)} />
          ) : (
            <button type="button" onClick={() => setSearching(true)} className="text-sm underline">
              Choose a different MP
            </button>
          )}
        </div>
      </section>

      <section className="space-y-4">
        {mp ? (
          <>
            <LetterEditor letter={letter} edited={letterOverride !== null} onSave={saveLetter} />
            <p className="rounded-xl bg-paper p-4 text-sm text-muted">
              Once your MP agrees, name them as sponsor when you submit on ourcommons.ca.
            </p>
            {mp.email ? (
              <SendOptions
                links={composeLinks({ to: mp.email, ...email })}
                emailText={`To: ${mp.email}\nSubject: ${email.subject}\n\n${email.body}`}
                continueHref={`/petition/${draft.id}/submit`}
                onSent={markSent}
              />
            ) : (
              <p className="text-sm text-danger">This MP has no public email address. Choose a different MP.</p>
            )}
          </>
        ) : (
          <p className="rounded-xl border border-dashed border-line p-6 text-sm text-muted">
            Find your MP to see the sponsorship request.
          </p>
        )}
        {saveError && <p className="text-sm text-danger">{saveError}</p>}
      </section>
    </div>
  );
}
