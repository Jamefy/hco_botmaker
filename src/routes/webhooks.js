const express = require("express");
const logger = require("../logger");
const { requireBotmakerWebhookToken } = require("../middleware/auth");
const { forwardWebhookWithOptionalAuth } = require("../services/creatio");
const { ensureJsonObject, ensureRawBodyPresent } = require("../services/request-validation");
const {
  detectSourceType,
  isEligibleUserMessage,
  summarizeBotmakerEvent
} = require("../services/webhook-parser");

function createWebhookRouter(config) {
  const router = express.Router();

  router.post("/botmaker", requireBotmakerWebhookToken(config), createWebhookHandler(config, "auto"));
  router.post("/botmaker/incoming", requireBotmakerWebhookToken(config), createWebhookHandler(config, "incoming"));
  router.post("/botmaker/outgoing", requireBotmakerWebhookToken(config), createWebhookHandler(config, "outgoing"));
  router.post("/botmaker/status", requireBotmakerWebhookToken(config), createWebhookHandler(config, "status"));

  return router;
}

function createWebhookHandler(config, sourceType) {
  return asyncHandler(async (req, res) => {
    ensureJsonObject(req.body, "Webhook payload must be a JSON object");
    ensureRawBodyPresent(req);

    const resolvedSourceType =
      sourceType === "auto" ? detectSourceType(req.body, "incoming") : sourceType;

    const summary = summarizeBotmakerEvent(req.body, resolvedSourceType);
    logger.info("Botmaker webhook received", summary);

    if (resolvedSourceType === "incoming" && !isEligibleUserMessage(req.body)) {
      return res.status(202).json({
        status: "ignored",
        reason: "event_not_eligible",
        summary
      });
    }

    const forwardedRawBody = injectSourceType(req.rawBody, resolvedSourceType);
    const creatioResponse = await forwardWebhookWithOptionalAuth(config, forwardedRawBody);

    logger.info("Webhook forwarded to Creatio", {
      sourceType: resolvedSourceType,
      creatioStatus: creatioResponse.status,
      chatId: summary.chatId,
      contactId: summary.contactId
    });

    return res.status(creatioResponse.ok ? 200 : 502).json({
      status: creatioResponse.ok ? "forwarded" : "creatio_error",
      creatioStatus: creatioResponse.status,
      creatioBody: creatioResponse.body,
      summary
    });
  });
}

function injectSourceType(rawBody, sourceType) {
  const parsed = JSON.parse(rawBody);
  parsed._middlewareSourceType = sourceType;
  return JSON.stringify(parsed);
}

function asyncHandler(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  createWebhookRouter
};
