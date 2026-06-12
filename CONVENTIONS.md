# Engineering Conventions

**Read this before you write any code. We grade against it.**

These are the standards we hold our production codebase to. They are deliberately strict. We are not testing whether you can make something work once — we are testing whether you write code a team can maintain for years. Most of these rules are also exactly the things AI coding tools get wrong by default, so following them is partly a test of whether you *review and steer* the AI rather than paste what it gives you.

You may (and should) use AI tools. A good move is to give your AI assistant this file as context so its output matches our house style. The submissions that score well are the ones where the conventions below are visibly respected throughout — not just in the first file.

If a rule here is genuinely impractical for something you hit, **don't silently break it** — note the tension in `NOTES.md` and explain your call. Documented judgment beats a silent shortcut every time.

---

## 0. Project shape

Build a small **pnpm workspace** with three packages:

```
<your-repo>/
├── shared/      # the contract: request schemas, response DTOs, enums/models. No app code.
├── backend/     # Express + Kysely API
└── web/         # Next.js (App Router) frontend
```

- **`shared` is the single source of truth** for anything both `backend` and `web` need: request-validation schemas, response types (DTOs), and domain enums. Neither app may redefine a shape that belongs in `shared`.
- `backend` and `web` import from the built `shared` package (e.g. `import { schema, ResponseInterface } from "shared"`), **never** by reaching into `shared/src/...` with a relative path.
- Use **TypeScript strict mode everywhere** (`"strict": true`). Zero type errors. Zero suppressed warnings. `cd <pkg> && npx tsc --noEmit` must exit clean in every package.

---

## 1. No shortcuts — ever

Every file you submit must be production-ready. The following are **shortcuts and will cost you points** wherever they appear:

- `TODO` / `FIXME` / `HACK` / `XXX` comments left in shipped code.
- Placeholder or stub logic: handlers that return hardcoded data, empty implementations, `throw new Error("not implemented")`.
- `any` used to silence the type checker. Use `unknown` + narrowing, or define the real type. (If a third-party type is genuinely wrong, use `@ts-expect-error` with a one-line comment explaining why — never `@ts-ignore`.)
- Swallowed errors: empty `catch {}`, `catch (e) {}` that hides the failure. Either handle it meaningfully or let it propagate to the error funnel (§4).
- Hardcoded environment-specific values (URLs, ports, DB credentials, secrets) in source. They belong in environment variables.
- A user-facing async operation with **no loading state and no error state** — only the happy path.
- Copy-pasted logic that should be one shared helper.
- A type/enum/DTO defined locally in `backend` or `web` that belongs in `shared`.

> **A bug you notice is a bug you own.** If you spot something broken while working — even if you didn't cause it — fix it, or explain in `NOTES.md` why you didn't. "Not my code" is not an accepted reason in a codebase this size.

---

## 2. The shared contract: TWO separate registries

This is the most important structural convention, and the one AI tools most reliably get wrong. The contract package has **two independent registries**. Adding to one does **not** add to the other — a typical endpoint touches both.

### 2a. Request validation schemas → `shared/src/schemas/`

