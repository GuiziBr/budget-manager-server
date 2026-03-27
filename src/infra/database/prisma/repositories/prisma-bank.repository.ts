import { Injectable } from "@nestjs/common"
import type { CreateBankDTO } from "@/domains/bank/dtos/create-bank.dto"
import type { UpdateBankDTO } from "@/domains/bank/dtos/update-bank.dto"
import type { Bank } from "@/domains/bank/entities/bank.entity"
import { BankRepository } from "@/domains/bank/repositories/bank.repository"
import { DatabaseService } from "@/infra/database/database.service"

@Injectable()
export class PrismaBankRepository extends BankRepository {
	constructor(private readonly db: DatabaseService) {
		super()
	}

	async findAll(): Promise<Bank[]> {
		return this.db.bank.findMany({ where: { deletedAt: null } })
	}

	async findById(id: string): Promise<Bank | null> {
		return this.db.bank.findFirst({ where: { id, deletedAt: null } })
	}

	async create(data: CreateBankDTO): Promise<Bank> {
		return this.db.bank.create({ data })
	}

	async update(id: string, data: UpdateBankDTO): Promise<Bank> {
		return this.db.bank.update({ where: { id, deletedAt: null }, data })
	}

	async delete(id: string): Promise<void> {
		await this.db.bank.update({
			where: { id, deletedAt: null },
			data: { deletedAt: new Date() }
		})
	}
}
