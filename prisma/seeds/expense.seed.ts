import {
	type DateToken,
	type Db,
	loadJson,
	optionalDate,
	type SeedContext
} from "./helpers"

// One-time, installment and recurring-generated expenses (linked by id in the JSON).
export async function seedExpenses(db: Db, { ref, periodId }: SeedContext) {
	const rows = loadJson<{
		id: string
		period: number
		description: string
		amount: number
		category: string
		paymentType: string
		bank?: string
		store?: string
		installmentGroupId?: string
		installmentNumber?: number
		recurringExpenseId?: string
		purchasedAt?: DateToken
		dueAt?: DateToken
		paidAt?: DateToken
		deletedAt?: DateToken
	}>("expenses.json")
	await db.expense.createMany({
		data: rows.map((e) => ({
			id: e.id,
			budgetPeriodId: periodId(e.period),
			description: e.description,
			amount: e.amount,
			categoryId: ref.category(e.category, true),
			paymentTypeId: ref.paymentType(e.paymentType, true),
			bankId: ref.bank(e.bank),
			storeId: ref.store(e.store),
			installmentGroupId: e.installmentGroupId,
			installmentNumber: e.installmentNumber,
			recurringExpenseId: e.recurringExpenseId,
			purchasedAt: optionalDate(e.purchasedAt),
			dueAt: optionalDate(e.dueAt),
			paidAt: optionalDate(e.paidAt),
			deletedAt: optionalDate(e.deletedAt)
		}))
	})
	console.log(`  expenses: ${rows.length}`)
}
