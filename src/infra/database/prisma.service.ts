import { Injectable, OnModuleInit } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import type { Env } from "../env"

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
	constructor(configService: ConfigService<Env, true>) {
		const connectionString = configService.get("DATABASE_URL", { infer: true })
		const pool = new Pool({ connectionString })
		const adapter = new PrismaPg(pool as any)

		super({ adapter })
	}

	async onModuleInit() {
		await this.$connect()
	}
}
