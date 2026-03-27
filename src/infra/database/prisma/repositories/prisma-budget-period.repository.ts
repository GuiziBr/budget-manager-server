import { Injectable } from "@nestjs/common"
import type { CreateBudgetPeriodDTO } from "@/domains/budget-period/dtos/create-budget-period.dto"
import type { UpdateBudgetPeriodDTO } from "@/domains/budget-period/dtos/update-budget-period.dto"
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

	async create(data: CreateBudgetPeriodDTO): Promise<BudgetPeriod> {
		return this.db.budgetPeriod.create({ data })
	}

	async update(id: string, data: UpdateBudgetPeriodDTO): Promise<BudgetPeriod> {
		return this.db.budgetPeriod.update({ where: { id, deletedAt: null }, data })
	}

	async delete(id: string): Promise<void> {
		await this.db.budgetPeriod.update({
			where: { id, deletedAt: null },
			data: { deletedAt: new Date() }
		})
	}
}
