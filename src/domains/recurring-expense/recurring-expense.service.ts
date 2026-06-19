import {
	BadRequestException,
	HttpException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException
} from "@nestjs/common"
import { BankService } from "@/domains/bank/bank.service"
import { CategoryService } from "@/domains/category/category.service"
import { PaymentTypeService } from "@/domains/payment-type/payment-type.service"
import { StoreService } from "@/domains/store/store.service"
import type { CreateRecurringExpenseDTO } from "./dtos/create-recurring-expense.dto"
import type { UpdateRecurringExpenseDTO } from "./dtos/update-recurring-expense.dto"
import type { RecurringExpense } from "./entities/recurring-expense.entity"
import { RecurringExpenseRepository } from "./repositories/recurring-expense.repository"

@Injectable()
export class RecurringExpenseService {
	private readonly logger = new Logger(RecurringExpenseService.name)

	constructor(
		private readonly recurringExpenseRepository: RecurringExpenseRepository,
		private readonly categoryService: CategoryService,
		private readonly paymentTypeService: PaymentTypeService,
		private readonly bankService: BankService,
		private readonly storeService: StoreService
	) {}

	async findAll(): Promise<RecurringExpense[]> {
		this.logger.debug("Fetching all recurring expenses")
		try {
			return await this.recurringExpenseRepository.findAll()
		} catch (error) {
			this.logger.error("Failed to fetch recurring expenses", error)
			throw new InternalServerErrorException()
		}
	}

	async findById(id: string): Promise<RecurringExpense> {
		this.logger.debug(`Fetching recurring expense with id: ${id}`)
		try {
			const recurringExpense =
				await this.recurringExpenseRepository.findById(id)
			if (!recurringExpense) {
				throw new NotFoundException(`Recurring expense with id ${id} not found`)
			}
			return recurringExpense
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(
				`Failed to fetch recurring expense with id: ${id}`,
				error
			)
			throw new InternalServerErrorException()
		}
	}

	async findActiveForPeriod(
		year: number,
		month: number
	): Promise<RecurringExpense[]> {
		this.logger.debug(
			`Fetching active recurring expenses for period ${year}/${month}`
		)
		try {
			return await this.recurringExpenseRepository.findActiveForPeriod(
				year,
				month
			)
		} catch (error) {
			this.logger.error(
				`Failed to fetch recurring expenses for period ${year}/${month}`,
				error
			)
			throw new InternalServerErrorException()
		}
	}

	async create(dto: CreateRecurringExpenseDTO): Promise<RecurringExpense> {
		try {
			await Promise.all([
				this.categoryService.findById(dto.categoryId),
				this.paymentTypeService.findById(dto.paymentTypeId),
				dto.bankId ? this.bankService.findById(dto.bankId) : Promise.resolve(),
				dto.storeId
					? this.storeService.findById(dto.storeId)
					: Promise.resolve()
			])
			const recurringExpense = await this.recurringExpenseRepository.create(dto)
			this.logger.log(`Created recurring expense ${recurringExpense.id}`)
			return recurringExpense
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error("Failed to create recurring expense", error)
			throw new InternalServerErrorException()
		}
	}

	async update(
		id: string,
		dto: UpdateRecurringExpenseDTO
	): Promise<RecurringExpense> {
		try {
			await this.findById(id)
			if (dto.cancelledAt) {
				const now = new Date()
				const firstDayOfCurrentMonth = new Date(
					Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
				)
				if (dto.cancelledAt < firstDayOfCurrentMonth) {
					throw new BadRequestException(
						"cancelledAt must be on or after the first day of the current month"
					)
				}
			}
			const recurringExpense = await this.recurringExpenseRepository.update(
				id,
				dto
			)
			this.logger.log(`Updated recurring expense ${id}`)
			return recurringExpense
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(
				`Failed to update recurring expense with id: ${id}`,
				error
			)
			throw new InternalServerErrorException()
		}
	}

	async delete(id: string): Promise<void> {
		try {
			await this.findById(id)
			await this.recurringExpenseRepository.delete(id)
			this.logger.log(`Deleted recurring expense ${id}`)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(
				`Failed to delete recurring expense with id: ${id}`,
				error
			)
			throw new InternalServerErrorException()
		}
	}
}
