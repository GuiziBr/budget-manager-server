import {
	type DateToken,
	type Db,
	loadJson,
	optionalDate,
	resolveDate,
	type SeedContext
} from "./helpers"

export async function seedRecurringExpenses(db: Db, { ref }: SeedContext) {
	const rows = loadJson<{
		id: string
		description: string
		amount: number
		category: string
		paymentType: string
		bank?: string
		store?: string
		startedAt: DateToken
		cancelledAt?: DateToken
		monthsAlreadyPaid?: number
	}>("recurring-expenses.json")
	await db.recurringExpense.createMany({
		data: rows.map((r) => ({
			id: r.id,
			description: r.description,
			amount: r.amount,
			categoryId: ref.category(r.category, true),
			paymentTypeId: ref.paymentType(r.paymentType, true),
			bankId: ref.bank(r.bank),
			storeId: ref.store(r.store),
			startedAt: resolveDate(r.startedAt),
			cancelledAt: optionalDate(r.cancelledAt),
			monthsAlreadyPaid: r.monthsAlreadyPaid
		}))
	})
	console.log(`  recurring_expenses: ${rows.length}`)
}
