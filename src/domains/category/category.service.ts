import {
	HttpException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException
} from "@nestjs/common"
import type { CreateCategoryDTO } from "./dtos/create-category.dto"
import type { UpdateCategoryDTO } from "./dtos/update-category.dto"
import type { Category } from "./entities/category.entity"
import { CategoryRepository } from "./repositories/category.repository"

@Injectable()
export class CategoryService {
	private readonly logger = new Logger(CategoryService.name)

	constructor(private readonly categoryRepository: CategoryRepository) {}

	async findAll(): Promise<Category[]> {
		this.logger.debug("Fetching all categories")
		try {
			return await this.categoryRepository.findAll()
		} catch (error) {
			this.logger.error("Failed to fetch categories", error)
			throw new InternalServerErrorException()
		}
	}

	async findById(id: string): Promise<Category> {
		this.logger.debug(`Fetching category with id: ${id}`)
		try {
			const category = await this.categoryRepository.findById(id)
			if (!category) {
				throw new NotFoundException(`Category with id ${id} not found`)
			}
			return category
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to fetch category with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}

	async findAllWithBudgetEnvelope(): Promise<Category[]> {
		this.logger.debug("Fetching all envelope categories")
		try {
			return await this.categoryRepository.findAllWithBudgetEnvelope()
		} catch (error) {
			this.logger.error("Failed to fetch envelope categories", error)
			throw new InternalServerErrorException()
		}
	}

	async create(dto: CreateCategoryDTO): Promise<Category> {
		try {
			const category = await this.categoryRepository.create(dto)
			this.logger.log(`Created category ${category.id}`)
			return category
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error("Failed to create category", error)
			throw new InternalServerErrorException()
		}
	}

	async update(id: string, dto: UpdateCategoryDTO): Promise<Category> {
		try {
			await this.findById(id)
			const category = await this.categoryRepository.update(id, dto)
			this.logger.log(`Updated category ${id}`)
			return category
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to update category with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}

	async delete(id: string): Promise<void> {
		try {
			await this.findById(id)
			await this.categoryRepository.delete(id)
			this.logger.log(`Deleted category ${id}`)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to delete category with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}
}
