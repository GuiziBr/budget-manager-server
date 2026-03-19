import { Injectable } from "@nestjs/common"
import type { CreateCategoryDto } from "@/domains/category/dtos/create-category.dto"
import type { UpdateCategoryDto } from "@/domains/category/dtos/update-category.dto"
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

	async create(data: CreateCategoryDto): Promise<Category> {
		return this.db.category.create({ data })
	}

	async update(id: string, data: UpdateCategoryDto): Promise<Category> {
		return this.db.category.update({ where: { id }, data })
	}

	async delete(id: string): Promise<void> {
		await this.db.category.update({
			where: { id },
			data: { deletedAt: new Date() }
		})
	}
}
