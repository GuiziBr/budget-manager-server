import {
	ConflictException,
	HttpException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException
} from "@nestjs/common"
import { CategoryService } from "@/domains/category/category.service"
import { RecurringExpenseService } from "@/domains/recurring-expense/recurring-expense.service"
import { BUDGET_ENVELOPE_AMOUNTS } from "@/shared/constants/budget-envelope-amounts"
import type { CreateBudgetPeriodDTO } from "./dtos/create-budget-period.dto"
import type { BudgetPeriod } from "./entities/budget-period.entity"
import { BudgetPeriodRepository } from "./repositories/budget-period.repository"

@Injectable()
export class BudgetPeriodService {
	private readonly logger = new Logger(BudgetPeriodService.name)

	constructor(
		private readonly budgetPeriodRepository: BudgetPeriodRepository,
		private readonly recurringExpenseService: RecurringExpenseService,
		private readonly categoryService: CategoryService
	) {}

	async findAll(): Promise<BudgetPeriod[]> {
		this.logger.debug("Fetching all budget periods")
		try {
			return await this.budgetPeriodRepository.findAll()
		} catch (error) {
			this.logger.error("Failed to fetch budget periods", error)
			throw new InternalServerErrorException()
		}
	}

	async findById(id: string): Promise<BudgetPeriod> {
		this.logger.debug(`Fetching budget period with id: ${id}`)
		try {
			const budgetPeriod = await this.budgetPeriodRepository.findById(id)
			if (!budgetPeriod) {
				throw new NotFoundException(`Budget period with id ${id} not found`)
			}
			return budgetPeriod
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to fetch budget period with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}

	async create(dto: CreateBudgetPeriodDTO): Promise<BudgetPeriod> {
		try {
			const existing = await this.budgetPeriodRepository.findByYearAndMonth(
				dto.year,
				dto.month
			)
			if (existing) {
				throw new ConflictException(
					`A budget period for ${dto.year}/${String(dto.month).padStart(2, "0")} already exists`
				)
			}

			const [recurringTemplates, envelopeCategories] = await Promise.all([
				this.recurringExpenseService.findActiveForPeriod(dto.year, dto.month),
				this.categoryService.findAllWithBudgetEnvelope()
			])

			const recurringRows = recurringTemplates.map((r) => ({
				recurringExpenseId: r.id,
				categoryId: r.categoryId,
				paymentTypeId: r.paymentTypeId,
				bankId: r.bankId,
				storeId: r.storeId,
				description: r.description,
				amount: r.amount
			}))

			const envelopeRows = envelopeCategories.map((c) => ({
				categoryId: c.id,
				allocatedAmount: BUDGET_ENVELOPE_AMOUNTS[c.name] ?? 0
			}))

			const budgetPeriod = await this.budgetPeriodRepository.openPeriod(
				dto,
				recurringRows,
				envelopeRows
			)
			this.logger.log(`Opened budget period ${budgetPeriod.id}`)
			return budgetPeriod
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error("Failed to open budget period", error)
			throw new InternalServerErrorException()
		}
	}

	async findByYearAndMonth(
		year: number,
		month: number
	): Promise<BudgetPeriod | null> {
		this.logger.debug(`Fetching budget period for ${year}/${month}`)
		try {
			return await this.budgetPeriodRepository.findByYearAndMonth(year, month)
		} catch (error) {
			this.logger.error(
				`Failed to fetch budget period for ${year}/${month}`,
				error
			)
			throw new InternalServerErrorException()
		}
	}

	async delete(id: string): Promise<void> {
		try {
			await this.findById(id)
			const hasLinked = await this.budgetPeriodRepository.hasLinkedRecords(id)
			if (hasLinked) {
				throw new ConflictException(
					"Cannot delete a budget period that has linked expenses, incomes, or budget envelopes"
				)
			}
			await this.budgetPeriodRepository.delete(id)
			this.logger.log(`Deleted budget period ${id}`)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to delete budget period with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}
}
