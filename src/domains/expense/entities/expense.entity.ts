export class Expense {
	id: string
	budgetPeriodId: string
	categoryId: string
	paymentTypeId: string
	bankId: string | null
	storeId: string | null
	installmentGroupId: string | null
	recurringExpenseId: string | null
	description: string
	installmentNumber: number | null
	purchasedAt: Date | null
	dueAt: Date | null
	paidAt: Date | null
	amount: number
	createdAt: Date
	updatedAt: Date
	deletedAt: Date | null
}
