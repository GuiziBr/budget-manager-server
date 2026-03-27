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
import { BankService } from "./bank.service"
import { type CreateBankDTO, createBankSchema } from "./dtos/create-bank.dto"
import { bankParamSchema } from "./dtos/bank-param.dto"
import { type UpdateBankDTO, updateBankSchema } from "./dtos/update-bank.dto"
import type { Bank } from "./entities/bank.entity"

@Controller("banks")
export class BankController {
	constructor(private readonly bankService: BankService) {}

	@Get()
	findAll(): Promise<Bank[]> {
		return this.bankService.findAll()
	}

	@Get(":id")
	findById(
		@Param("id", new ZodValidationPipe(bankParamSchema)) id: string
	): Promise<Bank> {
		return this.bankService.findById(id)
	}

	@Post()
	create(
		@Body(new ZodValidationPipe(createBankSchema)) dto: CreateBankDTO
	): Promise<Bank> {
		return this.bankService.create(dto)
	}

	@Patch(":id")
	update(
		@Param("id", new ZodValidationPipe(bankParamSchema)) id: string,
		@Body(new ZodValidationPipe(updateBankSchema)) dto: UpdateBankDTO
	): Promise<Bank> {
		return this.bankService.update(id, dto)
	}

	@Delete(":id")
	@HttpCode(HttpStatus.NO_CONTENT)
	delete(
		@Param("id", new ZodValidationPipe(bankParamSchema)) id: string
	): Promise<void> {
		return this.bankService.delete(id)
	}
}
