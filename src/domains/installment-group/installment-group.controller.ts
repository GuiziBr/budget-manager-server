import { Body, Controller, Get, Param, Patch } from "@nestjs/common"
import { ZodValidationPipe } from "@/infra/pipes/zod-validation.pipe"
import { installmentGroupParamSchema } from "./dtos/installment-group-param.dto"
import {
	type UpdateInstallmentGroupDTO,
	updateInstallmentGroupSchema
} from "./dtos/update-installment-group.dto"
import type { InstallmentGroup } from "./entities/installment-group.entity"
import { InstallmentGroupService } from "./installment-group.service"

@Controller("installment-groups")
export class InstallmentGroupController {
	constructor(
		private readonly installmentGroupService: InstallmentGroupService
	) {}

	@Get(":id")
	findById(
		@Param("id", new ZodValidationPipe(installmentGroupParamSchema)) id: string
	): Promise<InstallmentGroup> {
		return this.installmentGroupService.findById(id)
	}

	@Patch(":id")
	update(
		@Param("id", new ZodValidationPipe(installmentGroupParamSchema)) id: string,
		@Body(new ZodValidationPipe(updateInstallmentGroupSchema))
		dto: UpdateInstallmentGroupDTO
	): Promise<InstallmentGroup> {
		return this.installmentGroupService.update(id, dto)
	}
}
