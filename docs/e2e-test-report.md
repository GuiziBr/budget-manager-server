# E2E Test Report — Lookup Domains

## 1. Summary

| | |
|---|---|
| **Report title** | End-to-end API verification — lookup domains |
| **Date** | 2026-06-18 |
| **Tester** | Ricardo (ricardo.guizi@invokemedia.com) |
| **Build** | commit `386476b`, app version `0.0.1` |
| **Environment** | Local — `http://localhost:3000`, PostgreSQL via Docker Compose |
| **Tooling** | `curl` (direct HTTP against the running server) |
| **Overall result** | ✅ **PASS** — all functional cases and business rules pass |

---

## 2. Scope

| Domain | Coverage |
|---|---|
| **Banks** | Full lifecycle — `POST`, `GET` (list + by id), `PATCH`, `DELETE` — plus business rules (uniqueness, soft delete, delete existence check) |
| **Payment-types** | Full lifecycle + business rules + `hasStatement` handling |
| **Categories** | Full lifecycle + business rules + `hasBudgetEnvelope` handling |
| **Stores** | Full lifecycle + business rules |

**Out of scope:** other domains (budget-period, budget-envelope, income, expense, recurring-expense, installment-group) and the business-scenario tests in `qa-postman-guide.md` Part 2.

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

---

## 6. Notes

- **Created entity shape:** `{ id, name, [hasBudgetEnvelope | hasStatement], createdAt, updatedAt, deletedAt }` — `deletedAt` is `null` on creation.
- **Boolean fields are required on create.** Although the DB columns default to `false`, the create schema requires `hasBudgetEnvelope` / `hasStatement` explicitly — omitting them returns `400`.
- **Validation error shape:** `400` with Zod issues under `message` (array), plus `error` and `statusCode`.
- **Not-found message:** `{ "message": "<Domain> with id <uuid> not found", "error": "Not Found", "statusCode": 404 }`.

---

## 7. Conclusion

All CRUD endpoints and business rules for the four lookup domains pass. No open defects in the tested scope.
