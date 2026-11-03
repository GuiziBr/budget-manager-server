-- Months a recurring expense had already been paid before it was registered here
ALTER TABLE "recurring_expenses" ADD COLUMN "months_already_paid" INTEGER NOT NULL DEFAULT 0;
