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
	purchaseDate: Date | null
	dueDate: Date | null
	paidDate: Date | null
	amount: number
	createdAt: Date
	updatedAt: Date
	deletedAt: Date | null
}
