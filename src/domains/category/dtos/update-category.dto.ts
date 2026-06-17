import { z } from "zod"

export const updateCategorySchema = z
	.object({
		name: z.string().min(1).optional(),
		hasBudgetEnvelope: z.boolean().optional()
	})
	.refine((obj) => Object.keys(obj).length > 0, {
		message: "At least one field must be provided"
	})

export type UpdateCategoryDTO = z.infer<typeof updateCategorySchema>
