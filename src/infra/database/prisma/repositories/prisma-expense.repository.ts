import { Injectable } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import type { Expense } from "@/domains/expense/entities/expense.entity"
import { calculateMonthsRunning } from "@/domains/expense/months-running"
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

// Relations are included without a `deletedAt` filter on purpose: expenses
// keep pointing at lookups (category, bank...) that were soft-deleted later,
// and their names must still resolve.
const EXPENSE_INCLUDE = {
	category: { select: { id: true, name: true } },
	paymentType: { select: { id: true, name: true } },
	bank: { select: { id: true, name: true } },
	store: { select: { id: true, name: true } },
	installmentGroup: {
		select: {
			id: true,
			totalInstallments: true,
			paymentIntervalDays: true,
			firstPurchasedAt: true
		}
	},
	recurringExpense: { select: { monthsAlreadyPaid: true, startedAt: true } },
	budgetPeriod: { select: { year: true, month: true } }
} as const

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
	purchasedAt: Date | null
	dueAt: Date | null
	paidAt: Date | null
	amount: { toNumber(): number }
	createdAt: Date
	updatedAt: Date
	deletedAt: Date | null
	category: { id: string; name: string }
	paymentType: { id: string; name: string }
	bank: { id: string; name: string } | null
	store: { id: string; name: string } | null
	installmentGroup: {
		id: string
		totalInstallments: number
		paymentIntervalDays: number
		firstPurchasedAt: Date
	} | null
	recurringExpense: { monthsAlreadyPaid: number; startedAt: Date } | null
	budgetPeriod: { year: number; month: number }
}

const NULLABLE_SORT_FIELDS = new Set<string>([
	"purchasedAt",
	"dueAt",
	"paidAt",
	"installmentNumber"
])

// Prisma cannot order case-insensitively and the Alpine Postgres image
// compares by code point (uppercase before lowercase), so these keys are
// ordered with raw SQL. Lookup joins have no `deleted_at` filter on purpose,
// so soft-deleted names sort as they are shown.
const CASE_INSENSITIVE_SORTS = {
	description: {
		join: Prisma.empty,
		expression: Prisma.sql`LOWER(e.description)`
	},
	categoryName: {
		join: Prisma.sql`JOIN categories c ON c.id = e.category_id`,
		expression: Prisma.sql`LOWER(c.name)`
	},
	paymentTypeName: {
		join: Prisma.sql`JOIN payment_types p ON p.id = e.payment_type_id`,
		expression: Prisma.sql`LOWER(p.name)`
	}
} as const

type CaseInsensitiveSort = keyof typeof CASE_INSENSITIVE_SORTS

function isCaseInsensitiveSort(sortBy: string): sortBy is CaseInsensitiveSort {
	return sortBy in CASE_INSENSITIVE_SORTS
}

@Injectable()
export class PrismaExpenseRepository extends ExpenseRepository {
	constructor(private readonly db: DatabaseService) {
		super()
	}

	private mapToExpense(row: PrismaExpenseRow): Expense {
		const {
			category,
			paymentType,
			bank,
			store,
			installmentGroup,
			recurringExpense,
			budgetPeriod,
			// replaced by the nested objects, which carry the same ids
			categoryId: _categoryId,
			paymentTypeId: _paymentTypeId,
			bankId: _bankId,
			storeId: _storeId,
			installmentGroupId: _installmentGroupId,
			...expense
		} = row
		return {
			...expense,
			amount: expense.amount.toNumber(),
			category,
			paymentType,
			bank,
			store,
			installment: installmentGroup
				? {
						id: installmentGroup.id,
						totalInstallments: installmentGroup.totalInstallments,
						paymentIntervalDays: installmentGroup.paymentIntervalDays,
						firstPurchasedAt: installmentGroup.firstPurchasedAt
					}
				: null,
			monthsRunning: recurringExpense
				? calculateMonthsRunning(recurringExpense, budgetPeriod)
				: null
		}
	}

