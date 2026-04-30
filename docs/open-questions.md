# Open Questions

Undecided business rules, functional constraints, and implementation choices that need a resolution before or during the implementation of the affected domain. Items are not necessarily blockers — they can be decided at implementation time — but they should be resolved before that domain ships.

---

## OQ-001 — Can past income records be soft-deleted? ✅ Resolved

**Decision:** Block deletion if the income's budget period is in a past calendar month.

**Implementation:** `IncomeService.delete` fetches the budget period via `BudgetPeriodService.findById` and throws `UnprocessableEntityException` (422) if `period.year/month` is before the current calendar month.

---

## OQ-002 — Can records in a past budget period be mutated (update/delete)? ✅ Resolved

**Decision:** Implicit lock — block mutations on records whose `budgetPeriod.year/month` is before the current calendar month.

**Implementation:** Each transactional domain service (`income`, `expense`, `budget-envelope`) checks the linked period's `year/month` against today in both `update` and `delete`, throwing `UnprocessableEntityException` (422) for past periods. `income` is implemented; `expense` and `budget-envelope` will apply the same guard when those services are built.

---

## OQ-003 — Soft-delete vs cancellation on RecurringExpense — are both allowed? ✅ Resolved

**Decision:** Soft-delete is equivalent to immediate cancellation — `cancelledAt` is set automatically on delete. Already-generated expense rows are untouched.

**Implementation:** `PrismaRecurringExpenseRepository.delete` sets both `deletedAt` and `cancelledAt` to `now()` atomically. Cancellation via `PATCH /recurring-expenses/:id` (setting `cancelledAt`) remains the "pause" mechanism — it stops future generation without removing the template, and can be reversed by clearing `cancelledAt`.

---

## OQ-004 — What happens to generated expense rows when an InstallmentGroup is soft-deleted? ✅ Resolved

**Decision:** No standalone `DELETE /installment-groups/:id` endpoint will be built. `InstallmentGroup` is a persistence detail created automatically during installment expense creation — it has no independent API surface. Expense rows linked to a group are managed exclusively through `DELETE /expenses/:id`.

**Implementation:** No code changes required. The question of cascade behaviour is moot because the group record cannot be directly deleted via the API.

---

## OQ-005 — Can system-generated expense rows be manually edited or deleted? ✅ Resolved

**Decision:** Allow full edit and delete on all expense rows regardless of origin. Individual installment and recurring rows can be soft-deleted or updated via `DELETE /expenses/:id` and `PATCH /expenses/:id` with no cascade and no special guards based on `installmentGroupId` or `recurringExpenseId`.

- `installmentNumber` is excluded from `UpdateExpenseDTO` and is immutable (resolved in OQ-009)
- Bulk amount changes across an installment group go through `PATCH /installment-groups/:id` (resolved in OQ-009)
- No code changes required; the existing `ExpenseService.update` and `ExpenseService.delete` are already correct

---

## OQ-006 — Should list endpoints support pagination? ✅ Resolved

**Decision:** Lookup tables (Bank, Store, Category, PaymentType) remain unbounded. Transactional records (Expense, Income) use offset-based pagination via `page` + `limit` query params.

**Rationale:** The expense dashboard is not designed for long lists — at most dozens of records per period. Offset-based pagination is sufficient and simpler to implement.

**Affects:** `ExpenseController`, `IncomeController`, and their repositories when built.

---

## OQ-007 — What is the behaviour when the external spend API is unavailable?

**Context:** `BudgetEnvelope` actual-spend and auto-allocation both depend on an external REST API. The spec does not define a fallback strategy if that API is unreachable or returns an error.

**Options:**
- Fail fast — propagate the error; the endpoint returns 502/503
- Return null/zero — return `actualSpend: null` and let the client handle the missing value
- Use cached value — cache the last successful API response and return it on failure (requires a caching layer)
- Skip auto-allocation — open the period without pre-filling envelopes; user fills them manually

**Affects:** `BudgetEnvelopeService`, the period-opening workflow, potentially a new `CacheModule`

---

## OQ-009 — How should updates to installment expenses and their group be handled? ✅ Resolved

**Context:** An installment purchase creates one `InstallmentGroup` record and multiple `Expense` rows spread across budget periods. The current `PATCH /expenses/:id` allows updating individual expense rows (description, amount, dates, etc.), but several questions are unresolved:

**Sub-questions:**

1. **Should `installmentNumber` be updatable?** ✅ Resolved

   **Decision:** `installmentNumber` is immutable — block any attempt to update it. Gaps in the sequence (e.g., #1, #3, #4 after deleting #2) are acceptable and honest: they indicate a payment was cancelled for that slot. The desire to postpone rather than cancel a payment is addressed by a separate planned feature (Installment Deferral in the software spec), which will soft-delete the row and append a new one at the end of the sequence instead.

   **Implementation:** `UpdateExpenseDTO` must not expose `installmentNumber`. No repository changes required.

2. **Should updating a single installment row's `amount` also update the `InstallmentGroup.amountPerInstallment`?** ✅ Resolved

   **Decision:** Amount changes go through the group endpoint (sub-question 3), not through `PATCH /expenses/:id`. `PATCH /expenses/:id` does not cascade — it only updates the individual row for local corrections (e.g., `paidDate`, `description`).

3. **Should there be a `PATCH /installment-groups/:id` endpoint?** ✅ Resolved

   **Decision:** Yes. `PATCH /installment-groups/:id` is the only way to change `amountPerInstallment` or `totalInstallments`. On update, the new `amountPerInstallment` is propagated to all non-deleted linked expense rows whose `budgetPeriod.year/month` is **≥ the current calendar month** — past rows are left untouched. `paymentIntervalDays` and `firstPurchaseDate` are immutable (changing them would require recomputing `dueDate` on all linked rows and potentially moving rows between budget periods).

   **Implementation:** Requires a full `InstallmentGroup` domain stack: `InstallmentGroupRepository` (abstract), `PrismaInstallmentGroupRepository`, `InstallmentGroupService`, `InstallmentGroupController`, `InstallmentGroupModule`. The Prisma repository update method bulk-updates linked expense rows filtered by their budget period's `year/month >= current month` in a single transaction.

4. **How should changing `paymentIntervalDays` or `firstPurchaseDate` affect already-generated rows?** ✅ Resolved

   **Decision:** These fields are immutable after group creation — they are not exposed in `UpdateInstallmentGroupDTO`. Recomputing `dueDate` across linked rows and potentially moving them between budget periods is out of scope.

**Affects:** `InstallmentGroupService`, `InstallmentGroupController`, `InstallmentGroupRepository`, `PrismaInstallmentGroupRepository` (new domain stack); `ExpenseService.update` (no changes needed — individual row updates do not cascade)

---

## OQ-008 — Should `RecurringExpense` support being updated after creation? ✅ Resolved

**Decision:** Allow full updates — any field except FK references (`categoryId`, `paymentTypeId`, `bankId`, `storeId`) can be patched; future-generated rows use the new values.

**Implementation:** Already in place — `UpdateRecurringExpenseDTO` exposes `description`, `amount`, and `cancelledAt`. No code changes required.
