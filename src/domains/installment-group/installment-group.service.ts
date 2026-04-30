import {
	HttpException,
	Injectable,
	InternalServerErrorException,
	Logger,
	NotFoundException
} from "@nestjs/common"
import type { UpdateInstallmentGroupDTO } from "./dtos/update-installment-group.dto"
import type { InstallmentGroup } from "./entities/installment-group.entity"
import { InstallmentGroupRepository } from "./repositories/installment-group.repository"

@Injectable()
export class InstallmentGroupService {
	private readonly logger = new Logger(InstallmentGroupService.name)

	constructor(
		private readonly installmentGroupRepository: InstallmentGroupRepository
	) {}

	async findById(id: string): Promise<InstallmentGroup> {
		this.logger.debug(`Fetching installment group with id: ${id}`)
		try {
			const group = await this.installmentGroupRepository.findById(id)
			if (!group) {
				throw new NotFoundException(`InstallmentGroup with id ${id} not found`)
			}
			return group
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(
				`Failed to fetch installment group with id: ${id}`,
				error
			)
			throw new InternalServerErrorException()
		}
	}

	async update(
		id: string,
		dto: UpdateInstallmentGroupDTO
	): Promise<InstallmentGroup> {
		this.logger.debug(`Updating installment group with id: ${id}`)
		try {
			await this.findById(id)

			const now = new Date()
			const currentYear = now.getUTCFullYear()
			const currentMonth = now.getUTCMonth() + 1

			return await this.installmentGroupRepository.update(
				id,
				dto,
				currentYear,
				currentMonth
			)
		} catch (error) {
			if (error instanceof HttpException) throw error
			this.logger.error(
				`Failed to update installment group with id: ${id}`,
				error
			)
			throw new InternalServerErrorException()
		}
	}
}
