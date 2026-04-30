import { z } from "zod"
import { monetaryAmountSchema } from "@/shared/schemas/monetary-amount.schema"

export const updateInstallmentGroupSchema = z
	.object({
		amountPerInstallment: monetaryAmountSchema.optional(),
		totalInstallments: z.number().int().positive().optional()
	})
	.superRefine((data, ctx) => {
		if (Object.values(data).every((v) => v === undefined)) {
			ctx.addIssue({
				code: "custom",
				message: "At least one field must be provided"
			})
		}
	})

export type UpdateInstallmentGroupDTO = z.infer<
	typeof updateInstallmentGroupSchema
>
