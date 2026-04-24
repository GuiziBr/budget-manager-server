import { z } from "zod"

export const updateRecurringExpenseSchema = z.object({
	description: z.string().min(1).optional(),
	amount: z
		.number()
		.positive()
		.max(99_999_999.99)
		.refine((n) => /^\d+(\.\d{1,2})?$/.test(String(n)), {
			message: "Amount must have at most 2 decimal places"
		})
		.optional(),
	cancelledAt: z.iso.date().optional().nullable()
})

export type UpdateRecurringExpenseDTO = z.infer<typeof updateRecurringExpenseSchema>
