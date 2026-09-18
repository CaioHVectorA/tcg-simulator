# Usa a imagem oficial do Bun (leve e rápida)
FROM oven/bun:1 AS base
WORKDIR /myapp

# Instala apenas o openssl (obrigatório para o Query Engine do Prisma rodar no Linux)
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# ---- Passo 1: Instalação e Geração do Prisma ----
# Copia os arquivos de pacotes
COPY package.json bun.lockb ./

# Copia a pasta prisma INTEIRA para dentro de ./prisma (evita o bug de caminhos)
COPY prisma ./prisma/

# Instala as dependências travadas pelo lockfile
RUN bun install

# Gera o Prisma Client usando o Bun
RUN bunx prisma generate

# ---- Passo 2: Código Fonte e Execução ----
# Copia o restante do seu projeto
COPY . .

# Garante que o app vai rodar na porta que o Fly.io espera
ENV PORT=8080
EXPOSE 8080

# Muda para o usuário seguro do Bun (boas práticas de Docker)
USER bun

# Inicializa o Elysia
CMD ["bun", "run", "src/index.ts"]