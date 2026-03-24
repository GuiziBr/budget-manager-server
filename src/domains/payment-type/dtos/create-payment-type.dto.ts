import { z } from "zod"

export const createPaymentTypeSchema = z.object({
	name: z.string().min(1),
	hasStatement: z.boolean()
})

export type CreatePaymentTypeDTO = z.infer<typeof createPaymentTypeSchema>
