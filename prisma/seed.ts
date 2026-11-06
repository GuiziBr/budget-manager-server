import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import "dotenv/config"
import { seedBudgetEnvelopes } from "./seeds/budget-envelope.seed"
import { seedBudgetPeriods } from "./seeds/budget-period.seed"
import { seedExpenses } from "./seeds/expense.seed"
import type { Db, SeedContext } from "./seeds/helpers"
import { seedIncomes } from "./seeds/income.seed"
import { seedInstallmentGroups } from "./seeds/installment-group.seed"
import { loadLookupRefs, seedLookups } from "./seeds/lookups.seed"
import { seedRecurringExpenses } from "./seeds/recurring-expense.seed"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(
	pool as unknown as ConstructorParameters<typeof PrismaPg>[0]
)
const prisma = new PrismaClient({ adapter })

// Children first (foreign keys). Lookup tables are never deleted.
async function wipeTransactionalData(db: Db) {
	await db.expense.deleteMany()
	await db.budgetEnvelope.deleteMany()
	await db.income.deleteMany()
	await db.recurringExpense.deleteMany()
	await db.installmentGroup.deleteMany()
	await db.budgetPeriod.deleteMany()
	console.log("  transactional tables cleared")
}

async function main() {
	if (process.env.NODE_ENV === "production") {
		throw new Error("Refusing to seed in production")
	}

	console.log("Seeding lookup tables (upsert, nothing deleted)...")
	await seedLookups(prisma)
	const ref = await loadLookupRefs(prisma)

	console.log("Resetting and seeding transactional data...")
	await prisma.$transaction(
		async (tx) => {
			await wipeTransactionalData(tx)

			// Parents first (foreign keys).
			const periodId = await seedBudgetPeriods(tx)
			const ctx: SeedContext = { ref, periodId }
			await seedInstallmentGroups(tx)
			await seedRecurringExpenses(tx, ctx)
			await seedExpenses(tx, ctx)
			await seedIncomes(tx, ctx)
			await seedBudgetEnvelopes(tx, ctx)
		},
		{ timeout: 60_000 }
	)
	console.log("Done.")
}

main()
	.catch((err) => {
		console.error(err)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
		await pool.end()
	})
