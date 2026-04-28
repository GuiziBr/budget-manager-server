import { z } from "zod"

export const expenseBudgetPeriodIdQuerySchema = z.uuid().optional()
export const expensePageQuerySchema = z.coerce.number().int().min(1).optional()
export const expenseLimitQuerySchema = z.coerce
	.number()
	.int()
	.min(1)
	.max(100)
	.optional()

export type ExpenseBudgetPeriodIdQueryDTO = z.infer<
	typeof expenseBudgetPeriodIdQuerySchema
>
export type ExpensePageQueryDTO = z.infer<typeof expensePageQuerySchema>
export type ExpenseLimitQueryDTO = z.infer<typeof expenseLimitQuerySchema>
