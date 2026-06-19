import { z } from "zod"
import { monetaryAmountSchema } from "@/shared/schemas/monetary-amount.schema"

export const updateExpenseSchema = z
	.object({
		description: z.string().min(1).optional(),
		amount: monetaryAmountSchema.optional(),
		categoryId: z.uuid().optional(),
		paymentTypeId: z.uuid().optional(),
		bankId: z.uuid().optional().nullable(),
		storeId: z.uuid().optional().nullable(),
		purchasedAt: z.coerce.date().optional().nullable(),
		dueAt: z.coerce.date().optional().nullable(),
		paidAt: z.coerce.date().optional().nullable()
	})
	.superRefine((data, ctx) => {
		if (Object.values(data).every((v) => v === undefined)) {
			ctx.addIssue({
				code: "custom",
				message: "At least one field must be provided"
			})
		}
	})

export type UpdateExpenseDTO = z.infer<typeof updateExpenseSchema>
