-- Enforce name uniqueness only across active (non-soft-deleted) rows, so a
-- name can be reused once the record holding it has been soft-deleted.

-- CreateIndex
CREATE UNIQUE INDEX "banks_name_active_key"
    ON "banks" ("name")
    WHERE "deleted_at" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_active_key"
    ON "categories" ("name")
    WHERE "deleted_at" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payment_types_name_active_key"
    ON "payment_types" ("name")
    WHERE "deleted_at" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "stores_name_active_key"
    ON "stores" ("name")
    WHERE "deleted_at" IS NULL;
