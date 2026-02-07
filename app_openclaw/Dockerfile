# 1. Imagem base
FROM ubuntu:22.04

# 2. Evitar prompts interativos do apt
ENV DEBIAN_FRONTEND=noninteractive

# 3. Dependências mínimas (curl para o script; o install.sh costuma instalar Node se precisar)
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    git \
    coreutils \
    && rm -rf /var/lib/apt/lists/*

# 4. Instalar OpenClaw com o script oficial (sem onboarding: não há TTY no build)
ENV OPENCLAW_NO_ONBOARD=1
RUN curl -fsSL https://openclaw.ai/install.sh | bash

# 5. Garantir que o binário está no PATH (o script normalmente coloca em ~/.local/bin)
ENV PATH="/root/.local/bin:${PATH}"

# 6. Diretório de trabalho
WORKDIR /app

# 7. Porta do gateway
EXPOSE 18789

# 8. Comando padrão: subir o gateway (ou use "bash" para só abrir o shell)
CMD ["node", "dist/index.js", "gateway", "--bind", "lan"]
