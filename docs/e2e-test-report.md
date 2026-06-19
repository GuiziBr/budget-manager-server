# E2E Test Report

## 1. Summary

| | |
|---|---|
| **Report title** | End-to-end API verification — lookup domains, budget-period, income |
| **Date** | 2026-06-18 |
| **Tester** | Ricardo (ricardo.guizi@invokemedia.com) |
| **Build** | commit `386476b`, app version `0.0.1` |
| **Environment** | Local — `http://localhost:3000`, PostgreSQL via Docker Compose |
| **Tooling** | `curl` (direct HTTP against the running server) |
| **Overall result** | ⚠️ **PASS WITH FINDINGS** — lookup domains and budget-period fully pass; income passes except **1 open defect** (DEF-1: `receivedAt` date → `500`, [#28](https://github.com/GuiziBr/budget-manager-server/issues/28)) |

---

## 2. Scope

| Domain | Coverage |
|---|---|
| **Banks** | Full lifecycle — `POST`, `GET` (list + by id), `PATCH`, `DELETE` — plus business rules (uniqueness, soft delete, delete existence check) |
| **Payment-types** | Full lifecycle + business rules + `hasStatement` handling |
| **Categories** | Full lifecycle + business rules + `hasBudgetEnvelope` handling |
| **Stores** | Full lifecycle + business rules |
| **Budget-periods** | `POST`, `GET` (list + by id), `DELETE` (no `PATCH` — periods are immutable) — plus `year`/`month` validation, duplicate-period rule, delete-with-linked-records guard, and the period-opening side effect |
| **Income** | Full lifecycle — `POST`, `GET` (list + by id, `?budgetPeriodId` filter), `PATCH`, `DELETE` — plus monetary-amount rules, optional-field defaults, period-existence check, and empty-`PATCH` guard |

**Out of scope:** remaining domains (budget-envelope, expense, recurring-expense, installment-group) and the business-scenario tests in `qa-postman-guide.md` Part 2.

---

## 3. Preconditions

- Server reachable: `GET /banks` → `200`.
- Database migrated and writable.
- `Content-Type: application/json` sent on every request.

---

## 4. Test Cases & Results

Each subsection covers all test cases for a single API.

### 4.1 — Banks

#### `POST /banks`

##### TC-01 — Valid body

- **Request body:** `{ "name": "Test Bank" }`
- **Expected / Actual:** `201` with the created bank object (`id`, `name`, `createdAt`, `updatedAt`, `deletedAt: null`).
- **Result:** ✅ PASS

##### TC-02 — Invalid: empty body

- **Request body:** `{}`
- **Expected / Actual:** `400` (`invalid_type`, missing `name`).
- **Result:** ✅ PASS

#### `GET /banks`

##### TC-09 — List all

- **Request:** `GET /banks`
- **Expected / Actual:** `200` with an array of non-deleted banks.
- **Result:** ✅ PASS

#### `GET /banks/:id`

##### TC-10 — Valid id

- **Expected / Actual:** `200` with the matching bank object.
- **Result:** ✅ PASS

##### TC-11 — Non-UUID id

- **Request:** `GET /banks/not-a-uuid`
- **Expected / Actual:** `400` (`invalid_format`, "Invalid UUID").
- **Result:** ✅ PASS

##### TC-12 — Unknown UUID

- **Request:** `GET /banks/00000000-0000-0000-0000-000000000000`
- **Expected / Actual:** `404` ("Bank with id ... not found").
- **Result:** ✅ PASS

#### `PATCH /banks/:id`

##### TC-13 — Valid rename

- **Request body:** `{ "name": "QA Bank Renamed" }`
- **Expected / Actual:** `200`; `name` updated and `updatedAt` bumped.
- **Result:** ✅ PASS

##### TC-14 — Empty body `{}`

- **Request body:** `{}`
- **Expected / Actual:** `400` — `"At least one field must be provided"`.
- **Result:** ✅ PASS

##### TC-15 — Empty name `""`

- **Request body:** `{ "name": "" }`
- **Expected / Actual:** `400` (`too_small`, min 1).
- **Result:** ✅ PASS

##### TC-16 — Non-UUID id

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-17 — Unknown UUID

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

#### `DELETE /banks/:id`

##### TC-18 — Valid delete

- **Expected / Actual:** `204` no content (soft delete).
- **Result:** ✅ PASS

##### TC-19 — GET after delete

- **Expected / Actual:** `404` — soft-deleted records are not retrievable.
- **Result:** ✅ PASS

##### TC-20 — Excluded from list

- **Expected / Actual:** deleted id does not appear in `GET /banks`.
- **Result:** ✅ PASS

##### TC-21 — Second delete (idempotency)

- **Expected / Actual:** `404` — not silently idempotent.
- **Result:** ✅ PASS

##### TC-22 — Non-UUID id

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-23 — Unknown UUID

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

#### Business Rules — Banks

##### BR-1 — Name uniqueness

- **Rule:** posting a second bank with an existing active name → `409 Conflict` (`"A bank named '<name>' already exists"`); a name is reusable after its record is soft-deleted (partial unique index on `deleted_at IS NULL`).
- **Actual:** second POST → `409`; soft-delete then recreate same name → `201`.
- **Result:** ✅ PASS

##### BR-2 — Soft delete hides records from reads

- **Evidence:** TC-19 (`404` by id), TC-20 (excluded from list).
- **Result:** ✅ PASS

##### BR-3 — Delete existence check

- **Evidence:** TC-21 (second delete → `404`), TC-23 (unknown → `404`).
- **Result:** ✅ PASS

### 4.2 — Categories

#### `POST /categories`

##### TC-03 — Valid body

- **Request body:** `{ "name": "Test Category", "hasBudgetEnvelope": true }`
- **Expected / Actual:** `201` with the created category including `hasBudgetEnvelope`.
- **Result:** ✅ PASS

##### TC-04 — Invalid: missing `hasBudgetEnvelope`

- **Request body:** `{ "name": "Bad Category" }`
- **Expected / Actual:** `400` (required boolean missing).
- **Result:** ✅ PASS

##### TC-40 — Invalid: `hasBudgetEnvelope` wrong type

- **Request body:** `{ "name": "...", "hasBudgetEnvelope": "yes" }`
- **Expected / Actual:** `400` (`invalid_type`, expected boolean).
- **Result:** ✅ PASS

#### `GET /categories`

##### TC-41 — List all

- **Expected / Actual:** `200` with an array of non-deleted categories.
- **Result:** ✅ PASS

#### `GET /categories/:id`

##### TC-42 — Valid id

- **Expected / Actual:** `200` with the matching object.
- **Result:** ✅ PASS

##### TC-43 — Non-UUID id

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-44 — Unknown UUID

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

#### `PATCH /categories/:id`

##### TC-45 — Valid rename

- **Expected / Actual:** `200`; `name` updated, `updatedAt` bumped.
- **Result:** ✅ PASS

##### TC-46 — Toggle `hasBudgetEnvelope`

- **Request body:** `{ "hasBudgetEnvelope": false }`
- **Expected / Actual:** `200`; flag flipped, other fields preserved.
- **Result:** ✅ PASS

##### TC-47 — Empty body `{}`

- **Expected / Actual:** `400` — `"At least one field must be provided"`.
- **Result:** ✅ PASS

##### TC-48 — Empty name `""`

- **Expected / Actual:** `400` (`too_small`, min 1).
- **Result:** ✅ PASS

##### TC-49 — Unknown UUID

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

#### `DELETE /categories/:id`

##### TC-50 — Valid delete

- **Expected / Actual:** `204` (soft delete).
- **Result:** ✅ PASS

##### TC-51 — GET after delete

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

##### TC-52 — Excluded from list

- **Expected / Actual:** deleted id not in `GET /categories`.
- **Result:** ✅ PASS

##### TC-53 — Second delete

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

##### TC-54 — Non-UUID id

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-55 — Unknown UUID

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

#### Business Rules — Categories

##### BR-7 — Name uniqueness

- **Rule:** duplicate active name → `409` (`"A category named '<name>' already exists"`); reusable after soft-delete.
- **Actual:** second POST → `409`.
- **Result:** ✅ PASS

##### BR-8 — Soft delete hides records from reads

- **Evidence:** TC-51, TC-52.
- **Result:** ✅ PASS

##### BR-9 — Delete existence check

- **Evidence:** TC-53, TC-55.
- **Result:** ✅ PASS

### 4.3 — Payment-types

#### `POST /payment-types`

##### TC-05 — Valid body

- **Request body:** `{ "name": "Test Card", "hasStatement": true }`
- **Expected / Actual:** `201` with the created payment-type including `hasStatement`.
- **Result:** ✅ PASS

##### TC-06 — Invalid: missing `hasStatement`

- **Expected / Actual:** `400` (required boolean missing).
- **Result:** ✅ PASS

##### TC-25 — Invalid: `hasStatement` wrong type

- **Expected / Actual:** `400` (`invalid_type`, expected boolean).
- **Result:** ✅ PASS

#### `GET /payment-types`

##### TC-24 — List all

- **Expected / Actual:** `200` with an array of non-deleted payment types.
- **Result:** ✅ PASS

#### `GET /payment-types/:id`

##### TC-26 — Valid id

- **Expected / Actual:** `200` with the matching object.
- **Result:** ✅ PASS

##### TC-27 — Non-UUID id

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-28 — Unknown UUID

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

#### `PATCH /payment-types/:id`

##### TC-29 — Valid rename

- **Expected / Actual:** `200`; `name` updated, `updatedAt` bumped.
- **Result:** ✅ PASS

##### TC-30 — Toggle `hasStatement`

- **Request body:** `{ "hasStatement": false }`
- **Expected / Actual:** `200`; flag flipped, other fields preserved.
- **Result:** ✅ PASS

##### TC-31 — Empty body `{}`

- **Expected / Actual:** `400` — `"At least one field must be provided"`.
- **Result:** ✅ PASS

##### TC-32 — Empty name `""`

- **Expected / Actual:** `400` (`too_small`, min 1).
- **Result:** ✅ PASS

##### TC-33 — Unknown UUID

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

#### `DELETE /payment-types/:id`

##### TC-34 — Valid delete

- **Expected / Actual:** `204` (soft delete).
- **Result:** ✅ PASS

##### TC-35 — GET after delete

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

##### TC-36 — Excluded from list

- **Expected / Actual:** deleted id not in `GET /payment-types`.
- **Result:** ✅ PASS

##### TC-37 — Second delete

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

##### TC-38 — Non-UUID id

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-39 — Unknown UUID

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

#### Business Rules — Payment-types

##### BR-4 — Name uniqueness

- **Rule:** duplicate active name → `409` (`"A payment type named '<name>' already exists"`); reusable after soft-delete.
- **Actual:** second POST → `409`.
- **Result:** ✅ PASS

##### BR-5 — Soft delete hides records from reads

- **Evidence:** TC-35, TC-36.
- **Result:** ✅ PASS

##### BR-6 — Delete existence check

- **Evidence:** TC-37, TC-39.
- **Result:** ✅ PASS

### 4.4 — Stores

#### `POST /stores`

##### TC-07 — Valid body

- **Request body:** `{ "name": "Test Store" }`
- **Expected / Actual:** `201` with the created store object.
- **Result:** ✅ PASS

##### TC-08 — Invalid: empty name

- **Request body:** `{ "name": "" }`
- **Expected / Actual:** `400` (`too_small`, min 1).
- **Result:** ✅ PASS

#### `GET /stores`

##### TC-56 — List all

- **Expected / Actual:** `200` with an array of non-deleted stores.
- **Result:** ✅ PASS

#### `GET /stores/:id`

##### TC-57 — Valid id

- **Expected / Actual:** `200` with the matching object.
- **Result:** ✅ PASS

##### TC-58 — Non-UUID id

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-59 — Unknown UUID

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

#### `PATCH /stores/:id`

##### TC-60 — Valid rename

- **Expected / Actual:** `200`; `name` updated, `updatedAt` bumped.
- **Result:** ✅ PASS

##### TC-61 — Empty body `{}`

- **Expected / Actual:** `400` — `"At least one field must be provided"`.
- **Result:** ✅ PASS

##### TC-62 — Empty name `""`

- **Expected / Actual:** `400` (`too_small`, min 1).
- **Result:** ✅ PASS

##### TC-63 — Non-UUID id

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-64 — Unknown UUID

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

#### `DELETE /stores/:id`

##### TC-65 — Valid delete

- **Expected / Actual:** `204` (soft delete).
- **Result:** ✅ PASS

##### TC-66 — GET after delete

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

##### TC-67 — Excluded from list

- **Expected / Actual:** deleted id not in `GET /stores`.
- **Result:** ✅ PASS

##### TC-68 — Second delete

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

##### TC-69 — Non-UUID id

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-70 — Unknown UUID

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

#### Business Rules — Stores

##### BR-10 — Name uniqueness

- **Rule:** duplicate active name → `409` (`"A store named '<name>' already exists"`); reusable after soft-delete.
- **Actual:** second POST → `409`.
- **Result:** ✅ PASS

##### BR-11 — Soft delete hides records from reads

- **Evidence:** TC-66, TC-67.
- **Result:** ✅ PASS

##### BR-12 — Delete existence check

- **Evidence:** TC-68, TC-70.
- **Result:** ✅ PASS

### 4.5 — Budget-periods

> Budget periods expose `POST`, `GET` (list + by id), and `DELETE` — there is **no `PATCH`** (periods are immutable). Create body is `{ year, month }` with no foreign keys.

#### `POST /budget-periods`

##### TC-71 — Valid body

- **Request body:** `{ "year": 2027, "month": 4 }`
- **Expected / Actual:** `201` with the created period (`id`, `year`, `month`, timestamps, `deletedAt: null`).
- **Result:** ✅ PASS

##### TC-72 — Missing `year`

- **Request body:** `{ "month": 5 }`
- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-73 — Missing `month`

- **Request body:** `{ "year": 2027 }`
- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-74 — `month` below range (`0`)

- **Request body:** `{ "year": 2027, "month": 0 }`
- **Expected / Actual:** `400` (min 1).
- **Result:** ✅ PASS

##### TC-75 — `month` above range (`13`)

- **Request body:** `{ "year": 2027, "month": 13 }`
- **Expected / Actual:** `400` (max 12).
- **Result:** ✅ PASS

##### TC-76 — `year` below range (`1999`)

- **Request body:** `{ "year": 1999, "month": 6 }`
- **Expected / Actual:** `400` (min 2000).
- **Result:** ✅ PASS

##### TC-77 — `year` above range (`2028`)

- **Request body:** `{ "year": 2028, "month": 6 }`
- **Expected / Actual:** `400` — the max allowed year is `current year + 1`. Current year is **2026**, so the cap is **2027**; `2028` is rejected.
- **Result:** ✅ PASS

##### TC-78 — Non-integer `month` (`1.5`)

- **Request body:** `{ "year": 2027, "month": 1.5 }`
- **Expected / Actual:** `400` (`int`).
- **Result:** ✅ PASS

##### TC-79 — Wrong types (strings)

- **Request body:** `{ "year": "2027", "month": "6" }`
- **Expected / Actual:** `400` (`invalid_type`, expected number).
- **Result:** ✅ PASS

##### TC-80 — `year` at upper bound (`2027`)

- **Request body:** `{ "year": 2027, "month": 8 }`
- **Expected / Actual:** `201` — `2027` is the cap (current year 2026 + 1); the upper bound is inclusive.
- **Result:** ✅ PASS

#### `GET /budget-periods`

##### TC-81 — List all

- **Expected / Actual:** `200` with an array of non-deleted periods.
- **Result:** ✅ PASS

#### `GET /budget-periods/:id`

##### TC-82 — Valid id

- **Expected / Actual:** `200` with the matching period.
- **Result:** ✅ PASS

##### TC-83 — Non-UUID id

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-84 — Unknown UUID

- **Expected / Actual:** `404` ("Budget period with id ... not found").
- **Result:** ✅ PASS

#### `PATCH /budget-periods/:id`

##### TC-85 — No update endpoint

- **Request:** `PATCH /budget-periods/:id` body `{ "year": 2027 }`
- **Expected / Actual:** `404` — no `PATCH` route is defined (periods are immutable).
- **Result:** ✅ PASS

#### `DELETE /budget-periods/:id`

##### TC-86 — Valid delete (no linked records)

- **Expected / Actual:** `204` (soft delete) when the period has no linked expenses, incomes, or envelopes.
- **Result:** ✅ PASS

##### TC-87 — GET after delete

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

##### TC-88 — Excluded from list

- **Expected / Actual:** deleted id not in `GET /budget-periods`.
- **Result:** ✅ PASS

##### TC-89 — Second delete

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

##### TC-90 — Non-UUID id

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-91 — Unknown UUID

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

#### Business Rules — Budget-periods

##### BR-13 — Period uniqueness `(year, month)`

- **Rule:** posting a period for an existing active `(year, month)` → `409 Conflict` (`"A budget period for <year>/<month> already exists"`). Enforced both at the service layer and by a partial unique index (`WHERE deleted_at IS NULL`).
- **Actual:** second `POST { "year": 2027, "month": 4 }` → `409`.
- **Result:** ✅ PASS

##### BR-14 — Delete blocked when records are linked

- **Rule:** deleting a period that has linked expenses, incomes, or budget envelopes → `409 Conflict` (`"Cannot delete a budget period that has linked expenses, incomes, or budget envelopes"`).
- **Steps:** create period → create an income on it → `DELETE` the period.
- **Actual:** `DELETE` → `409` (income remained linked).
- **Result:** ✅ PASS

##### BR-15 — Soft delete hides records from reads

- **Evidence:** TC-87 (`404` by id), TC-88 (excluded from list).
- **Result:** ✅ PASS

##### BR-16 — Period "opening" side effect

- **Rule:** creating a period does not just insert a row — it **opens** the period, auto-creating budget envelopes for every `hasBudgetEnvelope` category, recurring-expense entries active for that period, and any installments due in it.
- **Steps:** create a category with `hasBudgetEnvelope: true` → `POST` a new period → query its envelopes.
- **Actual:** `GET /budget-envelopes?budgetPeriodId=<new>` returned one envelope for the category (`allocatedAmount: 0`, since the category name is not in the seed amount map).
- **Result:** ✅ PASS — note for consumers: a freshly-opened period may already contain envelopes/expenses, and is therefore not deletable (see BR-14).

### 4.6 — Income

> Income exposes full CRUD. Create body: `{ budgetPeriodId, description, amount }` + optional `isSalary` (default `false`) and `receivedAt` (date, nullable). `GET /incomes` supports a `?budgetPeriodId=` filter.

#### `POST /incomes`

##### TC-92 — Valid, all fields (incl. `receivedAt` date) ❌

- **Request body:** `{ "budgetPeriodId": "...", "description": "Monthly salary", "amount": 5000, "isSalary": true, "receivedAt": "2026-02-01" }`
- **Expected:** `201` with the income persisted.
- **Actual:** `500 Internal Server Error` — `receivedAt` date string is not coerced to a DateTime for the Prisma `@db.Date` column. See **DEF-1** ([#28](https://github.com/GuiziBr/budget-manager-server/issues/28)).
- **Result:** ❌ **FAIL** (open defect)

##### TC-93 — Valid, minimal (omit `isSalary` / `receivedAt`)

- **Request body:** `{ "budgetPeriodId": "...", "description": "Freelance", "amount": 800 }`
- **Expected / Actual:** `201` with `isSalary: false` and `receivedAt: null` (defaults applied).
- **Result:** ✅ PASS

##### TC-94 — `receivedAt: null` explicit

- **Expected / Actual:** `201` with `receivedAt: null`.
- **Result:** ✅ PASS

##### TC-95 — Missing `budgetPeriodId`

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-96 — Missing `description`

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-97 — Missing `amount`

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-98 — `budgetPeriodId` non-UUID

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-99 — `budgetPeriodId` unknown (valid UUID)

- **Expected / Actual:** `404` ("Budget period with id ... not found") — create validates the period exists.
- **Result:** ✅ PASS

##### TC-100 — `amount` = 0

- **Expected / Actual:** `400` (must be positive).
- **Result:** ✅ PASS

##### TC-101 — `amount` negative

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-102 — `amount` > max (`100000000`)

- **Expected / Actual:** `400` (max `99,999,999.99`).
- **Result:** ✅ PASS

##### TC-103 — `amount` with 3 decimals (`10.123`)

- **Expected / Actual:** `400` (max 2 decimals).
- **Result:** ✅ PASS

##### TC-104 — Empty `description`

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-105 — `isSalary` wrong type

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-106 — `receivedAt` bad format

- **Request body:** `{ ..., "receivedAt": "not-a-date" }`
- **Expected / Actual:** `400` (validation rejects malformed date before reaching Prisma).
- **Result:** ✅ PASS

#### `GET /incomes`

##### TC-107 — List all

- **Expected / Actual:** `200` array.
- **Result:** ✅ PASS

##### TC-108 — List filtered `?budgetPeriodId=`

- **Expected / Actual:** `200` array scoped to the period.
- **Result:** ✅ PASS

##### TC-109 — Filter value non-UUID

- **Expected / Actual:** `400` (query validation).
- **Result:** ✅ PASS

#### `GET /incomes/:id`

##### TC-110 — Valid id

- **Expected / Actual:** `200`.
- **Result:** ✅ PASS

##### TC-111 — Non-UUID id

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-112 — Unknown UUID

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

#### `PATCH /incomes/:id`

##### TC-113 — Update `amount`

- **Expected / Actual:** `200`, `amount` updated, `updatedAt` bumped.
- **Result:** ✅ PASS

##### TC-114 — Update `receivedAt` to a date ❌

- **Request body:** `{ "receivedAt": "2026-02-05" }`
- **Expected:** `200` with `receivedAt` updated.
- **Actual:** `500` — same root cause as TC-92. See **DEF-1** ([#28](https://github.com/GuiziBr/budget-manager-server/issues/28)).
- **Result:** ❌ **FAIL** (open defect)

##### TC-115 — Clear `receivedAt` (`null`)

- **Request body:** `{ "receivedAt": null }`
- **Expected / Actual:** `200` with `receivedAt: null`.
- **Result:** ✅ PASS

##### TC-116 — Empty body `{}`

- **Expected / Actual:** `400` — `"At least one field must be provided"` (guard present).
- **Result:** ✅ PASS

##### TC-117 — Empty `description`

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-118 — `amount` = 0

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-119 — Non-UUID id

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-120 — Unknown UUID

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

#### `DELETE /incomes/:id`

##### TC-121 — Valid delete

- **Expected / Actual:** `204` (soft delete).
- **Result:** ✅ PASS

##### TC-122 — GET after delete

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

##### TC-123 — Second delete

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

##### TC-124 — Non-UUID id

- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-125 — Unknown UUID

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

#### Business Rules — Income

##### BR-17 — Create validates budget period existence

- **Rule:** `create` checks the referenced budget period exists; unknown period → `404`.
- **Evidence:** TC-99.
- **Result:** ✅ PASS

##### BR-18 — Optional-field defaults

- **Rule:** omitting `isSalary` / `receivedAt` yields `isSalary: false`, `receivedAt: null`.
- **Evidence:** TC-93.
- **Result:** ✅ PASS

##### BR-19 — Soft delete hides records from reads

- **Evidence:** TC-122.
- **Result:** ✅ PASS

##### BR-20 — Delete existence check

- **Evidence:** TC-123, TC-125.
- **Result:** ✅ PASS

##### BR-21 — Empty `PATCH` rejected

- **Rule:** `PATCH {}` → `400` (the lookup-domain empty-`PATCH` guard, [#23](https://github.com/GuiziBr/budget-manager-server/issues/23), is present on income).
- **Evidence:** TC-116.
- **Result:** ✅ PASS

---

## 5. Results Matrix

### Banks

| ID | Method | Scenario | Expected | Actual | Status |
|---|---|---|---|---|---|
| TC-01 | `POST` | Valid body | `201` | `201` | ✅ PASS |
| TC-02 | `POST` | Empty body `{}` | `400` | `400` | ✅ PASS |
| TC-09 | `GET` | List all | `200` array | `200` | ✅ PASS |
| TC-10 | `GET /:id` | Valid id | `200` | `200` | ✅ PASS |
| TC-11 | `GET /:id` | Non-UUID | `400` | `400` | ✅ PASS |
| TC-12 | `GET /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| TC-13 | `PATCH /:id` | Valid rename | `200` | `200` | ✅ PASS |
| TC-14 | `PATCH /:id` | Empty body `{}` | `400` | `400` | ✅ PASS |
| TC-15 | `PATCH /:id` | Empty name `""` | `400` | `400` | ✅ PASS |
| TC-16 | `PATCH /:id` | Non-UUID | `400` | `400` | ✅ PASS |
| TC-17 | `PATCH /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| TC-18 | `DELETE /:id` | Valid delete | `204` | `204` | ✅ PASS |
| TC-19 | `DELETE /:id` | GET after delete | `404` | `404` | ✅ PASS |
| TC-20 | `DELETE /:id` | Excluded from list | excluded | excluded | ✅ PASS |
| TC-21 | `DELETE /:id` | Second delete | `404` | `404` | ✅ PASS |
| TC-22 | `DELETE /:id` | Non-UUID | `400` | `400` | ✅ PASS |
| TC-23 | `DELETE /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| BR-1 | `POST` | Duplicate name | `409` | `409` | ✅ PASS |
| BR-2 | — | Soft delete hides reads | hidden | hidden | ✅ PASS |
| BR-3 | — | Delete existence check | `404` | `404` | ✅ PASS |

### Payment-types

| ID | Method | Scenario | Expected | Actual | Status |
|---|---|---|---|---|---|
| TC-05 | `POST` | Valid body | `201` | `201` | ✅ PASS |
| TC-06 | `POST` | Missing `hasStatement` | `400` | `400` | ✅ PASS |
| TC-25 | `POST` | `hasStatement` wrong type | `400` | `400` | ✅ PASS |
| TC-24 | `GET` | List all | `200` array | `200` | ✅ PASS |
| TC-26 | `GET /:id` | Valid id | `200` | `200` | ✅ PASS |
| TC-27 | `GET /:id` | Non-UUID | `400` | `400` | ✅ PASS |
| TC-28 | `GET /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| TC-29 | `PATCH /:id` | Valid rename | `200` | `200` | ✅ PASS |
| TC-30 | `PATCH /:id` | Toggle `hasStatement` | `200` | `200` | ✅ PASS |
| TC-31 | `PATCH /:id` | Empty body `{}` | `400` | `400` | ✅ PASS |
| TC-32 | `PATCH /:id` | Empty name `""` | `400` | `400` | ✅ PASS |
| TC-33 | `PATCH /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| TC-34 | `DELETE /:id` | Valid delete | `204` | `204` | ✅ PASS |
| TC-35 | `DELETE /:id` | GET after delete | `404` | `404` | ✅ PASS |
| TC-36 | `DELETE /:id` | Excluded from list | excluded | excluded | ✅ PASS |
| TC-37 | `DELETE /:id` | Second delete | `404` | `404` | ✅ PASS |
| TC-38 | `DELETE /:id` | Non-UUID | `400` | `400` | ✅ PASS |
| TC-39 | `DELETE /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| BR-4 | `POST` | Duplicate name | `409` | `409` | ✅ PASS |
| BR-5 | — | Soft delete hides reads | hidden | hidden | ✅ PASS |
| BR-6 | — | Delete existence check | `404` | `404` | ✅ PASS |

### Categories

| ID | Method | Scenario | Expected | Actual | Status |
|---|---|---|---|---|---|
| TC-03 | `POST` | Valid body | `201` | `201` | ✅ PASS |
| TC-04 | `POST` | Missing `hasBudgetEnvelope` | `400` | `400` | ✅ PASS |
| TC-40 | `POST` | `hasBudgetEnvelope` wrong type | `400` | `400` | ✅ PASS |
| TC-41 | `GET` | List all | `200` array | `200` | ✅ PASS |
| TC-42 | `GET /:id` | Valid id | `200` | `200` | ✅ PASS |
| TC-43 | `GET /:id` | Non-UUID | `400` | `400` | ✅ PASS |
| TC-44 | `GET /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| TC-45 | `PATCH /:id` | Valid rename | `200` | `200` | ✅ PASS |
| TC-46 | `PATCH /:id` | Toggle `hasBudgetEnvelope` | `200` | `200` | ✅ PASS |
| TC-47 | `PATCH /:id` | Empty body `{}` | `400` | `400` | ✅ PASS |
| TC-48 | `PATCH /:id` | Empty name `""` | `400` | `400` | ✅ PASS |
| TC-49 | `PATCH /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| TC-50 | `DELETE /:id` | Valid delete | `204` | `204` | ✅ PASS |
| TC-51 | `DELETE /:id` | GET after delete | `404` | `404` | ✅ PASS |
| TC-52 | `DELETE /:id` | Excluded from list | excluded | excluded | ✅ PASS |
| TC-53 | `DELETE /:id` | Second delete | `404` | `404` | ✅ PASS |
| TC-54 | `DELETE /:id` | Non-UUID | `400` | `400` | ✅ PASS |
| TC-55 | `DELETE /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| BR-7 | `POST` | Duplicate name | `409` | `409` | ✅ PASS |
| BR-8 | — | Soft delete hides reads | hidden | hidden | ✅ PASS |
| BR-9 | — | Delete existence check | `404` | `404` | ✅ PASS |

### Stores

| ID | Method | Scenario | Expected | Actual | Status |
|---|---|---|---|---|---|
| TC-07 | `POST` | Valid body | `201` | `201` | ✅ PASS |
| TC-08 | `POST` | Empty name `""` | `400` | `400` | ✅ PASS |
| TC-56 | `GET` | List all | `200` array | `200` | ✅ PASS |
| TC-57 | `GET /:id` | Valid id | `200` | `200` | ✅ PASS |
| TC-58 | `GET /:id` | Non-UUID | `400` | `400` | ✅ PASS |
| TC-59 | `GET /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| TC-60 | `PATCH /:id` | Valid rename | `200` | `200` | ✅ PASS |
| TC-61 | `PATCH /:id` | Empty body `{}` | `400` | `400` | ✅ PASS |
| TC-62 | `PATCH /:id` | Empty name `""` | `400` | `400` | ✅ PASS |
| TC-63 | `PATCH /:id` | Non-UUID | `400` | `400` | ✅ PASS |
| TC-64 | `PATCH /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| TC-65 | `DELETE /:id` | Valid delete | `204` | `204` | ✅ PASS |
| TC-66 | `DELETE /:id` | GET after delete | `404` | `404` | ✅ PASS |
| TC-67 | `DELETE /:id` | Excluded from list | excluded | excluded | ✅ PASS |
| TC-68 | `DELETE /:id` | Second delete | `404` | `404` | ✅ PASS |
| TC-69 | `DELETE /:id` | Non-UUID | `400` | `400` | ✅ PASS |
| TC-70 | `DELETE /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| BR-10 | `POST` | Duplicate name | `409` | `409` | ✅ PASS |
| BR-11 | — | Soft delete hides reads | hidden | hidden | ✅ PASS |
| BR-12 | — | Delete existence check | `404` | `404` | ✅ PASS |

### Budget-periods

| ID | Method | Scenario | Expected | Actual | Status |
|---|---|---|---|---|---|
| TC-71 | `POST` | Valid body | `201` | `201` | ✅ PASS |
| TC-72 | `POST` | Missing `year` | `400` | `400` | ✅ PASS |
| TC-73 | `POST` | Missing `month` | `400` | `400` | ✅ PASS |
| TC-74 | `POST` | `month` = 0 | `400` | `400` | ✅ PASS |
| TC-75 | `POST` | `month` = 13 | `400` | `400` | ✅ PASS |
| TC-76 | `POST` | `year` = 1999 | `400` | `400` | ✅ PASS |
| TC-77 | `POST` | `year` = 2028 (> max) | `400` | `400` | ✅ PASS |
| TC-78 | `POST` | `month` = 1.5 (non-int) | `400` | `400` | ✅ PASS |
| TC-79 | `POST` | String types | `400` | `400` | ✅ PASS |
| TC-80 | `POST` | `year` = 2027 (= max) | `201` | `201` | ✅ PASS |
| TC-81 | `GET` | List all | `200` array | `200` | ✅ PASS |
| TC-82 | `GET /:id` | Valid id | `200` | `200` | ✅ PASS |
| TC-83 | `GET /:id` | Non-UUID | `400` | `400` | ✅ PASS |
| TC-84 | `GET /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| TC-85 | `PATCH /:id` | No update endpoint | `404` | `404` | ✅ PASS |
| TC-86 | `DELETE /:id` | Valid delete (no linked) | `204` | `204` | ✅ PASS |
| TC-87 | `DELETE /:id` | GET after delete | `404` | `404` | ✅ PASS |
| TC-88 | `DELETE /:id` | Excluded from list | excluded | excluded | ✅ PASS |
| TC-89 | `DELETE /:id` | Second delete | `404` | `404` | ✅ PASS |
| TC-90 | `DELETE /:id` | Non-UUID | `400` | `400` | ✅ PASS |
| TC-91 | `DELETE /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| BR-13 | `POST` | Duplicate `(year, month)` | `409` | `409` | ✅ PASS |
| BR-14 | `DELETE` | Linked records present | `409` | `409` | ✅ PASS |
| BR-15 | — | Soft delete hides reads | hidden | hidden | ✅ PASS |
| BR-16 | `POST` | Opening side effect (envelopes/recurring/installments) | auto-created | auto-created | ✅ PASS |

### Income

| ID | Method | Scenario | Expected | Actual | Status |
|---|---|---|---|---|---|
| TC-92 | `POST` | Valid, incl. `receivedAt` date | `201` | `500` | ❌ FAIL (DEF-1) |
| TC-93 | `POST` | Valid, minimal (defaults) | `201` | `201` | ✅ PASS |
| TC-94 | `POST` | `receivedAt: null` | `201` | `201` | ✅ PASS |
| TC-95 | `POST` | Missing `budgetPeriodId` | `400` | `400` | ✅ PASS |
| TC-96 | `POST` | Missing `description` | `400` | `400` | ✅ PASS |
| TC-97 | `POST` | Missing `amount` | `400` | `400` | ✅ PASS |
| TC-98 | `POST` | `budgetPeriodId` non-UUID | `400` | `400` | ✅ PASS |
| TC-99 | `POST` | `budgetPeriodId` unknown | `404` | `404` | ✅ PASS |
| TC-100 | `POST` | `amount` = 0 | `400` | `400` | ✅ PASS |
| TC-101 | `POST` | `amount` negative | `400` | `400` | ✅ PASS |
| TC-102 | `POST` | `amount` > max | `400` | `400` | ✅ PASS |
| TC-103 | `POST` | `amount` 3 decimals | `400` | `400` | ✅ PASS |
| TC-104 | `POST` | Empty `description` | `400` | `400` | ✅ PASS |
| TC-105 | `POST` | `isSalary` wrong type | `400` | `400` | ✅ PASS |
| TC-106 | `POST` | `receivedAt` bad format | `400` | `400` | ✅ PASS |
| TC-107 | `GET` | List all | `200` array | `200` | ✅ PASS |
| TC-108 | `GET` | List filtered by period | `200` | `200` | ✅ PASS |
| TC-109 | `GET` | Filter value non-UUID | `400` | `400` | ✅ PASS |
| TC-110 | `GET /:id` | Valid id | `200` | `200` | ✅ PASS |
| TC-111 | `GET /:id` | Non-UUID | `400` | `400` | ✅ PASS |
| TC-112 | `GET /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| TC-113 | `PATCH /:id` | Update `amount` | `200` | `200` | ✅ PASS |
| TC-114 | `PATCH /:id` | Update `receivedAt` date | `200` | `500` | ❌ FAIL (DEF-1) |
| TC-115 | `PATCH /:id` | Clear `receivedAt` (`null`) | `200` | `200` | ✅ PASS |
| TC-116 | `PATCH /:id` | Empty body `{}` | `400` | `400` | ✅ PASS |
| TC-117 | `PATCH /:id` | Empty `description` | `400` | `400` | ✅ PASS |
| TC-118 | `PATCH /:id` | `amount` = 0 | `400` | `400` | ✅ PASS |
| TC-119 | `PATCH /:id` | Non-UUID | `400` | `400` | ✅ PASS |
| TC-120 | `PATCH /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| TC-121 | `DELETE /:id` | Valid delete | `204` | `204` | ✅ PASS |
| TC-122 | `DELETE /:id` | GET after delete | `404` | `404` | ✅ PASS |
| TC-123 | `DELETE /:id` | Second delete | `404` | `404` | ✅ PASS |
| TC-124 | `DELETE /:id` | Non-UUID | `400` | `400` | ✅ PASS |
| TC-125 | `DELETE /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| BR-17 | `POST` | Validates period existence | `404` | `404` | ✅ PASS |
| BR-18 | `POST` | Optional-field defaults | defaults | defaults | ✅ PASS |
| BR-19 | — | Soft delete hides reads | hidden | hidden | ✅ PASS |
| BR-20 | — | Delete existence check | `404` | `404` | ✅ PASS |
| BR-21 | `PATCH` | Empty body rejected | `400` | `400` | ✅ PASS |

---

## 6. Open Defects

| # | Severity | Description | Tracked |
|---|---|---|---|
| DEF-1 | High | **`POST` / `PATCH /incomes` with a `receivedAt` date returns `500`.** The DTO validates `receivedAt` as a date-only string (`z.iso.date()`), but the Prisma `@db.Date` column requires an ISO-8601 DateTime, so the value is rejected by the client (TC-92, TC-114). Setting a received date is impossible. Omitting it or sending `null` works. Suggested fix: `z.coerce.date()`. The same `z.iso.date()` → `@db.Date` pattern likely affects the **expense** date fields (untested). | [#28](https://github.com/GuiziBr/budget-manager-server/issues/28) |

---

## 7. Notes

- **Lookup entity shape:** `{ id, name, [hasBudgetEnvelope | hasStatement], createdAt, updatedAt, deletedAt }` — `deletedAt` is `null` on creation.
- **Budget-period entity shape:** `{ id, year, month, createdAt, updatedAt, deletedAt }`. No `PATCH` endpoint — periods are immutable.
- **Boolean fields are required on create** (categories / payment-types). Although the DB columns default to `false`, the create schema requires `hasBudgetEnvelope` / `hasStatement` explicitly — omitting them returns `400`.
- **`year` bounds** for budget-periods: min `2000`, max `current year + 1` (inclusive). Current year at test time was 2026, so the accepted range was `2000`–`2027`.
- **Opening a budget period has side effects:** it auto-creates budget envelopes (for `hasBudgetEnvelope` categories), recurring-expense entries, and due installments. A freshly-opened period may therefore already hold linked records and not be deletable.
- **Validation error shape:** `400` with Zod issues under `message` (array), plus `error` and `statusCode`.
- **Not-found message:** `{ "message": "<Domain> with id <uuid> not found", "error": "Not Found", "statusCode": 404 }`.

---

## 8. Conclusion

The four lookup domains and the budget-period domain pass fully. The income domain passes except for one defect: setting `receivedAt` to a date on `POST` or `PATCH` returns `500` (**DEF-1**, [#28](https://github.com/GuiziBr/budget-manager-server/issues/28)) — all other income behaviour (validation, defaults, filtering, CRUD, soft delete, empty-`PATCH` guard) is correct. The same date-handling pattern should be checked on the expense domain.
