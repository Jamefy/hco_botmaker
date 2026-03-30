function requireEnv(name) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value.trim();
}

function getEnv(name, fallback = "") {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

function getConfig() {
  return {
    port: Number.parseInt(getEnv("PORT", "3000"), 10),
    logLevel: getEnv("LOG_LEVEL", "info"),
    botmaker: {
      webhookToken: getEnv("BOTMAKER_WEBHOOK_TOKEN"),
      apiBaseUrl: getEnv("BOTMAKER_API_BASE_URL", "https://api.botmaker.com/v2.0"),
      apiToken: getEnv("BOTMAKER_API_TOKEN")
    },
    internalApiKey: getEnv("INTERNAL_API_KEY"),
    creatio: {
      webhookUrl: getEnv("CREATIO_WEBHOOK_URL"),
      authUrl: getEnv("CREATIO_AUTH_URL"),
      username: getEnv("CREATIO_USERNAME"),
      password: getEnv("CREATIO_PASSWORD"),
      bpmCsrfHeader: getEnv("CREATIO_BPMCSRF_HEADER", "BPMCSRF")
    }
  };
}

module.exports = {
  getConfig,
  getEnv,
  requireEnv
};
