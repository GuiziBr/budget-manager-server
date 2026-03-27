import { z } from "zod"

export const createBankSchema = z.object({
	name: z.string().min(1)
})

export type CreateBankDTO = z.infer<typeof createBankSchema>
