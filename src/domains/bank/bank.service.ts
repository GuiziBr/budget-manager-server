import {
	HttpException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException
} from "@nestjs/common"
import type { CreateBankDTO } from "./dtos/create-bank.dto"
import type { UpdateBankDTO } from "./dtos/update-bank.dto"
import type { Bank } from "./entities/bank.entity"
import { BankRepository } from "./repositories/bank.repository"

@Injectable()
export class BankService {
	private readonly logger = new Logger(BankService.name)

	constructor(private readonly bankRepository: BankRepository) {}

	async findAll(): Promise<Bank[]> {
		this.logger.debug("Fetching all banks")
		try {
			return await this.bankRepository.findAll()
		} catch (error) {
			this.logger.error("Failed to fetch banks", error)
			throw new InternalServerErrorException()
		}
	}

	async findById(id: string): Promise<Bank> {
		this.logger.debug(`Fetching bank with id: ${id}`)
		try {
			const bank = await this.bankRepository.findById(id)
			if (!bank) {
				throw new NotFoundException(`Bank with id ${id} not found`)
			}
			return bank
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to fetch bank with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}

	async create(dto: CreateBankDTO): Promise<Bank> {
		this.logger.debug(`Creating bank: ${dto.name}`)
		try {
			return await this.bankRepository.create(dto)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error("Failed to create bank", error)
			throw new InternalServerErrorException()
		}
	}

	async update(id: string, dto: UpdateBankDTO): Promise<Bank> {
		this.logger.debug(`Updating bank with id: ${id}`)
		try {
			await this.findById(id)
			return await this.bankRepository.update(id, dto)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to update bank with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}

	async delete(id: string): Promise<void> {
		this.logger.debug(`Deleting bank with id: ${id}`)
		try {
			await this.findById(id)
			return await this.bankRepository.delete(id)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to delete bank with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}
}
