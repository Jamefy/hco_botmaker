# hco_botmaker

Middleware para deploy no Railway que fica entre Botmaker e Creatio.

## O que o middleware entrega agora

- `GET /health`: healthcheck simples do Railway
- `GET /ready`: readiness com checagem de configuração mínima
- `GET /api/botmaker/status`: status da API interna da Botmaker
- `POST /webhooks/botmaker`: recebe o webhook da Botmaker, valida `auth-bm-token` e encaminha o payload bruto para o custom webservice da Creatio
- `POST /api/botmaker/send-text`: endpoint interno autenticado para enviar texto para a Botmaker sem expor o token da API no Creatio

## Fluxo inicial

1. Botmaker chama o endpoint público do Railway em `/webhooks/botmaker`.
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
Header: auth-bm-token: <BOTMAKER_WEBHOOK_TOKEN>
```

Saída interna para uso pela Creatio:

```text
POST /api/botmaker/send-text
Header: x-api-key: <INTERNAL_API_KEY>
```

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
