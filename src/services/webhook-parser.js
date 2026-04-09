function firstMessage(payload) {
  return Array.isArray(payload?.messages) && payload.messages.length > 0
    ? payload.messages[0]
    : null;
}

function pickText(payload) {
  const first = firstMessage(payload);
  return firstNotEmpty(
    payload?.content?.text,
    payload?.message?.content?.text,
    payload?.text,
    payload?.message?.text,
    first?.message,
    first?.text
  );
}

function pickFrom(payload) {
  const first = firstMessage(payload);
  return firstNotEmpty(payload?.from, payload?.message?.from, first?.from);
}

function pickMessageId(payload) {
  const first = firstMessage(payload);
  return firstNotEmpty(payload?.id, first?._id_, first?.id);
}

function pickChat(payload) {
  return {
    chatId: firstNotEmpty(
      payload?.chat?.chatId,
      payload?.chatId,
      payload?.sessionId,
      payload?.customerId,
      payload?.chatIdInChatPlatform
    ),
    channelId: firstNotEmpty(
      payload?.chat?.channelId,
      payload?.channelId,
      payload?.chatChannelId
    ),
    contactId: firstNotEmpty(
      payload?.chat?.contactId,
      payload?.contactId,
      payload?.chat?.phone,
      payload?.phone
    )
  };
}

function summarizeWebhook(payload) {
  const chat = pickChat(payload);
  return {
    messageId: pickMessageId(payload),
    from: pickFrom(payload) || "",
    text: pickText(payload) || "",
    ...chat
  };
}

function detectSourceType(payload, fallback = "incoming") {
  const from = (pickFrom(payload) || "").toLowerCase();
  const rawStatus = firstNotEmpty(
    payload?.status,
    payload?.lastStatus?.status,
    payload?.eventType,
    payload?.notificationType
  );

  if (rawStatus) {
    return "status";
  }

  if (from === "bot" || from === "agent") {
    return "outgoing";
  }

  if (from === "user") {
    return "incoming";
  }

  return fallback;
}

function summarizeBotmakerEvent(payload, sourceType = "incoming") {
  return {
    sourceType,
    ...summarizeWebhook(payload),
    rawStatus:
      payload?.status ||
      payload?.lastStatus?.status ||
      payload?.eventType ||
      payload?.notificationType ||
      "",
    hasVariableChanges: Boolean(payload?.variableChanges || payload?.variables),
    hasMessageContent: Boolean(pickText(payload))
  };
}

function isEligibleUserMessage(payload) {
  const summary = summarizeWebhook(payload);
  if (!summary.from || summary.from.toLowerCase() !== "user") {
    return false;
  }

  return Boolean(summary.chatId || (summary.channelId && summary.contactId));
}

function firstNotEmpty(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}

module.exports = {
  detectSourceType,
  isEligibleUserMessage,
  summarizeBotmakerEvent,
  summarizeWebhook
};
