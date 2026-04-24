import type { CreateIncomeDTO } from "../dtos/create-income.dto"
import type { UpdateIncomeDTO } from "../dtos/update-income.dto"
import type { Income } from "../entities/income.entity"

export abstract class IncomeRepository {
	abstract findAll(budgetPeriodId?: string): Promise<Income[]>
	abstract findById(id: string): Promise<Income | null>
	abstract create(data: CreateIncomeDTO): Promise<Income>
	abstract update(id: string, data: UpdateIncomeDTO): Promise<Income>
	abstract delete(id: string): Promise<void>
}
