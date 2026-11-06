import { byName, type Db, type LookupRefs, loadJson } from "./helpers"

// A database seeded before the ids were aligned can hold an active row with the
// same name under a different id. Names are unique among active rows, so the
// id upsert would fail. Move that row to the seed id instead: every foreign key
// to the lookup tables is ON UPDATE CASCADE, so existing references follow.
// Soft-deleted rows are never matched, and nothing is deleted.
async function reconcileActiveRow(
	db: Db,
	table: "categories" | "payment_types" | "banks" | "stores",
	id: string,
	name: string
) {
	const moved = await db.$executeRawUnsafe(
		`UPDATE "${table}" SET "id" = $1::uuid
		 WHERE "name" = $2 AND "deleted_at" IS NULL AND "id" <> $1::uuid
		 AND NOT EXISTS (SELECT 1 FROM "${table}" WHERE "id" = $1::uuid)`,
		id,
		name
	)
	if (moved > 0) {
		console.log(`  ${table}: re-keyed "${name}" to ${id}`)
	}
}

async function upsertAll<T extends { id: string; name: string }>(
	db: Db,
	table: Parameters<typeof reconcileActiveRow>[1],
	file: string,
	upsert: (id: string, data: Omit<T, "id">) => Promise<unknown>
) {
	const rows = loadJson<T>(file)
	for (const { id, ...data } of rows) {
		await reconcileActiveRow(db, table, id, data.name)
		await upsert(id, data)
	}
	console.log(`  ${table}: ${rows.length} upserted`)
}

// Lookup tables are upserted, never deleted (soft-deleted rows must stay in the DB).
export async function seedLookups(db: Db) {
	await upsertAll<{ id: string; name: string; hasBudgetEnvelope: boolean }>(
		db,
		"categories",
		"categories.json",
		(id, data) =>
			db.category.upsert({
				where: { id },
				create: { id, ...data },
				update: { ...data, deletedAt: null }
			})
	)
	await upsertAll<{ id: string; name: string; hasStatement: boolean }>(
		db,
		"payment_types",
		"payment-types.json",
		(id, data) =>
			db.paymentType.upsert({
				where: { id },
				create: { id, ...data },
				update: { ...data, deletedAt: null }
			})
	)
	await upsertAll<{ id: string; name: string }>(
		db,
		"banks",
		"banks.json",
		(id, data) =>
			db.bank.upsert({
				where: { id },
				create: { id, ...data },
				update: { ...data, deletedAt: null }
			})
	)
	await upsertAll<{ id: string; name: string }>(
		db,
		"stores",
		"stores.json",
		(id, data) =>
			db.store.upsert({
				where: { id },
				create: { id, ...data },
				update: { ...data, deletedAt: null }
			})
	)
}

export async function loadLookupRefs(db: Db): Promise<LookupRefs> {
	const active = {
		where: { deletedAt: null },
		select: { id: true, name: true }
	}
	const [categories, paymentTypes, banks, stores] = await Promise.all([
		db.category.findMany(active),
		db.paymentType.findMany(active),
		db.bank.findMany(active),
		db.store.findMany(active)
	])
	return {
		category: byName(categories, "category"),
		paymentType: byName(paymentTypes, "payment type"),
		bank: byName(banks, "bank"),
		store: byName(stores, "store")
	}
}
