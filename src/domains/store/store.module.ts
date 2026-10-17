import { Module } from "@nestjs/common"
import { PrismaStoreRepository } from "@/infra/database/prisma/repositories/prisma-store.repository"
import { InfraModule } from "@/infra/infra.module"
import { StoreRepository } from "./repositories/store.repository"
import { StoreController } from "./store.controller"
import { StoreService } from "./store.service"

@Module({
	imports: [InfraModule],
	controllers: [StoreController],
	providers: [
		StoreService,
		{ provide: StoreRepository, useClass: PrismaStoreRepository }
	],
	exports: [StoreService]
})
export class StoreModule {}
