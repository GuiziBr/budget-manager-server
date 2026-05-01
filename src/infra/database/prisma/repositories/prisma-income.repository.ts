import { Injectable } from "@nestjs/common"
import type { CreateIncomeDTO } from "@/domains/income/dtos/create-income.dto"
import type { UpdateIncomeDTO } from "@/domains/income/dtos/update-income.dto"
import type { Income } from "@/domains/income/entities/income.entity"
import { IncomeRepository } from "@/domains/income/repositories/income.repository"
import { DatabaseService } from "@/infra/database/database.service"

@Injectable()
export class PrismaIncomeRepository extends IncomeRepository {
	constructor(private readonly db: DatabaseService) {
		super()
	}

	private mapToIncome(record: {
		id: string
		budgetPeriodId: string
		description: string
		amount: { toNumber(): number }
		isSalary: boolean
		receivedAt: Date | null
		createdAt: Date
		updatedAt: Date
		deletedAt: Date | null
	}): Income {
		return {
			...record,
			amount: record.amount.toNumber()
		}
	}

	async findAll(budgetPeriodId?: string): Promise<Income[]> {
		const records = await this.db.income.findMany({
			where: { deletedAt: null, ...(budgetPeriodId ? { budgetPeriodId } : {}) }
		})
		return records.map((r) => this.mapToIncome(r))
	}

	async findById(id: string): Promise<Income | null> {
		const record = await this.db.income.findFirst({
			where: { id, deletedAt: null }
		})
		if (!record) return null
		return this.mapToIncome(record)
	}

	async create(data: CreateIncomeDTO): Promise<Income> {
		const record = await this.db.income.create({ data })
		return this.mapToIncome(record)
	}

	async update(id: string, data: UpdateIncomeDTO): Promise<Income> {
		const record = await this.db.income.update({
			where: { id, deletedAt: null },
			data
		})
		return this.mapToIncome(record)
	}

	async delete(id: string): Promise<void> {
		await this.db.income.update({
			where: { id, deletedAt: null },
			data: { deletedAt: new Date() }
		})
	}
}
