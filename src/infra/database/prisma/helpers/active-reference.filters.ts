// A lookup record is "actively referenced" when a non-cancelled recurring
// template points at it or an expense lives in the current or a future period.
// Past-period expenses are history and do not block deletion.

export const openPeriodFilter = (
	currentYear: number,
	currentMonth: number
) => ({
	deletedAt: null,
	OR: [
		{ year: { gt: currentYear } },
		{ year: currentYear, month: { gte: currentMonth } }
	]
})

export const activeRecurringFilter = (
	currentYear: number,
	currentMonth: number
) => ({
	deletedAt: null,
	OR: [
		{ cancelledAt: null },
		{
			cancelledAt: {
				gte: new Date(Date.UTC(currentYear, currentMonth - 1, 1))
			}
		}
	]
})
