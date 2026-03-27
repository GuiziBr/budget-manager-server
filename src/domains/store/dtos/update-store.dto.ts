import { z } from "zod"

export const updateStoreSchema = z.object({
	name: z.string().min(1).optional()
})

export type UpdateStoreDTO = z.infer<typeof updateStoreSchema>
