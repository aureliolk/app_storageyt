# Instalação OpenClaw com Docker

Guia rápido para subir o OpenClaw em container usando o repositório oficial e um Dockerfile customizado.

---

## Links úteis

- **Docker:** https://docs.docker.com/get-started/get-docker
- **Repositório:** https://github.com/openclaw/openclaw
- **Google AI Studio (API keys):** https://aistudio.google.com/api-keys
- **OpenAI (API keys):** https://platform.openai.com/api-keys
- **API Key Brave:** https://api-dashboard.search.brave.com/app/keys

---

## Arquivos para download

_https://github.com/aureliolk/app_storageyt/blob/master/app_openclaw/Dockerfile_

---

## Passo a passo

### 1. Clonar o repositório OpenClaw

```bash
git clone https://github.com/openclaw/openclaw.git app_openclaw
cd app_openclaw
```

### 2. Configurar arquivos

```bash
mkdir config
echo '{"gateway":{"mode":"local","auth":{"mode":"token","token":"seu-token-aqui"}}}' > config/openclaw.json
```

#### Adicionar config/ ao .dockerignore (evita copiar dados locais para a imagem)

```bash
echo "config/" >> .dockerignore
```

#### Adicionar /config ao .gitignore (evita commitar dados locais)

```bash
echo "/config" >> .gitignore
```

### Se quiser instalar o OpenClaw Webchat Customizado Audio e Imagenß

```bash
curl -sSL https://raw.githubusercontent.com/aureliolk/app_storageyt/master/app_openclaw/apply-fixes.sh | bash
```

### 3. Baixar e configurar o Dockerfile

Baixe o `Dockerfile` do link acima e coloque na raiz do projeto, ou crie manualmente com o conteúdo disponibilizado.

### 4. Construir a imagem Docker

```bash
docker build -t openclaw:local -f Dockerfile .
```

### 5. Iniciar o container

```bash
docker run -d \
  --name openclaw \
  -v "$(pwd)/config:/root/.openclaw" \
  -p 18789:18789 \
  openclaw:local
```

- **Porta:** o gateway fica acessível em `http://localhost:18789`

### 6. Verificar se o container está ativo

```bash
docker ps
```

### 7. Entrar no container

```bash
docker exec -it openclaw bash
```

### 8. Configurar a instalação (onboarding)

Dentro do container:

```bash
openclaw onboard
```

### 8.2. Configurar as ferramentas de Busca e Audio

Dentro do container:

```bash
"tools": {
    "web": {
      "search": {
        "enabled": true,
        "apiKey": ""
      },
      "fetch": {
        "enabled": true
      }
    },
    "media": {
      "audio": {
        "enabled": true,
        "maxBytes": 20971520,
        "models": [
          {
            "provider": "openai",
            "model": "whisper-1"
          }
        ]
      }
    }
  },
```

### 9. Acessar o Dashboard

Dentro do container, para obter o link de acesso à UI com token:

```bash
openclaw dashboard
```

### 10. Gerenciar dispositivos (pairing)

**Listar dispositivos:**

```bash
openclaw devices list
```

**Aprovar dispositivo:**

```bash
openclaw devices approve <requestId>
```

Substitua `<requestId>` pelo ID do pedido de pairing exibido em `openclaw devices list`.

---

## Resumo rápido

| Ação                    | Comando                                                                                                          |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Clonar repo             | `git clone https://github.com/openclaw/openclaw.git app_openclaw`                                                |
| Configurar ignores      | `echo "config/" >> .dockerignore && echo "/config" >> .gitignore`                                                |
| Build                   | `docker build -t openclaw:local -f Dockerfile .`                                                                 |
| Subir container         | `docker run -d --name openclaw -v "$(pwd)/config:/root/.openclaw" -p 18789:18789 openclaw:local`                 |
| Status                  | `docker ps`                                                                                                      |
| Shell no container      | `docker exec -it openclaw bash`                                                                                  |
| Onboarding              | `openclaw onboard` (dentro do container)                                                                         |
| Dashboard               | `openclaw dashboard` ou `openclaw dashboard --no-open`                                                           |
| Pairing                 | `openclaw devices list` → `openclaw devices approve <requestId>`                                                 |
| Parar container         | `docker stop openclaw`                                                                                           |
| Remover container       | `docker rm openclaw`                                                                                             |
| Rebuild (após mudanças) | `docker stop openclaw && docker rm openclaw && docker build -t openclaw:local -f Dockerfile . && docker run ...` |

---

## Dicas

- **Primeira vez:** Execute o `openclaw onboard` dentro do container para configurar credenciais
- **Persistência:** Os dados de configuração ficam salvos em `./config` no seu host
- **Rebuild:** Se modificar o código, pare e remova o container, rebuild a imagem e suba novamente
- **Logs:** Veja logs com `docker logs openclaw`
