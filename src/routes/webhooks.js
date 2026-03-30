const express = require("express");
const logger = require("../logger");
const { requireBotmakerWebhookToken } = require("../middleware/auth");
const { forwardWebhookWithOptionalAuth } = require("../services/creatio");
const { ensureJsonObject, ensureRawBodyPresent } = require("../services/request-validation");
const { isEligibleUserMessage, summarizeWebhook } = require("../services/webhook-parser");

function createWebhookRouter(config) {
  const router = express.Router();

  router.post(
    "/botmaker",
    requireBotmakerWebhookToken(config),
    asyncHandler(async (req, res) => {
      ensureJsonObject(req.body, "Webhook payload must be a JSON object");
      ensureRawBodyPresent(req);

      const summary = summarizeWebhook(req.body);
      logger.info("Botmaker webhook received", summary);

      if (!isEligibleUserMessage(req.body)) {
        return res.status(202).json({
          status: "ignored",
          reason: "event_not_eligible",
          summary
        });
      }

      const creatioResponse = await forwardWebhookWithOptionalAuth(
        config,
        req.rawBody
      );

      logger.info("Webhook forwarded to Creatio", {
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
    })
  );

  return router;
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
