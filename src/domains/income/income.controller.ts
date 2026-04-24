import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	Query
} from "@nestjs/common"
import { z } from "zod"
import { ZodValidationPipe } from "@/infra/pipes/zod-validation.pipe"
import {
	type CreateIncomeDTO,
	createIncomeSchema
} from "./dtos/create-income.dto"
import { incomeParamSchema } from "./dtos/income-param.dto"
import {
	type UpdateIncomeDTO,
	updateIncomeSchema
} from "./dtos/update-income.dto"
import type { Income } from "./entities/income.entity"
import { IncomeService } from "./income.service"

const budgetPeriodIdQuerySchema = z.uuid().optional()

@Controller("incomes")
export class IncomeController {
	constructor(private readonly incomeService: IncomeService) {}

	@Get()
	findAll(
		@Query("budgetPeriodId", new ZodValidationPipe(budgetPeriodIdQuerySchema))
		budgetPeriodId?: string
	): Promise<Income[]> {
		return this.incomeService.findAll(budgetPeriodId)
	}

	@Get(":id")
	findById(
		@Param("id", new ZodValidationPipe(incomeParamSchema)) id: string
	): Promise<Income> {
		return this.incomeService.findById(id)
	}

	@Post()
	create(
		@Body(new ZodValidationPipe(createIncomeSchema)) dto: CreateIncomeDTO
	): Promise<Income> {
		return this.incomeService.create(dto)
	}

	@Patch(":id")
	update(
		@Param("id", new ZodValidationPipe(incomeParamSchema)) id: string,
		@Body(new ZodValidationPipe(updateIncomeSchema)) dto: UpdateIncomeDTO
	): Promise<Income> {
		return this.incomeService.update(id, dto)
	}

	@Delete(":id")
	@HttpCode(HttpStatus.NO_CONTENT)
	delete(
		@Param("id", new ZodValidationPipe(incomeParamSchema)) id: string
	): Promise<void> {
		return this.incomeService.delete(id)
	}
}
