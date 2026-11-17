import { NotFoundException } from "@nestjs/common"
import { Prisma } from "@prisma/client"

// Row locks on lookup tables, used to close the race between checking a
// lookup's references / existence and soft-deleting or referencing it.
// Soft delete is an UPDATE, so foreign keys cannot protect us: delete takes
// FOR UPDATE, anything that references the lookup takes FOR SHARE.

const LOOKUP_TABLES = {
	bank: "banks",
	store: "stores",
	category: "categories",
	paymentType: "payment_types"
} as const

export type LookupKind = keyof typeof LOOKUP_TABLES

type LockMode = "UPDATE" | "SHARE"

async function lockActiveRow(
	tx: Prisma.TransactionClient,
	kind: LookupKind,
	id: string,
	mode: LockMode
): Promise<boolean> {
	const table = Prisma.raw(`"${LOOKUP_TABLES[kind]}"`)
	const lock = Prisma.raw(`FOR ${mode}`)
	const rows = await tx.$queryRaw<{ id: string }[]>(
		Prisma.sql`SELECT "id" FROM ${table} WHERE "id" = ${id}::uuid AND "deleted_at" IS NULL ${lock}`
	)
	return rows.length > 0
}

export async function lockLookupForDelete(
	tx: Prisma.TransactionClient,
	kind: LookupKind,
	id: string
): Promise<void> {
	if (!(await lockActiveRow(tx, kind, id, "UPDATE"))) {
		throw new NotFoundException(`${kind} ${id} not found`)
	}
}

export interface LookupRefs {
	categoryId?: string | null
	paymentTypeId?: string | null
	bankId?: string | null
	storeId?: string | null
}

// Locks run sequentially in a fixed order so concurrent writers never wait on
// each other in opposite directions. Throws NotFoundException if any
// referenced lookup is missing or soft-deleted.
export async function lockLookupsForShare(
	tx: Prisma.TransactionClient,
	refs: LookupRefs
): Promise<void> {
	const ordered: [LookupKind, string | null | undefined][] = [
		["category", refs.categoryId],
		["paymentType", refs.paymentTypeId],
		["bank", refs.bankId],
		["store", refs.storeId]
	]
	for (const [kind, id] of ordered) {
		if (!id) continue
		if (!(await lockActiveRow(tx, kind, id, "SHARE"))) {
			throw new NotFoundException(`${kind} ${id} not found`)
		}
	}
}
