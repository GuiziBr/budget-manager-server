-- Make lookup name uniqueness case-insensitive (still only across active,
-- non-soft-deleted rows). "Food" and "food" are now treated as duplicates.
--
-- NOTE: this fails if active rows that differ only by case already exist.
-- Rename or soft-delete the duplicates before applying.

-- banks
DROP INDEX "banks_name_active_key";
CREATE UNIQUE INDEX "banks_name_active_key"
    ON "banks" (lower("name"))
    WHERE "deleted_at" IS NULL;

-- categories
DROP INDEX "categories_name_active_key";
CREATE UNIQUE INDEX "categories_name_active_key"
    ON "categories" (lower("name"))
    WHERE "deleted_at" IS NULL;

-- payment_types
DROP INDEX "payment_types_name_active_key";
CREATE UNIQUE INDEX "payment_types_name_active_key"
    ON "payment_types" (lower("name"))
    WHERE "deleted_at" IS NULL;

-- stores
DROP INDEX "stores_name_active_key";
CREATE UNIQUE INDEX "stores_name_active_key"
    ON "stores" (lower("name"))
    WHERE "deleted_at" IS NULL;
