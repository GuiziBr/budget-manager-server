# Architecture Decisions

Implementation-level decisions made during development. Complements the domain-level decisions in `software_specification.md`.

Each entry captures **what** was decided, **why**, and **what was rejected** — the rejected alternative is the most important part, since the code only shows what was chosen.

---

## ADR-001: Expense creation type uses a `type` discriminator field

**Decision:** `POST /expenses` accepts a `type` field with values `"one-time"`, `"recurring"`, or `"installment"`, validated via a Zod `discriminatedUnion`.

**Why:** A discriminated union lets Zod pick the correct schema in O(1) by reading a single field, and TypeScript narrows the inferred type inside each branch of the service. Fields that only exist on one type (e.g. `amountPerInstallment`, `totalInstallments`) are not present on other variants, so the compiler enforces correctness at the call site.

**Rejected:** Using an `isRecurring: boolean` flag (as described in the soft spec) and inferring installment type from the presence of optional fields. This approach requires cross-field `superRefine` validation, produces worse error messages, and loses TypeScript's narrowing — the service would have to cast or do runtime checks with no type safety guarantee.

---

## ADR-002: Expense type values centralised in an `ExpenseType` const object

**Decision:** The string literals `"one-time"`, `"recurring"`, and `"installment"` are defined once in `src/domains/expense/dtos/create-expense.dto.ts` as a `const` object and referenced everywhere via `ExpenseType.ONE_TIME`, `ExpenseType.RECURRING`, `ExpenseType.INSTALLMENT`.

**Why:** Avoids magic strings scattered across the service, specs, and DTO. A single source of truth means a rename is a one-line change with full compiler assistance.

**Rejected:** Using `z.enum(["one-time", ...])` and accessing values via `schema.enum["one-time"]`. The bracket notation required for hyphenated keys negates the ergonomic benefit of the approach.

---

## ADR-003: Recurring expense template, first row, and future-period backfill created in a single DB transaction

**Decision:** `PrismaExpenseRepository.createWithRecurringTemplate` uses `this.db.$transaction(async tx => { ... })` to atomically:
1. Insert the `RecurringExpense` template
2. Insert the first `Expense` row for the current period
3. Query all existing `BudgetPeriod` records strictly after `startedAt` (with `deletedAt: null`) and bulk-insert one `Expense` row per period, linked to the new template

**Why:** Both records must succeed or both must fail — see original atomicity rationale above. The backfill is necessary because `BudgetPeriodService.openPeriod` is a one-shot event: any recurring template created after a period is already open would never get a row for that period without this step. Including the backfill inside the same transaction keeps the guarantee — either the template, the first row, and all backfill rows are written together, or none are.

A partial unique index on `(budget_period_id, recurring_expense_id) WHERE deleted_at IS NULL AND recurring_expense_id IS NOT NULL` enforces that no period can ever have two rows for the same recurring template, regardless of how rows were created.

**Rejected:**
- *Two-step in the service layer* — `recurringExpenseService.create()` then `expenseRepository.create()`: loses atomicity; a crash between the two writes leaves a permanent orphaned template.
- *Two-step with compensating delete* — same as above with a best-effort `delete` in a catch block: the cleanup can also fail, leaving the same orphan. Two writes and two potential deletes for what should be one operation.
- *Unit of Work / shared transaction context* — passing a Prisma `tx` client through the abstract repository interface would solve the problem cleanly but adds complexity (threading `tx` everywhere) that the rest of the codebase does not have and would not justify for a single use case.
- *Dedicated sync endpoint (`POST /budget-periods/:id/sync-recurring`)* — pushes the responsibility of knowing when to sync onto the frontend, which should not be aware of this internal consistency concern.

The chosen approach is a deliberate pragmatic trade-off: the expense infra layer directly writes to the `recurring_expenses` and `budget_periods` tables, which is a DDD boundary violation, but the atomicity guarantee and simplicity outweigh the purity concern for this system.

---

## ADR-004: InstallmentGroup has no standalone service or controller

**Decision:** `InstallmentGroup` lives as an entity-only domain (`src/domains/installment-group/entities/`). It has no repository, service, or controller of its own. It is always created atomically inside `PrismaExpenseRepository.createInstallmentExpenses` as part of expense creation.

**Why:** `InstallmentGroup` has no standalone lifecycle — it is created once when an installment purchase is registered and never updated or deleted independently. Giving it a full domain stack would add files and indirection with no benefit.

**Rejected:** Full domain with abstract repository and service. Would require the same transaction coordination problem as ADR-003 (two service calls, atomicity lost) or the same pragmatic violation of threading a `tx` client.

---

## ADR-005: Installment expense rows only generated for budget periods that already exist

**Decision:** When creating an installment purchase, the service computes the due date for each installment and calls `budgetPeriodService.findByYearAndMonth` for each one. Only installments whose due-date month has an existing `BudgetPeriod` row get an `Expense` row created immediately. Installments for future periods that do not yet exist are skipped — they will be generated by the period-open flow when those periods are created.

**Why:** The period-open flow already handles generating installment rows for new periods (`INSTALLMENT_GROUP` records with due dates in the new month). Generating all rows upfront would require creating budget periods that don't exist yet, which has its own business logic and constraints.

**Rejected:** Creating all expense rows upfront by also creating the missing budget periods. This would bypass the business rules enforced by `BudgetPeriodService.create()` (uniqueness check, year/month validation) and couple installment creation to period creation in an unexpected way.

---

## ADR-006: `% of salary` deferred — not computed on expense responses

**Decision:** `percentOfSalary` is not included in the `Expense` entity or any response at this time. It is tracked as a TODO in `docs/TODO.md`.

**Why:** The field requires querying `Income` records for the same budget period at expense query time. Implementing it correctly (avoiding N+1 for cross-period list queries, handling periods with no salary income) adds meaningful complexity. Deferring it keeps the expense domain self-contained and unblocks the rest of the implementation.

**Rejected:** Implementing it immediately. The spec describes it as a derived metric with a clear formula — it is straightforward to add later by injecting `IncomeService` into `ExpenseService`. `IncomeModule` already exports `IncomeService` in anticipation of this.
