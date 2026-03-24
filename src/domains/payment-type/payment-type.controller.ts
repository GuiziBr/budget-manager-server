import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post
} from "@nestjs/common"
import { ZodValidationPipe } from "@/infra/pipes/zod-validation.pipe"
import {
	type CreatePaymentTypeDTO,
	createPaymentTypeSchema
} from "./dtos/create-payment-type.dto"
import { paymentTypeParamSchema } from "./dtos/payment-type-param.dto"
import {
	type UpdatePaymentTypeDTO,
	updatePaymentTypeSchema
} from "./dtos/update-payment-type.dto"
import type { PaymentType } from "./entities/payment-type.entity"
import { PaymentTypeService } from "./payment-type.service"

@Controller("payment-types")
export class PaymentTypeController {
	constructor(private readonly paymentTypeService: PaymentTypeService) {}

	@Get()
	findAll(): Promise<PaymentType[]> {
		return this.paymentTypeService.findAll()
	}

	@Get(":id")
	findById(
		@Param("id", new ZodValidationPipe(paymentTypeParamSchema)) id: string
	): Promise<PaymentType> {
		return this.paymentTypeService.findById(id)
	}

	@Post()
	create(
		@Body(new ZodValidationPipe(createPaymentTypeSchema))
		dto: CreatePaymentTypeDTO
	): Promise<PaymentType> {
		return this.paymentTypeService.create(dto)
	}

	@Patch(":id")
	update(
		@Param("id", new ZodValidationPipe(paymentTypeParamSchema)) id: string,
		@Body(new ZodValidationPipe(updatePaymentTypeSchema))
		dto: UpdatePaymentTypeDTO
	): Promise<PaymentType> {
		return this.paymentTypeService.update(id, dto)
	}

	@Delete(":id")
	@HttpCode(HttpStatus.NO_CONTENT)
	delete(
		@Param("id", new ZodValidationPipe(paymentTypeParamSchema)) id: string
	): Promise<void> {
		return this.paymentTypeService.delete(id)
	}
}
