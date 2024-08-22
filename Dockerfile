# Use a imagem oficial do Bun como base
FROM jarredsumner/bun:latest as build

# Set the working directory inside the container
WORKDIR /app

# Copy the package files and install dependencies
COPY package.json bun.lockb ./
RUN bun install

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Set the entrypoint for the application
CMD ["bun", "run", "start:dev"]

# Use a smaller base image for the final stage
FROM jarredsumner/bun:latest

# Set the working directory inside the container
WORKDIR /app

# Copy the built application files
COPY --from=build /app /app

# Expose the port that your application runs on
EXPOSE 3000

# Start the server
CMD ["bun", "run", "start:dev"]
