import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { CategoryModule } from "@/domains/category/category.module"
import { PaymentTypeModule } from "@/domains/payment-type/payment-type.module"
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
		StoreModule
	]
})
export class AppModule {}
