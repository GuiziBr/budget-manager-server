import type { CreateBankDTO } from "../dtos/create-bank.dto"
import type { UpdateBankDTO } from "../dtos/update-bank.dto"
import type { Bank } from "../entities/bank.entity"

export abstract class BankRepository {
	abstract findAll(): Promise<Bank[]>
	abstract findById(id: string): Promise<Bank | null>
	abstract create(data: CreateBankDTO): Promise<Bank>
	abstract update(id: string, data: UpdateBankDTO): Promise<Bank>
	abstract delete(id: string): Promise<void>
}
