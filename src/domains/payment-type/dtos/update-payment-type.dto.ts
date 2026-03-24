import { z } from "zod"

export const updatePaymentTypeSchema = z.object({
	name: z.string().min(1).optional(),
	hasStatement: z.boolean().optional()
})

export type UpdatePaymentTypeDTO = z.infer<typeof updatePaymentTypeSchema>
