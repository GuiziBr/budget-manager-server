import { Module } from "@nestjs/common"
import { BudgetPeriodModule } from "@/domains/budget-period/budget-period.module"
import { CategoryModule } from "@/domains/category/category.module"
import { PrismaBudgetEnvelopeRepository } from "@/infra/database/prisma/repositories/prisma-budget-envelope.repository"
import { InfraModule } from "@/infra/infra.module"
import { BudgetEnvelopeController } from "./budget-envelope.controller"
import { BudgetEnvelopeService } from "./budget-envelope.service"
import { BudgetEnvelopeRepository } from "./repositories/budget-envelope.repository"

@Module({
	imports: [InfraModule, BudgetPeriodModule, CategoryModule],
	controllers: [BudgetEnvelopeController],
	providers: [
		BudgetEnvelopeService,
		{
			provide: BudgetEnvelopeRepository,
			useClass: PrismaBudgetEnvelopeRepository
		}
	],
	exports: [BudgetEnvelopeService]
})
export class BudgetEnvelopeModule {}
