import { z } from "zod"
import { monetaryAmountSchema } from "@/shared/schemas/monetary-amount.schema"

export const createIncomeSchema = z.object({
	budgetPeriodId: z.uuid(),
	description: z.string().min(1),
	amount: monetaryAmountSchema,
	isSalary: z.boolean().optional().default(false),
	receivedDate: z.iso.date().optional().nullable()
})

export type CreateIncomeDTO = z.infer<typeof createIncomeSchema>
