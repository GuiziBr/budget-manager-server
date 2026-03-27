import { Injectable } from "@nestjs/common"
import type { CreateBudgetPeriodDTO } from "@/domains/budget-period/dtos/create-budget-period.dto"
import type { BudgetPeriod } from "@/domains/budget-period/entities/budget-period.entity"
import { BudgetPeriodRepository } from "@/domains/budget-period/repositories/budget-period.repository"
import { DatabaseService } from "@/infra/database/database.service"

@Injectable()
export class PrismaBudgetPeriodRepository extends BudgetPeriodRepository {
	constructor(private readonly db: DatabaseService) {
		super()
	}

	async findAll(): Promise<BudgetPeriod[]> {
		return this.db.budgetPeriod.findMany({ where: { deletedAt: null } })
	}

	async findById(id: string): Promise<BudgetPeriod | null> {
		return this.db.budgetPeriod.findFirst({ where: { id, deletedAt: null } })
	}

	async findByYearAndMonth(
		year: number,
		month: number
	): Promise<BudgetPeriod | null> {
		return this.db.budgetPeriod.findFirst({
			where: { year, month, deletedAt: null }
		})
	}

	async hasLinkedRecords(id: string): Promise<boolean> {
		const count = await this.db.budgetPeriod.findFirst({
			where: { id, deletedAt: null },
			select: {
				_count: {
					select: {
						expenses: { where: { deletedAt: null } },
						incomes: { where: { deletedAt: null } },
						budgetEnvelopes: { where: { deletedAt: null } }
					}
				}
			}
		})
		if (!count) return false
		const { expenses, incomes, budgetEnvelopes } = count._count
		return expenses > 0 || incomes > 0 || budgetEnvelopes > 0
	}

	async create(data: CreateBudgetPeriodDTO): Promise<BudgetPeriod> {
		return this.db.budgetPeriod.create({ data })
	}

	async delete(id: string): Promise<void> {
		await this.db.budgetPeriod.update({
			where: { id, deletedAt: null },
			data: { deletedAt: new Date() }
		})
	}
}
