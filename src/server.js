const express = require("express");
const { getConfig } = require("./config");
const logger = require("./logger");
const { sendTextMessage } = require("./services/botmaker");
const { forwardWebhookWithOptionalAuth } = require("./services/creatio");
const { isEligibleUserMessage, summarizeWebhook } = require("./services/webhook-parser");

const config = getConfig();
const app = express();

app.use(
  express.json({
    verify(req, res, buffer) {
      req.rawBody = buffer.toString("utf8");
    }
  })
);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "hco-botmaker",
    timestamp: new Date().toISOString()
  });
});

app.post("/webhooks/botmaker", async (req, res) => {
  try {
    validateBotmakerToken(req);

    const summary = summarizeWebhook(req.body || {});
    logger.info("Botmaker webhook received", summary);

    if (!isEligibleUserMessage(req.body || {})) {
      return res.status(202).json({
        status: "ignored",
        reason: "event_not_eligible",
        summary
      });
    }

    const creatioResponse = await forwardWebhookWithOptionalAuth(
      config,
      req.rawBody || JSON.stringify(req.body || {})
    );

    logger.info("Webhook forwarded to Creatio", {
      creatioStatus: creatioResponse.status,
      chatId: summary.chatId,
      contactId: summary.contactId
    });

    return res.status(creatioResponse.ok ? 200 : 502).json({
      status: creatioResponse.ok ? "forwarded" : "creatio_error",
      creatioStatus: creatioResponse.status,
      creatioBody: creatioResponse.body
    });
  } catch (error) {
    logger.error("Botmaker webhook processing failed", serializeError(error));
    return res.status(error.status || 500).json({
      status: "error",
      message: error.message
    });
  }
});

app.post("/api/botmaker/send-text", async (req, res) => {
  try {
    validateInternalApiKey(req);

    const result = await sendTextMessage(config, req.body || {});
    return res.status(200).json({
      status: "sent",
      botmakerStatus: result.status,
      botmakerBody: result.body
    });
  } catch (error) {
    logger.error("Botmaker send-text failed", serializeError(error));
    return res.status(error.status || 500).json({
      status: "error",
      message: error.message,
      body: error.body || ""
    });
  }
});

app.use((err, req, res, next) => {
  logger.error("Unhandled middleware error", serializeError(err));
  res.status(500).json({
    status: "error",
    message: "internal_error"
  });
});

app.listen(config.port, () => {
  logger.info("Server listening", {
    port: config.port
  });
});

function validateBotmakerToken(req) {
  if (!config.botmaker.webhookToken) {
    return;
  }

  const received = req.header("auth-bm-token") || "";
  if (received !== config.botmaker.webhookToken) {
    const error = new Error("Invalid auth-bm-token");
    error.status = 401;
    throw error;
  }
}

function validateInternalApiKey(req) {
  if (!config.internalApiKey) {
    return;
  }

  const received = req.header("x-api-key") || "";
  if (received !== config.internalApiKey) {
    const error = new Error("Invalid x-api-key");
    error.status = 401;
    throw error;
  }
}

function serializeError(error) {
  return {
    message: error.message,
    status: error.status,
    body: error.body,
    stack: error.stack
  };
}
