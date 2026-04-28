import { z } from "zod"

export const expenseParamSchema = z.uuid()

export type ExpenseParamDTO = z.infer<typeof expenseParamSchema>
