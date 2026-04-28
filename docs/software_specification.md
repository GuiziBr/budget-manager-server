# Budget Manager Server — Software Specification

## Overview

A NestJS backend for personal budget management. It tracks monthly budget periods, expenses (one-time, installment, and recurring), income, and spending envelopes backed by an external API for real-time category balances.

---

## Domain Model

## Core Concept: Budget Periods

Everything in the system is scoped to a **BudgetPeriod** — a single calendar month identified by `year` and `month` (e.g., March 2026). Expenses, incomes, and budget envelopes all belong to one period.

A partial unique index enforces that no two active (non-deleted) periods share the same `(year, month)`.

---

## Expense Tracking

All three expense types land as rows in the `EXPENSE` table. The `installment_group_id` and `recurring_expense_id` foreign keys distinguish the type:

### One-Time Expenses
Manually entered by the user. Both `installment_group_id` and `recurring_expense_id` are null.

### Installment Purchases
When a user registers an installment purchase (e.g., a $600 laptop over 3 months), an `INSTALLMENT_GROUP` record is created. The system then auto-generates one `EXPENSE` row per installment, each assigned to the correct future `BudgetPeriod`.

- Due dates are computed as: `first_purchase_date + (installment_number - 1) × payment_interval_days`
- `payment_interval_days` supports any cadence (30 for monthly, 14 for bi-weekly, etc.)
- `purchase_date` is only populated on the first installment; subsequent rows are system-generated

### Recurring Expenses
A `RECURRING_EXPENSE` acts as a template for an expense that repeats every month (e.g., Netflix, gym membership, rent).

