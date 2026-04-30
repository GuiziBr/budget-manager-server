import type { InstallmentGroup } from "../entities/installment-group.entity"

export type UpdateInstallmentGroupData = {
	amountPerInstallment?: number
	totalInstallments?: number
}

export abstract class InstallmentGroupRepository {
	abstract findById(id: string): Promise<InstallmentGroup | null>
	abstract update(
		id: string,
		data: UpdateInstallmentGroupData,
		currentYear: number,
		currentMonth: number
	): Promise<InstallmentGroup>
}
