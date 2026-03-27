import { z } from "zod"

export const createStoreSchema = z.object({
	name: z.string().min(1)
})

export type CreateStoreDTO = z.infer<typeof createStoreSchema>
