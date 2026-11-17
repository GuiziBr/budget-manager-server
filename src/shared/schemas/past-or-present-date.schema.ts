import { z } from "zod"

export const pastOrPresentDateSchema = z.coerce
	.date()
	.refine((date) => date.getTime() <= Date.now(), {
		message: "Date cannot be in the future"
	})
