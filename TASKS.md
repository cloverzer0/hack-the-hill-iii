# Izu's Work Brief — Tally UI

This is the implementation brief for Izu's frontend work on the Hack the Hill III MVP. An agent working on this repo should read this file before changing UI code.

## Product context

Tally helps a Canadian taxpayer understand where their federal income tax goes and take civic action. A user:

1. Enters income and province.
2. Sees their estimated federal tax and how it maps to federal programs.
3. Browses real federal spending stories and their personal share of each item.
4. Opens a matching House of Commons e-petition, or drafts a new petition and emails their MP to sponsor it.

The MVP has six screens:

- Screen 01 — income and province onboarding
- Screen 02 — tax overview / spending breakdown
- Screen 03 — spending feed
- Screen 04 — spending story detail
- Screen 05 — start-a-petition form
- Screen 06 — find MP and prepare sponsor email

Izu owns the UI for all six screens. Raphael owns tax/data/API work, Great owns stories and petition matching, and Muktar owns Auth0, MP lookup, sponsor email, draft persistence, deployment, and the demo.

## Non-negotiable product rules

- Screens 01–04 work without login. Ask for Auth0 login only when the user starts or saves a petition draft.
- Income never leaves the device. Tax calculation runs on the client and income is stored locally.
- Only federal spending items get a petition action card.
- “Join petition” opens the official House of Commons petition page. The app does not collect signatures or submit petitions.
- “Start a petition” creates a draft and prepares an email to the user's MP.
- Wireframe values, dates, and labels are placeholders. Use real API/data values once available.
- Every displayed spending number should have an official source available in the UI.
- Keep the tone neutral and factual. Do not label spending “suspicious” or make partisan claims.

## Shared spending-item contract

Build feed and detail components against this shape. The API and story pipeline are expected to produce it:

```ts
type SpendingItem = {
  id: string;
  title: string;
  summary: string;
  amount: number;
  date: string; // ISO date, e.g. 2025-03-31
  fiscal_year: string; // e.g. 2024-25
  department: string;
  dept_code: string;
  program_code: string;
  source_type: "data" | "news";
  level: "federal";
  sources: { label: string; url: string }[];
  image_url: string;
  petition: {
    number: string;
    title: string;
    signatures: number;
    closes: string;
    url: string;
  } | null;
};
```

API dependencies:

- `GET /breakdown` → top seven programs plus `All other programs`, with `{ name, amount, percent }`.
- `GET /spending?department=` → feed items.
- `GET /spending/:id` → one item for the detail page.
- `GET /departments` → filter-chip options.
- Muktar will provide `GET /mp?postal=` and draft endpoints for Screen 06.

## Personal-share calculation

Use the same formula everywhere a spending item is shown:

```text
your share = your federal tax × (item amount ÷ total federal spending for that year)
```

Raphael owns the authoritative tax result and total-spending value. Do not invent a second formula in the UI. During Phase 1, use clearly marked mock values.

The data year `2024` represents April 2024–March 2025 and must be displayed as `2024–25`.

## Work branches

Create or use one branch per UI task:

- `ui/onboarding-overview`
- `ui/feed-detail`
- `ui/petition-flow`

Merge each completed phase through a PR into `main`. Keep changes scoped to the relevant UI task and avoid modifying other teammates' data, story, or platform work.

## Task 1 — Onboarding and tax overview

Branch: `ui/onboarding-overview`

### Phase 1 — UI with mock data

- Inspect the wireframe/design file and establish frontend design tokens: colors, typography, spacing, radii, buttons, cards, and responsive layout.
- Build Screen 01: income input, automatic currency formatting, province dropdown, and sensible default province from locale when available.
- Build Screen 02 using mock tax and breakdown values.
- Add navigation from Screen 01 to Screen 02 and a clear way to continue or edit.

### Phase 2 — Connect real data

- Save income and province locally on the device.
- Plug in Raphael's client tax-calculator result.
- Call `GET /breakdown` and render the seven largest programs plus “All other programs” as a horizontal bar list.
- Keep tax numbers and spending numbers formatted consistently as Canadian dollars.

### Phase 3 — Quality states

- Add an “Edit” path back to Screen 01.
- Add a “How we calculate” link/content entry point.
- Implement loading, empty, and error states for breakdown data.
- Check the layout at 390px width and common mobile sizes.

## Task 2 — Spending feed and detail

Branch: `ui/feed-detail`

### Phase 1 — Mock feed

- Create approximately five mock items in the shared `SpendingItem` shape.
- Build Screen 03 feed cards with title, summary, amount, date/fiscal year, department, source indicator, and personal share where available.
- Build department filter chips from mock departments.
- Add the bottom tab/navigation bar.
- Build Screen 04 detail page from mock data.

### Phase 2 — Connect real data

- Replace mock feed data with `GET /spending?department=`.
- Load details with `GET /spending/:id`.
- Show the user's personal share using the shared formula.
- Keep the detail page in this order:
  1. facts and headline
  2. “How this relates to you” personal-share section
  3. sources
  4. petition/action card

### Phase 3 — Action and resilience states

- For an open petition: show signatures/progress, “Join” linking to `ourcommons.ca`, and “Start different”.
- For no matching petition: show “Start a petition” only.
- Add empty feed state, failed request state, and image fallback.
- Verify that external petition links have the correct destination and that federal-only petition rules are respected.

## Task 3 — Petition flow

Branch: `ui/petition-flow`

### Phase 1 — Form and sample MP

- Build Screen 05 petition form:
  - title field with 250-character counter
  - issue field with a “Whereas” helper
  - requested-action field
  - six-step explainer beneath the form
- Build Screen 06 with postal-code input, Find button, sample MP card, and editable email-template layout.

### Phase 2 — Connect platform APIs

- Connect to Muktar's `GET /mp?postal=` endpoint.
- Connect to the draft endpoints when available.
- Show step progress, including “1 of 3” and “2 of 3”.
- Keep the sponsorship email editable before hand-off.

### Phase 3 — Complete the flow

- Prompt for login only when the user taps “Start a petition” or saves a draft.
- Add the step-three hand-off screen.
- Add validation for missing/invalid title, issue, requested action, and postal code.
- Complete a final visual pass across all six screens.

## UI acceptance checklist

Before handing off a phase, verify:

- The app starts and the intended route is reachable.
- The layout works at mobile width, especially 390px.
- Loading, empty, error, and success states do not leave blank screens.
- Currency, percentages, dates, and signature counts are readable and consistently formatted.
- Keyboard focus, labels, and button states are usable.
- External links have the correct destination.
- Screens 01–04 do not trigger login.
- Mock data is visibly replaceable and matches the shared contract.
- No UI text contradicts the product rules.

## Dependencies and coordination

- Raphael: tax result, breakdown response, total-spending value, and spending APIs.
- Great: story records and petition matches.
- Muktar: Auth0 trigger, MP lookup, draft endpoints, sponsor-email behavior, and deployed environment.
- Confirm shared field names before wiring a real endpoint. If an API is not ready, use a typed adapter/mock rather than spreading temporary assumptions through components.

## Priority if time is limited

1. Screens 01–04, including tax breakdown, feed, detail, and personal share.
2. MP lookup and sponsor-email UI integration.
3. Petition form polish and visual consistency.
4. Stretch features only after the core path works.

Do not spend MVP time on petition tracking, signature trend charts, provincial spending, or milestone notifications.

## Definition of done

Izu's work is complete when a user can enter income and province, view their tax breakdown, browse and filter spending stories, open a story with their personal share and sources, and move into a validated petition draft flow that hands off cleanly to the platform/API work.
