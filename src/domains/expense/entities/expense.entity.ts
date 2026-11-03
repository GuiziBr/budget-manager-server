export class ExpenseLookup {
	id: string
	name: string
}

export class ExpenseInstallment {
	id: string
	totalInstallments: number
	paymentIntervalDays: number
	firstPurchasedAt: Date
}

export class Expense {
	id: string
	budgetPeriodId: string
	recurringExpenseId: string | null
	description: string
	installmentNumber: number | null
	purchasedAt: Date | null
	dueAt: Date | null
	paidAt: Date | null
	amount: number
	category: ExpenseLookup
	paymentType: ExpenseLookup
	bank: ExpenseLookup | null
	store: ExpenseLookup | null
	installment: ExpenseInstallment | null
	monthsRunning: number | null
	createdAt: Date
	updatedAt: Date
	deletedAt: Date | null
}
