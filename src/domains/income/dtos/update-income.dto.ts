import { z } from "zod"

export const updateIncomeSchema = z.object({
	description: z.string().min(1).optional(),
	amount: z
		.number()
		.positive()
		.max(99_999_999.99)
		.refine((n) => /^\d+(\.\d{1,2})?$/.test(String(n)), {
			message: "Amount must have at most 2 decimal places"
		})
		.optional(),
	isSalary: z.boolean().optional(),
	receivedDate: z.iso.date().optional().nullable()
})

export type UpdateIncomeDTO = z.infer<typeof updateIncomeSchema>
