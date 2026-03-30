function pickText(payload) {
  return firstNotEmpty(
    payload?.content?.text,
    payload?.message?.content?.text,
    payload?.text,
    payload?.message?.text
  );
}

function pickFrom(payload) {
  return firstNotEmpty(payload?.from, payload?.message?.from);
}

function pickChat(payload) {
  return {
    chatId: firstNotEmpty(payload?.chat?.chatId, payload?.chatId),
    channelId: firstNotEmpty(payload?.chat?.channelId, payload?.channelId),
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
    messageId: payload?.id || "",
    from: pickFrom(payload) || "",
    text: pickText(payload) || "",
    ...chat
  };
}

function isEligibleUserMessage(payload) {
  const summary = summarizeWebhook(payload);
  if (summary.from && summary.from.toLowerCase() !== "user") {
    return false;
  }

  return Boolean(summary.chatId || (summary.channelId && summary.contactId));
}

function firstNotEmpty(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}

module.exports = {
  isEligibleUserMessage,
  summarizeWebhook
};