- Request validation uses **[TypeBox](https://github.com/sinclairzx81/typebox)**. **Do not use Zod, Yup, Joi, or AJV by hand.** This is a hard requirement — a Zod schema anywhere in the submission is an automatic red flag, because it means the AI's default was shipped without review.
- Build a small `createSchema` helper and reuse it. A schema is defined per action and exposes a `.validate(req)` that returns the typed, coerced `{ body, query, params }` or throws a validation error:

```ts
// shared/src/schemas/helpers.ts
import { Type, type TProperties } from "typebox";
import TypeCompile from "typebox/compile";
import { Value } from "typebox/value";
import { ValidationError } from "../errors"; // your own error type, see §4

export function createSchema<T extends TProperties>(t: T) {
  const schema = Type.Object(t);
  let compiled: ReturnType<typeof TypeCompile> | undefined;

  const validate = (data: unknown) => {
    if (!compiled) compiled = TypeCompile(schema);
    const coerced = Value.Convert(schema, data); // string "42" -> 42 for query/params
    const errors = [...compiled.Errors(coerced)];
    if (errors.length) {
      const msg = errors.map((e) => `${e.schemaPath} ${e.message}`).join("; ");
      throw new ValidationError(`Validation failed: ${msg}`);
    }
    return coerced as typeof schema.static;
  };

  return { validate };
}

// require additionalProperties:false so unexpected keys are rejected
export function strictObject<T extends TProperties>(t: T) {
  return Type.Object(t, { additionalProperties: false });
}

// a union of string literals from a `const` array (see §6) — your runtime enum check
export function StringEnum<T extends readonly string[]>(values: T) {
  return Type.Union(values.map((v) => Type.Literal(v)));
}
```

- Each action's schema lives under `shared/src/schemas/<area>/<resource>.ts`:

```ts
// shared/src/schemas/saved-gigs.ts
import { Type } from "typebox";
import { createSchema, strictObject } from "./helpers";
import { SAVED_LIST } from "../models/saved-gig"; // the enum, see §6

export const save = createSchema({
  params: strictObject({ gigId: Type.Number({ minimum: 1 }) }),
  body: strictObject({
    list: Type.Optional(StringEnum(SAVED_LIST)),
    note: Type.Optional(Type.String({ maxLength: 280 })),
  }),
});
```

### 2b. Response DTOs → `shared/src/api/` (a DIFFERENT registry)

- Response shapes are **plain TypeScript `interface`s**, not schemas. They live separately and are registered in one typed map so the frontend can ask for a response type by key:

```ts
// shared/src/api/saved-gigs/interfaces.ts
export interface SavedGigItem {
  id: number;
  gig_id: number;
  gig_title: string;
  gig_status: string;   // so the UI can badge gigs that have since closed
  list: string;
  note: string | null;
  created_on: string;
}
export interface ListSavedGigs {
  items: SavedGigItem[];
  total: number;
}

// shared/src/api/index.ts  (the registry)
const records = {
  "saved-gigs/list": {} as ListSavedGigs,
  // ...every response shape registered under a string key
};
export type ResponseInterface<K extends keyof typeof records> = (typeof records)[K];
```

- The backend types its response with `ResponseInterface<'saved-gigs/list'>`; the frontend's API client is typed the same way. **One definition, both sides.** If `web` declares its own copy of `SavedGigItem`, that's a §1 violation.

> Why two registries? Request validation needs runtime checking (TypeBox compiles a validator). Responses only need a compile-time type. Keeping them separate keeps the runtime validator out of your frontend bundle. Mirror this split.

---

## 3. Validate at the top of every controller

Every route handler validates its input **first**, using the shared schema. No manual `if (!req.body.x)` checking, no validating inside the DAO.

```ts
import { schema } from "shared";

export const saveGig = async (req: Request, res: Response) => {
  const { params: { gigId }, body: { list, note } } = schema.savedGigs.save.validate(req);
  // ...everything below can trust these values are present, typed, and in range
};
```

---

## 4. One error funnel — `ErrorStatus` + `apiWrapper`

There is exactly one way errors reach the client. Do not invent a parallel path (no `res.status(400).json(...)` scattered through controllers).

```ts
// an expected failure carries its HTTP status
export class ErrorStatus extends Error {
  constructor(public message: string, public statusCode: number = 400) { super(message); }
}

// wrap every handler so thrown errors land in one place
export function apiWrapper(handler: (req: Request, res: Response) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(handler(req, res)).catch(next);
}

// the single error handler, registered LAST on the app
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ErrorStatus)     return void res.status(err.statusCode).json({ message: err.message });
  if (err instanceof ValidationError) return void res.status(400).json({ message: err.message });
  // unknown errors: log server-side, never leak internals to the client
  console.error(err);
  res.status(500).json({ message: "Internal Server Error" });
}
```

In a controller, every *expected* failure is a thrown `ErrorStatus`:

```ts
if (!gig) throw new ErrorStatus("Gig not found", 404);
if (gig.posted_by === userId) throw new ErrorStatus("You cannot save your own gig", 400);
```

Register routes through the wrapper — never a bare handler:

```ts
router.post("/gigs/:gigId/save", allowPermission("Create:SavedGig"), apiWrapper(controller.saveGig));
```

---

## 5. Auth & permissions live in middleware, not controllers

- A route guard decides auth. It returns **401 when the request is unauthenticated** and **403 when the user lacks the required permission**. Controllers never re-implement this.

```ts
export function allowPermission(...required: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.sendStatus(401);
    if (required.length && !required.some((p) => req.user!.permissions.includes(p)))
      return res.sendStatus(403);
    next();
  };
}
```

- Permissions are `'<Action>:<Resource>'` strings (e.g. `Create:SavedGig`, `Read:SavedGig`, `Delete:SavedGig`). Define them once in `shared` and reference the constants — don't sprinkle string literals.
- For this exercise, "authentication" can be a **stub**: a bearer token that maps to a seeded user (see `TASK.md`). Keep the *shape* real (a middleware that populates `req.user` with `{ id, permissions }`, then `allowPermission` guards the route) even though the token mechanism is simplified. Don't build Firebase/OAuth.

---

## 6. Enums: the `const → type → label` pattern

No bare TypeScript `enum`s. Every enumerated set follows this exact shape, defined in `shared`:

```ts
export const SAVED_LIST = ["WATCHLIST", "APPLY_LATER", "SHORTLIST"] as const;
export type SavedList = (typeof SAVED_LIST)[number];
export const SavedListLabel: Record<SavedList, string> = {
  WATCHLIST: "Watchlist",
  APPLY_LATER: "Apply later",
  SHORTLIST: "Shortlist",
};
```

The array drives the runtime validator (TypeBox union), the type drives the compiler, and the label map drives the UI. One source.

---

## 7. Data access (DAO)

- Use **[Kysely](https://kysely.dev/)** (typed SQL query builder) over Postgres. Don't reach for a heavyweight ORM.
- Split read vs write access explicitly — a single accessor that takes the mode:

```ts
const db = getDb({ mode: "read" });   // SELECTs
const db = getDb({ mode: "write" });  // INSERT/UPDATE/DELETE/transactions
```

  (In production these map to read-replica vs primary credentials. Here they can point at the same DB, but keep the call sites honest about intent.)
- **Never** build SQL by string concatenation. Use the query builder's parameter binding. No raw interpolation of user input.
- List endpoints are **paginated** (`offset` / `limit`, with a sane max) and return a **total** count. Get the count in the same query with a window function rather than a second round-trip:

```ts
.select((eb) => eb.fn.countAll().over().as("total"))
```

- The generated DB types (e.g. from `kysely-codegen`) are generated — don't hand-edit them. Coerce `bigint`/numeric columns to `number` at the boundary so DTOs are clean.

---

## 8. Migrations

- The schema is created by a **hand-authored SQL migration** (and a small seed). Don't rely on an ORM's `sync`/auto-create.
- Every table gets `created_on` and `updated_on` (`TIMESTAMP DEFAULT now()`), and `updated_on` is maintained by a trigger — define the trigger function once and attach it per table.
- Enforce invariants in the schema, not just in code: the `saved_gigs` table must have a **`UNIQUE (user_id, gig_id)`** constraint (see §2 of `TASK.md` for why this matters).
- Store enum-backed columns (`mode`, `status`, `list`) as a `VARCHAR` with a `CHECK (col IN (...))` constraint rather than a native Postgres `ENUM` type — it keeps the values in sync with the `const` array in `shared` and avoids `ALTER TYPE` pain when the set changes.

---

## 9. Frontend (Next.js + Zustand)

- **Server components by default.** Add `"use client"` only when a component genuinely needs browser APIs, event handlers, or hooks.
- **Every user-facing async operation has three states, not one:** a **loading** state (skeleton/spinner), an **error** state (with a retry where it makes sense), and — for lists — an **empty** state. A screen that only renders the success case is incomplete.
- **Surface errors to the user.** A failed mutation shows a toast/notification; it does not fail silently or only `console.log`. A **401 signs the user out**; a **403 renders an access-denied state** (not a blank screen, not a swallowed error).
- **Global state is Zustand, not React Context**, and never prop-drilling shared state through many layers. Local-only UI state (a dropdown's open/closed) can stay in `useState`.
- The API client is typed with the **shared `ResponseInterface<...>`** types. Don't redeclare response shapes in `web`.
- **Styling:** utility classes (Tailwind) over hand-written CSS files; compose conditional classes with a `cn()`-style helper (`clsx`, or a one-liner `const cn = (...c: unknown[]) => c.filter(Boolean).join(" ")`) rather than string concatenation. Don't hand-roll components a component library already gives you.
- **Forms:** schema-driven validation (a resolver + a typed field config), not ad-hoc `onChange` validation scattered across the component.

---

## 10. Imports & structure

- Use a path alias (`@/...`) within each app. **No `../../../` up-traversal.**
- **Co-locate** a route's pieces with the route: its page, its API calls, its form config, its route-only components live together — not in distant global folders.
- Don't deep-import another package's internals. Cross-package code goes through `shared`.

---

## 11. Git hygiene

- Commit in **small, logical steps** with clear messages (imperative mood: "Add saved_gigs migration", "Wire save toggle to API"). One giant "final commit" tells us nothing about how you work.
- **Never commit secrets** or a real `.env`. Commit a `.env.example` instead, and document required variables in the README.
- The history should read as a sensible build order (contract → migration → backend → frontend), not a single dump.

---

## Quick self-check before you submit

- [ ] `npx tsc --noEmit` is clean in `shared`, `backend`, and `web`.
- [ ] No `any`, no `@ts-ignore`, no `TODO`/`FIXME`, no empty `catch`, no Zod.
- [ ] Request schemas (TypeBox) and response DTOs are both in `shared`; nothing is duplicated in an app.
- [ ] Every endpoint validates at the top, is guarded by a permission, and throws `ErrorStatus` on expected failures.
- [ ] Every async screen has loading + error (+ empty for lists) states; 401 signs out, 403 is access-denied.
- [ ] No secrets committed; `.env.example` present; README explains how to run it.
- [ ] `NOTES.md` is filled in (see `NOTES.template.md`).
