import { readFileSync } from "node:fs"
import { join } from "node:path"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import "dotenv/config"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(
	pool as unknown as ConstructorParameters<typeof PrismaPg>[0]
)
const prisma = new PrismaClient({ adapter })

function loadJson<T>(filename: string): T[] {
	const filepath = join(__dirname, "seed-data", filename)
	return JSON.parse(readFileSync(filepath, "utf-8")) as T[]
}

async function truncateAll() {
	await prisma.expense.deleteMany()
	await prisma.budgetEnvelope.deleteMany()
	await prisma.income.deleteMany()
	await prisma.recurringExpense.deleteMany()
	await prisma.installmentGroup.deleteMany()
	await prisma.category.deleteMany()
	await prisma.paymentType.deleteMany()
	await prisma.bank.deleteMany()
	await prisma.store.deleteMany()
	await prisma.budgetPeriod.deleteMany()
	console.log("  all tables cleared")
}

async function seedCategories() {
	const rows = loadJson<{
		id: string
		name: string
		hasBudgetEnvelope: boolean
	}>("categories.json")
	await prisma.category.createMany({ data: rows })
	console.log(`  categories: ${rows.length} inserted`)
}

async function seedPaymentTypes() {
	const rows = loadJson<{ id: string; name: string; hasStatement: boolean }>(
		"payment-types.json"
	)
	await prisma.paymentType.createMany({ data: rows })
	console.log(`  payment_types: ${rows.length} inserted`)
}

async function seedBanks() {
	const rows = loadJson<{ id: string; name: string }>("banks.json")
	await prisma.bank.createMany({ data: rows })
	console.log(`  banks: ${rows.length} inserted`)
}

async function seedStores() {
	const rows = loadJson<{ id: string; name: string }>("stores.json")
	await prisma.store.createMany({ data: rows })
	console.log(`  stores: ${rows.length} inserted`)
}

async function main() {
	console.log("Clearing all tables...")
	await truncateAll()
	console.log("Seeding lookup tables...")
	await seedCategories()
	await seedPaymentTypes()
	await seedBanks()
	await seedStores()
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
