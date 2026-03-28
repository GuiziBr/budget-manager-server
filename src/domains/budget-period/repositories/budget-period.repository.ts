import type { CreateBudgetPeriodDTO } from "../dtos/create-budget-period.dto"
import type { BudgetPeriod } from "../entities/budget-period.entity"

export abstract class BudgetPeriodRepository {
	abstract findAll(): Promise<BudgetPeriod[]>
	abstract findById(id: string): Promise<BudgetPeriod | null>
	abstract findByYearAndMonth(
		year: number,
		month: number
	): Promise<BudgetPeriod | null>
	abstract hasLinkedRecords(id: string): Promise<boolean>
	abstract create(data: CreateBudgetPeriodDTO): Promise<BudgetPeriod>
	abstract delete(id: string): Promise<void>
}
