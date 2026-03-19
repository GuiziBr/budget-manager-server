import { Injectable, Logger, NotFoundException } from "@nestjs/common"
import type { CreateCategoryDto } from "./dtos/create-category.dto"
import type { UpdateCategoryDto } from "./dtos/update-category.dto"
import type { Category } from "./entities/category.entity"
import { CategoryRepository } from "./repositories/category.repository"

@Injectable()
export class CategoryService {
	private readonly logger = new Logger(CategoryService.name)

	constructor(private readonly categoryRepository: CategoryRepository) {}

	async findAll(): Promise<Category[]> {
		this.logger.debug("Fetching all categories")
		return this.categoryRepository.findAll()
	}

	async findById(id: string): Promise<Category> {
		this.logger.debug(`Fetching category with id: ${id}`)
		const category = await this.categoryRepository.findById(id)
		if (!category) {
			throw new NotFoundException(`Category with id ${id} not found`)
		}
		return category
	}

	async create(dto: CreateCategoryDto): Promise<Category> {
		this.logger.debug(`Creating category: ${dto.name}`)
		return this.categoryRepository.create(dto)
	}

	async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
		this.logger.debug(`Updating category with id: ${id}`)
		await this.findById(id)
		return this.categoryRepository.update(id, dto)
	}

	async delete(id: string): Promise<void> {
		this.logger.debug(`Deleting category with id: ${id}`)
		await this.findById(id)
		return this.categoryRepository.delete(id)
	}
}
