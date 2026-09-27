"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ApiError, apiFetch } from "@/lib/apiFetch";
import { CONSENT_TEXT, publishErrorFor, type PublishProblem } from "@/lib/campaigns/publish";
import { PETITION_OPENING } from "@/lib/campaigns/rules";
import type { Draft } from "@/lib/petition";

type Props = { draft: Draft; savedRiding: string | null };

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function PublishStep({ draft, savedRiding }: Props) {
  const router = useRouter();
  const [askPostal, setAskPostal] = useState(savedRiding === null);
  const [postalCode, setPostalCode] = useState("");
  const [consent, setConsent] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [problem, setProblem] = useState<PublishProblem | null>(null);
  const [textProblems, setTextProblems] = useState<string[]>([]);

  async function publish(event: FormEvent) {
    event.preventDefault();
    setPublishing(true);
    setProblem(null);
    setTextProblems([]);
    try {
      const { id } = await apiFetch<{ id: string }>("/api/campaigns", {
        method: "POST",
        body: {
          storyId: draft.storyId,
          title: draft.title,
          issue: draft.issue,
          request: draft.request,
          // Leaving the postal code out tells the API to use the saved riding.
          ...(askPostal ? { postalCode } : {}),
          consent: true,
        },
      });
      // The draft has done its job. If deleting it fails, publishing again only reopens this campaign.
      await apiFetch(`/api/me/drafts/${draft.id}`, { method: "DELETE" }).catch(() => null);
      router.push(`/petition/published/${id}`);
    } catch (error) {
      const code = error instanceof ApiError ? error.code : "";
      const details = error instanceof ApiError ? error.details : {};
      if (code === "already_started" && typeof details.campaignId === "string") {
        router.push(`/petition/published/${details.campaignId}?existing=1`);
        return;
      }
      const found = publishErrorFor(code);
      setProblem(found);
      setTextProblems(stringList(details.problems));
      if (found.askPostal) setAskPostal(true);
      setPublishing(false);
    }
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Publish your campaign</h1>
      <p className="mt-1 text-sm text-muted">
        Once it&rsquo;s published, anyone reading this story can join it. When it has enough support, our team asks an
        MP to sponsor it.
      </p>

      <article className="mt-6 rounded-xl border border-line bg-paper p-5 text-sm">
        <h2 className="text-lg font-semibold">{draft.title}</h2>
        <p className="mt-3 whitespace-pre-wrap">{draft.issue}</p>
        <p className="mt-3 whitespace-pre-wrap">{`${PETITION_OPENING} ${draft.request}`}</p>
        <Link href={`/petition/${draft.id}`} className="mt-4 inline-block text-accent underline">
          Edit
        </Link>
      </article>

      <form onSubmit={publish} className="mt-6 space-y-4">
        {askPostal ? (
          <label className="block text-sm font-semibold">
            Your postal code
            <input
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
              placeholder="K1P 1A4"
              autoComplete="postal-code"
              className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm font-normal"
            />
            <span className="mt-1 block text-xs font-normal text-muted">
              We use it to find your riding. We save the riding, never your postal code.
            </span>
          </label>
        ) : (
          <p className="text-sm">
            Your riding: <span className="font-medium">{savedRiding}</span>{" "}
            <button type="button" onClick={() => setAskPostal(true)} className="text-accent underline">
              Change
            </button>
          </p>
        )}

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-1"
          />
          <span>{CONSENT_TEXT}</span>
        </label>

        {problem && (
          <div role="alert" className="text-sm text-danger">
            <p>{problem.message}</p>
            {textProblems.length > 0 && (
              <ul className="mt-1 list-disc pl-5">
                {textProblems.map((text) => (
                  <li key={text}>{text}</li>
                ))}
              </ul>
            )}
            {problem.editText && (
              <Link href={`/petition/${draft.id}`} className="mt-1 inline-block underline">
                Edit your text
              </Link>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={!consent || publishing}
          className="w-full rounded-lg bg-ink px-4 py-3 text-sm font-medium text-paper disabled:opacity-60"
        >
          {publishing ? "Publishing…" : "Publish to the app"}
        </button>
      </form>
    </section>
  );
}
