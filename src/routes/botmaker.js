const express = require("express");
const logger = require("../logger");
const { requireInternalApiKey } = require("../middleware/auth");
const { sendTextMessage } = require("../services/botmaker");
const { validateSendTextPayload } = require("../services/request-validation");

function createBotmakerRouter(config) {
  const router = express.Router();

  router.use(requireInternalApiKey(config));

  router.get("/status", (req, res) => {
    res.json({
      status: "ok",
      botmakerConfigured: Boolean(config.botmaker.apiToken),
      internalApiKeyProtected: Boolean(config.internalApiKey)
    });
  });

  router.post(
    "/send-text",
    asyncHandler(async (req, res) => {
      const payload = validateSendTextPayload(req.body);
      const result = await sendTextMessage(config, payload);

      logger.info("Botmaker send-text succeeded", {
        chatId: payload.chatId || "",
        channelId: payload.channelId || "",
        contactId: payload.contactId || ""
      });

      return res.status(200).json({
        status: "sent",
        botmakerStatus: result.status,
        botmakerBody: result.body
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
  createBotmakerRouter
};
