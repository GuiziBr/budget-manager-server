-- Add case-insensitive partial unique indexes for lookup tables
-- Enforces that names are unique (case-insensitively) among non-deleted records

CREATE UNIQUE INDEX "categories_name_unique" ON "categories" (LOWER("name")) WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX "payment_types_name_unique" ON "payment_types" (LOWER("name")) WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX "banks_name_unique" ON "banks" (LOWER("name")) WHERE "deleted_at" IS NULL;

CREATE UNIQUE INDEX "stores_name_unique" ON "stores" (LOWER("name")) WHERE "deleted_at" IS NULL;
