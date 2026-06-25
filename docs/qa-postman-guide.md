# QA — Postman Testing Guide

## Environment Setup

Create a Postman Environment with these variables:

| Variable | Value |
|---|---|
| `base_url` | `http://localhost:3000` |
| `bank_id` | *(fill after GET /banks)* |
| `category_id` | *(fill after GET /categories)* |
| `payment_type_id` | *(fill after GET /payment-types)* |
| `store_id` | *(fill after GET /stores)* |
| `budget_period_id` | *(fill after POST /budget-periods)* |
| `budget_envelope_id` | *(fill after POST /budget-envelopes)* |
| `income_id` | *(fill after POST /incomes)* |
| `recurring_expense_id` | *(fill after GET /recurring-expenses)* |
| `expense_id` | *(fill after POST /expenses)* |
| `installment_group_id` | *(fill after POST installment expense)* |

All requests use header `Content-Type: application/json`.

---

## Recommended Test Order (dependency chain)

```
1. GET  /banks, /categories, /payment-types, /stores   ← capture IDs
2. POST /budget-periods                                 ← capture budget_period_id
3. POST /budget-envelopes                               ← requires budget_period_id + category_id
4. POST /incomes                                        ← requires budget_period_id
5. POST /expenses (one-time)                            ← requires all lookup IDs
6. POST /expenses (recurring)                           ← creates recurring-expense record
7. GET  /recurring-expenses                             ← capture recurring_expense_id
8. POST /expenses (installment)                         ← creates installment-group record
9. GET  /installment-groups/:id                         ← use installmentGroupId from step 8
```

---

## Step 1 — Seed Lookup Table IDs

These tables already have data. Fetch them to capture IDs for use in later requests.

### Banks

```
GET {{base_url}}/banks
```
Expected: `200` array of banks. Copy an `id` → `bank_id`.

```
GET {{base_url}}/banks/{{bank_id}}
```
Expected: `200` single bank object.

### Categories

```
GET {{base_url}}/categories
```
Expected: `200` array. Copy an `id` where `hasBudgetEnvelope: true` → `category_id`.

```
GET {{base_url}}/categories/{{category_id}}
```

### Payment Types

```
GET {{base_url}}/payment-types
```
Expected: `200` array. Copy an `id` → `payment_type_id`.

```
GET {{base_url}}/payment-types/{{payment_type_id}}
```

### Stores

```
GET {{base_url}}/stores
```
Expected: `200` array. Copy an `id` → `store_id`.

```
GET {{base_url}}/stores/{{store_id}}
```

---

## Step 2 — CRUD on Lookup Tables (verify full cycles)

These domains share the same shape. Verify the full cycle for each.

### Create a Bank

```
POST {{base_url}}/banks
Body:
{
  "name": "Test Bank"
}
```
Expected: `201` with the new bank object.

### Update a Bank

```
PATCH {{base_url}}/banks/{{bank_id}}
Body:
{
  "name": "Updated Bank Name"
}
```
Expected: `200` updated object.

### Delete a Bank

```
DELETE {{base_url}}/banks/{{bank_id}}
```
Expected: `204` no body. Use a throwaway ID, not the one needed downstream.

Repeat the same CRUD pattern for `/categories`, `/payment-types`, and `/stores`.

- **Categories** have an extra required boolean field `hasBudgetEnvelope`.
- **Payment types** have an extra required boolean field `hasStatement`.

**Error cases to verify:**

| Request | Expected |
|---|---|
| `GET /banks/not-a-uuid` | `400` |
| `GET /banks/00000000-0000-0000-0000-000000000000` | `404` |
| `POST /banks` with `{}` | `400` (validation error; issues under `message` array) |

---

## Step 3 — Budget Period

Budget periods have no update endpoint.

### Create

```
POST {{base_url}}/budget-periods
Body:
{
  "year": 2026,
  "month": 4
}
```
Expected: `201`. Copy the returned `id` → `budget_period_id`.

### List all

```
GET {{base_url}}/budget-periods
```
Expected: `200` array.

### Get by ID

