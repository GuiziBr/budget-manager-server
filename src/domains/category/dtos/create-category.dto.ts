import { z } from "zod"

export const createCategorySchema = z.object({
	name: z.string().min(1),
	hasBudgetEnvelope: z.boolean()
})

export type CreateCategoryDto = z.infer<typeof createCategorySchema>
