# Use a imagem oficial do Bun
FROM oven/bun:1 AS base

# Instalar dependências adicionais
RUN apt-get update && apt-get install -y fuse3 openssl sqlite3 ca-certificates curl

# Instalar Node.js 20.8
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs

FROM base AS deps

WORKDIR /myapp

# Adicionar arquivos de dependências e instalar pacotes
ADD package.json package-lock.json bun.lockb ./
RUN bun install

FROM base AS production-deps

WORKDIR /myapp

# Copiar as dependências instaladas na camada de deps
COPY --from=deps /myapp/node_modules /myapp/node_modules

# Adicionar arquivos de dependências para produção
ADD package.json bun.lockb ./

# Instalar o Prisma CLI
ADD prisma .


# Gerar os arquivos do Prisma
RUN npx prisma generate --generator client

# Adicionar o restante do código-fonte
ADD . .

# Configurar o usuário e expor a porta da aplicação
USER bun
EXPOSE 3000/tcp


# Executar a aplicação
CMD ["bun", "run", "src/index.ts"]