```
GET {{base_url}}/budget-periods/{{budget_period_id}}
```
Expected: `200`.

### Delete

```
DELETE {{base_url}}/budget-periods/{{budget_period_id}}
```
Expected: `204`. Create a second period just for this — delete only one not needed downstream.

**Error cases:**

| Request | Expected |
|---|---|
| `POST` with `month: 13` | `400` |
| `POST` with `year: 1999` | `400` |

---

## Step 4 — Budget Envelope

Requires `budget_period_id` and a `category_id` where `hasBudgetEnvelope: true`.

### Create

```
POST {{base_url}}/budget-envelopes
Body:
{
  "budgetPeriodId": "{{budget_period_id}}",
  "categoryId": "{{category_id}}",
  "allocatedAmount": 1500.00
}
```
Expected: `201`. Copy `id` → `budget_envelope_id`.

### List (unfiltered)

```
GET {{base_url}}/budget-envelopes
```

### List filtered by period

```
GET {{base_url}}/budget-envelopes?budgetPeriodId={{budget_period_id}}
```
Expected: `200` array containing only envelopes for that period.

### Get by ID

```
GET {{base_url}}/budget-envelopes/{{budget_envelope_id}}
```

### Update

```
PATCH {{base_url}}/budget-envelopes/{{budget_envelope_id}}
Body:
{
  "allocatedAmount": 2000.00
}
```
Expected: `200`.

### Delete

```
DELETE {{base_url}}/budget-envelopes/{{budget_envelope_id}}
```
Expected: `204`.

**Error cases:**

| Request | Expected |
|---|---|
| `PATCH` with `{}` | `400` (at least one field required) |
| `POST` with `allocatedAmount: 0` | `400` (must be positive) |
| `POST` with `allocatedAmount: 100000000` | `400` (exceeds max) |

---

## Step 5 — Income

### Create (all fields)

```
POST {{base_url}}/incomes
Body:
{
  "budgetPeriodId": "{{budget_period_id}}",
  "description": "Monthly salary",
  "amount": 5000.00,
  "isSalary": true,
  "receivedAt": "2026-04-01"
}
```
Expected: `201`. Copy `id` → `income_id`.

### Create (optional fields omitted)

```
POST {{base_url}}/incomes
Body:
{
  "budgetPeriodId": "{{budget_period_id}}",
  "description": "Freelance payment",
  "amount": 800.00
}
```
Expected: `201` with `isSalary: false` and `receivedAt: null`.

### List (unfiltered)

```
GET {{base_url}}/incomes
```

### List filtered by period

```
GET {{base_url}}/incomes?budgetPeriodId={{budget_period_id}}
```

### Get by ID

```
GET {{base_url}}/incomes/{{income_id}}
```

### Update

```
PATCH {{base_url}}/incomes/{{income_id}}
Body:
{
  "amount": 5200.00,
  "receivedAt": "2026-04-05"
}
```
Expected: `200`.

### Delete

```
DELETE {{base_url}}/incomes/{{income_id}}
```
Expected: `204`.

---

## Step 6 — Expense (three types)

`POST /expenses` is a discriminated union on the `type` field.

### 6a — One-time expense

```
POST {{base_url}}/expenses
Body:
{
  "type": "one-time",
  "budgetPeriodId": "{{budget_period_id}}",
  "categoryId": "{{category_id}}",
  "paymentTypeId": "{{payment_type_id}}",
  "bankId": "{{bank_id}}",
  "storeId": "{{store_id}}",
  "description": "Grocery run",
  "amount": 120.50,
  "purchasedAt": "2026-04-10",
  "dueAt": "2026-05-01",
  "paidAt": "2026-04-10"
}
```
Expected: `201`. Copy `id` → `expense_id`.

### 6b — Recurring expense

Creates the expense record and a separate recurring-expense record at the same time.

```
POST {{base_url}}/expenses
Body:
{
  "type": "recurring",
  "budgetPeriodId": "{{budget_period_id}}",
  "categoryId": "{{category_id}}",
  "paymentTypeId": "{{payment_type_id}}",
  "description": "Netflix",
  "amount": 19.99,
  "purchasedAt": "2026-04-01"
}
```
Expected: `201`. After this, proceed to Step 7 to manage the recurring-expense record.

