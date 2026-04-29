-- Prevent duplicate recurring expense rows per period.
-- Scoped to non-deleted rows and only when recurring_expense_id is set,
-- leaving one-time and installment expenses unrestricted.
CREATE UNIQUE INDEX "expenses_budget_period_recurring_expense_active_key"
    ON "expenses" ("budget_period_id", "recurring_expense_id")
    WHERE "deleted_at" IS NULL AND "recurring_expense_id" IS NOT NULL;
