# Implementação de Áudio no WebChat

## Visão Geral

Esta implementação adiciona suporte completo a mensagens de áudio no WebChat do OpenClaw, permitindo aos usuários gravar, reproduzir e enviar mensagens de voz que são automaticamente transcritas para texto pelo agente.

## Funcionalidades Implementadas

### 1. Interface do Usuário (UI)

**Gravação de Áudio:**

- Botão de microfone no campo de composição de mensagens
- Gravação via MediaRecorder API (formato WebM/Opus)
- Timer visual durante a gravação
- Indicador de status (gravando/parado)

**Playback e Preview:**

- Preview do áudio gravado antes de enviar
- Player nativo HTML5 `<audio>` com controles
- Remoção de attachment com cleanup de ObjectURL

**Upload de Attachments:**

- Suporte a arquivos de áudio via drag-and-drop
- Validação de tipos MIME (`audio/*`)
- Aceitação múltipla: imagens + áudio simultaneamente

### 2. Backend (Gateway)

**Processamento de Attachments:**

- Suporte a tipo `audio` em `ChatImageContent`
- Separação inteligente: imagens vão para o campo `images`, áudio é processado separadamente
- Salvamento de áudio em arquivos temporários (`/tmp/openclaw-audio/`)

**Integração com Media Understanding:**

- Passagem de caminhos de arquivo via `MediaPaths` e `MediaTypes` no contexto
- Transcrição automática usando modelo configurado (Whisper/Deepgram)
- Substituição do conteúdo da mensagem pela transcrição

## Fluxo de Dados

```
Usuário clica no microfone
        ↓
MediaRecorder API grava áudio (WebM)
        ↓
Áudio é armazenado como data URL
        ↓
Preview é exibido na UI (player de áudio)
        ↓
Usuário clica em "Enviar"
        ↓
Attachment é enviado via WebSocket (chat.send)
        ↓
Gateway recebe e identifica como áudio
        ↓
Arquivo é salvo em /tmp/openclaw-audio/
        ↓
Caminho é passado em ctx.MediaPaths
        ↓
Media Understanding detecta e transcreve
        ↓
Transcrição substitui o conteúdo da mensagem
        ↓
Agente recebe o texto transcrito
        ↓
Agente responde baseado na transcrição
```

## Arquivos Modificados

### Frontend (UI)

**`ui/src/ui/views/chat.ts`**

- Adicionada lógica de gravação com MediaRecorder
- Funções `startRecording()` e `stopRecording()`
- Processamento de chunks de áudio em Blob WebM
- Preview de attachments de áudio com elemento `<audio>`
- Cleanup de ObjectURLs ao remover attachments

**`ui/src/ui/controllers/chat.ts`**

- Conversão de attachments para formato da API
- Detecção de tipo audio vs imagem
- Envio correto de metadata (mimeType, dataUrl)

**`ui/src/ui/icons.ts`**

- Ícones de microfone (microphone, microphone-off)
- Ícone de ondas sonoras (waveform)

**`ui/src/styles/chat/layout.css`**

- Estilos do botão de gravação
- Animação de pulso durante gravação
- Layout do player de áudio
- Estilos de waveform/ondas

### Backend (Gateway)

**`src/gateway/chat-attachments.ts`**

- Modificação do tipo `ChatImageContent` para suportar `type: "audio"`
- Expansão de `mediaType` para incluir tipos de áudio (`audio/mpeg`, `audio/ogg`, `audio/wav`, `audio/webm`)
- Atualização de `parseMessageWithAttachments()` para aceitar audio/\*

**`src/gateway/server-methods/chat.ts`**

- Adicionados imports: `ImageContent`, `fsPromises`, `os`
- Processamento separado de áudio: salvamento em `/tmp/openclaw-audio/`
- População de `mediaPaths` e `mediaTypes` no contexto
- Filtragem de imagens vs áudio para o campo `images`
- Passagem de `MediaPaths` e `MediaTypes` no `MsgContext`

**`src/gateway/server-methods/agent.ts`**

- Filtragem correta de imagens para evitar erro de tipo
- Cast explícito de `ChatImageContent` para `ImageContent`

## Configuração Necessária

Para que a transcrição de áudio funcione, é necessário configurar o modelo de transcrição no `config.yaml`:

```yaml
tools:
  media:
    audio:
      enabled: true
      models:
        - provider: openai
          model: whisper-1
        # ou
        - provider: deepgram
          model: nova-2
```

## Tipos de Áudio Suportados

**Formatos de Gravação (Frontend):**

- WebM/Opus (padrão do MediaRecorder)

**Formatos de Upload:**

- audio/mpeg (MP3)
- audio/ogg
- audio/wav
- audio/webm
- audio/x-m4a

## Considerações Técnicas

1. **Armazenamento Temporário:** Arquivos de áudio são salvos em `/tmp/openclaw-audio/` e devem ser limpos periodicamente pelo sistema operacional.

2. **Tamanho Máximo:** Limite de 10MB por attachment de áudio (configurável em `parseMessageWithAttachments`).

3. **Transcrição Assíncrona:** A transcrição acontece durante o processamento da mensagem pelo Media Understanding, antes do agente receber o conteúdo.

4. **Fallback:** Se a transcrição falhar, o agente recebe o placeholder "[Audio Attachment]" para indicar que houve uma tentativa de envio de áudio.

## Testes

Para testar a funcionalidade:

1. Acesse o WebChat do OpenClaw
2. Clique no ícone de microfone no campo de mensagem
3. Grave uma mensagem de voz
4. Verifique o preview do áudio
5. Envie a mensagem
6. Verifique se o agente responde baseado no conteúdo transcrito

**Nota:** Esta implementação é específica para o canal WebChat do OpenClaw e requer suporte a MediaRecorder API no navegador (Chrome, Firefox, Edge, Safari 14.0.3+).
