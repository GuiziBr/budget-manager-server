import { type Db, loadJson, type SeedContext } from "./helpers"

export async function seedBudgetEnvelopes(
	db: Db,
	{ ref, periodId }: SeedContext
) {
	const rows = loadJson<{
		id: string
		period: number
		category: string
		allocatedAmount: number
	}>("budget-envelopes.json")
	await db.budgetEnvelope.createMany({
		data: rows.map((e) => ({
			id: e.id,
			budgetPeriodId: periodId(e.period),
			categoryId: ref.category(e.category, true),
			allocatedAmount: e.allocatedAmount
		}))
	})
	console.log(`  budget_envelopes: ${rows.length}`)
}
