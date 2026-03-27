import { z } from "zod"

export const createBudgetPeriodSchema = z.object({
	year: z.number().int().min(2000),
	month: z.number().int().min(1).max(12)
})

export type CreateBudgetPeriodDTO = z.infer<typeof createBudgetPeriodSchema>
