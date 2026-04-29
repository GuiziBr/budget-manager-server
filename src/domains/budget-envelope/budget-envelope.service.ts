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
import type { CreateBudgetEnvelopeDTO } from "./dtos/create-budget-envelope.dto"
import type { UpdateBudgetEnvelopeDTO } from "./dtos/update-budget-envelope.dto"
import type { BudgetEnvelope } from "./entities/budget-envelope.entity"
import { BudgetEnvelopeRepository } from "./repositories/budget-envelope.repository"

@Injectable()
export class BudgetEnvelopeService {
	private readonly logger = new Logger(BudgetEnvelopeService.name)

	constructor(
		private readonly budgetEnvelopeRepository: BudgetEnvelopeRepository,
		private readonly budgetPeriodService: BudgetPeriodService,
		private readonly categoryService: CategoryService
	) {}

	async findAll(budgetPeriodId?: string): Promise<BudgetEnvelope[]> {
		this.logger.debug("Fetching all budget envelopes")
		try {
			return await this.budgetEnvelopeRepository.findAll(budgetPeriodId)
		} catch (error) {
			this.logger.error("Failed to fetch budget envelopes", error)
			throw new InternalServerErrorException()
		}
	}

	async findById(id: string): Promise<BudgetEnvelope> {
		this.logger.debug(`Fetching budget envelope with id: ${id}`)
		try {
			const envelope = await this.budgetEnvelopeRepository.findById(id)
			if (!envelope) {
				throw new NotFoundException(`Budget envelope with id ${id} not found`)
			}
			return envelope
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to fetch budget envelope with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}

	async create(dto: CreateBudgetEnvelopeDTO): Promise<BudgetEnvelope> {
		this.logger.debug("Creating budget envelope")
		try {
			const [, category] = await Promise.all([
				this.budgetPeriodService.findById(dto.budgetPeriodId),
				this.categoryService.findById(dto.categoryId)
			])
			if (!category.hasBudgetEnvelope) {
				throw new BadRequestException(
					`Category '${category.name}' does not support budget envelopes`
				)
			}
			return await this.budgetEnvelopeRepository.create(dto)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error("Failed to create budget envelope", error)
			throw new InternalServerErrorException()
		}
	}

	async update(
		id: string,
		dto: UpdateBudgetEnvelopeDTO
	): Promise<BudgetEnvelope> {
		this.logger.debug(`Updating budget envelope with id: ${id}`)
		try {
			const envelope = await this.findById(id)
			await this.assertPeriodIsNotPast(envelope.budgetPeriodId, "update")
			return await this.budgetEnvelopeRepository.update(id, dto)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(
				`Failed to update budget envelope with id: ${id}`,
				error
			)
			throw new InternalServerErrorException()
		}
	}

	async delete(id: string): Promise<void> {
		this.logger.debug(`Deleting budget envelope with id: ${id}`)
		try {
			const envelope = await this.findById(id)
			await this.assertPeriodIsNotPast(envelope.budgetPeriodId, "delete")
			return await this.budgetEnvelopeRepository.delete(id)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(
				`Failed to delete budget envelope with id: ${id}`,
				error
			)
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
				`Cannot ${action} a budget envelope from a past budget period`
			)
		}
	}
}
