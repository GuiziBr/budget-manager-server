import type { CreateBudgetEnvelopeDTO } from "../dtos/create-budget-envelope.dto"
import type { UpdateBudgetEnvelopeDTO } from "../dtos/update-budget-envelope.dto"
import type { BudgetEnvelope } from "../entities/budget-envelope.entity"

export abstract class BudgetEnvelopeRepository {
	abstract findAll(budgetPeriodId?: string): Promise<BudgetEnvelope[]>
	abstract findById(id: string): Promise<BudgetEnvelope | null>
	abstract create(data: CreateBudgetEnvelopeDTO): Promise<BudgetEnvelope>
	abstract update(
		id: string,
		data: UpdateBudgetEnvelopeDTO
	): Promise<BudgetEnvelope>
	abstract delete(id: string): Promise<void>
}
