import { Module } from "@nestjs/common"
import { BankModule } from "@/domains/bank/bank.module"
import { CategoryModule } from "@/domains/category/category.module"
import { PaymentTypeModule } from "@/domains/payment-type/payment-type.module"
import { StoreModule } from "@/domains/store/store.module"
import { PrismaRecurringExpenseRepository } from "@/infra/database/prisma/repositories/prisma-recurring-expense.repository"
import { InfraModule } from "@/infra/infra.module"
import { RecurringExpenseController } from "./recurring-expense.controller"
import { RecurringExpenseService } from "./recurring-expense.service"
import { RecurringExpenseRepository } from "./repositories/recurring-expense.repository"

@Module({
	imports: [
		InfraModule,
		CategoryModule,
		PaymentTypeModule,
		BankModule,
		StoreModule
	],
	controllers: [RecurringExpenseController],
	providers: [
		RecurringExpenseService,
		{
			provide: RecurringExpenseRepository,
			useClass: PrismaRecurringExpenseRepository
		}
	],
	exports: [RecurringExpenseService]
})
export class RecurringExpenseModule {}
