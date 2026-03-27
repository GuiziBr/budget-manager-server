import {
	ConflictException,
	HttpException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException
} from "@nestjs/common"
import type { CreateBudgetPeriodDTO } from "./dtos/create-budget-period.dto"
import type { BudgetPeriod } from "./entities/budget-period.entity"
import { BudgetPeriodRepository } from "./repositories/budget-period.repository"

@Injectable()
export class BudgetPeriodService {
	private readonly logger = new Logger(BudgetPeriodService.name)

	constructor(
		private readonly budgetPeriodRepository: BudgetPeriodRepository
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
		this.logger.debug(`Creating budget period: ${dto.year}/${dto.month}`)
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
			return await this.budgetPeriodRepository.create(dto)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error("Failed to create budget period", error)
			throw new InternalServerErrorException()
		}
	}

	async delete(id: string): Promise<void> {
		this.logger.debug(`Deleting budget period with id: ${id}`)
		try {
			await this.findById(id)
			const hasLinked = await this.budgetPeriodRepository.hasLinkedRecords(id)
			if (hasLinked) {
				throw new ConflictException(
					"Cannot delete a budget period that has linked expenses, incomes, or budget envelopes"
				)
			}
			return await this.budgetPeriodRepository.delete(id)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to delete budget period with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}
}
