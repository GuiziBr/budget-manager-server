import {
	BadRequestException,
	HttpException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
	UnprocessableEntityException
} from "@nestjs/common"
import { BudgetPeriodService } from "@/domains/budget-period/budget-period.service"
import { CategoryService } from "@/domains/category/category.service"
import { PaymentTypeService } from "@/domains/payment-type/payment-type.service"
import { type CreateExpenseDTO, ExpenseType } from "./dtos/create-expense.dto"
import type { UpdateExpenseDTO } from "./dtos/update-expense.dto"
import type { Expense } from "./entities/expense.entity"
import {
	type ExpenseFilters,
	ExpenseRepository
} from "./repositories/expense.repository"

@Injectable()
export class ExpenseService {
	private readonly logger = new Logger(ExpenseService.name)

	constructor(
		private readonly expenseRepository: ExpenseRepository,
		private readonly budgetPeriodService: BudgetPeriodService,
		private readonly categoryService: CategoryService,
		private readonly paymentTypeService: PaymentTypeService
	) {}

	async findAll(
		filters: ExpenseFilters
	): Promise<{ data: Expense[]; total: number; page: number; limit: number }> {
		this.logger.debug("Fetching all expenses")
		try {
			const { budgetPeriodId, page = 1, limit = 20 } = filters
			const { data, total } = await this.expenseRepository.findAll({
				budgetPeriodId,
				page,
				limit
			})
			return { data, total, page, limit }
		} catch (error) {
			this.logger.error("Failed to fetch expenses", error)
			throw new InternalServerErrorException()
		}
	}

	async findById(id: string): Promise<Expense> {
		this.logger.debug(`Fetching expense with id: ${id}`)
		try {
			const expense = await this.expenseRepository.findById(id)
			if (!expense) {
				throw new NotFoundException(`Expense with id ${id} not found`)
			}
			return expense
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to fetch expense with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}

	async create(dto: CreateExpenseDTO): Promise<Expense> {
		this.logger.debug(`Creating ${dto.type} expense`)
		try {
			const period = await this.budgetPeriodService.findById(dto.budgetPeriodId)
			await this.categoryService.findById(dto.categoryId)
			const paymentType = await this.paymentTypeService.findById(
				dto.paymentTypeId
			)

			if (paymentType.hasStatement && !dto.bankId) {
				throw new BadRequestException(
					"bankId is required for this payment type"
				)
			}

			if (dto.type === ExpenseType.ONE_TIME) {
				const { type: _, ...data } = dto
				return await this.expenseRepository.create(data)
			}

			if (dto.type === ExpenseType.RECURRING) {
				const { type: _, ...fields } = dto
				const startedAt = new Date(Date.UTC(period.year, period.month - 1, 1))
				return await this.expenseRepository.createWithRecurringTemplate(
					fields,
					{
						categoryId: fields.categoryId,
						paymentTypeId: fields.paymentTypeId,
						bankId: fields.bankId ?? null,
						storeId: fields.storeId ?? null,
						description: fields.description,
						amount: fields.amount,
						startedAt
					}
				)
			}

			// installment
			const {
				type: _,
				budgetPeriodId: _pid,
				categoryId,
				paymentTypeId,
				bankId,
				storeId,
				description,
				amountPerInstallment,
				totalInstallments,
				paymentIntervalDays,
				firstPurchasedAt
			} = dto
			const baseDate = new Date(firstPurchasedAt)

			const expenseRows = []
			for (let i = 1; i <= totalInstallments; i++) {
				const dueDate = new Date(baseDate)
				dueDate.setUTCDate(dueDate.getUTCDate() + (i - 1) * paymentIntervalDays)

				const duePeriod = await this.budgetPeriodService.findByYearAndMonth(
					dueDate.getUTCFullYear(),
					dueDate.getUTCMonth() + 1
				)
				if (!duePeriod) continue

				expenseRows.push({
					budgetPeriodId: duePeriod.id,
					categoryId,
					paymentTypeId,
					bankId: bankId ?? null,
					storeId: storeId ?? null,
					description,
					amount: amountPerInstallment,
					installmentNumber: i,
					dueAt: dueDate,
					purchasedAt: i === 1 ? baseDate : null
				})
			}

			if (expenseRows.length === 0) {
				throw new BadRequestException(
					"No matching budget periods found for any installment due date"
				)
			}

			const expenses = await this.expenseRepository.createInstallmentExpenses(
				{
					description,
					amountPerInstallment,
					totalInstallments,
					paymentIntervalDays,
					firstPurchasedAt: baseDate
				},
				expenseRows
			)

			const first = expenses.find((e) => e.installmentNumber === 1)
			return first ?? expenses[0]
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error("Failed to create expense", error)
			throw new InternalServerErrorException()
		}
	}

	async update(id: string, dto: UpdateExpenseDTO): Promise<Expense> {
		this.logger.debug(`Updating expense with id: ${id}`)
		try {
			const expense = await this.findById(id)
			await this.assertPeriodIsNotPast(expense.budgetPeriodId, "update")

			if (dto.categoryId) {
				await this.categoryService.findById(dto.categoryId)
			}

			const paymentTypeChanged = dto.paymentTypeId !== undefined
			const bankIdCleared = dto.bankId === null

			if (paymentTypeChanged || bankIdCleared) {
				const paymentType = paymentTypeChanged
					? await this.paymentTypeService.findById(dto.paymentTypeId as string)
					: await this.paymentTypeService.findById(expense.paymentTypeId)
				const resolvedBankId =
					dto.bankId !== undefined ? dto.bankId : expense.bankId
				if (paymentType.hasStatement && !resolvedBankId) {
					throw new BadRequestException(
						"bankId is required for this payment type"
					)
				}
			}

			return await this.expenseRepository.update(id, dto)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to update expense with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}

	async delete(id: string): Promise<void> {
		this.logger.debug(`Deleting expense with id: ${id}`)
		try {
			const expense = await this.findById(id)
			await this.assertPeriodIsNotPast(expense.budgetPeriodId, "delete")
			return await this.expenseRepository.delete(id)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to delete expense with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}

	private async assertPeriodIsNotPast(
		budgetPeriodId: string,
		action: "update" | "delete"
	): Promise<void> {
		const period = await this.budgetPeriodService.findById(budgetPeriodId)
		const now = new Date()
		const currentYear = now.getUTCFullYear()
		const currentMonth = now.getUTCMonth() + 1
		const isPastPeriod =
			period.year < currentYear ||
			(period.year === currentYear && period.month < currentMonth)
		if (isPastPeriod) {
			throw new UnprocessableEntityException(
				`Cannot ${action} an expense from a past budget period`
			)
		}
	}
}
