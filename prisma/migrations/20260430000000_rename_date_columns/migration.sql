-- Rename date columns to follow the *At suffix convention

-- expenses
ALTER TABLE "expenses" RENAME COLUMN "purchase_date" TO "purchased_at";
ALTER TABLE "expenses" RENAME COLUMN "due_date" TO "due_at";
ALTER TABLE "expenses" RENAME COLUMN "paid_date" TO "paid_at";

-- installment_groups
ALTER TABLE "installment_groups" RENAME COLUMN "first_purchase_date" TO "first_purchased_at";

-- incomes
ALTER TABLE "incomes" RENAME COLUMN "received_date" TO "received_at";
