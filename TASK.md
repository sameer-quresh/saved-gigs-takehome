# Take-Home Task: "Saved Gigs"

Build a small but **production-grade** full-stack feature: letting a user **save (bookmark) gigs** on a gig marketplace and view their saved list.

This document is the spec. [`CONVENTIONS.md`](CONVENTIONS.md) is how we grade the *quality* of what you build — read it first. Everything here is self-contained; you don't need any prior context.

---

## 1. The scenario

You're working on a marketplace where people post **gigs** (short jobs) and others browse and apply to them. Product wants a "Saved Gigs" feature so a user can bookmark gigs they're interested in, optionally sort them into a few named lists, and come back to them later.

You will build this **vertical slice end to end**: the shared contract, the database, the API, and the UI.

There is no existing codebase — you start from an empty repo and set up the workspace described in [`CONVENTIONS.md` §0](CONVENTIONS.md). You may scaffold the boilerplate however you like (including with AI); **setup is not where the points are** — the points are in the contract design, the edge cases, the error/loading states, and the conventions.

---

## 2. Data model

Create these tables with a hand-authored SQL migration plus a small seed script.

### `users` (seed ≥ 2)
| column | notes |
|---|---|
| `id` | PK |
| `name` | |
| `email` | unique |

Seed **at least two** users — you need a second user so "you can't save your own gig" is testable.

### `gigs` (seed ~15–20)
| column | notes |
|---|---|
| `id` | PK |
| `title` | |
| `description` | |
| `budget_amount` | integer (minor units or whole — your call, document it) |
| `mode` | enum: `online` \| `offline` |
| `status` | enum: `open` \| `closed` |
| `posted_by` | FK → `users.id` |
| `created_on`, `updated_on` | timestamps + trigger (see [`CONVENTIONS.md` §8](CONVENTIONS.md)) |

Seed a realistic spread: gigs posted by different users, a mix of `online`/`offline`, and **at least one `closed`** gig (needed for an edge case below).

### `saved_gigs` (the feature)
| column | notes |
|---|---|
| `id` | PK |
| `user_id` | FK → `users.id` |
| `gig_id` | FK → `gigs.id` |
| `list` | enum: `WATCHLIST` \| `APPLY_LATER` \| `SHORTLIST`, default `WATCHLIST` |
| `note` | nullable text, max 280 chars |
| `created_on`, `updated_on` | timestamps + trigger |
| | **`UNIQUE (user_id, gig_id)`** — a user saves a given gig at most once |

The `list` enum (and the gig `mode`/`status` enums) must follow the `const → type → label` pattern in [`CONVENTIONS.md` §6](CONVENTIONS.md), defined in `shared`, and be stored as a `VARCHAR` + `CHECK` constraint (see [`CONVENTIONS.md` §8](CONVENTIONS.md)) rather than a native Postgres `ENUM`.

---

## 3. The API

Three endpoints. Each must: validate input at the top of the controller against a **TypeBox** schema in `shared`; be guarded by a permission; return a typed response DTO from `shared`; and route all expected failures through `ErrorStatus` (see [`CONVENTIONS.md` §3–§5](CONVENTIONS.md)).

The "current user" comes from the auth stub (§5 below) — endpoints act on behalf of `req.user`.

### 3.1 `POST /api/gigs/:gigId/save` — save (or update) a saved gig
Body: `{ "list"?: SavedList, "note"?: string }`

Behaviour and **required** edge cases:

