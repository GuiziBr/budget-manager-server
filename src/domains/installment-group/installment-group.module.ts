import { Module } from "@nestjs/common"
import { PrismaInstallmentGroupRepository } from "@/infra/database/prisma/repositories/prisma-installment-group.repository"
import { InfraModule } from "@/infra/infra.module"
import { InstallmentGroupController } from "./installment-group.controller"
import { InstallmentGroupService } from "./installment-group.service"
import { InstallmentGroupRepository } from "./repositories/installment-group.repository"

@Module({
	imports: [InfraModule],
	controllers: [InstallmentGroupController],
	providers: [
		InstallmentGroupService,
		{
			provide: InstallmentGroupRepository,
			useClass: PrismaInstallmentGroupRepository
		}
	]
})
export class InstallmentGroupModule {}
