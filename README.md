# hco_botmaker

Middleware para deploy no Railway que fica entre Botmaker e Creatio.

## O que o middleware entrega agora

- `GET /health`: healthcheck simples do Railway
- `GET /ready`: readiness com checagem de configuração mínima
- `GET /api/botmaker/status`: status da API interna da Botmaker
- `POST /webhooks/botmaker`: alias para mensagem recebida
- `POST /webhooks/botmaker/incoming`: webhook de mensagem recebida da Botmaker
- `POST /webhooks/botmaker/outgoing`: webhook de mensagem de saída da Botmaker
- `POST /webhooks/botmaker/status`: webhook de status de mensagem da Botmaker
- `POST /api/botmaker/send-text`: endpoint interno autenticado para enviar texto para a Botmaker sem expor o token da API no Creatio
- `POST /api/botmaker/send-read-typing-feedback`: endpoint interno autenticado para marcar leitura ou typing na Botmaker

## Fluxo inicial

1. Botmaker chama o endpoint público do Railway em `/webhooks/botmaker/incoming` ou usa o alias `/webhooks/botmaker`.
2. O middleware valida o header `auth-bm-token` se `BOTMAKER_WEBHOOK_TOKEN` estiver configurado.
3. O middleware ignora eventos que não pareçam mensagens de usuário.
4. O middleware autentica no Creatio via cookie se `CREATIO_AUTH_URL`, `CREATIO_USERNAME` e `CREATIO_PASSWORD` estiverem preenchidos.
5. O payload original é encaminhado para `CREATIO_WEBHOOK_URL`.
6. A Creatio pode responder diretamente à Botmaker ou chamar o endpoint interno `/api/botmaker/send-text`.

## Variáveis de ambiente

Copie de `.env.example`.

Obrigatórias para o fluxo Botmaker -> Creatio:

- `CREATIO_WEBHOOK_URL`

Obrigatórias se o serviço da Creatio usar autenticação por cookie:

- `CREATIO_AUTH_URL`
- `CREATIO_USERNAME`
- `CREATIO_PASSWORD`

Obrigatórias se quiser validar o webhook da Botmaker:

- `BOTMAKER_WEBHOOK_TOKEN`

Obrigatórias se quiser usar o endpoint interno de envio para a Botmaker:

- `BOTMAKER_API_TOKEN`

Recomendada para proteger o endpoint interno:

- `INTERNAL_API_KEY`

## Contrato para a Creatio chamar o middleware

Endpoint:

```text
POST /api/botmaker/send-text
Header: x-api-key: <INTERNAL_API_KEY>
Content-Type: application/json
```

Payload mínimo com `chatId`:

```json
{
  "chatId": "ABC123DEF456",
  "text": "Olá, sua solicitação foi recebida."
}
```

Payload mínimo com `channelId` + `contactId`:

```json
{
  "channelId": "botproject-whatsapp-5511999999999",
  "contactId": "5511998887777",
  "text": "Olá, sua solicitação foi recebida."
}
```

Payload com rastreio opcional:

```json
{
  "chatId": "ABC123DEF456",
  "text": "Olá, sua solicitação foi recebida.",
  "webhookPayload": "creatio-case-000123"
}
```

Resposta esperada:

```json
{
  "status": "sent",
  "botmakerStatus": 202,
  "botmakerBody": "{\"webhookNotificationId\":\"...\"}"
}
```

Endpoint de feedback de leitura/typing:

```text
POST /api/botmaker/send-read-typing-feedback
Header: x-api-key: <INTERNAL_API_KEY>
Content-Type: application/json
```

Payload:

```json
{
  "chatId": "ABC123DEF456",
  "isTyping": true
}
```

ou

```json
{
  "channelId": "botproject-whatsapp-5511999999999",
  "contactId": "5511998887777",
  "isTyping": false
}
```

## URLs típicas do Creatio

Autenticação:

```text
https://seu-dominio-creatio/ServiceModel/AuthService.svc/Login
```

Custom webservice:

```text
https://seu-dominio-creatio/0/rest/UsrBotmakerWebhookService/Receive
```

## Endpoints do middleware

Health:

```text
GET /health
GET /ready
GET /api/botmaker/status
```

Entrada pública da Botmaker:

```text
POST /webhooks/botmaker
POST /webhooks/botmaker/incoming
POST /webhooks/botmaker/outgoing
POST /webhooks/botmaker/status
Header: auth-bm-token: <BOTMAKER_WEBHOOK_TOKEN>
```

Saída interna para uso pela Creatio:

```text
POST /api/botmaker/send-text
Header: x-api-key: <INTERNAL_API_KEY>
POST /api/botmaker/send-read-typing-feedback
```

## Modelo de dados sugerido na Creatio

O webhook já entrega dados suficientes para você modelar uma entidade de conversa e uma entidade de mensagens.

Entidade `UsrBotmakerConversation`:
- `UsrChatId`
- `UsrChannelId`
- `UsrContactId`
- `UsrCurrentStatus`
- `UsrLastInboundAt`
- `UsrLastOutboundAt`
- `UsrContact`

Entidade `UsrBotmakerMessage`:
- `UsrExternalMessageId`
- `UsrConversation`
- `UsrDirection` (`Inbound`, `Outbound`, `Status`)
- `UsrSenderType` (`user`, `bot`, `agent`, `system`)
- `UsrMessageText`
- `UsrWebhookPayload`
- `UsrRawPayload`
- `UsrOccurredOn`
- `UsrDeliveryStatus`

## Telas sugeridas na Creatio

Para operação comercial do produto, a recomendação é:

1. Página de conversa
- cabeçalho com `chatId`, canal, contato e status
- detalhe de mensagens em ordem cronológica
- botão de resposta manual
- botão para typing/read feedback

2. Lista de conversas
- filtros por canal, status, contato e data da última mensagem
- indicador de novas mensagens

3. Log técnico
- payload bruto inbound/outbound
- response do middleware
- correlation por `messageId`

## Mapeamento dos webhooks da Botmaker

Na Botmaker, as três URLs podem ser apontadas assim:

```text
URL de notificação de mensagem recebida -> /webhooks/botmaker/incoming
URL de notificação de mensagem de saída -> /webhooks/botmaker/outgoing
URL de notificação do status da mensagem -> /webhooks/botmaker/status
```

O middleware injeta `_middlewareSourceType` no payload encaminhado à Creatio com um destes valores:
- `incoming`
- `outgoing`
- `status`

Isso permite que a Creatio trate cada evento de forma diferente sem depender da UI da Botmaker.

## Deploy no Railway

O projeto é um app Node.js simples. Para o primeiro deploy:

1. Suba estes arquivos para o repositório.
2. Crie o serviço no Railway apontando para este repo.
3. Configure as variáveis de ambiente.
4. Faça o deploy.
5. Use a URL gerada pelo Railway como webhook na Botmaker.

## Observação importante

O melhor desenho para seguir daqui é este:

1. Botmaker fala apenas com o Railway.
2. Railway encaminha o payload para a Creatio.
3. Creatio processa a regra de negócio.
4. Creatio chama o Railway em `/api/botmaker/send-text`.
5. Railway envia a mensagem para a Botmaker.

Isso centraliza tokens, logs e integração externa no middleware e deixa a Creatio focada na lógica de negócio.
