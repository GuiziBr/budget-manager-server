import { z } from "zod"

export const updatePaymentTypeSchema = z
	.object({
		name: z.string().min(1).optional(),
		hasStatement: z.boolean().optional()
	})
	.refine((obj) => Object.keys(obj).length > 0, {
		message: "At least one field must be provided"
	})

export type UpdatePaymentTypeDTO = z.infer<typeof updatePaymentTypeSchema>
