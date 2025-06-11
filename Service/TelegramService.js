// =================================================================================
// TELEGRAM SERVICE
// =================================================================================

// =================================================================================
// TELEGRAM AUTH SERVICE
// =================================================================================

const TelegramAuthService = {
  getApiUrl: function (endpoint = 'sendMessage') {
    return `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${endpoint}`;
  },
};

// =================================================================================
// TELEGRAM HTTP SERVICE
// =================================================================================

const TelegramHttpService = {
  post: function (endpoint, payload) {
    const apiUrl = TelegramAuthService.getApiUrl(endpoint);

    return UrlFetchApp.fetch(apiUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });
  },
};

/**
 * Service for Telegram operations
 */
const TelegramService = {
  /**
   * Sends a message to the configured Telegram chat (legacy method)
   * @param {string} message - The message to send
   */
  sendMessage: function (message) {
    try {
      const payload = {
        chat_id: TELEGRAM_CHAT_ID,
        text: `📌 New Gemini response:\n\n${message}`,
        parse_mode: 'Markdown',
      };

      TelegramHttpService.post('sendMessage', payload);
      Logger.log(`✅ Message sent to Telegram successfully`);
    } catch (error) {
      Logger.log(`❌ Error sending message to Telegram: ${error.toString()}`);
    }
  },

  /**
   * Enhanced messaging system with different message types
   */

  /**
   * Sends a daily status message when no images are found
   * @param {Object} systemStatus - Current system status
   */
  sendNoImagesAlert: function (systemStatus) {
    try {
      const currentHour = new Date().getHours();
      const timeEmoji = currentHour >= 18 ? '🌙' : currentHour >= 12 ? '☀️' : '🌅';

      const message = `${timeEmoji} *Daily Check-in*

      🤔 Hey! I haven't received any new plant images today.`;

      this._sendRawMessage(message);
      Logger.log(`📱 No images alert sent successfully`);
    } catch (error) {
      Logger.log(`❌ Error sending no images alert: ${error.toString()}`);
    }
  },

  /**
   * Sends a daily system health summary
   * @param {Object} healthData - System health information
   */
  sendDailyHealthSummary: function (healthData) {
    try {
      const statusEmoji = healthData.allSystemsOperational ? '💚' : '⚠️';

      const message = `${statusEmoji} *Daily System Summary*

🌡️ *Environment:*
• Temperature: ${healthData.temperature}°C
• Humidity: ${healthData.humidity}%

💡 *Devices:*
• Lighting: ${healthData.lightingStatus}
• Aeration: ${healthData.aerationStatus}

📊 *Activity:*
• Images analyzed today: ${healthData.imagesAnalyzedToday}
• Cycles completed: ${healthData.cyclesCompleted}
• Memory entries: ${healthData.memoryEntries}

🌱 Your Philodendron is ${healthData.plantStatus}!`;

      this._sendRawMessage(message);
      Logger.log(`📱 Daily health summary sent successfully`);
    } catch (error) {
      Logger.log(`❌ Error sending daily health summary: ${error.toString()}`);
    }
  },

  /**
   * Sends device status alerts when anomalies are detected
   * @param {Object} deviceAlert - Device alert information
   */
  sendDeviceAlert: function (deviceAlert) {
    try {
      const urgencyEmoji =
        deviceAlert.severity === 'high' ? '🚨' : deviceAlert.severity === 'medium' ? '⚠️' : 'ℹ️';

      const message = `${urgencyEmoji} *Device Alert*

🔧 *Issue Detected:*
${deviceAlert.message}

📍 *Device:* ${deviceAlert.deviceName}
⏰ *Time:* ${deviceAlert.timestamp}
🎯 *Severity:* ${deviceAlert.severity}

${deviceAlert.actionTaken ? `✅ *Action Taken:* ${deviceAlert.actionTaken}` : '🔄 *Monitoring situation...*'}`;

      this._sendRawMessage(message);
      Logger.log(`📱 Device alert sent successfully`);
    } catch (error) {
      Logger.log(`❌ Error sending device alert: ${error.toString()}`);
    }
  },

  /**
   * Sends environmental condition alerts
   * @param {Object} envAlert - Environmental alert data
   */
  sendEnvironmentalAlert: function (envAlert) {
    try {
      const alertEmoji =
        envAlert.type === 'temperature' ? '🌡️' : envAlert.type === 'humidity' ? '💧' : '🌿';

      const message = `${alertEmoji} *Environmental Alert*

📊 *Condition:* ${envAlert.condition}
📈 *Current Reading:* ${envAlert.currentValue}
📋 *Optimal Range:* ${envAlert.optimalRange}

🌱 *Plant Impact:* ${envAlert.plantImpact}

💡 *Recommendation:* ${envAlert.recommendation}`;

      this._sendRawMessage(message);
      Logger.log(`📱 Environmental alert sent successfully`);
    } catch (error) {
      Logger.log(`❌ Error sending environmental alert: ${error.toString()}`);
    }
  },

  /**
   * Sends weekly learning updates
   * @param {Object} learningData - Weekly learning summary
   */
  sendWeeklyLearningUpdate: function (learningData) {
    try {
      const message = `🧠 *Weekly Learning Update*

📚 *This Week I Learned:*
${learningData.insights.map(insight => `• ${insight}`).join('\n')}

📈 *Progress:*
• New patterns identified: ${learningData.newPatterns}
• Memory entries added: ${learningData.memoryEntriesAdded}
• Accuracy improvements: ${learningData.accuracyImprovement}%

🎯 *Next Week's Focus:*
${learningData.nextFocus}

🌱 Together, we're becoming better plant parents! 🤝`;

      this._sendRawMessage(message);
      Logger.log(`📱 Weekly learning update sent successfully`);
    } catch (error) {
      Logger.log(`❌ Error sending weekly learning update: ${error.toString()}`);
    }
  },

  /**
   * Sends motivational check-ins
   */
  sendMotivationalCheckIn: function () {
    try {
      const motivationalMessages = [
        '🌱 Your Philodendron is thriving thanks to your care!',
        '💚 Another day of perfect plant parenting!',
        '🌿 I love watching your plant grow with you!',
        '✨ Every day brings new growth and learning!',
        '🤖 Beep boop! Your plant care skills are improving!',
        '🌺 Your dedication to plant care is inspiring!',
        '🔬 Science and nature working together perfectly!',
      ];

      const randomMessage =
        motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

      const message = `💫 *Daily Motivation*

${randomMessage}

📊 Keep up the amazing work! Your consistent care creates the perfect environment for growth. 🌱➡️🌳`;

      this._sendRawMessage(message);
      Logger.log(`📱 Motivational check-in sent successfully`);
    } catch (error) {
      Logger.log(`❌ Error sending motivational check-in: ${error.toString()}`);
    }
  },

  /**
   * Sends a message with custom formatting
   * @param {string} message - Raw message content
   */
  _sendRawMessage: function (message) {
    try {
      const payload = {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      };

      TelegramHttpService.post('sendMessage', payload);
      Logger.log(`✅ Raw message sent to Telegram successfully`);
    } catch (error) {
      Logger.log(`❌ Error sending raw message to Telegram: ${error.toString()}`);
      throw error;
    }
  },
};
