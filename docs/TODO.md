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

### Deferred Features

Features intentionally not built in the current iteration but kept as candidates for future work:
- Scheduling a recurring expense to start in a future budget period (currently `startedAt` is always set to the month of the period the expense is entered into)

---

## Development

### Database Seed Scripts

Create a Prisma seed script (`prisma/seed.ts`) to populate the database with realistic development data. Should cover all domains: lookup tables (Category, PaymentType, Bank, Store), a set of budget periods, incomes, one-time and recurring expenses, and budget envelopes.
