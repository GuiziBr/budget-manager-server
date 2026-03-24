import type { CreateCategoryDTO } from "../dtos/create-category.dto"
import type { UpdateCategoryDTO } from "../dtos/update-category.dto"
import type { Category } from "../entities/category.entity"

export abstract class CategoryRepository {
	abstract findAll(): Promise<Category[]>
	abstract findById(id: string): Promise<Category | null>
	abstract create(data: CreateCategoryDTO): Promise<Category>
	abstract update(id: string, data: UpdateCategoryDTO): Promise<Category>
	abstract delete(id: string): Promise<void>
}
