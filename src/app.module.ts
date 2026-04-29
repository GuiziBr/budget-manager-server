import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { BankModule } from "@/domains/bank/bank.module"
import { BudgetEnvelopeModule } from "@/domains/budget-envelope/budget-envelope.module"
import { BudgetPeriodModule } from "@/domains/budget-period/budget-period.module"
import { CategoryModule } from "@/domains/category/category.module"
import { ExpenseModule } from "@/domains/expense/expense.module"
import { IncomeModule } from "@/domains/income/income.module"
import { PaymentTypeModule } from "@/domains/payment-type/payment-type.module"
import { RecurringExpenseModule } from "@/domains/recurring-expense/recurring-expense.module"
import { StoreModule } from "@/domains/store/store.module"
import { envSchema } from "@/infra/env"
import { InfraModule } from "@/infra/infra.module"

@Module({
	imports: [
		ConfigModule.forRoot({
			validate: (env) => envSchema.parse(env),
			isGlobal: true
		}),
		InfraModule,
		CategoryModule,
		PaymentTypeModule,
		BankModule,
		StoreModule,
		BudgetPeriodModule,
		BudgetEnvelopeModule,
		IncomeModule,
		RecurringExpenseModule,
		ExpenseModule
	]
})
export class AppModule {}
