import { z } from "zod"
import { monetaryAmountSchema } from "@/shared/schemas/monetary-amount.schema"

export const updateRecurringExpenseSchema = z
	.object({
		description: z.string().min(1).optional(),
		amount: monetaryAmountSchema.optional(),
		cancelledAt: z.coerce.date().optional()
	})
	.refine((obj) => Object.keys(obj).length > 0, {
		message: "At least one field must be provided"
	})

export type UpdateRecurringExpenseDTO = z.infer<
	typeof updateRecurringExpenseSchema
>
