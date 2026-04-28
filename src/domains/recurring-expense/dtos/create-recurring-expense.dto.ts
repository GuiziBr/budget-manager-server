import { z } from "zod"
import { monetaryAmountSchema } from "@/shared/schemas/monetary-amount.schema"

export const createRecurringExpenseSchema = z.object({
	categoryId: z.uuid(),
	paymentTypeId: z.uuid(),
	bankId: z.uuid().optional().nullable(),
	storeId: z.uuid().optional().nullable(),
	description: z.string().min(1),
	amount: monetaryAmountSchema,
	startedAt: z.coerce.date()
})

export type CreateRecurringExpenseDTO = z.infer<
	typeof createRecurringExpenseSchema
>
