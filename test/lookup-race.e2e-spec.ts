import { ConflictException, NotFoundException } from "@nestjs/common"
import type { ConfigService } from "@nestjs/config"
import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { DatabaseService } from "@/infra/database/database.service"
import {
	type LookupKind,
	lockLookupForDelete,
	lockLookupsForShare
} from "@/infra/database/prisma/helpers/lock-lookup"
import { PrismaBankRepository } from "@/infra/database/prisma/repositories/prisma-bank.repository"
import { PrismaCategoryRepository } from "@/infra/database/prisma/repositories/prisma-category.repository"
import { PrismaExpenseRepository } from "@/infra/database/prisma/repositories/prisma-expense.repository"
import { PrismaPaymentTypeRepository } from "@/infra/database/prisma/repositories/prisma-payment-type.repository"
import { PrismaStoreRepository } from "@/infra/database/prisma/repositories/prisma-store.repository"
import { TEST_DATABASE_URL } from "./test-database-url"

const db = new DatabaseService({
	get: () => TEST_DATABASE_URL
} as unknown as ConfigService<never, true>)
const expenseRepo = new PrismaExpenseRepository(db)
const repos = {
	bank: new PrismaBankRepository(db),
	store: new PrismaStoreRepository(db),
	category: new PrismaCategoryRepository(db),
	paymentType: new PrismaPaymentTypeRepository(db)
}
const refKey = {
	bank: "bankId",
	store: "storeId",
	category: "categoryId",
	paymentType: "paymentTypeId"
} as const
const kinds = Object.keys(repos) as LookupKind[]

const now = new Date()
const year = now.getUTCFullYear()
const month = now.getUTCMonth() + 1

type Ids = Record<(typeof refKey)[LookupKind], string> & { periodId: string }

async function seed(): Promise<Ids> {
	const [bank, store, category, paymentType, period] = await Promise.all([
		db.bank.create({ data: { name: "Bank" } }),
		db.store.create({ data: { name: "Store" } }),
		db.category.create({ data: { name: "Category" } }),
		db.paymentType.create({ data: { name: "Payment" } }),
		db.budgetPeriod.create({ data: { year, month } })
	])
	return {
		bankId: bank.id,
		storeId: store.id,
		categoryId: category.id,
		paymentTypeId: paymentType.id,
		periodId: period.id
	}
}

function expenseData(ids: Ids) {
	return {
		budgetPeriodId: ids.periodId,
		categoryId: ids.categoryId,
		paymentTypeId: ids.paymentTypeId,
		bankId: ids.bankId,
		storeId: ids.storeId,
		description: "race",
		amount: 10
	}
}

// Polls pg_stat_activity until some backend is blocked on a row lock, so the
// tests prove the two transactions actually contended instead of sleeping.
async function waitForLockWait() {
	for (let i = 0; i < 100; i++) {
		const rows = await db.$queryRaw<{ n: bigint }[]>`
			SELECT count(*) AS n FROM pg_stat_activity
			WHERE datname = current_database() AND wait_event_type = 'Lock'`
		if (Number(rows[0].n) > 0) return
		await new Promise((r) => setTimeout(r, 50))
	}
	throw new Error("No transaction ever blocked on a lock")
}

function findRow(kind: LookupKind, id: string) {
	// biome-ignore lint/suspicious/noExplicitAny: dynamic delegate per kind
	return (db as any)[kind].findUnique({ where: { id } }) as Promise<{
		deletedAt: Date | null
	} | null>
}

async function release() {
	let release!: () => void
	const gate = new Promise<void>((r) => {
		release = r
	})
	return { gate, release }
}

beforeEach(async () => {
	await db.$executeRawUnsafe(
		`TRUNCATE expenses, recurring_expenses, installment_groups, budget_envelopes, budget_periods, banks, stores, categories, payment_types CASCADE`
	)
})

afterAll(() => db.$disconnect())

describe.each(kinds)("%s lookup race", (kind) => {
	it("delete waits for an in-flight referencing write and then reports a conflict", async () => {
		const ids = await seed()
		const { gate, release: open } = await release()
		let locked!: () => void
		const hasLock = new Promise<void>((r) => {
			locked = r
		})

		// Writer: holds FOR SHARE on every lookup, inserts, then commits.
		const writer = db.$transaction(async (tx) => {
			await lockLookupsForShare(tx, ids)
			locked()
			await gate
			await tx.expense.create({ data: expenseData(ids) })
		})
		await hasLock

		const deleting = repos[kind].delete(ids[refKey[kind]], year, month)
		const outcome = deleting.then(
			() => "deleted",
			(e) => e
		)
		await waitForLockWait()
		open()
		await writer

		expect(await outcome).toBeInstanceOf(ConflictException)
		const row = await findRow(kind, ids[refKey[kind]])
		expect(row?.deletedAt).toBeNull()
	})

	it("expense create waits for an in-flight delete and then fails with not found", async () => {
		const ids = await seed()
		const { gate, release: open } = await release()
		let locked!: () => void
		const hasLock = new Promise<void>((r) => {
			locked = r
		})

		// Deleter: holds FOR UPDATE, then soft-deletes and commits.
		const deleter = db.$transaction(async (tx) => {
			await lockLookupForDelete(tx, kind, ids[refKey[kind]])
			locked()
			await gate
			// biome-ignore lint/suspicious/noExplicitAny: dynamic delegate per kind
			await (tx as any)[kind].update({
				where: { id: ids[refKey[kind]] },
				data: { deletedAt: new Date() }
			})
		})
		await hasLock

		const creating = expenseRepo.create(expenseData(ids)).then(
			() => "created",
			(e) => e
		)
		await waitForLockWait()
		open()
		await deleter

		expect(await creating).toBeInstanceOf(NotFoundException)
		expect(await db.expense.count()).toBe(0)
	})

	it("delete succeeds when nothing references the lookup", async () => {
		const ids = await seed()
		await repos[kind].delete(ids[refKey[kind]], year, month)
		const row = await findRow(kind, ids[refKey[kind]])
		expect(row?.deletedAt).not.toBeNull()
	})
})
