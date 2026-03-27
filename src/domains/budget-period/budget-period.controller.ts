import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post
} from "@nestjs/common"
import { ZodValidationPipe } from "@/infra/pipes/zod-validation.pipe"
import { BudgetPeriodService } from "./budget-period.service"
import { budgetPeriodParamSchema } from "./dtos/budget-period-param.dto"
import {
	type CreateBudgetPeriodDTO,
	createBudgetPeriodSchema
} from "./dtos/create-budget-period.dto"
import type { BudgetPeriod } from "./entities/budget-period.entity"

@Controller("budget-periods")
export class BudgetPeriodController {
	constructor(private readonly budgetPeriodService: BudgetPeriodService) {}

	@Get()
	findAll(): Promise<BudgetPeriod[]> {
		return this.budgetPeriodService.findAll()
	}

	@Get(":id")
	findById(
		@Param("id", new ZodValidationPipe(budgetPeriodParamSchema)) id: string
	): Promise<BudgetPeriod> {
		return this.budgetPeriodService.findById(id)
	}

	@Post()
	create(
		@Body(new ZodValidationPipe(createBudgetPeriodSchema))
		dto: CreateBudgetPeriodDTO
	): Promise<BudgetPeriod> {
		return this.budgetPeriodService.create(dto)
	}

	@Delete(":id")
	@HttpCode(HttpStatus.NO_CONTENT)
	delete(
		@Param("id", new ZodValidationPipe(budgetPeriodParamSchema)) id: string
	): Promise<void> {
		return this.budgetPeriodService.delete(id)
	}
}