	async findAll(
		filters: ExpenseFilters
	): Promise<{ data: Expense[]; total: number; totalAmount: number }> {
		const {
			budgetPeriodId,
			page = 1,
			limit = 20,
			sortBy = "createdAt",
			sortOrder = "desc"
		} = filters
		const skip = (page - 1) * limit
		const where = {
			deletedAt: null,
			...(budgetPeriodId ? { budgetPeriodId } : {})
		}

		const [rows, total, aggregate] = await this.db.$transaction(
			async (tx) => {
				const pageRows = isCaseInsensitiveSort(sortBy)
					? await this.findPageOrderedCaseInsensitive(tx, {
							sortBy,
							sortOrder,
							budgetPeriodId,
							skip,
							limit
						})
					: await tx.expense.findMany({
							where,
							skip,
							take: limit,
							// id tiebreaker keeps offset pagination stable across duplicate values
							orderBy: [
								this.buildOrderBy(sortBy, sortOrder),
								{ id: sortOrder }
							],
							include: EXPENSE_INCLUDE
						})

				return [
					pageRows,
					await tx.expense.count({ where }),
					await tx.expense.aggregate({ where, _sum: { amount: true } })
				] as const
			},
			// Repeatable Read gives every statement in this read-only transaction
			// the same snapshot, so a concurrent write between the page-id lookup,
			// the row load and the totals can't produce an inconsistent response.
			{ isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
		)

		return {
			data: rows.map((r) => this.mapToExpense(r)),
			total,
			totalAmount: aggregate._sum.amount?.toNumber() ?? 0
		}
	}

	private buildOrderBy(sortBy: string, sortOrder: "asc" | "desc") {
		return NULLABLE_SORT_FIELDS.has(sortBy)
			? { [sortBy]: { sort: sortOrder, nulls: "last" as const } }
			: { [sortBy]: sortOrder }
	}

	// Two steps: raw SQL picks the ordered page of ids, then Prisma loads the
	// rows with their relations and they are put back in that order.
	private async findPageOrderedCaseInsensitive(
		tx: Prisma.TransactionClient,
		params: {
			sortBy: CaseInsensitiveSort
			sortOrder: "asc" | "desc"
			budgetPeriodId?: string
			skip: number
			limit: number
		}
	) {
		const { sortBy, sortOrder, budgetPeriodId, skip, limit } = params
		const { join, expression } = CASE_INSENSITIVE_SORTS[sortBy]
		// direction comes from the validated "asc" | "desc" enum, never raw input
		const direction = sortOrder === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`
		const periodFilter = budgetPeriodId
			? Prisma.sql`AND e.budget_period_id = ${budgetPeriodId}::uuid`
			: Prisma.empty

		const idRows = await tx.$queryRaw<{ id: string }[]>`
			SELECT e.id
			FROM expenses e
			${join}
			WHERE e.deleted_at IS NULL ${periodFilter}
			ORDER BY ${expression} ${direction}, e.id ${direction}
			LIMIT ${limit} OFFSET ${skip}`

		const ids = idRows.map((r) => r.id)
		const rows = await tx.expense.findMany({
			where: { id: { in: ids } },
			include: EXPENSE_INCLUDE
		})
		const position = new Map(ids.map((id, index) => [id, index]))
		return rows.sort(
			(a, b) => (position.get(a.id) ?? 0) - (position.get(b.id) ?? 0)
		)
	}

	async findById(id: string): Promise<Expense | null> {
		const row = await this.db.expense.findFirst({
			where: { id, deletedAt: null },
			include: EXPENSE_INCLUDE
		})
		if (!row) return null
		return this.mapToExpense(row)
	}

	async create(data: CreateExpenseData): Promise<Expense> {
		const row = await this.db.expense.create({
			data,
			include: EXPENSE_INCLUDE
		})
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
				data: { ...expenseData, recurringExpenseId: recurring.id },
				include: EXPENSE_INCLUDE
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
				},
				select: { id: true }
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
					tx.expense.create({
						data: { ...e, installmentGroupId: group.id },
						include: EXPENSE_INCLUDE
					})
				)
			)
			return rows.map((r) => this.mapToExpense(r))
		})
	}

	async update(id: string, data: UpdateExpenseData): Promise<Expense> {
		const row = await this.db.expense.update({
			where: { id, deletedAt: null },
			data,
			include: EXPENSE_INCLUDE
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
