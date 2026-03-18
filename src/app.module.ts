import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { envSchema } from "./infra/env"
import { InfraModule } from "./infra/infra.module"

@Module({
	imports: [
		ConfigModule.forRoot({
			validate: (env) => envSchema.parse(env),
			isGlobal: true
		}),
		InfraModule
	]
})
export class AppModule {}
