function validateSendTextPayload(payload) {
  ensureJsonObject(payload, "Payload must be a JSON object");

  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  if (!text) {
    const error = new Error("Field 'text' is required");
    error.status = 400;
    throw error;
  }

  const normalized = {
    text,
    webhookPayload: normalizeOptionalString(payload.webhookPayload),
    chatId: normalizeOptionalString(payload.chatId),
    channelId: normalizeOptionalString(payload.channelId),
    contactId: normalizeOptionalString(payload.contactId)
  };

  const hasChatId = Boolean(normalized.chatId);
  const hasPair = Boolean(normalized.channelId && normalized.contactId);
  if (!hasChatId && !hasPair) {
    const error = new Error("Provide 'chatId' or both 'channelId' and 'contactId'");
    error.status = 400;
    throw error;
  }

  return normalized;
}

function ensureJsonObject(payload, message) {
  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    const error = new Error(message);
    error.status = 400;
    throw error;
  }
}

function ensureRawBodyPresent(req) {
  if (typeof req.rawBody === "string" && req.rawBody.length > 0) {
    return;
  }

  req.rawBody = JSON.stringify(req.body || {});
}

function normalizeOptionalString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

module.exports = {
  ensureJsonObject,
  ensureRawBodyPresent,
  validateSendTextPayload
};
