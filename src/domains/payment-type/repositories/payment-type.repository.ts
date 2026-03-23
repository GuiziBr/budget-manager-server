import type { CreatePaymentTypeDTO } from "../dtos/create-payment-type.dto"
import type { UpdatePaymentTypeDTO } from "../dtos/update-payment-type.dto"
import type { PaymentType } from "../entities/payment-type.entity"

export abstract class PaymentTypeRepository {
	abstract findAll(): Promise<PaymentType[]>
	abstract findById(id: string): Promise<PaymentType | null>
	abstract create(data: CreatePaymentTypeDTO): Promise<PaymentType>
	abstract update(id: string, data: UpdatePaymentTypeDTO): Promise<PaymentType>
	abstract delete(id: string): Promise<void>
}
