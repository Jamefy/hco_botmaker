const { requireEnv } = require("../config");

function getChatReference({ chatId, channelId, contactId }) {
  if (chatId) {
    return { chatId };
  }

  if (channelId && contactId) {
    return { channelId, contactId };
  }

  throw new Error("chatId or channelId + contactId is required");
}

async function sendTextMessage(config, payload) {
  const apiToken = config.botmaker.apiToken || requireEnv("BOTMAKER_API_TOKEN");
  const endpoint = `${config.botmaker.apiBaseUrl.replace(/\/$/, "")}/chats-actions/send-messages`;

  const body = {
    chat: getChatReference(payload),
    messages: [
      {
        text: payload.text,
        ...(payload.webhookPayload ? { webhookPayload: payload.webhookPayload } : {})
      }
    ]
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "access-token": apiToken
    },
    body: JSON.stringify(body)
  });

  const responseText = await response.text();
  if (!response.ok) {
    const error = new Error(`Botmaker request failed with status ${response.status}`);
    error.status = response.status;
    error.body = responseText;
    throw error;
  }

  return {
    status: response.status,
    body: responseText
  };
}

async function sendReadTypingFeedback(config, payload) {
  const apiToken = config.botmaker.apiToken || requireEnv("BOTMAKER_API_TOKEN");
  const endpoint = `${config.botmaker.apiBaseUrl.replace(/\/$/, "")}/chats-actions/send-read-typing-feedback`;

  const body = {
    chat: getChatReference(payload),
    isTyping: Boolean(payload.isTyping)
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "access-token": apiToken
    },
    body: JSON.stringify(body)
  });

  const responseText = await response.text();
  if (!response.ok) {
    const error = new Error(`Botmaker feedback request failed with status ${response.status}`);
    error.status = response.status;
    error.body = responseText;
    throw error;
  }

  return {
    status: response.status,
    body: responseText
  };
}

module.exports = {
  sendReadTypingFeedback,
  sendTextMessage
};
