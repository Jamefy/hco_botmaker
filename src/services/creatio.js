const { requireEnv } = require("../config");

async function authenticate(config) {
  const authUrl = config.creatio.authUrl || requireEnv("CREATIO_AUTH_URL");
  const username = config.creatio.username || requireEnv("CREATIO_USERNAME");
  const password = config.creatio.password || requireEnv("CREATIO_PASSWORD");

  const response = await fetch(authUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json"
    },
    body: JSON.stringify({
      UserName: username,
      UserPassword: password
    })
  });

  const responseText = await response.text();
  if (!response.ok) {
    const error = new Error(`Creatio auth failed with status ${response.status}`);
    error.status = response.status;
    error.body = responseText;
    throw error;
  }

  const cookieHeader = buildCookieHeader(response);
  const bpmcsrf = extractCookieValue(cookieHeader, "BPMCSRF");

  return {
    cookieHeader,
    bpmcsrf
  };
}

async function forwardWebhook(config, rawBody, headers) {
  const webhookUrl = config.creatio.webhookUrl || requireEnv("CREATIO_WEBHOOK_URL");
  const requestHeaders = {
    "content-type": "application/json",
    accept: "application/json"
  };

  if (headers?.cookieHeader) {
    requestHeaders.cookie = headers.cookieHeader;
  }

  if (headers?.bpmcsrf) {
    requestHeaders[config.creatio.bpmCsrfHeader] = headers.bpmcsrf;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: requestHeaders,
    body: rawBody
  });

  const responseText = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    body: responseText
  };
}

async function forwardWebhookWithOptionalAuth(config, rawBody) {
  const hasAuthConfig =
    Boolean(config.creatio.authUrl) &&
    Boolean(config.creatio.username) &&
    Boolean(config.creatio.password);

  if (!hasAuthConfig) {
    return forwardWebhook(config, rawBody);
  }

  const session = await authenticate(config);
  return forwardWebhook(config, rawBody, session);
}

function buildCookieHeader(response) {
  if (typeof response.headers.getSetCookie === "function") {
    return response.headers.getSetCookie().map((item) => item.split(";")[0]).join("; ");
  }

  const raw = response.headers.get("set-cookie");
  if (!raw) {
    return "";
  }

  return raw
    .split(/,(?=[^;]+=[^;]+)/)
    .map((item) => item.split(";")[0].trim())
    .join("; ");
}

function extractCookieValue(cookieHeader, name) {
  if (!cookieHeader) {
    return "";
  }

  const parts = cookieHeader.split(";").map((item) => item.trim());
  const found = parts.find((item) => item.startsWith(`${name}=`));
  return found ? found.slice(name.length + 1) : "";
}

module.exports = {
  authenticate,
  forwardWebhookWithOptionalAuth
};
