// Copy for the "Publish to the app" step. No server code here, so the client component can import it.

/** The consent checkbox, word for word as docs/campaigns-api.md gives it. */
export const CONSENT_TEXT =
  "Email me about this campaign, and share my name, email and riding with the MP we ask to sponsor it.";

export type PublishProblem = {
  message: string;
  /** Show the postal code field so the user can enter or fix it. */
  askPostal: boolean;
  /** The text itself has to change: link back to step 1. */
  editText: boolean;
};

const PROBLEMS: Record<string, PublishProblem> = {
  invalid_postal: { message: "Enter a postal code like K1P 1A4.", askPostal: true, editText: false },
  riding_not_found: { message: "We couldn't find a riding for that postal code.", askPostal: true, editText: false },
  riding_required: { message: "Enter your postal code so we can find your riding.", askPostal: true, editText: false },
  lookup_failed: { message: "Couldn't reach the riding lookup. Try again.", askPostal: false, editText: false },
  invalid_text: { message: "Your text doesn't follow the House of Commons rules yet:", askPostal: false, editText: true },
  story_not_found: { message: "That story is no longer available.", askPostal: false, editText: false },
};

/** What to tell the user when POST /api/campaigns fails with this error code. */
export function publishErrorFor(code: string): PublishProblem {
  return PROBLEMS[code] ?? { message: "We couldn't publish your campaign. Try again.", askPostal: false, editText: false };
}
