# E2E Test Report

## 1. Summary

| | |
|---|---|
| **Report title** | End-to-end API verification — lookup domains |
| **Date executed** | 2026-06-16 |
| **Tester** | Ricardo (ricardo.guizi@invokemedia.com) |
| **Build under test** | commit `938d2a4` on branch `development`, app version `0.0.1` |
| **Environment** | Local — `http://localhost:3000`, PostgreSQL via Docker Compose |
| **Tooling** | `curl` (direct HTTP against the running server) |
| **Overall result** | ⚠️ **PASS WITH FINDINGS** — all functional cases passed; **2 cross-cutting defects** tracked: DEF-1 (name uniqueness not enforced, [#22](https://github.com/GuiziBr/budget-manager-server/issues/22)) and DEF-2 (empty `PATCH` accepted, [#23](https://github.com/GuiziBr/budget-manager-server/issues/23)) — both confirmed on banks and payment-types |

---

## 2. Scope

### In scope

| Domain | Coverage |
|---|---|
| **Banks** | Full lifecycle — `POST`, `GET` (list + by id), `PATCH`, `DELETE` — plus business rules (uniqueness, soft delete, idempotency) |
| **Payment-types** | Full lifecycle — `POST`, `GET` (list + by id), `PATCH`, `DELETE` — plus business rules (uniqueness, soft delete, idempotency, `hasStatement` handling) |
| **Categories** | Full lifecycle — `POST`, `GET` (list + by id), `PATCH`, `DELETE` — plus business rules (uniqueness, soft delete, idempotency, `hasBudgetEnvelope` handling) |
| **Stores** | Full lifecycle — `POST`, `GET` (list + by id), `PATCH`, `DELETE` — plus business rules (uniqueness, soft delete, idempotency) |

### Out of scope

- All other domains (budget-period, budget-envelope, income, expense, recurring-expense, installment-group).
- Business-scenario / referential-integrity tests (see `qa-postman-guide.md`, Part 2).

---

## 3. Test Environment Preconditions

- Server reachable: `GET /banks` → `200`.
- Database seeded and writable (records were successfully created during the run).
- `Content-Type: application/json` sent on every request.

---

## 4. Test Cases & Results

Response timestamps are in UTC as returned by the server. Each subsection covers all test cases for a single API.

### 4.1 — Banks

#### `POST /banks`

##### TC-01 — Valid body

- **Request body:** `{ "name": "Test Bank" }`
- **Expected:** `201` with the created bank object.
- **Actual:** `201`
  ```json
  {
    "id": "b1f96468-9881-4063-85bf-e44742ee808a",
    "name": "Test Bank",
    "createdAt": "2026-06-17T04:12:13.453Z",
    "updatedAt": "2026-06-17T04:12:13.453Z",
    "deletedAt": null
  }
  ```
- **Result:** ✅ PASS

##### TC-02 — Invalid: empty body

- **Request body:** `{}`
- **Expected:** `400` with a validation error for the missing `name`.
- **Actual:** `400`
  ```json
  {
    "message": [
      { "expected": "string", "code": "invalid_type", "path": ["name"],
        "message": "Invalid input: expected string, received undefined" }
    ],
    "error": "Bad Request",
    "statusCode": 400
  }
  ```
- **Result:** ✅ PASS

#### `GET /banks`

##### TC-09 — List all banks

- **Request:** `GET /banks`
- **Expected:** `200` with an array of non-deleted banks.
- **Actual:** `200`
  ```json
  [
    { "id": "63c374b5-005f-462d-b10c-0e9c1382073e", "name": "CIBC", "createdAt": "2026-06-17T04:09:54.598Z", "updatedAt": "2026-06-17T04:09:54.598Z", "deletedAt": null },
    { "id": "b1f96468-9881-4063-85bf-e44742ee808a", "name": "Test Bank", "createdAt": "2026-06-17T04:12:13.453Z", "updatedAt": "2026-06-17T04:12:13.453Z", "deletedAt": null }
  ]
  ```
- **Result:** ✅ PASS

#### `GET /banks/:id`

##### TC-10 — Valid id

- **Request:** `GET /banks/2b1ac1e1-d26f-45d2-aa7d-8bdcd387e957`
- **Expected:** `200` with the matching bank object.
- **Actual:** `200`
  ```json
  {
    "id": "2b1ac1e1-d26f-45d2-aa7d-8bdcd387e957",
    "name": "QA Bank Primary",
    "createdAt": "2026-06-17T04:26:29.223Z",
    "updatedAt": "2026-06-17T04:26:29.223Z",
    "deletedAt": null
  }
  ```
- **Result:** ✅ PASS

##### TC-11 — Non-UUID id

- **Request:** `GET /banks/not-a-uuid`
- **Expected:** `400` (param validation fails before reaching the service).
- **Actual:** `400`
  ```json
  {
    "message": [
      { "origin": "string", "code": "invalid_format", "format": "uuid",
        "path": [], "message": "Invalid UUID" }
    ],
    "error": "Bad Request",
    "statusCode": 400
  }
  ```
- **Result:** ✅ PASS

##### TC-12 — Unknown UUID

- **Request:** `GET /banks/00000000-0000-0000-0000-000000000000`
- **Expected:** `404` with a not-found message.
- **Actual:** `404`
  ```json
  { "message": "Bank with id 00000000-0000-0000-0000-000000000000 not found", "error": "Not Found", "statusCode": 404 }
  ```
- **Result:** ✅ PASS

#### `PATCH /banks/:id`

##### TC-13 — Valid rename

- **Request body:** `{ "name": "QA Bank Renamed" }`
- **Expected:** `200`; `name` updated and `updatedAt` bumped.
- **Actual:** `200` — `updatedAt` advanced from `...29.223Z` to `...29.314Z`.
  ```json
  {
    "id": "2b1ac1e1-d26f-45d2-aa7d-8bdcd387e957",
    "name": "QA Bank Renamed",
    "createdAt": "2026-06-17T04:26:29.223Z",
    "updatedAt": "2026-06-17T04:26:29.314Z",
    "deletedAt": null
  }
  ```
- **Result:** ✅ PASS

##### TC-14 — Empty body `{}`

- **Request body:** `{}`
- **Expected (per established convention):** `400` "At least one field must be provided".
- **Actual:** `200` — no-op, record unchanged, `updatedAt` **not** bumped (stayed `...29.314Z`). ❌ Inconsistent with the rich domains. See **DEF-2** ([#23](https://github.com/GuiziBr/budget-manager-server/issues/23)).
- **Result:** ⚠️ Behaves per current (flawed) implementation; tracked as DEF-2.

##### TC-15 — Empty name `""`

- **Request body:** `{ "name": "" }`
- **Expected:** `400` for the `min(1)` violation.
- **Actual:** `400`
  ```json
  {
    "message": [
      { "origin": "string", "code": "too_small", "minimum": 1, "inclusive": true,
        "path": ["name"], "message": "Too small: expected string to have >=1 characters" }
    ],
    "error": "Bad Request",
    "statusCode": 400
  }
  ```
- **Result:** ✅ PASS

##### TC-16 — Non-UUID id

- **Request:** `PATCH /banks/not-a-uuid` body `{ "name": "x" }`
- **Expected:** `400`.
- **Actual:** `400` (`invalid_format`, "Invalid UUID").
- **Result:** ✅ PASS

##### TC-17 — Unknown UUID

- **Request:** `PATCH /banks/00000000-0000-0000-0000-000000000000` body `{ "name": "x" }`
- **Expected:** `404`.
- **Actual:** `404` ("Bank with id ... not found").
- **Result:** ✅ PASS

#### `DELETE /banks/:id`

##### TC-18 — Valid delete

- **Request:** `DELETE /banks/9cc97b49-8edb-4029-bb69-e43cbfe82cef`
- **Expected:** `204` no content (soft delete).
- **Actual:** `204`
- **Result:** ✅ PASS

##### TC-19 — GET after delete (soft-delete consumer)

- **Request:** `GET /banks/9cc97b49-8edb-4029-bb69-e43cbfe82cef`
- **Expected:** `404` — soft-deleted records are not retrievable.
- **Actual:** `404`
- **Result:** ✅ PASS

##### TC-20 — Deleted record excluded from list

- **Request:** `GET /banks`
- **Expected:** the deleted id does not appear in the array.
- **Actual:** `200`; 0 occurrences of the deleted id.
- **Result:** ✅ PASS

##### TC-21 — Idempotency (second delete)

- **Request:** `DELETE /banks/9cc97b49-8edb-4029-bb69-e43cbfe82cef` (already deleted)
- **Expected:** `404` — the record is no longer visible to the service's existence check.
- **Actual:** `404`
- **Result:** ✅ PASS (delete is **not** silently idempotent — it returns `404` once gone)

##### TC-22 — Non-UUID id

- **Request:** `DELETE /banks/not-a-uuid`
- **Expected:** `400`.
- **Actual:** `400` (`invalid_format`, "Invalid UUID").
- **Result:** ✅ PASS

##### TC-23 — Unknown UUID

- **Request:** `DELETE /banks/00000000-0000-0000-0000-000000000000`
- **Expected:** `404`.
- **Actual:** `404`.
- **Result:** ✅ PASS

#### Business Rules — Banks

##### BR-1 — Bank name uniqueness ❌

- **Rule under test:** `PrismaBankRepository.create` catches Prisma error `P2002` and throws `409 Conflict` (`"A bank named '<name>' already exists"`), implying bank names must be unique.
- **Steps:** `POST /banks { "name": "QA Dup Bank" }` twice.
- **Expected (per code intent):** first → `201`, second → `409 Conflict`.
- **Actual:** first → `201`, **second → `201`** (a duplicate record was created).
  ```json
  { "id": "57b9190b-fef9-485f-8db5-03f32298af34", "name": "QA Dup Bank", "createdAt": "2026-06-17T04:26:50.990Z", "updatedAt": "2026-06-17T04:26:50.990Z", "deletedAt": null }
  ```
- **Result:** ❌ **FAIL** — see DEF-1.

##### BR-2 — Soft delete hides records from reads ✅

- **Rule:** a soft-deleted bank must not appear in `GET /banks` nor be retrievable by id.
- **Evidence:** TC-19 (`404` by id) and TC-20 (excluded from list).
- **Result:** ✅ PASS

##### BR-3 — Delete existence check ✅

- **Rule:** the service validates existence (`findById`) before mutating, surfacing `404` for already-deleted or unknown records.
- **Evidence:** TC-21 (second delete → `404`), TC-23 (unknown → `404`).
- **Result:** ✅ PASS

### 4.2 — Categories

#### `POST /categories`

##### TC-03 — Valid body

- **Request body:** `{ "name": "Test Category", "hasBudgetEnvelope": true }`
- **Expected:** `201` with the created category object including `hasBudgetEnvelope`.
- **Actual:** `201`
  ```json
  {
    "id": "0c1eb75b-33c2-44ba-8dfa-a9bca1ee541f",
    "name": "Test Category",
    "hasBudgetEnvelope": true,
    "createdAt": "2026-06-17T04:12:13.500Z",
    "updatedAt": "2026-06-17T04:12:13.500Z",
    "deletedAt": null
  }
  ```
- **Result:** ✅ PASS

##### TC-04 — Invalid: missing `hasBudgetEnvelope`

- **Request body:** `{ "name": "Bad Category" }`
- **Expected:** `400` for the missing required boolean. (Note: the DB column has `@default(false)`, but the create schema requires the field explicitly — the default is not applied at the API layer.)
- **Actual:** `400`
  ```json
  {
    "message": [
      { "expected": "boolean", "code": "invalid_type", "path": ["hasBudgetEnvelope"],
        "message": "Invalid input: expected boolean, received undefined" }
    ],
    "error": "Bad Request",
    "statusCode": 400
  }
  ```
- **Result:** ✅ PASS

##### TC-40 — Invalid: `hasBudgetEnvelope` wrong type

- **Request body:** `{ "name": "QA Cat BadFlag", "hasBudgetEnvelope": "yes" }`
- **Expected / Actual:** `400` (`invalid_type`, expected boolean).
- **Result:** ✅ PASS

#### `GET /categories`

##### TC-41 — List all

- **Request:** `GET /categories`
- **Expected:** `200` with an array of non-deleted categories.
- **Actual:** `200`
  ```json
  [
    { "id": "0c1eb75b-33c2-44ba-8dfa-a9bca1ee541f", "name": "Test Category", "hasBudgetEnvelope": true, "createdAt": "2026-06-17T04:12:13.500Z", "updatedAt": "2026-06-17T04:12:13.500Z", "deletedAt": null }
  ]
  ```
- **Result:** ✅ PASS

#### `GET /categories/:id`

##### TC-42 — Valid id

- **Request:** `GET /categories/81f625f9-fec2-4be2-a136-7d8ec6ef7674`
- **Expected / Actual:** `200` with the matching object (`"QA Cat Primary"`, `hasBudgetEnvelope: true`).
- **Result:** ✅ PASS

##### TC-43 — Non-UUID id

- **Request:** `GET /categories/not-a-uuid`
- **Expected / Actual:** `400` (`invalid_format`, "Invalid UUID").
- **Result:** ✅ PASS

##### TC-44 — Unknown UUID

- **Request:** `GET /categories/00000000-0000-0000-0000-000000000000`
- **Expected / Actual:** `404` ("Category with id ... not found").
- **Result:** ✅ PASS

#### `PATCH /categories/:id`

##### TC-45 — Valid rename (name only)

- **Request body:** `{ "name": "QA Cat Renamed" }`
- **Expected:** `200`; `name` updated, `updatedAt` bumped.
- **Actual:** `200` — `updatedAt` advanced `...37.565Z` → `...37.650Z`.
- **Result:** ✅ PASS

##### TC-46 — Toggle `hasBudgetEnvelope` only

- **Request body:** `{ "hasBudgetEnvelope": false }`
- **Expected:** `200`; flag flipped to `false`, other fields preserved.
- **Actual:** `200`
  ```json
  {
    "id": "81f625f9-fec2-4be2-a136-7d8ec6ef7674",
    "name": "QA Cat Renamed",
    "hasBudgetEnvelope": false,
    "createdAt": "2026-06-17T04:47:37.565Z",
    "updatedAt": "2026-06-17T04:47:37.667Z",
    "deletedAt": null
  }
  ```
- **Result:** ✅ PASS

##### TC-47 — Empty body `{}`

- **Request body:** `{}`
- **Expected (per established convention):** `400` "At least one field must be provided".
- **Actual:** `200` — no-op, `updatedAt` not bumped. ❌ Inconsistent with the rich domains. See **DEF-2** ([#23](https://github.com/GuiziBr/budget-manager-server/issues/23)).
- **Result:** ⚠️ Behaves per current (flawed) implementation; tracked as DEF-2.

##### TC-48 — Empty name `""`

- **Request body:** `{ "name": "" }`
- **Expected / Actual:** `400` (`too_small`, min 1).
- **Result:** ✅ PASS

##### TC-49 — Unknown UUID

- **Request:** `PATCH /categories/00000000-0000-0000-0000-000000000000` body `{ "name": "x" }`
- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

#### `DELETE /categories/:id`

##### TC-50 — Valid delete

- **Request:** `DELETE /categories/2ec50867-b893-44ee-a4d2-73ca95202eb8`
- **Expected / Actual:** `204` (soft delete).
- **Result:** ✅ PASS

##### TC-51 — GET after delete

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

##### TC-52 — Excluded from list

- **Request:** `GET /categories` — **Actual:** 0 occurrences of the deleted id.
- **Result:** ✅ PASS

##### TC-53 — Second delete

- **Expected / Actual:** `404` (existence check; not silently idempotent).
- **Result:** ✅ PASS

##### TC-54 — Non-UUID id

- **Request:** `DELETE /categories/not-a-uuid` — **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-55 — Unknown UUID

- **Request:** `DELETE /categories/00000000-0000-0000-0000-000000000000` — **Expected / Actual:** `404`.
- **Result:** ✅ PASS

#### Business Rules — Categories

##### BR-7 — Category name uniqueness ❌

- **Rule under test:** `PrismaCategoryRepository.create`/`update` catch `P2002` and throw `409` (`"A category named '<name>' already exists"`), implying names must be unique.
- **Steps:** `POST /categories { "name": "QA Cat Dup", ... }` twice.
- **Expected (per code intent):** first → `201`, second → `409`.
- **Actual:** first → `201`, **second → `201`** (`id a5f89c6c-...`). No `@unique` on `categories.name`.
- **Result:** ❌ **FAIL** — same root cause as DEF-1 ([#22](https://github.com/GuiziBr/budget-manager-server/issues/22)).

##### BR-8 — Soft delete hides records from reads ✅

- **Evidence:** TC-51 (`404` by id) and TC-52 (excluded from list).
- **Result:** ✅ PASS

##### BR-9 — Delete existence check ✅

- **Evidence:** TC-53 (second delete → `404`), TC-55 (unknown → `404`).
- **Result:** ✅ PASS

### 4.3 — Payment-types

#### `POST /payment-types`

##### TC-05 — Valid body

- **Request body:** `{ "name": "Test Card", "hasStatement": true }`
- **Expected:** `201` with the created payment-type object including `hasStatement`.
- **Actual:** `201`
  ```json
  {
    "id": "17f4a47a-4680-46aa-b6f4-21ca33489025",
    "name": "Test Card",
    "hasStatement": true,
    "createdAt": "2026-06-17T04:12:13.532Z",
    "updatedAt": "2026-06-17T04:12:13.532Z",
    "deletedAt": null
  }
  ```
- **Result:** ✅ PASS

##### TC-06 — Invalid: missing `hasStatement`

- **Request body:** `{ "name": "Bad PT" }`
- **Expected:** `400` for the missing required boolean. (Note: the DB column has `@default(false)`, but the create schema requires the field explicitly — the default is not applied at the API layer.)
- **Actual:** `400`
  ```json
  {
    "message": [
      { "expected": "boolean", "code": "invalid_type", "path": ["hasStatement"],
        "message": "Invalid input: expected boolean, received undefined" }
    ],
    "error": "Bad Request",
    "statusCode": 400
  }
  ```
- **Result:** ✅ PASS

##### TC-25 — Invalid: `hasStatement` wrong type

- **Request body:** `{ "name": "QA PT BadFlag", "hasStatement": "yes" }`
- **Expected:** `400` (`invalid_type`, expected boolean).
- **Actual:** `400` — `"Invalid input: expected boolean, received string"`.
- **Result:** ✅ PASS

#### `GET /payment-types`

##### TC-24 — List all

- **Request:** `GET /payment-types`
- **Expected:** `200` with an array of non-deleted payment types.
- **Actual:** `200`
  ```json
  [
    { "id": "17f4a47a-4680-46aa-b6f4-21ca33489025", "name": "Test Card", "hasStatement": true, "createdAt": "2026-06-17T04:12:13.532Z", "updatedAt": "2026-06-17T04:12:13.532Z", "deletedAt": null }
  ]
  ```
- **Result:** ✅ PASS

#### `GET /payment-types/:id`

##### TC-26 — Valid id

- **Request:** `GET /payment-types/e5232624-8e70-422f-ba95-a5bdbd3852bd`
- **Expected:** `200` with the matching object.
- **Actual:** `200`
  ```json
  {
    "id": "e5232624-8e70-422f-ba95-a5bdbd3852bd",
    "name": "QA PT Primary",
    "hasStatement": true,
    "createdAt": "2026-06-17T04:41:27.687Z",
    "updatedAt": "2026-06-17T04:41:27.687Z",
    "deletedAt": null
  }
  ```
- **Result:** ✅ PASS

##### TC-27 — Non-UUID id

- **Request:** `GET /payment-types/not-a-uuid`
- **Expected / Actual:** `400` (`invalid_format`, "Invalid UUID").
- **Result:** ✅ PASS

##### TC-28 — Unknown UUID

- **Request:** `GET /payment-types/00000000-0000-0000-0000-000000000000`
- **Expected / Actual:** `404` ("Payment type with id ... not found").
- **Result:** ✅ PASS

#### `PATCH /payment-types/:id`

##### TC-29 — Valid rename (name only)

- **Request body:** `{ "name": "QA PT Renamed" }`
- **Expected:** `200`; `name` updated, `updatedAt` bumped.
- **Actual:** `200` — `updatedAt` advanced `...27.687Z` → `...27.764Z`.
- **Result:** ✅ PASS

##### TC-30 — Toggle `hasStatement` only

- **Request body:** `{ "hasStatement": false }`
- **Expected:** `200`; `hasStatement` flipped to `false`, other fields preserved.
- **Actual:** `200`
  ```json
  {
    "id": "e5232624-8e70-422f-ba95-a5bdbd3852bd",
    "name": "QA PT Renamed",
    "hasStatement": false,
    "createdAt": "2026-06-17T04:41:27.687Z",
    "updatedAt": "2026-06-17T04:41:27.778Z",
    "deletedAt": null
  }
  ```
- **Result:** ✅ PASS

##### TC-31 — Empty body `{}`

- **Request body:** `{}`
- **Expected (per established convention):** `400` "At least one field must be provided".
- **Actual:** `200` — no-op, `updatedAt` not bumped. ❌ Inconsistent with the rich domains. See **DEF-2** ([#23](https://github.com/GuiziBr/budget-manager-server/issues/23)).
- **Result:** ⚠️ Behaves per current (flawed) implementation; tracked as DEF-2.

##### TC-32 — Empty name `""`

- **Request body:** `{ "name": "" }`
- **Expected / Actual:** `400` (`too_small`, min 1).
- **Result:** ✅ PASS

##### TC-33 — Unknown UUID

- **Request:** `PATCH /payment-types/00000000-0000-0000-0000-000000000000` body `{ "name": "x" }`
- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

#### `DELETE /payment-types/:id`

##### TC-34 — Valid delete

- **Request:** `DELETE /payment-types/33f197ab-912a-49f6-8297-0577a71dd964`
- **Expected / Actual:** `204` (soft delete).
- **Result:** ✅ PASS

##### TC-35 — GET after delete

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

##### TC-36 — Excluded from list

- **Request:** `GET /payment-types` — **Actual:** 0 occurrences of the deleted id.
- **Result:** ✅ PASS

##### TC-37 — Second delete

- **Expected / Actual:** `404` (existence check; not silently idempotent).
- **Result:** ✅ PASS

##### TC-38 — Non-UUID id

- **Request:** `DELETE /payment-types/not-a-uuid` — **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-39 — Unknown UUID

- **Request:** `DELETE /payment-types/00000000-0000-0000-0000-000000000000` — **Expected / Actual:** `404`.
- **Result:** ✅ PASS

#### Business Rules — Payment-types

##### BR-4 — Payment-type name uniqueness ❌

- **Rule under test:** `PrismaPaymentTypeRepository.create`/`update` catch `P2002` and throw `409` (`"A payment type named '<name>' already exists"`), implying names must be unique.
- **Steps:** `POST /payment-types { "name": "QA PT Dup", ... }` twice.
- **Expected (per code intent):** first → `201`, second → `409`.
- **Actual:** first → `201`, **second → `201`** (`id 84913cfb-...`). No `@unique` on `payment_types.name`.
- **Result:** ❌ **FAIL** — same root cause as DEF-1 ([#22](https://github.com/GuiziBr/budget-manager-server/issues/22)).

##### BR-5 — Soft delete hides records from reads ✅

- **Evidence:** TC-35 (`404` by id) and TC-36 (excluded from list).
- **Result:** ✅ PASS

##### BR-6 — Delete existence check ✅

- **Evidence:** TC-37 (second delete → `404`), TC-39 (unknown → `404`).
- **Result:** ✅ PASS

### 4.4 — Stores

#### `POST /stores`

##### TC-07 — Valid body

- **Request body:** `{ "name": "Test Store" }`
- **Expected:** `201` with the created store object.
- **Actual:** `201`
  ```json
  {
    "id": "a96abc58-400d-48e1-8c4c-f38a899d295b",
    "name": "Test Store",
    "createdAt": "2026-06-17T04:12:13.560Z",
    "updatedAt": "2026-06-17T04:12:13.560Z",
    "deletedAt": null
  }
  ```
- **Result:** ✅ PASS

##### TC-08 — Invalid: empty name

- **Request body:** `{ "name": "" }`
- **Expected:** `400` for the `min(1)` violation.
- **Actual:** `400`
  ```json
  {
    "message": [
      { "origin": "string", "code": "too_small", "minimum": 1, "inclusive": true,
        "path": ["name"], "message": "Too small: expected string to have >=1 characters" }
    ],
    "error": "Bad Request",
    "statusCode": 400
  }
  ```
- **Result:** ✅ PASS

#### `GET /stores`

##### TC-56 — List all

- **Request:** `GET /stores`
- **Expected / Actual:** `200` with an array of non-deleted stores.
  ```json
  [
    { "id": "a96abc58-400d-48e1-8c4c-f38a899d295b", "name": "Test Store", "createdAt": "2026-06-17T04:12:13.560Z", "updatedAt": "2026-06-17T04:12:13.560Z", "deletedAt": null }
  ]
  ```
- **Result:** ✅ PASS

#### `GET /stores/:id`

##### TC-57 — Valid id

- **Request:** `GET /stores/5fd1bdb4-8c10-4a9d-a224-6a46961648ac`
- **Expected / Actual:** `200` with the matching object (`"QA Store Primary"`).
- **Result:** ✅ PASS

##### TC-58 — Non-UUID id

- **Request:** `GET /stores/not-a-uuid`
- **Expected / Actual:** `400` (`invalid_format`, "Invalid UUID").
- **Result:** ✅ PASS

##### TC-59 — Unknown UUID

- **Request:** `GET /stores/00000000-0000-0000-0000-000000000000`
- **Expected / Actual:** `404` ("Store with id ... not found").
- **Result:** ✅ PASS

#### `PATCH /stores/:id`

##### TC-60 — Valid rename

- **Request body:** `{ "name": "QA Store Renamed" }`
- **Expected:** `200`; `name` updated, `updatedAt` bumped.
- **Actual:** `200` — `updatedAt` advanced `...36.659Z` → `...36.738Z`.
- **Result:** ✅ PASS

##### TC-61 — Empty body `{}`

- **Request body:** `{}`
- **Expected (per established convention):** `400` "At least one field must be provided".
- **Actual:** `200` — no-op, `updatedAt` not bumped. ❌ Inconsistent with the rich domains. See **DEF-2** ([#23](https://github.com/GuiziBr/budget-manager-server/issues/23)).
- **Result:** ⚠️ Behaves per current (flawed) implementation; tracked as DEF-2.

##### TC-62 — Empty name `""`

- **Request body:** `{ "name": "" }`
- **Expected / Actual:** `400` (`too_small`, min 1).
- **Result:** ✅ PASS

##### TC-63 — Non-UUID id

- **Request:** `PATCH /stores/not-a-uuid` body `{ "name": "x" }`
- **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-64 — Unknown UUID

- **Request:** `PATCH /stores/00000000-0000-0000-0000-000000000000` body `{ "name": "x" }`
- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

#### `DELETE /stores/:id`

##### TC-65 — Valid delete

- **Request:** `DELETE /stores/52701a63-bdb2-4c19-8cfc-871efa9d6851`
- **Expected / Actual:** `204` (soft delete).
- **Result:** ✅ PASS

##### TC-66 — GET after delete

- **Expected / Actual:** `404`.
- **Result:** ✅ PASS

##### TC-67 — Excluded from list

- **Request:** `GET /stores` — **Actual:** 0 occurrences of the deleted id.
- **Result:** ✅ PASS

##### TC-68 — Second delete

- **Expected / Actual:** `404` (existence check; not silently idempotent).
- **Result:** ✅ PASS

##### TC-69 — Non-UUID id

- **Request:** `DELETE /stores/not-a-uuid` — **Expected / Actual:** `400`.
- **Result:** ✅ PASS

##### TC-70 — Unknown UUID

- **Request:** `DELETE /stores/00000000-0000-0000-0000-000000000000` — **Expected / Actual:** `404`.
- **Result:** ✅ PASS

#### Business Rules — Stores

##### BR-10 — Store name uniqueness ❌

- **Rule under test:** `PrismaStoreRepository.create`/`update` catch `P2002` and throw `409` (`"A store named '<name>' already exists"`), implying names must be unique.
- **Steps:** `POST /stores { "name": "QA Store Dup" }` twice.
- **Expected (per code intent):** first → `201`, second → `409`.
- **Actual:** first → `201`, **second → `201`** (`id 91f36ef8-...`). No `@unique` on `stores.name`.
- **Result:** ❌ **FAIL** — same root cause as DEF-1 ([#22](https://github.com/GuiziBr/budget-manager-server/issues/22)).

##### BR-11 — Soft delete hides records from reads ✅

- **Evidence:** TC-66 (`404` by id) and TC-67 (excluded from list).
- **Result:** ✅ PASS

##### BR-12 — Delete existence check ✅

- **Evidence:** TC-68 (second delete → `404`), TC-70 (unknown → `404`).
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
| TC-14 | `PATCH /:id` | Empty body `{}` | `400` | `200` | ❌ FAIL (DEF-2) |
| TC-15 | `PATCH /:id` | Empty name `""` | `400` | `400` | ✅ PASS |
| TC-16 | `PATCH /:id` | Non-UUID | `400` | `400` | ✅ PASS |
| TC-17 | `PATCH /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| TC-18 | `DELETE /:id` | Valid delete | `204` | `204` | ✅ PASS |
| TC-19 | `DELETE /:id` | GET after delete | `404` | `404` | ✅ PASS |
| TC-20 | `DELETE /:id` | Excluded from list | excluded | excluded | ✅ PASS |
| TC-21 | `DELETE /:id` | Second delete | `404` | `404` | ✅ PASS |
| TC-22 | `DELETE /:id` | Non-UUID | `400` | `400` | ✅ PASS |
| TC-23 | `DELETE /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| BR-1 | `POST` | Duplicate name | `409` | `201` | ❌ FAIL |
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
| TC-31 | `PATCH /:id` | Empty body `{}` | `400` | `200` | ❌ FAIL (DEF-2) |
| TC-32 | `PATCH /:id` | Empty name `""` | `400` | `400` | ✅ PASS |
| TC-33 | `PATCH /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| TC-34 | `DELETE /:id` | Valid delete | `204` | `204` | ✅ PASS |
| TC-35 | `DELETE /:id` | GET after delete | `404` | `404` | ✅ PASS |
| TC-36 | `DELETE /:id` | Excluded from list | excluded | excluded | ✅ PASS |
| TC-37 | `DELETE /:id` | Second delete | `404` | `404` | ✅ PASS |
| TC-38 | `DELETE /:id` | Non-UUID | `400` | `400` | ✅ PASS |
| TC-39 | `DELETE /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| BR-4 | `POST` | Duplicate name | `409` | `201` | ❌ FAIL |
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
| TC-47 | `PATCH /:id` | Empty body `{}` | `400` | `200` | ❌ FAIL (DEF-2) |
| TC-48 | `PATCH /:id` | Empty name `""` | `400` | `400` | ✅ PASS |
| TC-49 | `PATCH /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| TC-50 | `DELETE /:id` | Valid delete | `204` | `204` | ✅ PASS |
| TC-51 | `DELETE /:id` | GET after delete | `404` | `404` | ✅ PASS |
| TC-52 | `DELETE /:id` | Excluded from list | excluded | excluded | ✅ PASS |
| TC-53 | `DELETE /:id` | Second delete | `404` | `404` | ✅ PASS |
| TC-54 | `DELETE /:id` | Non-UUID | `400` | `400` | ✅ PASS |
| TC-55 | `DELETE /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| BR-7 | `POST` | Duplicate name | `409` | `201` | ❌ FAIL |
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
| TC-61 | `PATCH /:id` | Empty body `{}` | `400` | `200` | ❌ FAIL (DEF-2) |
| TC-62 | `PATCH /:id` | Empty name `""` | `400` | `400` | ✅ PASS |
| TC-63 | `PATCH /:id` | Non-UUID | `400` | `400` | ✅ PASS |
| TC-64 | `PATCH /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| TC-65 | `DELETE /:id` | Valid delete | `204` | `204` | ✅ PASS |
| TC-66 | `DELETE /:id` | GET after delete | `404` | `404` | ✅ PASS |
| TC-67 | `DELETE /:id` | Excluded from list | excluded | excluded | ✅ PASS |
| TC-68 | `DELETE /:id` | Second delete | `404` | `404` | ✅ PASS |
| TC-69 | `DELETE /:id` | Non-UUID | `400` | `400` | ✅ PASS |
| TC-70 | `DELETE /:id` | Unknown UUID | `404` | `404` | ✅ PASS |
| BR-10 | `POST` | Duplicate name | `409` | `201` | ❌ FAIL |
| BR-11 | — | Soft delete hides reads | hidden | hidden | ✅ PASS |
| BR-12 | — | Delete existence check | `404` | `404` | ✅ PASS |

---

## 6. Observations & Defects

| # | Severity | Description | Action |
|---|---|---|---|
| DEF-1 | Medium | **Name uniqueness is not enforced.** `create`/`update` repositories catch `P2002` and throw `409`, but no `@unique` constraint exists on the `name` column in `prisma/schema.prisma` or any migration. Duplicate names are persisted with `201`. **Confirmed on all four lookup domains — banks (BR-1), payment-types (BR-4), categories (BR-7), stores (BR-10)**; the conflict-handling code is unreachable. | Tracked in [#22](https://github.com/GuiziBr/budget-manager-server/issues/22). Add a partial unique index (`WHERE deleted_at IS NULL`) + migration, or remove the dead handler. |
| DEF-2 | Low | **Empty `PATCH` body `{}` is accepted as a `200` no-op** on the lookup domains, whereas the rich domains reject it with `400` "At least one field must be provided". `updatedAt` is not bumped. **Confirmed on all four lookup domains — banks (TC-14), payment-types (TC-31), categories (TC-47), stores (TC-61).** Inconsistent client contract. | Tracked in [#23](https://github.com/GuiziBr/budget-manager-server/issues/23). Add the `.refine`/`.superRefine` guard to bank, store, category, payment-type, income. |
| OBS-1 | Info | All create responses include `deletedAt: null` and full `createdAt` / `updatedAt` timestamps, consistent with the soft-delete model. | None — expected behaviour. |
| OBS-2 | Info | `POST /payment-types` and `POST /categories` require their boolean field (`hasStatement` / `hasBudgetEnvelope`) explicitly even though the DB columns have `@default(false)` — the default is not applied at the API layer (TC-06, TC-04). By design of the create schema. | None — documented for consumers. |

---

## 7. Test Data / Cleanup

Records created during this run that remain in the local database (soft-delete model; removable with `DELETE /<domain>/<id>`):

| Domain | ID | Note |
|---|---|---|
| bank | `b1f96468-9881-4063-85bf-e44742ee808a` | "Test Bank" |
| bank | `2b1ac1e1-d26f-45d2-aa7d-8bdcd387e957` | "QA Bank Renamed" (TC-10→TC-14) |
| bank | `57b9190b-fef9-485f-8db5-03f32298af34` | "QA Dup Bank" — duplicate from BR-1 (plus one earlier "QA Dup Bank" id not captured) |
| bank | `9cc97b49-8edb-4029-bb69-e43cbfe82cef` | "QA Bank ToDelete" — already soft-deleted (TC-18) |
| payment-type | `17f4a47a-4680-46aa-b6f4-21ca33489025` | "Test Card" |
| payment-type | `e5232624-8e70-422f-ba95-a5bdbd3852bd` | "QA PT Renamed" (TC-26→TC-31) |
| payment-type | `84913cfb-8385-4c75-953a-234bd5bff959` | "QA PT Dup" — duplicate from BR-4 (plus one earlier "QA PT Dup" id not captured) |
| payment-type | `33f197ab-912a-49f6-8297-0577a71dd964` | "QA PT ToDelete" — already soft-deleted (TC-34) |
| category | `0c1eb75b-33c2-44ba-8dfa-a9bca1ee541f` | "Test Category" |
| category | `81f625f9-fec2-4be2-a136-7d8ec6ef7674` | "QA Cat Renamed" (TC-42→TC-47) |
| category | `a5f89c6c-f22a-44a5-8fdd-f1060065d936` | "QA Cat Dup" — duplicate from BR-7 (plus one earlier "QA Cat Dup" id not captured) |
| category | `2ec50867-b893-44ee-a4d2-73ca95202eb8` | "QA Cat ToDelete" — already soft-deleted (TC-50) |
| store | `a96abc58-400d-48e1-8c4c-f38a899d295b` | "Test Store" |
| store | `5fd1bdb4-8c10-4a9d-a224-6a46961648ac` | "QA Store Renamed" (TC-57→TC-61) |
| store | `91f36ef8-3b4e-4e63-bfa6-9fb969c2e26e` | "QA Store Dup" — duplicate from BR-10 (plus one earlier "QA Store Dup" id not captured) |
| store | `52701a63-bdb2-4c19-8cfc-871efa9d6851` | "QA Store ToDelete" — already soft-deleted (TC-65) |

---

## 8. Conclusion

All four lookup domains — **Banks**, **Payment-types**, **Categories**, and **Stores** — were exercised across their full lifecycle (create, read, update, soft-delete) plus business rules. All happy-path, validation (`400`), and not-found (`404`) behaviours are correct, and the boolean-field handling (`hasStatement`, `hasBudgetEnvelope`) is sound.

Two cross-cutting defects were confirmed on **all four** lookup domains:

- **DEF-1 — name uniqueness not enforced** ([#22](https://github.com/GuiziBr/budget-manager-server/issues/22)): the `P2002 → 409` handler is dead code; duplicate names persist with `201`.
- **DEF-2 — empty `PATCH` accepted** ([#23](https://github.com/GuiziBr/budget-manager-server/issues/23)): lookup domains accept `{}` as a `200` no-op, unlike the rest of the API.

Both are tracked as GitHub issues. No domain-specific defects were found. Note that DEF-2's fix also extends to the **income** domain, which shares the same missing-guard pattern (not tested here).
