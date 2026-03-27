import {
	HttpException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException
} from "@nestjs/common"
import type { CreateStoreDTO } from "./dtos/create-store.dto"
import type { UpdateStoreDTO } from "./dtos/update-store.dto"
import type { Store } from "./entities/store.entity"
import { StoreRepository } from "./repositories/store.repository"

@Injectable()
export class StoreService {
	private readonly logger = new Logger(StoreService.name)

	constructor(private readonly storeRepository: StoreRepository) {}

	async findAll(): Promise<Store[]> {
		this.logger.debug("Fetching all stores")
		try {
			return await this.storeRepository.findAll()
		} catch (error) {
			this.logger.error("Failed to fetch stores", error)
			throw new InternalServerErrorException()
		}
	}

	async findById(id: string): Promise<Store> {
		this.logger.debug(`Fetching store with id: ${id}`)
		try {
			const store = await this.storeRepository.findById(id)
			if (!store) {
				throw new NotFoundException(`Store with id ${id} not found`)
			}
			return store
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to fetch store with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}

	async create(dto: CreateStoreDTO): Promise<Store> {
		this.logger.debug(`Creating store: ${dto.name}`)
		try {
			return await this.storeRepository.create(dto)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error("Failed to create store", error)
			throw new InternalServerErrorException()
		}
	}

	async update(id: string, dto: UpdateStoreDTO): Promise<Store> {
		this.logger.debug(`Updating store with id: ${id}`)
		try {
			await this.findById(id)
			return await this.storeRepository.update(id, dto)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to update store with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}

	async delete(id: string): Promise<void> {
		this.logger.debug(`Deleting store with id: ${id}`)
		try {
			await this.findById(id)
			return await this.storeRepository.delete(id)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(`Failed to delete store with id: ${id}`, error)
			throw new InternalServerErrorException()
		}
	}
}
