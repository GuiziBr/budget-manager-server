import { Module } from "@nestjs/common"
import { BankModule } from "@/domains/bank/bank.module"
import { BudgetPeriodModule } from "@/domains/budget-period/budget-period.module"
import { CategoryModule } from "@/domains/category/category.module"
import { PaymentTypeModule } from "@/domains/payment-type/payment-type.module"
import { StoreModule } from "@/domains/store/store.module"
import { PrismaExpenseRepository } from "@/infra/database/prisma/repositories/prisma-expense.repository"
import { InfraModule } from "@/infra/infra.module"
import { ExpenseController } from "./expense.controller"
import { ExpenseService } from "./expense.service"
import { ExpenseRepository } from "./repositories/expense.repository"

@Module({
	imports: [
		InfraModule,
		BudgetPeriodModule,
		CategoryModule,
		PaymentTypeModule,
		BankModule,
		StoreModule
	],
	controllers: [ExpenseController],
	providers: [
		ExpenseService,
		{ provide: ExpenseRepository, useClass: PrismaExpenseRepository }
	],
	exports: [ExpenseService]
})
export class ExpenseModule {}
