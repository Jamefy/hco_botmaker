# hco_botmaker

Middleware para deploy no Railway que fica entre Botmaker e Creatio.

## O que este primeiro scaffold entrega

- `GET /health`: healthcheck do Railway
- `POST /webhooks/botmaker`: recebe o webhook da Botmaker, valida `auth-bm-token` e encaminha o payload bruto para o custom webservice da Creatio
- `POST /api/botmaker/send-text`: endpoint interno opcional para enviar texto para a Botmaker sem expor o token da API no Creatio

## Fluxo inicial

1. Botmaker chama o endpoint público do Railway em `/webhooks/botmaker`.
2. O middleware valida o header `auth-bm-token` se `BOTMAKER_WEBHOOK_TOKEN` estiver configurado.
3. O middleware ignora eventos que não pareçam mensagens de usuário.
4. O middleware autentica no Creatio via cookie se `CREATIO_AUTH_URL`, `CREATIO_USERNAME` e `CREATIO_PASSWORD` estiverem preenchidos.
5. O payload original é encaminhado para `CREATIO_WEBHOOK_URL`.

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

## URLs típicas do Creatio

Autenticação:

```text
https://seu-dominio-creatio/ServiceModel/AuthService.svc/Login
```

Custom webservice:

```text
https://seu-dominio-creatio/0/rest/UsrBotmakerWebhookService/Receive
```

## Deploy no Railway

O projeto é um app Node.js simples. Para o primeiro deploy:

1. Suba estes arquivos para o repositório.
2. Crie o serviço no Railway apontando para este repo.
3. Configure as variáveis de ambiente.
4. Faça o deploy.
5. Use a URL gerada pelo Railway como webhook na Botmaker.

## Observação importante

O custom webservice que você mostrou ainda responde diretamente à Botmaker. Se o middleware do Railway passar a ser a ponte principal, o ideal é ajustar o código da Creatio para focar na lógica de negócio e deixar o envio externo centralizado aqui ou então manter o envio na Creatio e usar o Railway apenas como proxy de entrada. Hoje este scaffold suporta os dois caminhos, mas o desenho final precisa escolher um para evitar duplicidade.
