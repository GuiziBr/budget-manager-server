export const TEST_DATABASE_URL =
	process.env.DATABASE_URL_TEST ??
	"postgresql://admin:admin@localhost:5433/budget_manager_test?schema=public"
