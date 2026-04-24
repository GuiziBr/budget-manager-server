import { z } from "zod"

export const createIncomeSchema = z.object({
	budgetPeriodId: z.string().uuid(),
	description: z.string().min(1),
	amount: z
		.number()
		.positive()
		.max(99_999_999.99)
		.refine((n) => Math.round(n * 100) === n * 100, {
			message: "Amount must have at most 2 decimal places"
		}),
	isSalary: z.boolean().optional().default(false),
	receivedDate: z.string().date().optional().nullable()
})

export type CreateIncomeDTO = z.infer<typeof createIncomeSchema>
