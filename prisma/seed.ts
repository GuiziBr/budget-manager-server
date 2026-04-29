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

async function seedCategories() {
	const rows = loadJson<{ id: string; name: string; hasBudgetEnvelope: boolean }>(
		"categories.json"
	)
	let created = 0
	for (const row of rows) {
		const existing = await prisma.category.findFirst({
			where: { id: row.id, deletedAt: null }
		})
		if (!existing) {
			await prisma.category.create({ data: row })
			created++
		}
	}
	console.log(
		`  categories: ${created} created, ${rows.length - created} skipped`
	)
}

async function seedPaymentTypes() {
	const rows = loadJson<{ id: string; name: string; hasStatement: boolean }>(
		"payment-types.json"
	)
	let created = 0
	for (const row of rows) {
		const existing = await prisma.paymentType.findFirst({
			where: { id: row.id, deletedAt: null }
		})
		if (!existing) {
			await prisma.paymentType.create({ data: row })
			created++
		}
	}
	console.log(
		`  payment_types: ${created} created, ${rows.length - created} skipped`
	)
}

async function seedBanks() {
	const rows = loadJson<{ id: string; name: string }>("banks.json")
	let created = 0
	for (const row of rows) {
		const existing = await prisma.bank.findFirst({
			where: { id: row.id, deletedAt: null }
		})
		if (!existing) {
			await prisma.bank.create({ data: row })
			created++
		}
	}
	console.log(`  banks: ${created} created, ${rows.length - created} skipped`)
}

async function seedStores() {
	const rows = loadJson<{ id: string; name: string }>("stores.json")
	let created = 0
	for (const row of rows) {
		const existing = await prisma.store.findFirst({
			where: { id: row.id, deletedAt: null }
		})
		if (!existing) {
			await prisma.store.create({ data: row })
			created++
		}
	}
	console.log(`  stores: ${created} created, ${rows.length - created} skipped`)
}

async function main() {
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