### 6c — Installment expense

Creates the expense record and a separate installment-group record at the same time.

```
POST {{base_url}}/expenses
Body:
{
  "type": "installment",
  "budgetPeriodId": "{{budget_period_id}}",
  "categoryId": "{{category_id}}",
  "paymentTypeId": "{{payment_type_id}}",
  "bankId": "{{bank_id}}",
  "description": "New laptop",
  "amountPerInstallment": 250.00,
  "totalInstallments": 12,
  "paymentIntervalDays": 30,
  "firstPurchasedAt": "2026-04-01"
}
```
Expected: `201`. The response includes an `installmentGroupId` — copy it → `installment_group_id`.

### List (unfiltered, paginated)

```
GET {{base_url}}/expenses
```
Response shape: `{ data, total, page, limit }`.

### List filtered and paginated

```
GET {{base_url}}/expenses?budgetPeriodId={{budget_period_id}}&page=1&limit=10
```

### Get by ID

```
GET {{base_url}}/expenses/{{expense_id}}
```

### Update

```
PATCH {{base_url}}/expenses/{{expense_id}}
Body:
{
  "description": "Grocery run (updated)",
  "paidAt": "2026-04-11",
  "amount": 135.00
}
```
Expected: `200`.

### Update — clear an optional date field

```
PATCH {{base_url}}/expenses/{{expense_id}}
Body:
{
  "paidAt": null
}
```
Expected: `200` with `paidAt: null`.

### Delete

```
DELETE {{base_url}}/expenses/{{expense_id}}
```
Expected: `204`.

**Error cases:**

| Request | Expected |
|---|---|
| `POST` with `type: "installment"` missing `totalInstallments` | `400` |
| `POST` with `type: "installment"` and `totalInstallments: 1` | `400` (min: 2) |
| `POST` with `type: "one-time"` using installment-only fields | `400` |
| `PATCH` with `{}` | `400` |

---

## Step 7 — Recurring Expense

> There is no `POST /recurring-expenses` endpoint. Recurring expenses are created implicitly when posting an expense with `"type": "recurring"` (Step 6b). Use these endpoints to manage them afterward.

### List all

```
GET {{base_url}}/recurring-expenses
```
Expected: `200` array. Copy an `id` → `recurring_expense_id`.

### Get by ID

```
GET {{base_url}}/recurring-expenses/{{recurring_expense_id}}
```

### Update

```
PATCH {{base_url}}/recurring-expenses/{{recurring_expense_id}}
Body:
{
  "description": "Updated Netflix subscription",
  "amount": 22.99
}
```
Expected: `200`.

### Cancel (set cancelledAt)

```
PATCH {{base_url}}/recurring-expenses/{{recurring_expense_id}}
Body:
{
  "cancelledAt": "2026-05-01"
}
```
Expected: `200`.

### Delete

```
DELETE {{base_url}}/recurring-expenses/{{recurring_expense_id}}
```
Expected: `204`. Use a throwaway record, not the one used above.

---

## Step 8 — Installment Group

The installment group is created automatically in Step 6c. There is no list or delete endpoint — only `GET` and `PATCH`.

### Get by ID

```
GET {{base_url}}/installment-groups/{{installment_group_id}}
```
Expected: `200` with group details and all associated installment expenses.

### Update (multiple fields)

```
PATCH {{base_url}}/installment-groups/{{installment_group_id}}
Body:
{
  "amountPerInstallment": 275.00,
  "totalInstallments": 10
}
```
Expected: `200`.

### Update (single field)

```
PATCH {{base_url}}/installment-groups/{{installment_group_id}}
Body:
{
  "amountPerInstallment": 300.00
}
```
Expected: `200`.

**Error cases:**

| Request | Expected |
|---|---|
| `PATCH` with `{}` | `400` |
| `PATCH` with `totalInstallments: 0` | `400` |

---

