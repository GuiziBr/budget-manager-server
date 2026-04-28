import { z } from "zod"

export const recurringExpenseParamSchema = z.uuid()

export type RecurringExpenseParamDTO = z.infer<
	typeof recurringExpenseParamSchema
>
