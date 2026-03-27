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
import { type CreateStoreDTO, createStoreSchema } from "./dtos/create-store.dto"
import { storeParamSchema } from "./dtos/store-param.dto"
import { type UpdateStoreDTO, updateStoreSchema } from "./dtos/update-store.dto"
import type { Store } from "./entities/store.entity"
import { StoreService } from "./store.service"

@Controller("stores")
export class StoreController {
	constructor(private readonly storeService: StoreService) {}

	@Get()
	findAll(): Promise<Store[]> {
		return this.storeService.findAll()
	}

	@Get(":id")
	findById(
		@Param("id", new ZodValidationPipe(storeParamSchema)) id: string
	): Promise<Store> {
		return this.storeService.findById(id)
	}

	@Post()
	create(
		@Body(new ZodValidationPipe(createStoreSchema)) dto: CreateStoreDTO
	): Promise<Store> {
		return this.storeService.create(dto)
	}

	@Patch(":id")
	update(
		@Param("id", new ZodValidationPipe(storeParamSchema)) id: string,
		@Body(new ZodValidationPipe(updateStoreSchema)) dto: UpdateStoreDTO
	): Promise<Store> {
		return this.storeService.update(id, dto)
	}

	@Delete(":id")
	@HttpCode(HttpStatus.NO_CONTENT)
	delete(
		@Param("id", new ZodValidationPipe(storeParamSchema)) id: string
	): Promise<void> {
		return this.storeService.delete(id)
	}
}
