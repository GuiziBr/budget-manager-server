import { z } from "zod"

export const updateBudgetPeriodSchema = z.object({
	year: z.number().int().min(2000).optional(),
	month: z.number().int().min(1).max(12).optional()
})

export type UpdateBudgetPeriodDTO = z.infer<typeof updateBudgetPeriodSchema>
