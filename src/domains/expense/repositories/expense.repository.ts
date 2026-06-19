import type { Expense } from "../entities/expense.entity"

export type ExpenseFilters = {
	budgetPeriodId?: string
	page?: number
	limit?: number
}

export type CreateExpenseData = {
	budgetPeriodId: string
	categoryId: string
	paymentTypeId: string
	bankId?: string | null
	storeId?: string | null
	description: string
	amount: number
	purchasedAt?: Date | null
	dueAt?: Date | null
	paidAt?: Date | null
}

export type CreateRecurringTemplateData = {
	categoryId: string
	paymentTypeId: string
	bankId?: string | null
	storeId?: string | null
	description: string
	amount: number
	startedAt: Date
}

export type CreateInstallmentGroupData = {
	description: string
	amountPerInstallment: number
	totalInstallments: number
	paymentIntervalDays: number
	firstPurchasedAt: Date
}

export type CreateInstallmentExpenseData = {
	budgetPeriodId: string
	categoryId: string
	paymentTypeId: string
	bankId?: string | null
	storeId?: string | null
	description: string
	amount: number
	installmentNumber: number
	dueAt: Date
	purchasedAt?: Date | null
}

export type UpdateExpenseData = {
	description?: string
	amount?: number
	categoryId?: string
	paymentTypeId?: string
	bankId?: string | null
	storeId?: string | null
	purchasedAt?: Date | null
	dueAt?: Date | null
	paidAt?: Date | null
}

export abstract class ExpenseRepository {
	abstract findAll(
		filters: ExpenseFilters
	): Promise<{ data: Expense[]; total: number }>
	abstract findById(id: string): Promise<Expense | null>
	abstract create(data: CreateExpenseData): Promise<Expense>
	abstract createWithRecurringTemplate(
		expenseData: CreateExpenseData,
		recurringData: CreateRecurringTemplateData
	): Promise<Expense>
	abstract createInstallmentExpenses(
		groupData: CreateInstallmentGroupData,
		expenses: CreateInstallmentExpenseData[]
	): Promise<Expense[]>
	abstract update(id: string, data: UpdateExpenseData): Promise<Expense>
	abstract delete(id: string): Promise<void>
}
