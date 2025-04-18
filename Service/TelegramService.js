// =================================================================================
// TELEGRAM SERVICE
// =================================================================================

// =================================================================================
// TELEGRAM AUTH SERVICE
// =================================================================================

const TelegramAuthService = {
  getApiUrl: function(endpoint = "sendMessage") {
    return `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${endpoint}`;
  }
};

// =================================================================================
// TELEGRAM HTTP SERVICE
// =================================================================================

const TelegramHttpService = {
  post: function(endpoint, payload) {
    const apiUrl = TelegramAuthService.getApiUrl(endpoint);

    return UrlFetchApp.fetch(apiUrl, {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  }
};


/**
 * Service for Telegram operations
 */
const TelegramService = {
  /**
   * Sends a message to the configured Telegram chat
   * @param {string} message - The message to send
   */
  sendMessage: function(message) {
    try {
      const payload = {
        chat_id: TELEGRAM_CHAT_ID,
        text: `📌 New Gemini response:\n\n${message}`,
        parse_mode: "Markdown"
      };

      TelegramHttpService.post("sendMessage", payload);
      Logger.log(`✅ Message sent to Telegram successfully`);
    } catch (error) {
      Logger.log(`❌ Error sending message to Telegram: ${error.toString()}`);
    }
  }
};
