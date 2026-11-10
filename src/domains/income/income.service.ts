import {
	HttpException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException
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
			await this.findById(id)
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
			await this.findById(id)
			await this.incomeRepository.delete(id)
			this.logger.log(`Deleted income ${id}`)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to delete income with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}
}
