# CLAUDE.md — Budget Manager Server

## Project Overview

NestJS backend for personal budget management. Supports monthly budget periods, expense tracking (one-time, installments, recurring), income management, and budget envelopes backed by an external spend API.

## Tech Stack

- **Framework**: NestJS v10
- **Language**: TypeScript v5
- **ORM**: Prisma v7 with PostgreSQL (via `@prisma/adapter-pg`)
- **Validation**: Zod (environment schema + request body/param validation via `ZodValidationPipe`)
- **Testing**: Vitest
- **Linting/Formatting**: Biome
- **Containerization**: Docker + Docker Compose

## Common Commands

```bash
npm run start:dev       # start with watch mode
npm run test            # run unit tests
npm run test:cov        # run unit tests with coverage
npm run lint            # lint and auto-fix with Biome
npm run format          # format with Biome
npm run migrate         # run Prisma migrations locally
npm run docker:up       # start server + PostgreSQL via Docker Compose
```

## Architecture — Domain-Driven Design (DDD)

### Folder Structure

```
src/
  domains/
    <domain>/
      entities/         # domain entity class
      dtos/             # CreateDto, UpdateDto, and their Zod schemas
      repositories/     # abstract repository class
      <domain>.service.ts
      <domain>.service.spec.ts
      <domain>.controller.ts
      <domain>.controller.spec.ts
      <domain>.module.ts
  infra/
    env.ts              # Zod environment schema
    infra.module.ts     # exports DatabaseService
    pipes/
      zod-validation.pipe.ts       # reusable ZodValidationPipe
      zod-validation.pipe.spec.ts
    database/
      database.service.ts                        # extends PrismaClient
      prisma/
        repositories/
          prisma-<domain>.repository.ts          # Prisma implementation
```

### Layer Rules

- **Controller** — communicates with the service layer only; never imports repositories
- **Service** — injects the abstract repository; has no knowledge of Prisma; uses NestJS `Logger`
- **Abstract Repository** — defines the contract (methods, signatures) as an abstract class
- **Prisma Repository** — implements the abstract class; lives in `src/infra/database/prisma/repositories/`
- **Module** — binds the abstract repository to its Prisma implementation via DI: `{ provide: CategoryRepository, useClass: PrismaCategoryRepository }`; imports `InfraModule` to access `DatabaseService`

### Naming Conventions

- Files: `kebab-case` (e.g., `category.service.ts`, `prisma-category.repository.ts`)
- Classes: `PascalCase`
- Database columns: `snake_case` (mapped via Prisma `@map`)
- Path alias: use `@/` for any import that crosses folder boundaries (e.g., `@/domains/category/...`, `@/infra/...`); keep `./` only for same-directory imports

## Adding a New Domain

1. Create `src/domains/<domain>/entities/<domain>.entity.ts` — plain TS class
2. Create `src/domains/<domain>/dtos/create-<domain>.dto.ts` and `update-<domain>.dto.ts` — each exports a Zod schema and an inferred type (no class needed)
3. Create `src/domains/<domain>/repositories/<domain>.repository.ts` — abstract class
4. Create `src/infra/database/prisma/repositories/prisma-<domain>.repository.ts` — Prisma implementation
5. Create `src/domains/<domain>/<domain>.service.ts` — injects abstract repo, uses `Logger`
6. Create `src/domains/<domain>/<domain>.controller.ts` — injects service only
7. Create `src/domains/<domain>/<domain>.module.ts` — wires everything, imports `InfraModule`
8. Add the new module to `src/app.module.ts`
9. Write `<domain>.service.spec.ts` and `<domain>.controller.spec.ts`

## Testing

- Unit tests use **Vitest** with `vi.fn()` mocks — no `@nestjs/testing` module
- Service tests: mock the abstract repository
- Controller tests: mock the service
- Prisma repository implementations are **excluded from coverage** — they require a real DB and belong in e2e/integration tests
- Coverage provider: `v8` (configured in `vitest.config.ts`)

## Database

- All models have `deletedAt DateTime?` — use **soft delete** everywhere (set `deletedAt = new Date()`)
- All queries must filter `where: { deletedAt: null }`
- Schema: `prisma/schema.prisma`; migrations: `prisma/migrations/`
- `DatabaseService` extends `PrismaClient` directly and is provided by `InfraModule`

## Validation

- `ZodValidationPipe` lives in `src/infra/pipes/` and is reused across all domains
- Apply it per-parameter: `@Body(new ZodValidationPipe(schema))` for bodies, `@Param("id", new ZodValidationPipe(schema))` for route params
- DTOs are Zod schemas + `z.infer<>` types — no classes, no decorators
- UUID params use `z.uuid()` — invalid IDs return `400` before reaching the service
- Validation errors are returned as `error.issues` (Zod v4 — `format()` and `flatten()` are deprecated)

## Key Design Decisions

- `NotFoundException` is thrown by the **service** (not the repository) when a record is not found
- Soft delete is enforced in the **Prisma repository** — the service calls `delete()` on the abstract repo without knowing the implementation detail
- The service calls `findById()` before `update()` and `delete()` to validate existence and surface a clean 404 before attempting the mutation
