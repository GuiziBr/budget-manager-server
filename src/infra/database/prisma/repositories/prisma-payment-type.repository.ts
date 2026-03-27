import { ConflictException, Injectable } from "@nestjs/common"
import { PrismaClientKnownRequestError } from "@prisma/client-runtime-utils"
import type { CreatePaymentTypeDTO } from "@/domains/payment-type/dtos/create-payment-type.dto"
import type { UpdatePaymentTypeDTO } from "@/domains/payment-type/dtos/update-payment-type.dto"
import type { PaymentType } from "@/domains/payment-type/entities/payment-type.entity"
import { PaymentTypeRepository } from "@/domains/payment-type/repositories/payment-type.repository"
import { DatabaseService } from "@/infra/database/database.service"

@Injectable()
export class PrismaPaymentTypeRepository extends PaymentTypeRepository {
	constructor(private readonly db: DatabaseService) {
		super()
	}

	async findAll(): Promise<PaymentType[]> {
		return this.db.paymentType.findMany({ where: { deletedAt: null } })
	}

	async findById(id: string): Promise<PaymentType | null> {
		return this.db.paymentType.findFirst({ where: { id, deletedAt: null } })
	}

	async create(data: CreatePaymentTypeDTO): Promise<PaymentType> {
		try {
			return await this.db.paymentType.create({ data })
		} catch (error) {
			if (
				error instanceof PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				throw new ConflictException(
					`A payment type named '${data.name}' already exists`
				)
			}
			throw error
		}
	}

	async update(id: string, data: UpdatePaymentTypeDTO): Promise<PaymentType> {
		try {
			return await this.db.paymentType.update({
				where: { id, deletedAt: null },
				data
			})
		} catch (error) {
			if (
				error instanceof PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				throw new ConflictException(
					`A payment type named '${data.name}' already exists`
				)
			}
			throw error
		}
	}

	async delete(id: string): Promise<void> {
		await this.db.paymentType.update({
			where: { id, deletedAt: null },
			data: { deletedAt: new Date() }
		})
	}
}
