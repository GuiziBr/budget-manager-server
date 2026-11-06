import { type Db, loadJson, monthStart } from "./helpers"

// Returns a resolver from month offset to the seeded period id.
export async function seedBudgetPeriods(db: Db) {
	const periods = loadJson<{ id: string; monthOffset: number }>(
		"budget-periods.json"
	)
	await db.budgetPeriod.createMany({
		data: periods.map(({ id, monthOffset }) => {
			const first = monthStart(monthOffset)
			return {
				id,
				year: first.getUTCFullYear(),
				month: first.getUTCMonth() + 1
			}
		})
	})
	console.log(`  budget_periods: ${periods.length}`)

	return (offset: number) => {
		const found = periods.find((p) => p.monthOffset === offset)
		if (!found) {
			throw new Error(`No budget period for month offset ${offset}`)
		}
		return found.id
	}
}