---

---

# Part 2 — Business Scenario Tests

> Run these after all Part 1 steps pass. These scenarios verify business rules, edge cases, and contracts that a frontend application depends on. Many of them have **unknown** expected outcomes — record what the server actually returns so the frontend team can code against it.

---

## S1 — Referential Integrity on Delete

Tests what happens when you delete a record that other records depend on. The frontend needs this to decide whether to show a warning dialog or handle a cascade.

### S1a — Delete a bank that has expenses

First create a bank, create an expense using that bank, then delete the bank.

```
DELETE {{base_url}}/banks/{{bank_with_expenses_id}}
```
**Record result:** Does it return `204`, `409`, or `400`? Does the expense still return the bank's data afterward?

### S1b — Delete a category that has expenses and budget envelopes

```
DELETE {{base_url}}/categories/{{category_with_expenses_id}}
```
**Record result:** `204`, `409`, or `400`?

### S1c — Delete a budget period that has envelopes, incomes, and expenses

```
DELETE {{base_url}}/budget-periods/{{budget_period_id}}
```
**Record result:** Does it cascade-delete all child records, block with an error, or succeed silently? Immediately follow with:

```
GET {{base_url}}/incomes?budgetPeriodId={{budget_period_id}}
GET {{base_url}}/expenses?budgetPeriodId={{budget_period_id}}
GET {{base_url}}/budget-envelopes?budgetPeriodId={{budget_period_id}}
```
**Record result:** Are child records gone, still there, or does the endpoint return an error?

---

## S2 — Duplicate and Conflict Detection

Tests whether the backend enforces uniqueness rules the frontend would need to know about.

### S2a — Duplicate budget period

Create a period that already exists.

```
POST {{base_url}}/budget-periods
Body:
{
  "year": 2026,
  "month": 4
}
```
(Use a year/month you already created in Part 1.)

**Record result:** `201` (allowed), `409 Conflict`, or `400`?

### S2b — Duplicate budget envelope (same category, same period)

```
POST {{base_url}}/budget-envelopes
Body:
{
  "budgetPeriodId": "{{budget_period_id}}",
  "categoryId": "{{category_id}}",
  "allocatedAmount": 500.00
}
```
(Use the same `budgetPeriodId` and `categoryId` from a previously created envelope.)

**Record result:** `201` (duplicates allowed), `409`, or `400`?

---

## S3 — Soft Delete Consumer Behaviour

Verifies that deleted records behave correctly from a consumer's perspective (cache invalidation, list refresh).

### S3a — GET a deleted record by ID

Delete any record, then immediately fetch it:

```
DELETE {{base_url}}/banks/{{throwaway_bank_id}}

GET {{base_url}}/banks/{{throwaway_bank_id}}
```
**Expected:** `404`. **Record result if different.**

### S3b — Deleted record excluded from list

After the delete above:

```
GET {{base_url}}/banks
```
**Expected:** The deleted bank does not appear in the array. **Record result if different.**

### S3c — DELETE is idempotent

Call delete twice on the same ID:

```
DELETE {{base_url}}/banks/{{throwaway_bank_id}}
DELETE {{base_url}}/banks/{{throwaway_bank_id}}
```
**Record result:** `204` both times, or `404` on the second call?

---

## S4 — Envelope Spend Tracking

The most critical gap for a budget UI. Tests whether envelope responses include any computed spend/balance data.

### S4a — Envelope response after expenses are added

Create a budget envelope, then create one or more expenses in the same period and category. Then fetch the envelope:

```
GET {{base_url}}/budget-envelopes/{{budget_envelope_id}}
```
**Record result:** Does the response include any of these fields?
- `spentAmount`
- `remainingAmount`
- `utilizationPercentage`
- Any other computed field

### S4b — Envelope list with spend data

```
GET {{base_url}}/budget-envelopes?budgetPeriodId={{budget_period_id}}
```
**Record result:** Same question — does each envelope in the list include spend data?

> **If the API returns no spend data on envelopes:** The frontend must aggregate totals client-side from `GET /expenses?budgetPeriodId=...`. Document this explicitly as the expected integration pattern.

