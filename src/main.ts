import { ConfigService } from "@nestjs/config"
import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"
import { Env } from "./infra/env"

async function bootstrap() {
	const app = await NestFactory.create(AppModule)
	app.enableCors({ origin: "http://localhost:3001" })
	app.enableShutdownHooks()
	const configService = app.get<ConfigService<Env, true>>(ConfigService)
	const port = configService.get("PORT", { infer: true })
	await app.listen(port)
}
bootstrap()
