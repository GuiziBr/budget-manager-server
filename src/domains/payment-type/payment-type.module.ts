import { Module } from "@nestjs/common"
import { PrismaPaymentTypeRepository } from "@/infra/database/prisma/repositories/prisma-payment-type.repository"
import { InfraModule } from "@/infra/infra.module"
import { PaymentTypeController } from "./payment-type.controller"
import { PaymentTypeService } from "./payment-type.service"
import { PaymentTypeRepository } from "./repositories/payment-type.repository"

@Module({
	imports: [InfraModule],
	controllers: [PaymentTypeController],
	providers: [
		PaymentTypeService,
		{ provide: PaymentTypeRepository, useClass: PrismaPaymentTypeRepository }
	],
	exports: [PaymentTypeService]
})
export class PaymentTypeModule {}
