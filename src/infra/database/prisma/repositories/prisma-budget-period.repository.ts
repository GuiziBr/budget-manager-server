import { Injectable } from "@nestjs/common"
import type { CreateBudgetPeriodDTO } from "@/domains/budget-period/dtos/create-budget-period.dto"
import type { BudgetPeriod } from "@/domains/budget-period/entities/budget-period.entity"
import {
	BudgetPeriodRepository,
	type EnvelopeRow,
	type RecurringExpenseRow
} from "@/domains/budget-period/repositories/budget-period.repository"
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

	async openPeriod(
		dto: CreateBudgetPeriodDTO,
		recurringRows: RecurringExpenseRow[],
		envelopeRows: EnvelopeRow[]
	): Promise<BudgetPeriod> {
		return this.db.$transaction(async (tx) => {
			const period = await tx.budgetPeriod.create({ data: dto })

			// Compute installment expense rows due in this period
			const installmentGroups = await tx.installmentGroup.findMany({
				where: { deletedAt: null },
				include: {
					expenses: {
						where: { deletedAt: null },
						select: { installmentNumber: true }
					}
				}
			})

			const periodStart = new Date(Date.UTC(dto.year, dto.month - 1, 1))
			const periodEnd = new Date(Date.UTC(dto.year, dto.month, 1))

			const installmentExpenseData: {
				budgetPeriodId: string
				categoryId: string
				paymentTypeId: string
				bankId: string | null
				storeId: string | null
				installmentGroupId: string
				description: string
				amount: number
				installmentNumber: number
				dueAt: Date
				purchasedAt: Date | null
			}[] = []

			for (const group of installmentGroups) {
				const existingInstallmentNumbers = new Set(
					group.expenses
						.map((e) => e.installmentNumber)
						.filter((n) => n !== null)
				)

				for (let n = 1; n <= group.totalInstallments; n++) {
					if (existingInstallmentNumbers.has(n)) continue

					const dueDate = new Date(group.firstPurchasedAt)
					dueDate.setUTCDate(
						dueDate.getUTCDate() + (n - 1) * group.paymentIntervalDays
					)

					if (dueDate >= periodStart && dueDate < periodEnd) {
						// We need the category/paymentType from the first expense of the group
						const firstExpense = await tx.expense.findFirst({
							where: { installmentGroupId: group.id, deletedAt: null },
							orderBy: { installmentNumber: "asc" }
						})
						if (!firstExpense) continue

						installmentExpenseData.push({
							budgetPeriodId: period.id,
							categoryId: firstExpense.categoryId,
							paymentTypeId: firstExpense.paymentTypeId,
							bankId: firstExpense.bankId,
							storeId: firstExpense.storeId,
							installmentGroupId: group.id,
							description: group.description,
							amount: group.amountPerInstallment.toNumber(),
							installmentNumber: n,
							dueAt: dueDate,
							purchasedAt: null
						})
					}
				}
			}

			if (installmentExpenseData.length > 0) {
				await tx.expense.createMany({ data: installmentExpenseData })
			}

			if (recurringRows.length > 0) {
				await tx.expense.createMany({
					data: recurringRows.map((r) => ({
						budgetPeriodId: period.id,
						recurringExpenseId: r.recurringExpenseId,
						categoryId: r.categoryId,
						paymentTypeId: r.paymentTypeId,
						bankId: r.bankId,
						storeId: r.storeId,
						description: r.description,
						amount: r.amount
					}))
				})
			}

			if (envelopeRows.length > 0) {
				await tx.budgetEnvelope.createMany({
					data: envelopeRows.map((e) => ({
						budgetPeriodId: period.id,
						categoryId: e.categoryId,
						allocatedAmount: e.allocatedAmount
					}))
				})
			}

			return period
		})
	}

	async delete(id: string): Promise<void> {
		await this.db.budgetPeriod.update({
			where: { id, deletedAt: null },
			data: { deletedAt: new Date() }
		})
	}
}
