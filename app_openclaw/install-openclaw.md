# Instalação OpenClaw com Docker

Guia rápido para subir o OpenClaw em container usando o repositório oficial e um Dockerfile customizado.

---

## Links úteis

- **Docker:** https://docs.docker.com/get-started/get-docker
- **Repositório:** https://github.com/openclaw/openclaw
- **Google AI Studio (API keys):** https://aistudio.google.com/api-keys
- **API Key Brave:** https://api-dashboard.search.brave.com/app/keys

---

## Arquivos para download

_https://github.com/aureliolk/app_storageyt/blob/master/app_openclaw/Dockerfile_

---

## Comandos Docker

### 1. Clonar o repositório OpenClaw

```bash
git clone https://github.com/openclaw/openclaw.git app_openclaw
cd app_openclaw
```

### 2. Editar o Dockerfile igual disponivel para Download

Ajuste o `Dockerfile` igual o disponibilizado para download. _(https://github.com/aureliolk/app_storageyt/blob/master/app_openclaw/Dockerfile)_

### 3. Construir a imagem

```bash
docker build -t openclaw:local -f Dockerfile .
```

### 4. Criar pastas de configuração

```bash
mkdir -p config workspace
```

### 5. Criar `openclaw.json` temporário

Para o container subir e você poder rodar o onboarding depois, crie um config:

```bash
echo '{"gateway":{"mode":"local","auth":{"mode":"token","token":"seu-token-aqui"}}}' > config/openclaw.json
```

### 6. Iniciar o container (volumes mapeados)

```bash
docker run -d --name openclaw \
  -v "$(pwd)/config:/root/.openclaw" \
  -v "$(pwd)/workspace:/root/.openclaw/workspace" \
  -p 18790:18789 \
  -p 18792:18792 \
  openclaw:local \
  openclaw gateway run --bind 0.0.0.0 --port 18789
```

- **Porta:** o gateway fica acessível em `http://localhost:18790` (18790 no host → 18789 no container).
- Ajuste as portas `-p` se 18790 ou 18792 já estiverem em uso.

### 7. Verificar se o container está ativo

```bash
docker ps
```

### 8. Entrar no container

```bash
docker exec -it openclaw bash
```

### 9. Configurar a instalação (onboarding)

Dentro do container:

```bash
openclaw onboard
```

### 10. Dashboard (link com token)

Dentro do container, para obter o link de acesso à UI com token:

```bash
openclaw dashboard
```

### 11. Listar dispositivos (pairing)

```bash
openclaw devices list
```

### 12. Aprovar dispositivo

```bash
openclaw devices approve <requestId>
```

Substitua `<requestId>` pelo ID do pedido de pairing exibido em `openclaw devices list`.

---

## Resumo rápido

| Ação              | Comando                                      |
|-------------------|----------------------------------------------|
| Build             | `docker build -t openclaw:local -f Dockerfile .` |
| Subir container   | `docker run -d --name openclaw ...` (bloco acima) |
| Status            | `docker ps`                                  |
| Shell no container | `docker exec -it openclaw bash`            |
| Onboarding        | `openclaw onboard` (dentro do container)     |
| Dashboard         | `openclaw dashboard` ou `openclaw dashboard --no-open` |
| Pairing           | `openclaw devices list` → `openclaw devices approve <requestId>` |
