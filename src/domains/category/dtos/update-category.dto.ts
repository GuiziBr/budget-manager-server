import { z } from "zod"

export const updateCategorySchema = z.object({
	name: z.string().min(1).optional(),
	hasBudgetEnvelope: z.boolean().optional()
})

export type UpdateCategoryDTO = z.infer<typeof updateCategorySchema>
