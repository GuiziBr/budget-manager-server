import { z } from "zod"

export const createBudgetPeriodSchema = z.object({
	year: z
		.number()
		.int()
		.min(2000)
		.refine((year) => year <= new Date().getUTCFullYear() + 1, {
			message: "Year cannot be later than next year"
		}),
	month: z.number().int().min(1).max(12)
})

export type CreateBudgetPeriodDTO = z.infer<typeof createBudgetPeriodSchema>
