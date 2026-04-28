import { Module } from "@nestjs/common"
import { PrismaBankRepository } from "@/infra/database/prisma/repositories/prisma-bank.repository"
import { InfraModule } from "@/infra/infra.module"
import { BankController } from "./bank.controller"
import { BankService } from "./bank.service"
import { BankRepository } from "./repositories/bank.repository"

@Module({
	imports: [InfraModule],
	controllers: [BankController],
	providers: [
		BankService,
		{ provide: BankRepository, useClass: PrismaBankRepository }
	],
	exports: [BankService]
})
export class BankModule {}
