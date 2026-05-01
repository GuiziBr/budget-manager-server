import { z } from "zod"
import { monetaryAmountSchema } from "@/shared/schemas/monetary-amount.schema"

export const ExpenseType = {
	ONE_TIME: "one-time",
	RECURRING: "recurring",
	INSTALLMENT: "installment"
} as const

const baseExpenseFields = {
	budgetPeriodId: z.uuid(),
	categoryId: z.uuid(),
	paymentTypeId: z.uuid(),
	bankId: z.uuid().optional().nullable(),
	storeId: z.uuid().optional().nullable(),
	description: z.string().min(1)
}

const dateFields = {
	purchasedAt: z.iso.date().optional(),
	dueAt: z.iso.date().optional(),
	paidAt: z.iso.date().optional()
}

export const createExpenseSchema = z.discriminatedUnion("type", [
	z.object({
		type: z.literal(ExpenseType.ONE_TIME),
		...baseExpenseFields,
		amount: monetaryAmountSchema,
		...dateFields
	}),
	z.object({
		type: z.literal(ExpenseType.RECURRING),
		...baseExpenseFields,
		amount: monetaryAmountSchema,
		...dateFields
	}),
	z.object({
		type: z.literal(ExpenseType.INSTALLMENT),
		...baseExpenseFields,
		amountPerInstallment: monetaryAmountSchema,
		totalInstallments: z.number().int().min(2),
		paymentIntervalDays: z.number().int().min(1),
		firstPurchasedAt: z.iso.date()
	})
])

export type CreateExpenseDTO = z.infer<typeof createExpenseSchema>
