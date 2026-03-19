# Budget Manager Server

[![CI](https://github.com/GuiziBr/budget-manager-server/actions/workflows/ci.yml/badge.svg)](https://github.com/GuiziBr/budget-manager-server/actions/workflows/ci.yml)
[![Biome](https://img.shields.io/badge/Linter-Biome-60a5fa?logo=biome)](https://biomejs.dev)
[![NestJS](https://img.shields.io/badge/Framework-NestJS-e0234e?logo=nestjs)](https://nestjs.com)

Budget Manager Server is a robust backend service for personal budget management. It supports monthly budget periods, expense tracking (including installments and recurring payments), income management, and budget envelopes that pull real-time data from external spend APIs.

---

## 🚀 Tech Stack

- **Framework**: [NestJS](https://nestjs.com/) (v10)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **ORM**: [Prisma](https://www.prisma.io/) with **PostgreSQL**
- **Validation**: [Zod](https://zod.dev/) (for environment and data schemas)
- **Tooling**: [Biome](https://biomejs.dev/) (Linting & Formatting)
- **Testing**: [Vitest](https://vitest.dev/)
- **Containerization**: [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)

---

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v24+ required)
- [Docker](https://www.docker.com/products/docker-desktop/) & [Docker Compose](https://docs.docker.com/compose/install/)

### Quick Start (with Docker)

The easiest way to get started is using Docker Compose:

```bash
# 1. Clone the repository
git clone https://github.com/GuiziBr/budget-manager-server.git
cd budget-manager-server

# 2. Setup your environment
cp .env.example .env

# 3. Spin up the containers (Server + PostgreSQL)
npm run docker:up
```

The server will be available at `http://localhost:3000`.

---

## ⚙️ Configuration

Copy `.env.example` to `.env` and adjust the variables:

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | Prisma/PostgreSQL connection string | `postgresql://admin:admin@localhost:5432/budget-manager?schema=public` |
| `PORT` | Local port for the NestJS server | `3000` |

---

## 📜 Available Scripts

| Script | Description |
|---|---|
| `npm run start:dev` | Start the server in watch mode |
| `npm run build` | Build the project for production |
| `npm run lint` | Run Biome linting and auto-fix |
| `npm run format` | Run Biome formatting and auto-fix |
| `npm run test` | Run unit tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Generate coverage report |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run migrate` | Run Prisma migrations locally |
| `npm run docker:up` | Start the full environment with Docker Compose |
| `npm run docker:build` | Rebuild and start Docker containers |
| `npm run docker:down` | Stop and remove Docker containers and volumes |
| `npm run docker:migrate:dev` | Run Prisma migrations inside the Docker container |
| `npm run docker:migrate:deploy` | Deploy migrations inside the Docker container |
| `npm run docker:seed` | Seed the database inside the Docker container |

---

## 🏗️ Architecture

The project follows **Domain-Driven Design (DDD)**:

- **`src/domains/`**: Domain modules — each domain owns its entity, DTOs, abstract repository, service, controller, and module.
- **`src/infra/`**: Infrastructure layer — environment config, `DatabaseService` (Prisma), and Prisma repository implementations.
- **`prisma/`**: Database schema and migrations.
- **`docs/`**: Detailed documentation and [Database Schema design](docs/database_schema.md).

For a deep dive into the database design, see [docs/database_schema.md](docs/database_schema.md).

---

## 🧪 Testing

We use **Vitest** for all testing needs.

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:cov
```

---
