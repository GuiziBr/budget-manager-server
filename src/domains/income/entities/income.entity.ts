export class Income {
	id: string
	budgetPeriodId: string
	description: string
	amount: number
	isSalary: boolean
	receivedAt: Date | null
	createdAt: Date
	updatedAt: Date
	deletedAt: Date | null
}