| Condition | Response |
|---|---|
| No / invalid bearer token | **401** |
| Authenticated but missing `Create:SavedGig` permission | **403** |
| `gigId` doesn't exist | **404** |
| The gig was posted by the current user (can't save your own gig) | **400** |
| The gig's `status` is `closed` | **400** |
| `list` is not a valid enum value, or `note` exceeds max length | **400** (validation) |
| Valid, and the user **hasn't** saved this gig before | **201** create the row |
| Valid, and the user **has already** saved this gig | **200** update `list`/`note` on the existing row — an **idempotent upsert**, not a duplicate row and not a 500 from the unique constraint |

> The last row is the crux of this endpoint. Because of the `UNIQUE (user_id, gig_id)` constraint, a naive "always INSERT" will throw on the second save. Handle it deliberately (an upsert, or a check-then-write in a transaction) and make sure two rapid saves can't create two rows. We will test this.

Response body: the saved gig as a DTO (`{ id, gig_id, list, note, created_on, ... }`).

### 3.2 `DELETE /api/gigs/:gigId/save` — unsave
- **401 / 403** as above (permission: `Delete:SavedGig`).
- **Idempotent**: unsaving a gig the user hasn't saved is a **success no-op** (e.g. `204`), **not** a `404`. Deleting twice behaves the same as deleting once.
- Unsaving a gig that doesn't exist at all: your call — pick one behaviour and justify it in `NOTES.md`.

### 3.3 `GET /api/saved-gigs?offset=&limit=&list=` — the user's saved list
- Permission: `Read:SavedGig`.
- Returns the **current user's** saved gigs only, **joined** to gig data, **newest first**.
- **Paginated** via `offset`/`limit` (enforce a max `limit`), and returns a **`total`** count for the whole filtered set (use a window function, not a second query — see [`CONVENTIONS.md` §7](CONVENTIONS.md)).
- Optional `list` filter (`?list=SHORTLIST` returns only that list).
- Each item includes the gig's current `status`, so the UI can mark gigs that have since been **closed**.

Response: `{ items: SavedGigItem[], total: number }`.

---

## 4. The frontend (Next.js App Router + Zustand)

Two pages. Both must implement the state requirements in [`CONVENTIONS.md` §9](CONVENTIONS.md) (loading, error, empty; 401 → sign out; 403 → access denied; errors surfaced via a toast/notification).

### 4.1 `/gigs` — browse gigs
- Lists the seeded **open** gigs (paginated or "load more" — your call).
- Each gig card has a **Save** control:
  - Opens a small form to pick a **`list`** and add an optional **`note`** (this is your schema-driven form — [`CONVENTIONS.md` §9](CONVENTIONS.md)).
  - Shows a **loading state** while the request is in flight.
  - On success, reflects that the gig is now saved; on failure, shows an **error toast**.
- The card should reflect whether the current user has already saved that gig.

### 4.2 `/saved` — my saved gigs
- Shows the current user's saved gigs from `GET /api/saved-gigs`.
- **Paginated**, with a **loading skeleton**, an **error state with retry**, and an **empty state** ("You haven't saved any gigs yet").
- A **filter** by `list`.
- An **unsave** action on each item (reflects immediately).
- Gigs whose `status` is now `closed` are visually marked.

Keep cross-page/shared state (current user, the active `list` filter, or an optimistic "saved set") in a **Zustand** store — not React Context, not prop-drilling.

---

## 5. Auth stub (keep it simple, keep the shape real)

Do **not** build real auth. Instead:

- A request authenticates with `Authorization: Bearer <token>` where the token maps to a seeded user (e.g. token `"user-1-token"` → user 1). A middleware reads the token, looks up the user, and populates `req.user = { id, permissions }`. The token-to-user mapping is yours to define (a constant map is fine) — the token *scheme* isn't graded; the middleware + guard *shape* is.
- Permissions are `'<Action>:<Resource>'` strings (see [`CONVENTIONS.md` §5](CONVENTIONS.md)), defined once as constants in `shared`. Seed each user with `Create:SavedGig`, `Read:SavedGig`, `Delete:SavedGig` so the happy paths work — but keep `allowPermission` real so a **missing token → 401** and a token **without** a permission → **403** both work. (You can demonstrate 403 with a test that strips a permission, or a second seeded token that lacks one.)
- The web app can hold the current user's token in env/config or a simple switcher; **don't hardcode it deep in components.** How the frontend "logs in" is up to you — a dev-only user switcher (e.g. a header dropdown that swaps the active token, or a `/dev/login` page) is fine.

The point: the **middleware + permission-guard shape** must be real (per [`CONVENTIONS.md` §5](CONVENTIONS.md)) even though the credential is a stub.

---

## 6. Tests

Write **backend tests** (e.g. Vitest) covering the rules that matter. At minimum:

- Save your own gig → 400.
- Save a closed gig → 400.
- Save a non-existent gig → 404.
- Save the same gig twice → one row, second call updates it (idempotent upsert).
- Delete is idempotent (deleting an unsaved gig succeeds).
- List is scoped to the current user, paginated, returns correct `total`, and respects the `list` filter.
- Missing token → 401; missing permission → 403.

Frontend tests are welcome but optional. We care more that the backend rules are proven than that you wire up a frontend test runner.

---

## 7. If you run low on time (prioritisation)

We don't expect every candidate to finish everything, and we explicitly want to see **how you prioritise**. If time is tight, build in this order and note what you cut (and why) in `NOTES.md`:

1. **The backend slice done correctly** — the contract in `shared`, the migration, all three endpoints with every edge case in §3, and the tests in §6. This is the core.
2. **The conventions** — the two registries, TypeBox (not Zod), validate-at-controller, the error funnel, the permission guard, the enum pattern. Correct-but-conventional beats more-but-sloppy.
3. **The frontend states** — `/saved` with real loading/error/empty states and `/gigs` with a working, error-handling save toggle.
4. **Stretch** (only if the above is solid) — see §8.

A smaller, correct, convention-clean submission scores **higher** than a large one littered with shortcuts.

---

## 8. Stretch goals (optional — differentiators, not requirements)

Pick zero or more, only after the core is solid. Each should be documented in `NOTES.md`.

- **Named collections**: let users create/rename/delete their own lists instead of the fixed enum.
- **Sort / search** on `/saved` (by saved date, by gig title).
- **Optimistic UI** on save/unsave with rollback on failure.
- **A DB index** supporting the list query, plus a short note on the query plan (`EXPLAIN`).
- **Rate-limiting** the save endpoint.
- A **mobile (React Native/Expo) screen** for the saved list instead of, or in addition to, the web page.

---

## 9. Acceptance checklist

Your submission is "done" when:

- [ ] `shared`, `backend`, `web` are a pnpm workspace; `npx tsc --noEmit` is clean in all three.
- [ ] Request schemas (TypeBox) **and** response DTOs both live in `shared`; nothing duplicated in an app.
- [ ] The migration creates all three tables with timestamps/trigger and the `UNIQUE (user_id, gig_id)` constraint; a seed populates users + gigs.
- [ ] All three endpoints exist, validate at the top, are permission-guarded, and handle **every** edge case in §3 (including the idempotent upsert).
- [ ] Backend tests in §6 pass.
- [ ] `/gigs` and `/saved` implement loading + error (+ empty) states; 401 signs out; 403 is access-denied; errors are surfaced to the user.
- [ ] No shortcuts per [`CONVENTIONS.md` §1](CONVENTIONS.md). No committed secrets; `.env.example` present.
- [ ] `README` explains how to run it; `NOTES.md` is filled in (see [`NOTES.template.md`](NOTES.template.md)).

See [`README.md`](README.md) for how to submit and what we're looking for overall.
