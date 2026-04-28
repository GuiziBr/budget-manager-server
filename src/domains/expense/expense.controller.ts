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
import { ZodValidationPipe } from "@/infra/pipes/zod-validation.pipe"
import {
	type CreateExpenseDTO,
	createExpenseSchema
} from "./dtos/create-expense.dto"
import { expenseParamSchema } from "./dtos/expense-param.dto"
import {
	expenseBudgetPeriodIdQuerySchema,
	expenseLimitQuerySchema,
	expensePageQuerySchema
} from "./dtos/expense-query.dto"
import {
	type UpdateExpenseDTO,
	updateExpenseSchema
} from "./dtos/update-expense.dto"
import type { Expense } from "./entities/expense.entity"
import { ExpenseService } from "./expense.service"

@Controller("expenses")
export class ExpenseController {
	constructor(private readonly expenseService: ExpenseService) {}

	@Get()
	findAll(
		@Query(
			"budgetPeriodId",
			new ZodValidationPipe(expenseBudgetPeriodIdQuerySchema)
		)
		budgetPeriodId?: string,
		@Query("page", new ZodValidationPipe(expensePageQuerySchema)) page?: number,
		@Query("limit", new ZodValidationPipe(expenseLimitQuerySchema))
		limit?: number
	): Promise<{ data: Expense[]; total: number; page: number; limit: number }> {
		return this.expenseService.findAll({ budgetPeriodId, page, limit })
	}

	@Get(":id")
	findById(
		@Param("id", new ZodValidationPipe(expenseParamSchema)) id: string
	): Promise<Expense> {
		return this.expenseService.findById(id)
	}

	@Post()
	create(
		@Body(new ZodValidationPipe(createExpenseSchema)) dto: CreateExpenseDTO
	): Promise<Expense> {
		return this.expenseService.create(dto)
	}

	@Patch(":id")
	update(
		@Param("id", new ZodValidationPipe(expenseParamSchema)) id: string,
		@Body(new ZodValidationPipe(updateExpenseSchema)) dto: UpdateExpenseDTO
	): Promise<Expense> {
		return this.expenseService.update(id, dto)
	}

	@Delete(":id")
	@HttpCode(HttpStatus.NO_CONTENT)
	delete(
		@Param("id", new ZodValidationPipe(expenseParamSchema)) id: string
	): Promise<void> {
		return this.expenseService.delete(id)
	}
}
