export class RecurringExpense {
	id: string
	categoryId: string
	paymentTypeId: string
	bankId: string | null
	storeId: string | null
	description: string
	amount: number
	startedAt: Date
	cancelledAt: Date | null
	createdAt: Date
	updatedAt: Date
	deletedAt: Date | null
}
