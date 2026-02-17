#!/bin/bash

# Este script baixa as correções mais recentes do repositório principal
# e as aplica no diretório local.

# Configuração
REPO_URL="https://raw.githubusercontent.com/aureliolk/app_storageyt/master/app_openclaw"
FILES=(
    "src/gateway/chat-attachments.ts"
    "src/gateway/server-methods/agent.ts"
    "src/gateway/server-methods/chat.ts"
    "ui/src/styles/chat/layout.css"
    "ui/src/ui/controllers/chat.ts"
    "ui/src/ui/icons.ts"
    "ui/src/ui/views/chat.ts"
)

echo "🚀 Iniciando a aplicação de correções do OpenClaw..."

# Verifica se estamos no diretório correto (deve ter src ou ui)
if [ ! -d "src" ] && [ ! -d "ui" ]; then
    echo "❌ Erro: Execute este script na raiz do repositório onde as correções devem ser aplicadas."
    exit 1
fi

for FILE in "${FILES[@]}"; do
    echo "📥 Processando: $FILE..."
    
    # Cria o diretório pai se não existir
    mkdir -p "$(dirname "$FILE")"
    
    # Baixa o arquivo usando curl
    # -s: silent
    # -f: fail silently on server errors
    # -L: follow redirects
    curl -s -f -L "$REPO_URL/$FILE" -o "$FILE.tmp"
    
    if [ $? -eq 0 ]; then
        mv "$FILE.tmp" "$FILE"
        echo "✅ $FILE atualizado com sucesso."
    else
        rm -f "$FILE.tmp"
        echo "❌ Erro ao baixar $FILE. Verifique se o arquivo existe no GitHub: $REPO_URL/$FILE"
    fi
done

echo "🎉 Processo concluído!"
