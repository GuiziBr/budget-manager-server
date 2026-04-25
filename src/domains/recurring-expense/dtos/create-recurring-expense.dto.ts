import { z } from "zod"

export const createRecurringExpenseSchema = z.object({
	categoryId: z.uuid(),
	paymentTypeId: z.uuid(),
	bankId: z.uuid().optional().nullable(),
	storeId: z.uuid().optional().nullable(),
	description: z.string().min(1),
	amount: z
		.number()
		.positive()
		.max(99_999_999.99)
		.refine((n) => /^\d+(\.\d{1,2})?$/.test(String(n)), {
			message: "Amount must have at most 2 decimal places"
		}),
	startedAt: z.coerce.date()
})

export type CreateRecurringExpenseDTO = z.infer<typeof createRecurringExpenseSchema>
