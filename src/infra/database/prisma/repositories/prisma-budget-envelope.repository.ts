import { ConflictException, Injectable } from "@nestjs/common"
import { PrismaClientKnownRequestError } from "@prisma/client-runtime-utils"
import type { CreateBudgetEnvelopeDTO } from "@/domains/budget-envelope/dtos/create-budget-envelope.dto"
import type { UpdateBudgetEnvelopeDTO } from "@/domains/budget-envelope/dtos/update-budget-envelope.dto"
import type { BudgetEnvelope } from "@/domains/budget-envelope/entities/budget-envelope.entity"
import { BudgetEnvelopeRepository } from "@/domains/budget-envelope/repositories/budget-envelope.repository"
import { DatabaseService } from "@/infra/database/database.service"

type PrismaBudgetEnvelopeRow = {
	id: string
	budgetPeriodId: string
	categoryId: string
	allocatedAmount: { toNumber(): number }
	createdAt: Date
	updatedAt: Date
	deletedAt: Date | null
}

@Injectable()
export class PrismaBudgetEnvelopeRepository extends BudgetEnvelopeRepository {
	constructor(private readonly db: DatabaseService) {
		super()
	}

	private mapToEnvelope(row: PrismaBudgetEnvelopeRow): BudgetEnvelope {
		return { ...row, allocatedAmount: row.allocatedAmount.toNumber() }
	}

	async findAll(budgetPeriodId?: string): Promise<BudgetEnvelope[]> {
		const rows = await this.db.budgetEnvelope.findMany({
			where: {
				deletedAt: null,
				...(budgetPeriodId ? { budgetPeriodId } : {})
			}
		})
		return rows.map((r) => this.mapToEnvelope(r))
	}

	async findById(id: string): Promise<BudgetEnvelope | null> {
		const row = await this.db.budgetEnvelope.findFirst({
			where: { id, deletedAt: null }
		})
		if (!row) return null
		return this.mapToEnvelope(row)
	}

	async create(data: CreateBudgetEnvelopeDTO): Promise<BudgetEnvelope> {
		try {
			const row = await this.db.budgetEnvelope.create({ data })
			return this.mapToEnvelope(row)
		} catch (error) {
			if (
				error instanceof PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				throw new ConflictException(
					"A budget envelope for this category already exists in the period"
				)
			}
			throw error
		}
	}

	async update(
		id: string,
		data: UpdateBudgetEnvelopeDTO
	): Promise<BudgetEnvelope> {
		const row = await this.db.budgetEnvelope.update({
			where: { id, deletedAt: null },
			data
		})
		return this.mapToEnvelope(row)
	}

	async delete(id: string): Promise<void> {
		await this.db.budgetEnvelope.update({
			where: { id, deletedAt: null },
			data: { deletedAt: new Date() }
		})
	}
}
