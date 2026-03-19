FROM node:24-alpine AS base

WORKDIR /server

RUN apk add --no-cache libc6-compat openssl

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Install dependencies without running postinstall scripts
RUN npm ci --ignore-scripts

# Generate Prisma client explicitly (using placeholder DATABASE_URL for build environment)
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" npx prisma generate

COPY . .

EXPOSE 3000
