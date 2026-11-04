import { z } from "zod"

export const expenseBudgetPeriodIdQuerySchema = z.uuid().optional()
export const expensePageQuerySchema = z.coerce.number().int().min(1).optional()
export const expenseLimitQuerySchema = z.coerce
	.number()
	.int()
	.min(1)
	.max(100)
	.optional()

export const EXPENSE_SORT_FIELDS = [
	"description",
	"categoryName",
	"paymentTypeName",
	"amount",
	"purchasedAt",
	"dueAt",
	"paidAt",
	"installmentNumber",
	"createdAt",
	"updatedAt"
] as const

export const expenseSortByQuerySchema = z.enum(EXPENSE_SORT_FIELDS).optional()
export const expenseSortOrderQuerySchema = z.enum(["asc", "desc"]).optional()

export type ExpenseBudgetPeriodIdQueryDTO = z.infer<
	typeof expenseBudgetPeriodIdQuerySchema
>
export type ExpensePageQueryDTO = z.infer<typeof expensePageQuerySchema>
export type ExpenseLimitQueryDTO = z.infer<typeof expenseLimitQuerySchema>
export type ExpenseSortByQueryDTO = z.infer<typeof expenseSortByQuerySchema>
export type ExpenseSortOrderQueryDTO = z.infer<
	typeof expenseSortOrderQuerySchema
>
