import { Module } from "@nestjs/common"
import { BudgetPeriodModule } from "@/domains/budget-period/budget-period.module"
import { CategoryModule } from "@/domains/category/category.module"
import { PrismaBudgetEnvelopeRepository } from "@/infra/database/prisma/repositories/prisma-budget-envelope.repository"
import { ExpenseServerEnvelopeSpendRepository } from "@/infra/external/expense-server-envelope-spend.repository"
import { InfraModule } from "@/infra/infra.module"
import { BudgetEnvelopeController } from "./budget-envelope.controller"
import { BudgetEnvelopeService } from "./budget-envelope.service"
import { BudgetEnvelopeRepository } from "./repositories/budget-envelope.repository"
import { EnvelopeSpendRepository } from "./repositories/envelope-spend.repository"

@Module({
	imports: [InfraModule, BudgetPeriodModule, CategoryModule],
	controllers: [BudgetEnvelopeController],
	providers: [
		BudgetEnvelopeService,
		{
			provide: BudgetEnvelopeRepository,
			useClass: PrismaBudgetEnvelopeRepository
		},
		{
			provide: EnvelopeSpendRepository,
			useClass: ExpenseServerEnvelopeSpendRepository
		}
	],
	exports: [BudgetEnvelopeService]
})
export class BudgetEnvelopeModule {}
