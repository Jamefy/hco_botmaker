function requireInternalApiKey(config) {
  return (req, res, next) => {
    if (!config.internalApiKey) {
      return next();
    }

    const received = req.header("x-api-key") || "";
    if (received !== config.internalApiKey) {
      const error = new Error("Invalid x-api-key");
      error.status = 401;
      return next(error);
    }

    return next();
  };
}

function requireBotmakerWebhookToken(config) {
  return (req, res, next) => {
    if (!config.botmaker.webhookToken) {
      return next();
    }

    const received = req.header("auth-bm-token") || "";
    if (received !== config.botmaker.webhookToken) {
      const error = new Error("Invalid auth-bm-token");
      error.status = 401;
      return next(error);
    }

    return next();
  };
}

module.exports = {
  requireBotmakerWebhookToken,
  requireInternalApiKey
};
