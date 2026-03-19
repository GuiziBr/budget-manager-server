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
import { CategoryService } from "./category.service"
import { CreateCategoryDto } from "./dtos/create-category.dto"
import { UpdateCategoryDto } from "./dtos/update-category.dto"
import type { Category } from "./entities/category.entity"

@Controller("categories")
export class CategoryController {
	constructor(private readonly categoryService: CategoryService) {}

	@Get()
	findAll(): Promise<Category[]> {
		return this.categoryService.findAll()
	}

	@Get(":id")
	findById(@Param("id") id: string): Promise<Category> {
		return this.categoryService.findById(id)
	}

	@Post()
	create(@Body() dto: CreateCategoryDto): Promise<Category> {
		return this.categoryService.create(dto)
	}

	@Patch(":id")
	update(
		@Param("id") id: string,
		@Body() dto: UpdateCategoryDto
	): Promise<Category> {
		return this.categoryService.update(id, dto)
	}

	@Delete(":id")
	@HttpCode(HttpStatus.NO_CONTENT)
	delete(@Param("id") id: string): Promise<void> {
		return this.categoryService.delete(id)
	}
}
