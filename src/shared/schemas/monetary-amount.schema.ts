import { z } from "zod"

export const monetaryAmountSchema = z
	.number()
	.positive()
	.max(99_999_999.99)
	.refine((n) => /^\d+(\.\d{1,2})?$/.test(String(n)), {
		message: "Amount must have at most 2 decimal places"
	})
