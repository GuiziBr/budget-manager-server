import { z } from "zod"

export const updateBankSchema = z.object({
	name: z.string().min(1).optional()
})

export type UpdateBankDTO = z.infer<typeof updateBankSchema>
