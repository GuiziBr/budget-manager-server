import { byName, type Db, type LookupRefs, loadJson } from "./helpers"

async function upsertAll<T extends { id: string }>(
	label: string,
	file: string,
	upsert: (id: string, data: Omit<T, "id">) => Promise<unknown>
) {
	const rows = loadJson<T>(file)
	for (const { id, ...data } of rows) {
		await upsert(id, data)
	}
	console.log(`  ${label}: ${rows.length} upserted`)
}

// Lookup tables are upserted, never deleted (soft-deleted rows must stay in the DB).
export async function seedLookups(db: Db) {
	await upsertAll<{ id: string; name: string; hasBudgetEnvelope: boolean }>(
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
