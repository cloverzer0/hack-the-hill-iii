"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { checkCampaignText, MAX_TITLE_CHARS, PETITION_OPENING } from "@/lib/campaigns/rules";
import type { Draft } from "@/lib/petition";

type Field = "title" | "issue" | "request";
type Props = { story: { id: string; title: string }; draft?: Draft };

const inputClass =
  "mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm focus:border-ink focus:outline-none";

export function PetitionForm({ story, draft }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<Field, string>>({
    title: draft?.title ?? "",
    issue: draft?.issue ?? "Whereas ",
    request: draft?.request ?? "",
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // The same House of Commons rules the campaigns API applies, so publishing can't fail on the text.
  const { words, maxWords, problems } = checkCampaignText(values);

  const set = (field: Field) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (problems.length > 0) return;

    setSaving(true);
    setSaveError(null);
    try {
      const saved = draft
        ? await apiFetch<Draft>(`/api/me/drafts/${draft.id}`, { method: "PATCH", body: values })
        : await apiFetch<Draft>("/api/me/drafts", {
            method: "POST",
            body: { storyId: story.id, storyTitle: story.title, ...values },
          });
      router.push(`/petition/${saved.id}/publish`);
    } catch {
      setSaveError("We couldn't save your draft. Try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <h1 className="text-2xl font-semibold">Start a campaign</h1>
      <p className="mt-1 text-sm text-muted">
        Linked to: <span className="font-medium text-ink">{story.title}</span>
      </p>

      <label className="mt-6 block">
        <span className="text-sm font-semibold">Title</span>
        <input className={inputClass} value={values.title} onChange={set("title")} />
      </label>
      <p className="mt-1 text-right text-xs text-muted">{`${values.title.length} / ${MAX_TITLE_CHARS}`}</p>

      <label className="mt-4 block">
        <span className="text-sm font-semibold">The issue</span>
        <span className="block text-xs text-muted">
          State facts, not opinions. Each point starts with &ldquo;Whereas&rdquo;.
        </span>
        <textarea className={`${inputClass} min-h-32`} value={values.issue} onChange={set("issue")} />
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-semibold">Requested action</span>
        <span className="block text-xs text-muted">{`${PETITION_OPENING}…`}</span>
        <textarea className={`${inputClass} min-h-24`} value={values.request} onChange={set("request")} />
      </label>

      <p className={`mt-2 text-right text-xs ${words > maxWords ? "text-danger" : "text-muted"}`}>
        {`${words} / ${maxWords} words`}
      </p>
      {problems.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-danger">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}

      {saveError && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {saveError}
        </p>
      )}
      <button
        type="submit"
        disabled={saving || problems.length > 0}
        className="mt-6 w-full rounded-lg bg-ink px-4 py-3 text-sm font-medium text-paper disabled:opacity-60"
      >
        {saving ? "Saving…" : "Next: publish to the app"}
      </button>
    </form>
  );
}
