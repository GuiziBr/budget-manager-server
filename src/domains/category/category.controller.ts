import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post
} from "@nestjs/common"
import { ZodValidationPipe } from "@/infra/pipes/zod-validation.pipe"
import { CategoryService } from "./category.service"
import { categoryParamSchema } from "./dtos/category-param.dto"
import {
	type CreateCategoryDTO,
	createCategorySchema
} from "./dtos/create-category.dto"
import {
	type UpdateCategoryDTO,
	updateCategorySchema
} from "./dtos/update-category.dto"
import type { Category } from "./entities/category.entity"

@Controller("categories")
export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}

	@Get()
	findAll(): Promise<Category[]> {
		return this.categoryService.findAll()
	}

	@Get(":id")
	findById(
		@Param("id", new ZodValidationPipe(categoryParamSchema)) id: string
	): Promise<Category> {
		return this.categoryService.findById(id)
	}

	@Post()
	create(
		@Body(new ZodValidationPipe(createCategorySchema)) dto: CreateCategoryDTO
	): Promise<Category> {
		return this.categoryService.create(dto)
	}

	@Patch(":id")
	update(
		@Param("id", new ZodValidationPipe(categoryParamSchema)) id: string,
		@Body(new ZodValidationPipe(updateCategorySchema)) dto: UpdateCategoryDTO
	): Promise<Category> {
		return this.categoryService.update(id, dto)
	}

	@Delete(":id")
	@HttpCode(HttpStatus.NO_CONTENT)
	delete(
		@Param("id", new ZodValidationPipe(categoryParamSchema)) id: string
	): Promise<void> {
		return this.categoryService.delete(id)
	}
}
