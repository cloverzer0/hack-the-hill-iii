"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { apiFetch } from "@/lib/apiFetch";
import { LIMITS, REQUEST_PREFIX, type Draft } from "@/lib/petition";

type Field = "title" | "issue" | "request";
type Props = { story: { id: string; title: string }; draft?: Draft };

const inputClass =
  "mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm focus:border-ink focus:outline-none";

function validate(values: Record<Field, string>): Partial<Record<Field, string>> {
  const errors: Partial<Record<Field, string>> = {};
  for (const field of ["title", "issue", "request"] as const) {
    const value = values[field].trim();
    if (!value || (field === "issue" && value === "Whereas")) {
      errors[field] = "This is required.";
    } else if (value.length > LIMITS[field]) {
      errors[field] = `Keep this under ${LIMITS[field]} characters.`;
    }
  }
  return errors;
}

export function PetitionForm({ story, draft }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<Record<Field, string>>({
    title: draft?.title ?? "",
    issue: draft?.issue ?? "Whereas ",
    request: draft?.request ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (field: Field) => (event: { target: { value: string } }) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSaving(true);
    setSaveError(null);
    try {
      const saved = draft
        ? await apiFetch<Draft>(`/api/me/drafts/${draft.id}`, { method: "PATCH", body: values })
        : await apiFetch<Draft>("/api/me/drafts", {
            method: "POST",
            body: { storyId: story.id, storyTitle: story.title, ...values },
          });
      router.push(`/petition/${saved.id}/sponsor`);
    } catch {
      setSaveError("We couldn't save your draft. Try again.");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="petition-form">
      <h1 className="petition-form-title text-2xl font-semibold">Write your petition</h1>
      <p className="petition-form-subtitle mt-1 text-sm text-muted">
        Linked to: <span className="font-medium text-ink">{story.title}</span>
      </p>

      <label className="mt-6 block">
        <span className="text-sm font-semibold">Title</span>
        <input id="petition-title" name="title" className={`${inputClass} petition-input`} value={values.title} onChange={set("title")} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "petition-title-error" : undefined} />
      </label>
      <div className="mt-1 flex justify-between text-xs">
        <span id="petition-title-error" className="text-danger" role={errors.title ? "alert" : undefined}>{errors.title}</span>
        <span className="text-muted">
          {values.title.length} / {LIMITS.title}
        </span>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-semibold">The issue</span>
        <span id="petition-issue-help" className="block text-xs text-muted">
          State facts, not opinions. Each point starts with &ldquo;Whereas&rdquo;.
        </span>
        <textarea id="petition-issue" name="issue" className={`${inputClass} petition-input min-h-32`} value={values.issue} onChange={set("issue")} aria-invalid={Boolean(errors.issue)} aria-describedby={errors.issue ? "petition-issue-error" : "petition-issue-help"} />
      </label>
      <p id="petition-issue-error" className="mt-1 text-xs text-danger" role={errors.issue ? "alert" : undefined}>{errors.issue}</p>

      <label className="mt-4 block">
        <span className="text-sm font-semibold">Requested action</span>
        <span id="petition-request-help" className="block text-xs text-muted">{REQUEST_PREFIX}…</span>
        <textarea id="petition-request" name="request" className={`${inputClass} petition-input min-h-24`} value={values.request} onChange={set("request")} aria-invalid={Boolean(errors.request)} aria-describedby={errors.request ? "petition-request-error" : "petition-request-help"} />
      </label>
      <p id="petition-request-error" className="mt-1 text-xs text-danger" role={errors.request ? "alert" : undefined}>{errors.request}</p>

      {saveError && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {saveError}
        </p>
      )}
      <button
        type="submit"
        disabled={saving}
        className="petition-primary-action mt-6 w-full rounded-lg px-4 py-3 text-sm font-medium disabled:opacity-60"
      >
        {saving ? "Saving…" : "Next: find an MP sponsor"}
      </button>
    </form>
  );
}
