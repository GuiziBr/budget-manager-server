import { Injectable } from "@nestjs/common"
import type { CreateCategoryDTO } from "@/domains/category/dtos/create-category.dto"
import type { UpdateCategoryDTO } from "@/domains/category/dtos/update-category.dto"
import type { Category } from "@/domains/category/entities/category.entity"
import { CategoryRepository } from "@/domains/category/repositories/category.repository"
import { DatabaseService } from "@/infra/database/database.service"

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

	async create(data: CreateCategoryDTO): Promise<Category> {
		return this.db.category.create({ data })
	}

	async update(id: string, data: UpdateCategoryDTO): Promise<Category> {
		return this.db.category.update({ where: { id, deletedAt: null }, data })
	}

	async delete(id: string): Promise<void> {
		await this.db.category.update({
			where: { id, deletedAt: null },
			data: { deletedAt: new Date() }
		})
	}
}
