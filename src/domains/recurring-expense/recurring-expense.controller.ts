import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch
} from "@nestjs/common"
import { ZodValidationPipe } from "@/infra/pipes/zod-validation.pipe"
import { recurringExpenseParamSchema } from "./dtos/recurring-expense-param.dto"
import {
	type UpdateRecurringExpenseDTO,
	updateRecurringExpenseSchema
} from "./dtos/update-recurring-expense.dto"
import type { RecurringExpense } from "./entities/recurring-expense.entity"
import { RecurringExpenseService } from "./recurring-expense.service"

@Controller("recurring-expenses")
export class RecurringExpenseController {
	constructor(
		private readonly recurringExpenseService: RecurringExpenseService
	) {}

	@Get()
	findAll(): Promise<RecurringExpense[]> {
		return this.recurringExpenseService.findAll()
	}

	@Get(":id")
	findById(
		@Param("id", new ZodValidationPipe(recurringExpenseParamSchema)) id: string
	): Promise<RecurringExpense> {
		return this.recurringExpenseService.findById(id)
	}

	@Patch(":id")
	update(
		@Param("id", new ZodValidationPipe(recurringExpenseParamSchema)) id: string,
		@Body(new ZodValidationPipe(updateRecurringExpenseSchema))
		dto: UpdateRecurringExpenseDTO
	): Promise<RecurringExpense> {
		return this.recurringExpenseService.update(id, dto)
	}

	@Delete(":id")
	@HttpCode(HttpStatus.NO_CONTENT)
	delete(
		@Param("id", new ZodValidationPipe(recurringExpenseParamSchema)) id: string
	): Promise<void> {
		return this.recurringExpenseService.delete(id)
	}
}
