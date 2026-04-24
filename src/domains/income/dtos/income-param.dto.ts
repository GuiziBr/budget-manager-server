import { z } from "zod"

export const incomeParamSchema = z.uuid()

export type IncomeParamDTO = z.infer<typeof incomeParamSchema>
