export class InstallmentGroup {
	id: string
	description: string
	amountPerInstallment: number
	totalInstallments: number
	paymentIntervalDays: number
	firstPurchasedAt: Date
	createdAt: Date
	updatedAt: Date
	deletedAt: Date | null
}
