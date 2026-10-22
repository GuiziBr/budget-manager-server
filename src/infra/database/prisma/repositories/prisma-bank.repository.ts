import { ConflictException, Injectable } from "@nestjs/common"
import { PrismaClientKnownRequestError } from "@prisma/client-runtime-utils"
import type { CreateBankDTO } from "@/domains/bank/dtos/create-bank.dto"
import type { UpdateBankDTO } from "@/domains/bank/dtos/update-bank.dto"
import type { Bank } from "@/domains/bank/entities/bank.entity"
import { BankRepository } from "@/domains/bank/repositories/bank.repository"
import { DatabaseService } from "@/infra/database/database.service"
import {
	activeRecurringFilter,
	openPeriodFilter
} from "@/infra/database/prisma/helpers/active-reference.filters"

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
		try {
			return await this.db.bank.create({ data })
		} catch (error) {
			if (
				error instanceof PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				throw new ConflictException(
					`A bank named '${data.name}' already exists`
				)
			}
			throw error
		}
	}

	async update(id: string, data: UpdateBankDTO): Promise<Bank> {
		try {
			return await this.db.bank.update({ where: { id, deletedAt: null }, data })
		} catch (error) {
			if (
				error instanceof PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				throw new ConflictException(
					`A bank named '${data.name}' already exists`
				)
			}
			throw error
		}
	}

	async delete(id: string): Promise<void> {
		await this.db.bank.update({
			where: { id, deletedAt: null },
			data: { deletedAt: new Date() }
		})
	}

	async hasActiveReferences(
		id: string,
		currentYear: number,
		currentMonth: number
	): Promise<boolean> {
		const [recurring, expense] = await Promise.all([
			this.db.recurringExpense.findFirst({
				where: {
					bankId: id,
					...activeRecurringFilter(currentYear, currentMonth)
				},
				select: { id: true }
			}),
			this.db.expense.findFirst({
				where: {
					bankId: id,
					deletedAt: null,
					budgetPeriod: openPeriodFilter(currentYear, currentMonth)
				},
				select: { id: true }
			})
		])
		return recurring !== null || expense !== null
	}
}
