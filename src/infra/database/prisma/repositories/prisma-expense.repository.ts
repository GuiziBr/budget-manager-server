import { Injectable } from "@nestjs/common"
import type { Expense } from "@/domains/expense/entities/expense.entity"
import {
	type CreateExpenseData,
	type CreateInstallmentExpenseData,
	type CreateInstallmentGroupData,
	type CreateRecurringTemplateData,
	type ExpenseFilters,
	ExpenseRepository,
	type UpdateExpenseData
} from "@/domains/expense/repositories/expense.repository"
import { DatabaseService } from "@/infra/database/database.service"

type PrismaExpenseRow = {
	id: string
	budgetPeriodId: string
	categoryId: string
	paymentTypeId: string
	bankId: string | null
	storeId: string | null
	installmentGroupId: string | null
	recurringExpenseId: string | null
	description: string
	installmentNumber: number | null
	purchaseDate: Date | null
	dueDate: Date | null
	paidDate: Date | null
	amount: { toNumber(): number }
	createdAt: Date
	updatedAt: Date
	deletedAt: Date | null
}

@Injectable()
export class PrismaExpenseRepository extends ExpenseRepository {
	constructor(private readonly db: DatabaseService) {
		super()
	}

	private mapToExpense(row: PrismaExpenseRow): Expense {
		return {
			...row,
			amount: row.amount.toNumber()
		}
	}

	async findAll(
		filters: ExpenseFilters
	): Promise<{ data: Expense[]; total: number }> {
		const { budgetPeriodId, page = 1, limit = 20 } = filters
		const skip = (page - 1) * limit
		const where = {
			deletedAt: null,
			...(budgetPeriodId ? { budgetPeriodId } : {})
		}

		const [rows, total] = await this.db.$transaction([
			this.db.expense.findMany({
				where,
				skip,
				take: limit,
				orderBy: { createdAt: "desc" }
			}),
			this.db.expense.count({ where })
		])

		return { data: rows.map((r) => this.mapToExpense(r)), total }
	}

	async findById(id: string): Promise<Expense | null> {
		const row = await this.db.expense.findFirst({
			where: { id, deletedAt: null }
		})
		if (!row) return null
		return this.mapToExpense(row)
	}

	async create(data: CreateExpenseData): Promise<Expense> {
		const row = await this.db.expense.create({ data })
		return this.mapToExpense(row)
	}

	async createWithRecurringTemplate(
		expenseData: CreateExpenseData,
		recurringData: CreateRecurringTemplateData
	): Promise<Expense> {
		return this.db.$transaction(async (tx) => {
			const recurring = await tx.recurringExpense.create({
				data: recurringData
			})
			const row = await tx.expense.create({
				data: { ...expenseData, recurringExpenseId: recurring.id }
			})

			// Backfill rows for budget periods that were opened before this
			// recurring template was created (strictly after startedAt month).
			const startedAt = recurringData.startedAt
			const futurePeriods = await tx.budgetPeriod.findMany({
				where: {
					deletedAt: null,
					id: { not: expenseData.budgetPeriodId },
					OR: [
						{ year: { gt: startedAt.getUTCFullYear() } },
						{
							year: startedAt.getUTCFullYear(),
							month: { gt: startedAt.getUTCMonth() + 1 }
						}
					]
				}
			})

			if (futurePeriods.length > 0) {
				await tx.expense.createMany({
					data: futurePeriods.map((period) => ({
						budgetPeriodId: period.id,
						recurringExpenseId: recurring.id,
						categoryId: expenseData.categoryId,
						paymentTypeId: expenseData.paymentTypeId,
						bankId: expenseData.bankId ?? null,
						storeId: expenseData.storeId ?? null,
						description: expenseData.description,
						amount: expenseData.amount
					}))
				})
			}

			return this.mapToExpense(row)
		})
	}

	async createInstallmentExpenses(
		groupData: CreateInstallmentGroupData,
		expenses: CreateInstallmentExpenseData[]
	): Promise<Expense[]> {
		return this.db.$transaction(async (tx) => {
			const group = await tx.installmentGroup.create({ data: groupData })
			const rows = await Promise.all(
				expenses.map((e) =>
					tx.expense.create({ data: { ...e, installmentGroupId: group.id } })
				)
			)
			return rows.map((r) => this.mapToExpense(r))
		})
	}

	async update(id: string, data: UpdateExpenseData): Promise<Expense> {
		const row = await this.db.expense.update({
			where: { id, deletedAt: null },
			data
		})
		return this.mapToExpense(row)
	}

	async delete(id: string): Promise<void> {
		await this.db.expense.update({
			where: { id, deletedAt: null },
			data: { deletedAt: new Date() }
		})
	}
}
