import { z } from "zod"

export const installmentGroupParamSchema = z.uuid()

export type InstallmentGroupParamDTO = z.infer<
	typeof installmentGroupParamSchema
>
