import type { CreateRecurringExpenseDTO } from "../dtos/create-recurring-expense.dto"
import type { UpdateRecurringExpenseDTO } from "../dtos/update-recurring-expense.dto"
import type { RecurringExpense } from "../entities/recurring-expense.entity"

export abstract class RecurringExpenseRepository {
	abstract findAll(): Promise<RecurringExpense[]>
	abstract findById(id: string): Promise<RecurringExpense | null>
	abstract findActiveForPeriod(
		year: number,
		month: number
	): Promise<RecurringExpense[]>
	abstract create(data: CreateRecurringExpenseDTO): Promise<RecurringExpense>
	abstract update(
		id: string,
		data: UpdateRecurringExpenseDTO
	): Promise<RecurringExpense>
	abstract delete(id: string): Promise<void>
}
