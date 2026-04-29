import { z } from "zod"
import { monetaryAmountSchema } from "@/shared/schemas/monetary-amount.schema"

export const createBudgetEnvelopeSchema = z.object({
	budgetPeriodId: z.uuid(),
	categoryId: z.uuid(),
	allocatedAmount: monetaryAmountSchema
})

export type CreateBudgetEnvelopeDTO = z.infer<typeof createBudgetEnvelopeSchema>
