/**
 * Months a recurring expense has been running as of the expense's month:
 * the months already paid before it was registered, plus the calendar months
 * from the template's start up to and including the expense's month.
 */
export function calculateMonthsRunning(
	recurring: { monthsAlreadyPaid: number; startedAt: Date },
	period: { year: number; month: number }
): number {
	const monthsSinceStart =
		(period.year - recurring.startedAt.getUTCFullYear()) * 12 +
		(period.month - (recurring.startedAt.getUTCMonth() + 1))
	return recurring.monthsAlreadyPaid + Math.max(0, monthsSinceStart) + 1
}
