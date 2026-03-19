import { Module } from "@nestjs/common"
import { PrismaCategoryRepository } from "@/infra/database/prisma/repositories/prisma-category.repository"
import { InfraModule } from "@/infra/infra.module"
import { CategoryController } from "./category.controller"
import { CategoryService } from "./category.service"
import { CategoryRepository } from "./repositories/category.repository"

@Module({
	imports: [InfraModule],
	controllers: [CategoryController],
	providers: [
		CategoryService,
		{ provide: CategoryRepository, useClass: PrismaCategoryRepository }
	]
})
export class CategoryModule {}
