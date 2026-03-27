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
import { BudgetPeriodService } from "./budget-period.service"
import { budgetPeriodParamSchema } from "./dtos/budget-period-param.dto"
import {
	type CreateBudgetPeriodDTO,
	createBudgetPeriodSchema
} from "./dtos/create-budget-period.dto"
import {
	type UpdateBudgetPeriodDTO,
	updateBudgetPeriodSchema
} from "./dtos/update-budget-period.dto"
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

	@Patch(":id")
	update(
		@Param("id", new ZodValidationPipe(budgetPeriodParamSchema)) id: string,
		@Body(new ZodValidationPipe(updateBudgetPeriodSchema))
		dto: UpdateBudgetPeriodDTO
	): Promise<BudgetPeriod> {
		return this.budgetPeriodService.update(id, dto)
	}

	@Delete(":id")
	@HttpCode(HttpStatus.NO_CONTENT)
	delete(
		@Param("id", new ZodValidationPipe(budgetPeriodParamSchema)) id: string
	): Promise<void> {
		return this.budgetPeriodService.delete(id)
	}
}
