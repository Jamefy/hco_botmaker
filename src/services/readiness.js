function getReadiness(config) {
  const checks = {
    creatioWebhookUrl: Boolean(config.creatio.webhookUrl),
    creatioAuthConfigured:
      Boolean(config.creatio.authUrl) &&
      Boolean(config.creatio.username) &&
      Boolean(config.creatio.password),
    botmakerWebhookTokenConfigured: Boolean(config.botmaker.webhookToken),
    botmakerApiConfigured: Boolean(config.botmaker.apiToken),
    internalApiKeyConfigured: Boolean(config.internalApiKey)
  };

  const missingRequired = [];
  if (!checks.creatioWebhookUrl) {
    missingRequired.push("CREATIO_WEBHOOK_URL");
  }

  return {
    status: missingRequired.length === 0 ? "ready" : "not_ready",
    checks,
    missingRequired,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  getReadiness
};
