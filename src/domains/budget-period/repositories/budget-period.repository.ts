import type { CreateBudgetPeriodDTO } from "../dtos/create-budget-period.dto"
import type { BudgetPeriod } from "../entities/budget-period.entity"

export type RecurringExpenseRow = {
	recurringExpenseId: string
	categoryId: string
	paymentTypeId: string
	bankId: string | null
	storeId: string | null
	description: string
	amount: number
}

export type EnvelopeRow = {
	categoryId: string
	allocatedAmount: number
}

export abstract class BudgetPeriodRepository {
	abstract findAll(): Promise<BudgetPeriod[]>
	abstract findById(id: string): Promise<BudgetPeriod | null>
	abstract findByYearAndMonth(
		year: number,
		month: number
	): Promise<BudgetPeriod | null>
	abstract hasLinkedRecords(id: string): Promise<boolean>
	abstract openPeriod(
		dto: CreateBudgetPeriodDTO,
		recurringRows: RecurringExpenseRow[],
		envelopeRows: EnvelopeRow[]
	): Promise<BudgetPeriod>
	abstract delete(id: string): Promise<void>
}
