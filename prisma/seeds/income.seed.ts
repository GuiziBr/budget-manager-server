import {
	type DateToken,
	type Db,
	loadJson,
	optionalDate,
	type SeedContext
} from "./helpers"

export async function seedIncomes(db: Db, { periodId }: SeedContext) {
	const rows = loadJson<{
		id: string
		period: number
		description: string
		amount: number
		isSalary: boolean
		receivedAt?: DateToken
	}>("incomes.json")
	await db.income.createMany({
		data: rows.map((i) => ({
			id: i.id,
			budgetPeriodId: periodId(i.period),
			description: i.description,
			amount: i.amount,
			isSalary: i.isSalary,
			receivedAt: optionalDate(i.receivedAt)
		}))
	})
	console.log(`  incomes: ${rows.length}`)
}
