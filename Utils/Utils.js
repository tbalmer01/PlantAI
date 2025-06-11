// =================================================================================
// UTILITY FUNCTIONS
// =================================================================================

const Utils = {
  /**
   * Safely parses a JSON string
   */
  safeJsonParse: function (jsonString, defaultValue = null) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      Logger.log(`⚠️ Error parsing JSON: ${error.toString()}`);
      return defaultValue;
    }
  },

  /**
   * Obtiene timestamp y sus componentes claramente formateados en GMT-3
   */
  getTime: function () {
    const now = new Date();
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const timestamp = Utilities.formatDate(
      now,
      'America/Argentina/Buenos_Aires',
      'yyyy-MM-dd HH:mm:ss'
    );

    return {
      currentDate: now,
      hour,
      minutes,
      timestamp,
    };
  },
};
