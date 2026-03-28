import {
	HttpException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException
} from "@nestjs/common"
import type { CreatePaymentTypeDTO } from "./dtos/create-payment-type.dto"
import type { UpdatePaymentTypeDTO } from "./dtos/update-payment-type.dto"
import type { PaymentType } from "./entities/payment-type.entity"
import { PaymentTypeRepository } from "./repositories/payment-type.repository"

@Injectable()
export class PaymentTypeService {
	private readonly logger = new Logger(PaymentTypeService.name)

	constructor(private readonly paymentTypeRepository: PaymentTypeRepository) {}

	async findAll(): Promise<PaymentType[]> {
		this.logger.debug("Fetching all payment types")
		try {
			return await this.paymentTypeRepository.findAll()
		} catch (error) {
			this.logger.error("Failed to fetch payment types", error)
			throw new InternalServerErrorException()
		}
	}

	async findById(id: string): Promise<PaymentType> {
		this.logger.debug(`Fetching payment type with id: ${id}`)
		try {
			const paymentType = await this.paymentTypeRepository.findById(id)
			if (!paymentType) {
				throw new NotFoundException(`Payment type with id ${id} not found`)
			}
			return paymentType
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to fetch payment type with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}

	async create(dto: CreatePaymentTypeDTO): Promise<PaymentType> {
		this.logger.debug(`Creating payment type: ${dto.name}`)
		try {
			return await this.paymentTypeRepository.create(dto)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error("Failed to create payment type", error)
			throw new InternalServerErrorException()
		}
	}

	async update(id: string, dto: UpdatePaymentTypeDTO): Promise<PaymentType> {
		this.logger.debug(`Updating payment type with id: ${id}`)
		try {
			await this.findById(id)
			return await this.paymentTypeRepository.update(id, dto)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to update payment type with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}

	async delete(id: string): Promise<void> {
		this.logger.debug(`Deleting payment type with id: ${id}`)
		try {
			await this.findById(id)
			return await this.paymentTypeRepository.delete(id)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to delete payment type with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}
}
