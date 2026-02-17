# Dockerfile para desenvolvimento - usa código local modificado
FROM node:22-slim

# Evitar prompts interativos
ENV DEBIAN_FRONTEND=noninteractive
ENV CI=true

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
  git \
  curl \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Instalar pnpm
RUN npm install -g pnpm

# Diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências primeiro (para cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY extensions/*/package.json ./extensions/*/

# Instalar dependências (sem frozen-lockfile porque pode estar desatualizado)
RUN pnpm install --no-frozen-lockfile

# Copiar TODO o código fonte (incluindo suas modificações!)
COPY . .

# Buildar o projeto
RUN pnpm build

# Instalar dependências da UI (necessário para evitar frozen-lockfile no build)
RUN cd /app/ui && pnpm install --no-frozen-lockfile

# Buildar a UI (necessária para o dashboard)
RUN pnpm ui:build

# Criar link simbólico para o CLI
RUN ln -s /app/dist/index.js /usr/local/bin/openclaw

# Porta do gateway
EXPOSE 18789

# Comando padrão
CMD ["node", "dist/index.js", "gateway", "--bind", "lan", "--port", "18789"]
