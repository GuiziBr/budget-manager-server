import { z } from "zod"
import { monetaryAmountSchema } from "@/shared/schemas/monetary-amount.schema"

export const updateIncomeSchema = z.object({
	description: z.string().min(1).optional(),
	amount: monetaryAmountSchema.optional(),
	isSalary: z.boolean().optional(),
	receivedAt: z.iso.date().optional().nullable()
})

export type UpdateIncomeDTO = z.infer<typeof updateIncomeSchema>
