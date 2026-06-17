# Documentation TODO

Items remaining to complete the software specification.

---

## Functional Gaps

### API Reference

Document every endpoint with:
- HTTP method and route (e.g., `POST /budget-periods`)
- Request body shape and field types
- Response body shape and field types
- Possible HTTP status codes and what triggers each

Covers all domains: Budget Period, Budget Envelope, Expense, Installment Group, Recurring Expense, Income, Category, PaymentType, Bank, Store.

### Error Handling Contract

Define the standard error response shape returned by the API for all failure cases. For example:

- What does a 400 body look like? (Zod issue array, single message string, or structured object?)
- What does a 404 body look like?
- What does a 409 body look like?
- What does a 500 body look like?

Consumers need to know what to parse on failure.

### External API Contract

Document the external spend API used for budget envelope actual-spend data:
- Base URL and auth mechanism
- Request format (e.g., `GET /balances?category=Groceries&month=2026-03`)
- Response shape
- Behavior when the API is unavailable — does the system error, return null, or use a cached value?

---

## Non-Functional Gaps

### Authentication & Authorization

Clarify:
- Is this a single-user system with no auth?
- If auth is required, what mechanism (JWT, session, API key)?
- Are all endpoints protected or is there a public surface?

### Environment & Deployment

Document:
- Required environment variables (names, descriptions, example values)
- Docker Compose setup and how to run locally
- How to run database migrations
- Any external service dependencies beyond the database

---

## Operational Gaps

### Out of Scope

Explicitly state what this system does **not** do to prevent scope creep. Candidates:
- Multi-user / multi-tenant support
- Currency conversion
- Reporting or aggregation endpoints
- Push notifications or scheduled jobs exposed via API
- Frontend or mobile clients

---

## Development

### % of Salary on Expense

Add `percentOfSalary: number | null` to the `Expense` entity as a computed field derived at query time:

```
expense.amount / SUM(income.amount WHERE is_salary = true AND budget_period_id = expense.budget_period_id) * 100
```

Implementation notes:
- `IncomeModule` already exports `IncomeService` — inject it into `ExpenseService`
- Compute in `findById` and in `findAll` when `budgetPeriodId` filter is provided (skip for cross-period queries to avoid N+1)
- Return `null` when no salary incomes exist for the period

---

### Standardise date column naming to `*At` convention

All date/timestamp columns should follow the `*At` suffix pattern already used by `createdAt`, `updatedAt`, `deletedAt`, `startedAt`, `cancelledAt`. The following columns currently deviate:

| Model | Current name | Target name |
|---|---|---|
| `Expense` | `purchaseDate` | `purchasedAt` |
| `Expense` | `dueDate` | `dueAt` |
| `Expense` | `paidDate` | `paidAt` |
| `InstallmentGroup` | `firstPurchaseDate` | `firstPurchasedAt` |
| `Income` | `receivedDate` | `receivedAt` |

Scope of change per column:
- `prisma/schema.prisma` — rename field and update `@map` to match
- New Prisma migration — `ALTER TABLE ... RENAME COLUMN`
- Entity class
- DTO schemas (Zod field names)
- Abstract repository type definitions
- Prisma repository `mapTo*` function
- Service and spec references

---

### Configure production log levels

The app currently calls `NestFactory.create(AppModule)` in `src/main.ts` with no `logger` option, so NestJS uses its default `ConsoleLogger` with **all levels enabled** — including `debug` and `verbose`. This means every `logger.debug(...)` call across the services is printed in all environments.

When setting up production, configure level filtering so `debug`/`verbose` are dropped in prod while `log`/`warn`/`error` are retained:
- Add a `LOG_LEVEL` (or `NODE_ENV`-driven) entry to the `Env` Zod schema in `src/infra/env.ts`
- Pass an explicit `logger` array to `NestFactory.create` in `src/main.ts`, e.g. `["error", "warn", "log"]` in production vs. all levels in development

---

### Database Seed Scripts

Create a Prisma seed script (`prisma/seed.ts`) to populate the database with realistic development data. Should cover all domains: lookup tables (Category, PaymentType, Bank, Store), a set of budget periods, incomes, one-time and recurring expenses, and budget envelopes.
