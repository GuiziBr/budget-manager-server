export class BudgetEnvelope {
	id: string
	budgetPeriodId: string
	categoryId: string
	allocatedAmount: number
	createdAt: Date
	updatedAt: Date
	deletedAt: Date | null
}
