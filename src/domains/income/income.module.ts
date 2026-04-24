import { Module } from "@nestjs/common"
import { BudgetPeriodModule } from "@/domains/budget-period/budget-period.module"
import { PrismaIncomeRepository } from "@/infra/database/prisma/repositories/prisma-income.repository"
import { InfraModule } from "@/infra/infra.module"
import { IncomeController } from "./income.controller"
import { IncomeService } from "./income.service"
import { IncomeRepository } from "./repositories/income.repository"

@Module({
	imports: [InfraModule, BudgetPeriodModule],
	controllers: [IncomeController],
	providers: [
		IncomeService,
		{ provide: IncomeRepository, useClass: PrismaIncomeRepository }
	]
})
export class IncomeModule {}
