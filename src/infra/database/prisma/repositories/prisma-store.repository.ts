import { ConflictException, Injectable } from "@nestjs/common"
import { PrismaClientKnownRequestError } from "@prisma/client-runtime-utils"
import type { CreateStoreDTO } from "@/domains/store/dtos/create-store.dto"
import type { UpdateStoreDTO } from "@/domains/store/dtos/update-store.dto"
import type { Store } from "@/domains/store/entities/store.entity"
import { StoreRepository } from "@/domains/store/repositories/store.repository"
import { DatabaseService } from "@/infra/database/database.service"

@Injectable()
export class PrismaStoreRepository extends StoreRepository {
	constructor(private readonly db: DatabaseService) {
		super()
	}

	async findAll(): Promise<Store[]> {
		return this.db.store.findMany({ where: { deletedAt: null } })
	}

	async findById(id: string): Promise<Store | null> {
		return this.db.store.findFirst({ where: { id, deletedAt: null } })
	}

	async create(data: CreateStoreDTO): Promise<Store> {
		try {
			return await this.db.store.create({ data })
		} catch (error) {
			if (
				error instanceof PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				throw new ConflictException(
					`A store named '${data.name}' already exists`
				)
			}
			throw error
		}
	}

	async update(id: string, data: UpdateStoreDTO): Promise<Store> {
		try {
			return await this.db.store.update({
				where: { id, deletedAt: null },
				data
			})
		} catch (error) {
			if (
				error instanceof PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				throw new ConflictException(
					`A store named '${data.name}' already exists`
				)
			}
			throw error
		}
	}

	async delete(id: string): Promise<void> {
		await this.db.store.update({
			where: { id, deletedAt: null },
			data: { deletedAt: new Date() }
		})
	}
}
