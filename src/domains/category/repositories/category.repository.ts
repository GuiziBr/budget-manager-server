import type { CreateCategoryDto } from "../dtos/create-category.dto"
import type { UpdateCategoryDto } from "../dtos/update-category.dto"
import type { Category } from "../entities/category.entity"

export abstract class CategoryRepository {
	abstract findAll(): Promise<Category[]>
	abstract findById(id: string): Promise<Category | null>
	abstract create(data: CreateCategoryDto): Promise<Category>
	abstract update(id: string, data: UpdateCategoryDto): Promise<Category>
	abstract delete(id: string): Promise<void>
}
