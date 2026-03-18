import { z } from "zod"

export const envSchema = z.object({
	DATABASE_URL: z.url(),
	PORT: z.number().default(3000)
})

export type Env = z.infer<typeof envSchema>
