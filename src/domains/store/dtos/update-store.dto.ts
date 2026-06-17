import { z } from "zod"

export const updateStoreSchema = z
	.object({
		name: z.string().min(1).optional()
	})
	.refine((obj) => Object.keys(obj).length > 0, {
		message: "At least one field must be provided"
	})

export type UpdateStoreDTO = z.infer<typeof updateStoreSchema>
