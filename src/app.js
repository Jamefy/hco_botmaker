const express = require("express");
const logger = require("./logger");
const { createBotmakerRouter } = require("./routes/botmaker");
const { createHealthRouter } = require("./routes/health");
const { createWebhookRouter } = require("./routes/webhooks");
const { errorHandler, notFoundHandler } = require("./middleware/errors");

function createApp(config) {
  const app = express();

  app.use(
    express.json({
      verify(req, res, buffer) {
        req.rawBody = buffer.toString("utf8");
      }
    })
  );

  app.use((req, res, next) => {
    req.config = config;
    next();
  });

  app.use("/", createHealthRouter(config));
  app.use("/webhooks", createWebhookRouter(config));
  app.use("/api/botmaker", createBotmakerRouter(config));

  app.use(notFoundHandler);
  app.use(errorHandler(logger));

  return app;
}

module.exports = {
  createApp
};