---

## S5 — Type-Specific Expense Response Shapes

Verifies which fields are present on each expense type's response, so the frontend knows what to render.

### S5a — GET a one-time expense

```
GET {{base_url}}/expenses/{{one_time_expense_id}}
```
**Record all fields returned.**

### S5b — GET a recurring expense

```
GET {{base_url}}/expenses/{{recurring_expense_id}}
```
**Record all fields returned.** Specifically note:
- Is `recurringExpenseId` present?
- Is `startedAt` present?
- Are installment fields (`amountPerInstallment`, `totalInstallments`) absent?

### S5c — GET an installment expense

```
GET {{base_url}}/expenses/{{installment_expense_id}}
```
**Record all fields returned.** Specifically note:
- Is `installmentGroupId` present?
- Is `amountPerInstallment` present?
- Is `totalInstallments` or `installmentNumber` present?

---

## S6 — Recurring Expense Lifecycle

Tests the business impact of updating and cancelling a recurring expense — specifically whether changes affect past records.

### S6a — Update recurring expense, then check linked expense record

```
PATCH {{base_url}}/recurring-expenses/{{recurring_expense_id}}
Body:
{
  "amount": 99.99,
  "description": "New description"
}
```

Then fetch the original expense that was created alongside this recurring record:

```
GET {{base_url}}/expenses/{{recurring_linked_expense_id}}
```
**Record result:** Did `amount` and `description` change on the expense, or only on the recurring-expense record?

### S6b — Cancel a recurring expense, then attempt a new expense of same type

Set `cancelledAt` on the recurring expense, then try creating a new expense entry for the next month that references the same recurring expense (if the API supports linking them):

```
PATCH {{base_url}}/recurring-expenses/{{recurring_expense_id}}
Body:
{
  "cancelledAt": "2026-05-01"
}
```

**Record result:** Does the response still allow future expense entries to reference this recurring record, or is it locked?

---

## S7 — Installment Group Mutation Effects

Tests what actually changes downstream when an installment group is patched — the frontend's installment schedule display depends on this.

### S7a — Reduce totalInstallments

Create a 6-installment group, then reduce it to 4:

```
PATCH {{base_url}}/installment-groups/{{installment_group_id}}
Body:
{
  "totalInstallments": 4
}
```

Then fetch the group:

```
GET {{base_url}}/installment-groups/{{installment_group_id}}
```
**Record result:** Are installments 5 and 6 deleted? Is `totalInstallments` now 4?

### S7b — Increase totalInstallments

```
PATCH {{base_url}}/installment-groups/{{installment_group_id}}
Body:
{
  "totalInstallments": 8
}
```

```
GET {{base_url}}/installment-groups/{{installment_group_id}}
```
**Record result:** Are new installment expense records created for installments 5–8?

### S7c — Change amountPerInstallment, verify existing records

```
PATCH {{base_url}}/installment-groups/{{installment_group_id}}
Body:
{
  "amountPerInstallment": 999.00
}
```

Fetch one of the individual installment expense records:

```
GET {{base_url}}/expenses/{{installment_expense_id}}
```
**Record result:** Did `amount` update on the individual expense, or only on the group-level record?

---

## S8 — Explicit Null vs Omitted Fields

Tests that a frontend form can explicitly clear optional foreign keys and dates, not just omit them.

### S8a — Create expense with explicit null bank and store

```
POST {{base_url}}/expenses
Body:
{
  "type": "one-time",
  "budgetPeriodId": "{{budget_period_id}}",
  "categoryId": "{{category_id}}",
  "paymentTypeId": "{{payment_type_id}}",
  "bankId": null,
  "storeId": null,
  "description": "Cash purchase",
  "amount": 50.00
}
```
**Expected:** `201`. **Record result if `400`.**

### S8b — Clear a bank from an existing expense

```
PATCH {{base_url}}/expenses/{{expense_id}}
Body:
{
  "bankId": null
}
```
**Expected:** `200` with `bankId: null`. **Record result if different.**

