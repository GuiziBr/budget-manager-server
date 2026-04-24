export class Income {
	id: string
	budgetPeriodId: string
	description: string
	amount: number
	isSalary: boolean
	receivedDate: Date | null
	createdAt: Date
	updatedAt: Date
	deletedAt: Date | null
}
