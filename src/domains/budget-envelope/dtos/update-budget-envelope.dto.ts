import { z } from "zod"
import { monetaryAmountSchema } from "@/shared/schemas/monetary-amount.schema"

export const updateBudgetEnvelopeSchema = z
	.object({
		allocatedAmount: monetaryAmountSchema.optional()
	})
	.superRefine((data, ctx) => {
		if (Object.values(data).every((v) => v === undefined)) {
			ctx.addIssue({
				code: "custom",
				message: "At least one field must be provided"
			})
		}
	})

export type UpdateBudgetEnvelopeDTO = z.infer<typeof updateBudgetEnvelopeSchema>
