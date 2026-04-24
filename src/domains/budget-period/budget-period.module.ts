import { Module } from "@nestjs/common"
import { PrismaBudgetPeriodRepository } from "@/infra/database/prisma/repositories/prisma-budget-period.repository"
import { InfraModule } from "@/infra/infra.module"
import { BudgetPeriodController } from "./budget-period.controller"
import { BudgetPeriodService } from "./budget-period.service"
import { BudgetPeriodRepository } from "./repositories/budget-period.repository"

@Module({
	imports: [InfraModule],
	controllers: [BudgetPeriodController],
	providers: [
		BudgetPeriodService,
		{ provide: BudgetPeriodRepository, useClass: PrismaBudgetPeriodRepository }
	],
	exports: [BudgetPeriodService]
})
export class BudgetPeriodModule {}
