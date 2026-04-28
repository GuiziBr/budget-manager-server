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

## OQ-004 — What happens to generated expense rows when an InstallmentGroup is soft-deleted?

**Context:** When an `InstallmentGroup` is created, the system auto-generates one `Expense` row per installment across future periods. If the group is later soft-deleted, the already-generated rows still exist with a non-null `installmentGroupId`. The spec does not define cascade behaviour.

**Options:**
- Leave generated rows untouched — they remain as regular expenses linked to a deleted group (historical integrity)
- Cascade soft-delete to all linked, future (unpaid) expense rows — cleaner but destructive
- Block deletion of an `InstallmentGroup` if any linked expense rows exist

**Affects:** `InstallmentGroupService.delete`, `PrismaInstallmentGroupRepository`

---

## OQ-005 — Can system-generated expense rows be manually edited or deleted?

**Context:** Installment rows (beyond the first) and recurring-generated rows are auto-created by the system. It is unclear whether the user should be allowed to edit their `amount`, `dueDate`, `description`, etc., or soft-delete individual rows without affecting the parent group or template.

**Options:**
- Allow full edit/delete on all expense rows regardless of origin — simplest; treats all rows equally
- Restrict editing of system-generated fields (e.g., `amount`, `dueDate`) while allowing user fields (e.g., `paidDate`, `description`)
- Block individual deletion of installment/recurring rows — require acting on the group/template instead

**Affects:** `ExpenseService.update` and `ExpenseService.delete`, potentially requires type-checking (`installmentGroupId != null`)

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

## OQ-008 — Should `RecurringExpense` support being updated after creation? ✅ Resolved

**Decision:** Allow full updates — any field except FK references (`categoryId`, `paymentTypeId`, `bankId`, `storeId`) can be patched; future-generated rows use the new values.

**Implementation:** Already in place — `UpdateRecurringExpenseDTO` exposes `description`, `amount`, and `cancelledAt`. No code changes required.
