# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG BUN_VERSION=1.1.0
FROM oven/bun:${BUN_VERSION}-slim as base

LABEL fly_launch_runtime="Bun/Prisma"

# NodeJS/Prisma app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV="production"


# Throw-away build stage to reduce size of final image
FROM base as build

# Install packages needed to build node modules
RUN apt-get update -qq && \
    apt-get install -y python-is-python3 pkg-config build-essential openssl 

# Install node modules
COPY --link bun.lockb package.json ./
RUN bun install --ci

# Generate Prisma Client
COPY --link prisma ./prisma
RUN bun add @prisma/client
RUN bun add -g prisma
RUN bunx prisma generate  
# Copy application code
COPY --link . .

# Final stage for app image
FROM base

# Copy built application
COPY --from=build /app /app
COPY --from=build /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client /app/node_modules/@prisma/client


# Entrypoint prepares the database.
ENTRYPOINT ["/app/docker-entrypoint"]

# Start the server by default, this can be overwritten at runtime
CMD bunx prisma db pull && bunx prisma generate && bun src/index.ts
