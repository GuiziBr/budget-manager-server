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
import type { BudgetPeriod } from "@/domains/budget-period/entities/budget-period.entity"
import { CategoryService } from "@/domains/category/category.service"
import type { CreateBudgetEnvelopeDTO } from "./dtos/create-budget-envelope.dto"
import type { UpdateBudgetEnvelopeDTO } from "./dtos/update-budget-envelope.dto"
import type {
	BudgetEnvelope,
	BudgetEnvelopeWithSpend
} from "./entities/budget-envelope.entity"
import { BudgetEnvelopeRepository } from "./repositories/budget-envelope.repository"
import { EnvelopeSpendRepository } from "./repositories/envelope-spend.repository"

// Spend of past periods is final and cached forever; current and future
// periods can still change, so they are re-fetched after this window.
const OPEN_PERIOD_SPEND_TTL_MS = 60_000

interface CachedSpend {
	amounts: Map<string, number>
	fetchedAt: Date
}

@Injectable()
export class BudgetEnvelopeService {
	private readonly logger = new Logger(BudgetEnvelopeService.name)
	private readonly spendCache = new Map<string, CachedSpend>()

	constructor(
		private readonly budgetEnvelopeRepository: BudgetEnvelopeRepository,
		private readonly budgetPeriodService: BudgetPeriodService,
		private readonly categoryService: CategoryService,
		private readonly envelopeSpendRepository: EnvelopeSpendRepository
	) {}

	async findAll(budgetPeriodId?: string): Promise<BudgetEnvelopeWithSpend[]> {
		this.logger.debug("Fetching all budget envelopes")
		try {
			const envelopes =
				await this.budgetEnvelopeRepository.findAll(budgetPeriodId)
			return await this.withSpend(envelopes)
		} catch (error) {
			this.logger.error("Failed to fetch budget envelopes", error)
			throw new InternalServerErrorException()
		}
	}

	async findById(id: string): Promise<BudgetEnvelopeWithSpend> {
		this.logger.debug(`Fetching budget envelope with id: ${id}`)
		try {
			const envelope = await this.getOrFail(id)
			const [withSpend] = await this.withSpend([envelope])
			return withSpend
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to fetch budget envelope with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}

	async create(dto: CreateBudgetEnvelopeDTO): Promise<BudgetEnvelopeWithSpend> {
		try {
			const [period, category] = await Promise.all([
				this.budgetPeriodService.findById(dto.budgetPeriodId),
				this.categoryService.findById(dto.categoryId)
			])
			if (this.isPastPeriod(period)) {
				throw new UnprocessableEntityException(
					"Cannot create a budget envelope for a past budget period"
				)
			}
			if (!category.hasBudgetEnvelope) {
				throw new BadRequestException(
					`Category '${category.name}' does not support budget envelopes`
				)
			}
			const envelope = await this.budgetEnvelopeRepository.create(dto)
			this.logger.log(`Created budget envelope ${envelope.id}`)
			const [withSpend] = await this.withSpend([envelope])
			return withSpend
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
		try {
			const envelope = await this.getOrFail(id)
			await this.assertPeriodIsNotPast(envelope.budgetPeriodId, "update")
			const updated = await this.budgetEnvelopeRepository.update(id, dto)
			this.logger.log(`Updated budget envelope ${id}`)
			return updated
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
		try {
			const envelope = await this.getOrFail(id)
			await this.assertPeriodIsNotPast(envelope.budgetPeriodId, "delete")
			await this.budgetEnvelopeRepository.delete(id)
			this.logger.log(`Deleted budget envelope ${id}`)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(
				`Failed to delete budget envelope with id: ${id}`,
				error
			)
			throw new InternalServerErrorException()
		}
	}

	private async getOrFail(id: string): Promise<BudgetEnvelope> {
		const envelope = await this.budgetEnvelopeRepository.findById(id)
		if (!envelope) {
			throw new NotFoundException(`Budget envelope with id ${id} not found`)
		}
		return envelope
	}

	private isPastPeriod(period: BudgetPeriod): boolean {
		const now = new Date()
		const currentYear = now.getUTCFullYear()
		const currentMonth = now.getUTCMonth() + 1
		return (
			period.year < currentYear ||
			(period.year === currentYear && period.month < currentMonth)
		)
	}

	private async assertPeriodIsNotPast(
		budgetPeriodId: string,
		action: "update" | "delete"
	): Promise<void> {
		const period = await this.budgetPeriodService.findById(budgetPeriodId)
		if (this.isPastPeriod(period)) {
			throw new UnprocessableEntityException(
				`Cannot ${action} a budget envelope from a past budget period`
			)
		}
	}

	/**
	 * Adds the actual spend to each envelope. The external spend API is called
	 * once per distinct period. When it is unavailable the spend is `null`:
	 * the envelope list must never fail because of an outside dependency.
	 */
	private async withSpend(
		envelopes: BudgetEnvelope[]
	): Promise<BudgetEnvelopeWithSpend[]> {
		const periodIds = [...new Set(envelopes.map((e) => e.budgetPeriodId))]
		const spendByPeriod = new Map<string, CachedSpend | null>()
		await Promise.all(
			periodIds.map(async (periodId) => {
				spendByPeriod.set(periodId, await this.getPeriodSpend(periodId))
			})
		)

		return envelopes.map((envelope) => {
			const spend = spendByPeriod.get(envelope.budgetPeriodId)
			if (!spend) {
				return { ...envelope, spentAmount: null, spendUpdatedAt: null }
			}
			const amount = spend.amounts.get(envelope.categoryId) ?? 0
			return {
				...envelope,
				spentAmount: Math.max(0, amount),
				spendUpdatedAt: spend.fetchedAt
			}
		})
	}

	private async getPeriodSpend(
		budgetPeriodId: string
	): Promise<CachedSpend | null> {
		try {
			const period = await this.budgetPeriodService.findById(budgetPeriodId)
			const key = `${period.year}-${period.month}`
			const cached = this.spendCache.get(key)
			if (cached && this.isCacheFresh(cached, period)) {
				return cached
			}
			const amounts = await this.envelopeSpendRepository.findByMonth(
				period.year,
				period.month
			)
			const entry = { amounts, fetchedAt: new Date() }
			this.spendCache.set(key, entry)
			return entry
		} catch (error) {
			this.logger.error(
				`Failed to fetch envelope spend for budget period ${budgetPeriodId}`,
				error
			)
			return null
		}
	}

	private isCacheFresh(cached: CachedSpend, period: BudgetPeriod): boolean {
		if (this.isPastPeriod(period)) return true
		return Date.now() - cached.fetchedAt.getTime() < OPEN_PERIOD_SPEND_TTL_MS
	}
}