- `started_at` — the month the recurring expense first appears; always set to the budget period of the expense being created
- `cancelled_at` — when set, stops future generation; past rows are untouched
- When a new `BudgetPeriod` is opened, one `EXPENSE` row is auto-generated per active recurring template (where `cancelled_at` is null or after the period's month)

**Creation flow:** Recurring expenses are not created via a standalone endpoint. Instead, when creating an expense the caller sets `isRecurring: true` on `POST /expenses`. The backend atomically creates the `RecurringExpense` template and the first `Expense` row linked to it via `recurringExpenseId`. The `startedAt` is set to the budget period's month.

**Management:** Existing recurring expenses are managed via `GET /recurring-expenses`, `GET /recurring-expenses/:id`, `PATCH /recurring-expenses/:id` (to update description, amount, or set `cancelledAt`), and `DELETE /recurring-expenses/:id`.

---

## Income

`INCOME` rows belong to a `BudgetPeriod` and represent money received that month.

- `is_salary = true` flags incomes that form the salary base
- Multiple salary incomes per period are supported (e.g., two payroll deposits on different days)
- **% of salary** is a derived metric, computed at query time as:
  ```
  expense.amount / SUM(income.amount WHERE is_salary = true)
  ```
  It is not stored — always derived on demand.

---

## Budget Envelopes

A `BUDGET_ENVELOPE` pairs a `Category` with a `BudgetPeriod` and an `allocated_amount` (the planned spending cap for that category that month).

Only categories where `has_budget_envelope = true` participate in envelope budgeting.

- **Allocated amount** — stored locally; set when the period is opened (user can adjust)
- **Actual spend** — not stored; fetched from an external REST API at query time (e.g., `GET /balances?category=Groceries&month=2026-03`)
- **Remaining** — derived: `allocated_amount − actual_spend`
- **Auto-allocation** — when opening a new period, the system queries the external API for the last 3 months' actual spend per envelope category and pre-fills `allocated_amount` as the average

A partial unique index enforces that no two active envelopes share the same `(budget_period_id, category_id)`.

---

## Opening a New Budget Period

When a user opens a new month (e.g., April 2026), the system executes the following steps in order:

1. **Generate installment rows** — Find all `INSTALLMENT_GROUP` records with installments due in the new month (based on `first_purchase_date` and `payment_interval_days`) and create the corresponding `EXPENSE` rows
2. **Generate recurring rows** — Find all `RECURRING_EXPENSE` records where `cancelled_at` is null or after the new period's month and create one `EXPENSE` row each
3. **Suggest budget envelopes** — For each `CATEGORY` where `has_budget_envelope = true`, query the external API for the last 3 months' actual spend, compute the average, and pre-fill `BUDGET_ENVELOPE.allocated_amount`; the user can adjust before confirming
4. **Activate the period** — The period becomes active and ready for manual expense entry

---

## Supporting Lookup Tables

### Category
Expense categories (e.g., Groceries, Entertainment, Transportation).
- `has_budget_envelope = true` — marks categories that participate in envelope budgeting and for which the external API is queried

### PaymentType
Payment methods (e.g., Credit Card, Debit Card, Cash, Pre-authorized).
- `has_statement = true` — requires the expense to be linked to a `Bank`

### Bank
Financial institutions (e.g., CIBC, Neo). Nullable on expenses — cash payments have no bank.

### Store
Merchants/vendors (e.g., Amazon, Loblaws). Nullable on expenses — not all purchases are at a specific store.

---

## Pagination

List endpoints for **lookup tables** (Bank, Store, Category, PaymentType) are unbounded — result sets are small and stable.

List endpoints for **transactional records** (Expense, Income) support offset-based pagination via `page` and `limit` query parameters.

---

## Soft Deletes

All models include a `deleted_at` timestamp. No records are physically deleted. All queries filter `WHERE deleted_at IS NULL`. Uniqueness constraints (budget periods, budget envelopes) are enforced via partial indexes scoped to non-deleted rows.

---

## Business Rules

### Budget Period

- `year` must be an integer in the range `[2000, current_year + 1]`; `month` must be in `[1, 12]` — violations return **400**
- `(year, month)` must be unique among non-deleted periods; creating a duplicate returns **409 Conflict** (e.g., "A budget period for 2026/03 already exists")
- Budget periods are **immutable** — `year` and `month` cannot be changed after creation
- A period **cannot be soft-deleted** if it has any linked non-deleted expenses, incomes, or budget envelopes — returns **409 Conflict**

### Budget Envelope

- A budget envelope **cannot be updated or soft-deleted** if its budget period's `(year, month)` is before the current calendar month — returns **422 Unprocessable Entity**
- Only valid for categories where `hasBudgetEnvelope = true`; creating an envelope for any other category returns **400**
- `(budgetPeriodId, categoryId)` must be unique among non-deleted envelopes; duplicates return **409 Conflict**
- `allocatedAmount` must be a positive value with at most 2 decimal places (max 99,999,999.99)

### Expense

- An expense **cannot be updated or soft-deleted** if its budget period's `(year, month)` is before the current calendar month — returns **422 Unprocessable Entity**
- Must always reference a **non-deleted** `BudgetPeriod`, `Category`, and `PaymentType`
- If the referenced `PaymentType.hasStatement = true`, a `bankId` is **required**; omitting it returns **400**
- `bankId` and `storeId` are optional; if provided, they may reference soft-deleted Bank/Store records (historical integrity is preserved)
- All monetary amounts: max 2 decimal places, up to 99,999,999.99
- Expense type is determined by the presence of foreign keys:
  - **One-time**: both `installmentGroupId` and `recurringExpenseId` are null
  - **Installment**: `installmentGroupId` is set
  - **Recurring-generated**: `recurringExpenseId` is set

### Recurring Expense

- Must reference a **non-deleted** `Category` and `PaymentType` at creation time
- `cancelledAt` must be ≥ the first day of the current calendar month; past-month dates return **400**
- Setting `cancelledAt` stops generation of new expense rows for future periods; already-generated rows are untouched; `cancelledAt` can be cleared to reactivate the template
- **Soft-deleting** a `RecurringExpense` also sets `cancelledAt = now()` atomically, ensuring no future rows are generated; already-generated rows are untouched
- `description`, `amount`, and `cancelledAt` can be updated freely after creation; FK references (`categoryId`, `paymentTypeId`, `bankId`, `storeId`) are immutable

### Installment Group

- Due date per installment: `firstPurchaseDate + (installmentNumber - 1) × paymentIntervalDays`
- `purchaseDate` is set only on the first installment row; subsequent system-generated rows leave it null

### Income

- Multiple incomes with `isSalary = true` per period are allowed (e.g., split payroll deposits)
- **% of salary** is derived at query time — `expense.amount / SUM(income.amount WHERE isSalary = true)` for the same period — and is never stored
- An income **cannot be updated or soft-deleted** if its budget period's `(year, month)` is before the current calendar month — returns **422 Unprocessable Entity**

### Lookup Tables (Category, PaymentType, Bank, Store)

- Names must be **unique case-insensitively** among non-deleted records within each table; duplicates return **409 Conflict**
- **Category / PaymentType** can be soft-deleted even if referenced by existing expenses; soft-deleted records still appear on historical expenses but **cannot be selected when creating new expenses or recurring expenses**
- **Bank / Store** can be soft-deleted freely; existing expenses retain their `bankId` / `storeId` reference for historical display; soft-deleted Bank/Store cannot be selected for new expenses

### Soft Delete (universal)

- No records are physically deleted; all deletions set `deletedAt = now()`
- All queries filter `WHERE deletedAt IS NULL`, except when displaying historical expense data which must still resolve soft-deleted Category, PaymentType, Bank, and Store names
- Uniqueness constraints are scoped to non-deleted rows via partial indexes

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| `has_budget_envelope` on `CATEGORY` | Separates envelope-tracked categories from regular ones; drives which categories are queried from the external API |
| External API as actual spend source | Avoids double-entry for envelope categories; the remote system is the source of truth for daily spending |
| `RECURRING_EXPENSE` as template | `cancelled_at` stops future generation while preserving historical rows |
| `recurring_expense_id` on `EXPENSE` | Allows tracing any generated row back to its template for editing or cancellation |
| `payment_interval_days` on `INSTALLMENT_GROUP` | Supports any cadence (monthly, bi-weekly, etc.); due dates are calculated, not hardcoded |
| `% of salary` is computed | `expense.amount / SUM(incomes WHERE is_salary)` — derived at query time, always accurate |
| No `salary` field on `BUDGET_PERIOD` | Salary is one or more `INCOME` rows with `is_salary = true`; supports multiple payroll deposits per month |

---

## Glossary

**Budget Period**
A single calendar month identified by `year` and `month` (e.g., March 2026). Every expense, income, and budget envelope belongs to exactly one budget period. At most one non-deleted period can exist for any given `(year, month)` pair.

**Budget Envelope**
A spending plan for a specific category within a budget period. It stores an `allocated_amount` (the cap the user sets) and derives `actual_spend` at query time from an external API. Only categories with `has_budget_envelope = true` participate. At most one non-deleted envelope can exist per `(budget_period_id, category_id)` pair.

**Recurring Expense**
A template for an expense that repeats every month (e.g., Netflix, rent, gym membership). It holds a fixed `amount`, `category`, and `payment_type`. Created implicitly when a user sets `isRecurring: true` on `POST /expenses` — never created directly. When a new budget period is opened, the system auto-generates one `EXPENSE` row per active recurring template. Setting `cancelled_at` stops future generation; already-generated rows are untouched.

**Installment Group**
A record that represents a single purchase split across multiple payments (e.g., a $600 laptop paid over 3 months). It stores the `amount_per_installment`, `total_installments`, `payment_interval_days`, and `first_purchase_date`. The system auto-generates one `EXPENSE` row per installment, each assigned to the correct future budget period with its due date computed as `first_purchase_date + (installment_number - 1) × payment_interval_days`.

**Allocated Amount vs Actual Spend**
Two complementary figures on a budget envelope:
- **Allocated amount** — the planned spending cap for a category in a given period; stored locally and set (or adjusted) when the period is opened.
- **Actual spend** — the real amount spent in that category during the period; never stored — always fetched on demand from the external spend API.
The difference (`allocated_amount − actual_spend`) gives the remaining budget for the envelope.

**% of Salary**
A derived metric that expresses an expense's amount as a percentage of the total salary income for the same period. Computed at query time as:
```text
expense.amount / SUM(income.amount WHERE is_salary = true AND budget_period_id = expense.budget_period_id)
```
It is never stored in the database.
