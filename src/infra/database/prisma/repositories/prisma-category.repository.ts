import { ConflictException, Injectable } from "@nestjs/common"
import { PrismaClientKnownRequestError } from "@prisma/client-runtime-utils"
import type { CreateCategoryDTO } from "@/domains/category/dtos/create-category.dto"
import type { UpdateCategoryDTO } from "@/domains/category/dtos/update-category.dto"
import type { Category } from "@/domains/category/entities/category.entity"
import { CategoryRepository } from "@/domains/category/repositories/category.repository"
import { DatabaseService } from "@/infra/database/database.service"
import {
	activeRecurringFilter,
	openPeriodFilter
} from "@/infra/database/prisma/helpers/active-reference.filters"
import { lockLookupForDelete } from "@/infra/database/prisma/helpers/lock-lookup"

@Injectable()
export class PrismaCategoryRepository extends CategoryRepository {
	constructor(private readonly db: DatabaseService) {
		super()
	}

	async findAll(): Promise<Category[]> {
		return this.db.category.findMany({ where: { deletedAt: null } })
	}

	async findById(id: string): Promise<Category | null> {
		return this.db.category.findFirst({ where: { id, deletedAt: null } })
	}

	async findAllWithBudgetEnvelope(): Promise<Category[]> {
		return this.db.category.findMany({
			where: { hasBudgetEnvelope: true, deletedAt: null }
		})
	}

	async create(data: CreateCategoryDTO): Promise<Category> {
		try {
			return await this.db.category.create({ data })
		} catch (error) {
			if (
				error instanceof PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				throw new ConflictException(
					`A category named '${data.name}' already exists`
				)
			}
			throw error
		}
	}

	async update(id: string, data: UpdateCategoryDTO): Promise<Category> {
		try {
			return await this.db.category.update({
				where: { id, deletedAt: null },
				data
			})
		} catch (error) {
			if (
				error instanceof PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				throw new ConflictException(
					`A category named '${data.name}' already exists`
				)
			}
			throw error
		}
	}

	async delete(
		id: string,
		currentYear: number,
		currentMonth: number
	): Promise<void> {
		await this.db.$transaction(async (tx) => {
			await lockLookupForDelete(tx, "category", id)
			const [recurring, expense, envelope] = await Promise.all([
				tx.recurringExpense.findFirst({
					where: {
						categoryId: id,
						...activeRecurringFilter(currentYear, currentMonth)
					},
					select: { id: true }
				}),
				tx.expense.findFirst({
					where: {
						categoryId: id,
						deletedAt: null,
						budgetPeriod: openPeriodFilter(currentYear, currentMonth)
					},
					select: { id: true }
				}),
				tx.budgetEnvelope.findFirst({
					where: {
						categoryId: id,
						deletedAt: null,
						budgetPeriod: openPeriodFilter(currentYear, currentMonth)
					},
					select: { id: true }
				})
			])
			if (recurring !== null || expense !== null || envelope !== null) {
				throw new ConflictException(
					`Cannot delete category ${id}: it is referenced by active recurring expenses, or by expenses or budget envelopes in the current or future budget periods`
				)
			}
			await tx.category.update({
				where: { id, deletedAt: null },
				data: { deletedAt: new Date() }
			})
		})
	}
}