### S8c — Clear `receivedAt` from an income

```
PATCH {{base_url}}/incomes/{{income_id}}
Body:
{
  "receivedAt": null
}
```
**Expected:** `200` with `receivedAt: null`. **Record result if different.**

---

## S9 — Empty State List Responses

Tests what a list endpoint returns when there is no data — the frontend distinguishes empty state from an error.

### S9a — Expenses for a brand-new period

Create a fresh budget period, then query expenses for it without adding any:

```
POST {{base_url}}/budget-periods
Body: { "year": 2025, "month": 1 }

GET {{base_url}}/expenses?budgetPeriodId={{new_empty_period_id}}
```
**Expected:** `200` with `{ data: [], total: 0, page: 1, limit: <default> }`. **Record actual shape.**

### S9b — Envelopes for a brand-new period

```
GET {{base_url}}/budget-envelopes?budgetPeriodId={{new_empty_period_id}}
```
**Expected:** `200` with `[]`. **Record actual shape.**

### S9c — Incomes for a brand-new period

```
GET {{base_url}}/incomes?budgetPeriodId={{new_empty_period_id}}
```
**Expected:** `200` with `[]`. **Record actual shape.**

---

## S10 — Pagination Defaults and Edge Cases

### S10a — Default pagination values

```
GET {{base_url}}/expenses
```
**Record result:** What are the default `page` and `limit` values in the response?

### S10b — Page beyond total

With fewer than 100 expenses total, request a page that doesn't exist:

```
GET {{base_url}}/expenses?page=9999&limit=10
```
**Record result:** `{ data: [], total: N, page: 9999, limit: 10 }` or `404`?

### S10c — Limit at maximum boundary

```
GET {{base_url}}/expenses?page=1&limit=100
```
**Expected:** `200`.

### S10d — Limit exceeds maximum

```
GET {{base_url}}/expenses?page=1&limit=101
```
**Expected:** `400`. **Record result if different.**

---

## S11 — List Sort Order

Tests the default ordering of each list so the frontend knows whether client-side sorting is needed.

### S11a — Budget periods

```
GET {{base_url}}/budget-periods
```
**Record result:** Are they sorted by `year`/`month` ascending, descending, or by `createdAt`?

### S11b — Expenses

```
GET {{base_url}}/expenses
```
**Record result:** What field determines order? `purchasedAt`? `createdAt`? Newest first or oldest first?

### S11c — Lookup tables (banks, categories, stores, payment types)

```
GET {{base_url}}/banks
GET {{base_url}}/categories
```
**Record result:** Alphabetical by `name`, or by insertion order?

---

## S12 — Category hasBudgetEnvelope Enforcement

### S12a — Create envelope for a non-envelope category

Find or create a category where `hasBudgetEnvelope: false`, then try:

```
POST {{base_url}}/budget-envelopes
Body:
{
  "budgetPeriodId": "{{budget_period_id}}",
  "categoryId": "{{non_envelope_category_id}}",
  "allocatedAmount": 100.00
}
```
**Record result:** `400`, `422`, or `201` (allowed)?

---

## Validation Error Reference

All validation failures return `400` with this shape (Zod v4 format). The Zod
issues are returned under `message` (an **array**), alongside `error` and
`statusCode`:

```json
{
  "message": [
    {
      "origin": "string",
      "code": "too_small",
      "minimum": 1,
      "inclusive": true,
      "path": ["name"],
      "message": "Too small: expected string to have >=1 characters"
    }
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

A missing required field produces an `invalid_type` issue instead:

```json
{
  "message": [
    {
      "expected": "boolean",
      "code": "invalid_type",
      "path": ["hasBudgetEnvelope"],
      "message": "Invalid input: expected boolean, received undefined"
    }
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

Not-found errors return `404`:

```json
{
  "statusCode": 404,
  "message": "Bank not found"
}
```

### Monetary Amount Rules

Applies to all `amount`, `allocatedAmount`, and `amountPerInstallment` fields:

- Must be a positive number
- Maximum value: `99,999,999.99`
- At most 2 decimal places
