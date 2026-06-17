import { z } from "zod"

export const updateBankSchema = z
	.object({
		name: z.string().min(1).optional()
	})
	.refine((obj) => Object.keys(obj).length > 0, {
		message: "At least one field must be provided"
	})

export type UpdateBankDTO = z.infer<typeof updateBankSchema>
