import { Injectable } from "@nestjs/common"
import type { CreateRecurringExpenseDTO } from "@/domains/recurring-expense/dtos/create-recurring-expense.dto"
import type { UpdateRecurringExpenseDTO } from "@/domains/recurring-expense/dtos/update-recurring-expense.dto"
import type { RecurringExpense } from "@/domains/recurring-expense/entities/recurring-expense.entity"
import { RecurringExpenseRepository } from "@/domains/recurring-expense/repositories/recurring-expense.repository"
import { DatabaseService } from "@/infra/database/database.service"

@Injectable()
export class PrismaRecurringExpenseRepository extends RecurringExpenseRepository {
	constructor(private readonly db: DatabaseService) {
		super()
	}

	private mapToRecurringExpense(record: {
		id: string
		categoryId: string
		paymentTypeId: string
		bankId: string | null
		storeId: string | null
		description: string
		amount: { toNumber(): number }
		startedAt: Date
		cancelledAt: Date | null
		createdAt: Date
		updatedAt: Date
		deletedAt: Date | null
	}): RecurringExpense {
		return {
			...record,
			amount: record.amount.toNumber()
		}
	}

	async findAll(): Promise<RecurringExpense[]> {
		const records = await this.db.recurringExpense.findMany({
			where: { deletedAt: null }
		})
		return records.map((r) => this.mapToRecurringExpense(r))
	}

	async findById(id: string): Promise<RecurringExpense | null> {
		const record = await this.db.recurringExpense.findFirst({
			where: { id, deletedAt: null }
		})
		if (!record) return null
		return this.mapToRecurringExpense(record)
	}

	async create(data: CreateRecurringExpenseDTO): Promise<RecurringExpense> {
		const record = await this.db.recurringExpense.create({ data })
		return this.mapToRecurringExpense(record)
	}

	async update(id: string, data: UpdateRecurringExpenseDTO): Promise<RecurringExpense> {
		const record = await this.db.recurringExpense.update({
			where: { id, deletedAt: null },
			data
		})
		return this.mapToRecurringExpense(record)
	}

	async delete(id: string): Promise<void> {
		await this.db.recurringExpense.update({
			where: { id, deletedAt: null },
			data: { deletedAt: new Date() }
		})
	}
}
