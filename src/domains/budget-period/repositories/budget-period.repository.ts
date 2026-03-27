import type { CreateBudgetPeriodDTO } from "../dtos/create-budget-period.dto"
import type { UpdateBudgetPeriodDTO } from "../dtos/update-budget-period.dto"
import type { BudgetPeriod } from "../entities/budget-period.entity"

export abstract class BudgetPeriodRepository {
	abstract findAll(): Promise<BudgetPeriod[]>
	abstract findById(id: string): Promise<BudgetPeriod | null>
	abstract create(data: CreateBudgetPeriodDTO): Promise<BudgetPeriod>
	abstract update(
		id: string,
		data: UpdateBudgetPeriodDTO
	): Promise<BudgetPeriod>
	abstract delete(id: string): Promise<void>
}
