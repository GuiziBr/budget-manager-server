import { z } from "zod"

export const envSchema = z.object({
	DATABASE_URL: z.url(),
	PORT: z.coerce.number().default(3000),
	EXPENSE_API_URL: z.url({ protocol: /^https?$/ }),
	EXPENSE_API_KEY: z.string().min(1),
	EXPENSE_API_USER_ID: z.uuid()
})

export type Env = z.infer<typeof envSchema>
