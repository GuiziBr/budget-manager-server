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
import { BudgetEnvelopeService } from "./budget-envelope.service"
import { budgetEnvelopeParamSchema } from "./dtos/budget-envelope-param.dto"
import {
	type CreateBudgetEnvelopeDTO,
	createBudgetEnvelopeSchema
} from "./dtos/create-budget-envelope.dto"
import {
	type UpdateBudgetEnvelopeDTO,
	updateBudgetEnvelopeSchema
} from "./dtos/update-budget-envelope.dto"
import type { BudgetEnvelope } from "./entities/budget-envelope.entity"

const budgetPeriodIdQuerySchema = z.uuid().optional()

@Controller("budget-envelopes")
export class BudgetEnvelopeController {
	constructor(private readonly budgetEnvelopeService: BudgetEnvelopeService) {}

	@Get()
	findAll(
		@Query("budgetPeriodId", new ZodValidationPipe(budgetPeriodIdQuerySchema))
		budgetPeriodId?: string
	): Promise<BudgetEnvelope[]> {
		return this.budgetEnvelopeService.findAll(budgetPeriodId)
	}

	@Get(":id")
	findById(
		@Param("id", new ZodValidationPipe(budgetEnvelopeParamSchema)) id: string
	): Promise<BudgetEnvelope> {
		return this.budgetEnvelopeService.findById(id)
	}

	@Post()
	create(
		@Body(new ZodValidationPipe(createBudgetEnvelopeSchema))
		dto: CreateBudgetEnvelopeDTO
	): Promise<BudgetEnvelope> {
		return this.budgetEnvelopeService.create(dto)
	}

	@Patch(":id")
	update(
		@Param("id", new ZodValidationPipe(budgetEnvelopeParamSchema)) id: string,
		@Body(new ZodValidationPipe(updateBudgetEnvelopeSchema))
		dto: UpdateBudgetEnvelopeDTO
	): Promise<BudgetEnvelope> {
		return this.budgetEnvelopeService.update(id, dto)
	}

	@Delete(":id")
	@HttpCode(HttpStatus.NO_CONTENT)
	delete(
		@Param("id", new ZodValidationPipe(budgetEnvelopeParamSchema)) id: string
	): Promise<void> {
		return this.budgetEnvelopeService.delete(id)
	}
}
