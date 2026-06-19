import {
	HttpException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException,
	UnprocessableEntityException
} from "@nestjs/common"
import { BudgetPeriodService } from "@/domains/budget-period/budget-period.service"
import type { CreateIncomeDTO } from "./dtos/create-income.dto"
import type { UpdateIncomeDTO } from "./dtos/update-income.dto"
import type { Income } from "./entities/income.entity"
import { IncomeRepository } from "./repositories/income.repository"

@Injectable()
export class IncomeService {
	private readonly logger = new Logger(IncomeService.name)

	constructor(
		private readonly incomeRepository: IncomeRepository,
		private readonly budgetPeriodService: BudgetPeriodService
	) {}

	async findAll(budgetPeriodId?: string): Promise<Income[]> {
		this.logger.debug("Fetching all incomes")
		try {
			return await this.incomeRepository.findAll(budgetPeriodId)
		} catch (error) {
			this.logger.error("Failed to fetch incomes", error)
			throw new InternalServerErrorException()
		}
	}

	async findById(id: string): Promise<Income> {
		this.logger.debug(`Fetching income with id: ${id}`)
		try {
			const income = await this.incomeRepository.findById(id)
			if (!income) {
				throw new NotFoundException(`Income with id ${id} not found`)
			}
			return income
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to fetch income with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}

	async create(dto: CreateIncomeDTO): Promise<Income> {
		try {
			await this.budgetPeriodService.findById(dto.budgetPeriodId)
			const income = await this.incomeRepository.create(dto)
			this.logger.log(`Created income ${income.id}`)
			return income
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error("Failed to create income", error)
			throw new InternalServerErrorException()
		}
	}

	async update(id: string, dto: UpdateIncomeDTO): Promise<Income> {
		try {
			const income = await this.findById(id)
			await this.assertPeriodIsNotPast(income.budgetPeriodId, "update")
			const updated = await this.incomeRepository.update(id, dto)
			this.logger.log(`Updated income ${id}`)
			return updated
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to update income with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}

	async delete(id: string): Promise<void> {
		try {
			const income = await this.findById(id)
			await this.assertPeriodIsNotPast(income.budgetPeriodId, "delete")
			await this.incomeRepository.delete(id)
			this.logger.log(`Deleted income ${id}`)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to delete income with id: ${id}`, error)
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
				`Cannot ${action} an income from a past budget period`
			)
		}
	}
}
