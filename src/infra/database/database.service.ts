import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import type { Env } from "@/infra/env"

@Injectable()
export class DatabaseService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
	constructor(configService: ConfigService<Env, true>) {
		const connectionString = configService.get("DATABASE_URL", { infer: true })

		// Use the specific type expected by PrismaPg from its constructor parameters
		// to resolve version conflicts between @types/pg versions.
		const poolOrConfig = new Pool({
			connectionString
		}) as unknown as ConstructorParameters<typeof PrismaPg>[0]
		const adapter = new PrismaPg(poolOrConfig)

		super({ adapter })
	}

	async onModuleInit() {
		await this.$connect()
	}

	async onModuleDestroy() {
		await this.$disconnect()
	}
}
