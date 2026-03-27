import type { CreateStoreDTO } from "../dtos/create-store.dto"
import type { UpdateStoreDTO } from "../dtos/update-store.dto"
import type { Store } from "../entities/store.entity"

export abstract class StoreRepository {
	abstract findAll(): Promise<Store[]>
	abstract findById(id: string): Promise<Store | null>
	abstract create(data: CreateStoreDTO): Promise<Store>
	abstract update(id: string, data: UpdateStoreDTO): Promise<Store>
	abstract delete(id: string): Promise<void>
}
