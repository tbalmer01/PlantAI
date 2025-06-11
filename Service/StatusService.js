// =================================================================================
// STATUS SERVICE - Enhanced System Monitoring and Proactive Messaging
// =================================================================================

/**
 * Service for system status monitoring and intelligent messaging
 * Provides proactive notifications and daily summaries
 */
const StatusService = {
  /**
   * Checks if daily summary should be sent (once per day at specific times)
   * @param {Date} currentDate - Current timestamp
   * @returns {boolean} Whether to send daily summary
   */
  shouldSendDailySummary: function (currentDate) {
    try {
      const hour = currentDate.getHours();
      // Send daily summary at 8 PM
      return hour === 20;
    } catch (error) {
      Logger.log(`❌ Error checking daily summary schedule: ${error.toString()}`);
      return false;
    }
  },

  /**
   * Checks if "no images" alert should be sent
   * @param {Date} currentDate - Current timestamp
   * @returns {boolean} Whether to send no images alert
   */
  shouldSendNoImagesAlert: function (currentDate) {
    try {
      const hour = currentDate.getHours();
      // Send "no images" alert once at 6 PM if no images processed today
      return hour === 18;
    } catch (error) {
      Logger.log(`❌ Error checking no images alert schedule: ${error.toString()}`);
      return false;
    }
  },

  /**
   * Checks if any images were processed today
   * @param {Date} currentDate - Current timestamp
   * @returns {boolean} Whether images were processed today
   */
  hasImagesProcessedToday: function (currentDate) {
    try {
      Logger.log(`📊 Checking if images were processed today`);

      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_IMAGE_ANALYSIS);
      if (!sheet) {
        Logger.log(`❌ Sheet not found: ${SHEET_IMAGE_ANALYSIS}`);
        return false;
      }

      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        Logger.log(`📊 No data found in image analysis sheet`);
        return false;
      }

      // Get today's date in YYYY-MM-DD format
      const today = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      Logger.log(`📊 Checking for images processed on: ${today}`);

      // Check timestamp column (assuming column 0 is timestamp)
      for (let i = 1; i < data.length; i++) {
        const rowTimestamp = data[i][0];
        if (rowTimestamp) {
          const rowDate = Utilities.formatDate(
            new Date(rowTimestamp),
            Session.getScriptTimeZone(),
            'yyyy-MM-dd'
          );
          if (rowDate === today) {
            Logger.log(`📊 Found image processed today: ${data[i][1]}`); // Log image name
            return true;
          }
        }
      }

      Logger.log(`📊 No images processed today`);
      return false;
    } catch (error) {
      Logger.log(`❌ Error checking images processed today: ${error.toString()}`);
      return false;
    }
  },

  /**
   * Gets current system status for daily summary
   * @param {Date} currentDate - Current timestamp
   * @param {Array} devices - Current device data
   * @returns {Object} System status data
   */
  getSystemHealthData: function (currentDate, devices) {
    try {
      Logger.log(`📊 Gathering system health data`);

      // Get current environmental data
      const temperature = this._extractDeviceValue(devices, 'temperature') || 'N/A';
      const humidity = this._extractDeviceValue(devices, 'humidity') || 'N/A';

      // Get device statuses
      const lightingStatus = this._getDevicesLightingStatus(devices);
      const aerationStatus = this._getDevicesAerationStatus(devices);

      // Get activity data
      const imagesAnalyzedToday = this._getImagesAnalyzedToday(currentDate);
      const cyclesCompleted = this._getCyclesCompletedToday(currentDate);
      const memoryEntries = this._getMemoryEntriesCount();

      // Determine overall system status
      const allSystemsOperational = temperature !== 'N/A' && humidity !== 'N/A';

      // Determine plant status based on conditions
      const plantStatus = this._determinePlantStatus(
        temperature,
        humidity,
        lightingStatus,
        aerationStatus
      );

      const healthData = {
        allSystemsOperational,
        temperature,
        humidity,
        lightingStatus,
        aerationStatus,
        imagesAnalyzedToday,
        cyclesCompleted,
        memoryEntries,
        plantStatus,
      };

      Logger.log(`📊 System health data gathered: ${JSON.stringify(healthData)}`);
      return healthData;
    } catch (error) {
      Logger.log(`❌ Error getting system health data: ${error.toString()}`);
      return {
        allSystemsOperational: false,
        temperature: 'N/A',
        humidity: 'N/A',
        lightingStatus: 'Unknown',
        aerationStatus: 'Unknown',
        imagesAnalyzedToday: 0,
        cyclesCompleted: 0,
        memoryEntries: 0,
        plantStatus: 'Unknown',
      };
    }
  },

  /**
   * Gets system status for "no images" alert
   * @param {Date} currentDate - Current timestamp
   * @returns {Object} System status for no images alert
   */
  getNoImagesSystemStatus: function (currentDate) {
    try {
      Logger.log(`📊 Gathering no images system status`);

      const status = {
        lastImageDate: this._getLastImageProcessedDate(),
        totalProcessed: this._getTotalImagesProcessed(),
        cyclesCompleted: this._getCyclesCompletedToday(currentDate),
      };

      Logger.log(`📊 No images system status: ${JSON.stringify(status)}`);
      return status;
    } catch (error) {
      Logger.log(`❌ Error getting no images system status: ${error.toString()}`);
      return {
        lastImageDate: 'Unknown',
        totalProcessed: 0,
        cyclesCompleted: 0,
      };
    }
  },

  /**
   * Processes enhanced messaging based on system status
   * @param {Date} currentDate - Current timestamp
   * @param {Array} devices - Current device data
   * @param {boolean} imageFoundToday - Whether an image was found in current cycle
   */
  processEnhancedMessaging: function (currentDate, devices, imageFoundToday) {
    try {
      Logger.log(`📱 Processing enhanced messaging...`);

      // No images alert at 6 PM (only if no images today)
      if (this.shouldSendNoImagesAlert(currentDate)) {
        if (!this.hasImagesProcessedToday(currentDate)) {
          Logger.log(`📱 Sending no images alert`);
          const systemStatus = this.getNoImagesSystemStatus(currentDate);
          TelegramService.sendNoImagesAlert(systemStatus);
        } else {
          Logger.log(`📱 Images were processed today - skipping no images alert`);
        }
      }

      Logger.log(`📱 Enhanced messaging processing completed`);
    } catch (error) {
      Logger.log(`❌ Error processing enhanced messaging: ${error.toString()}`);
    }
  },

  // =================================================================================
  // PRIVATE HELPER METHODS
  // =================================================================================

  /**
   * Extract device value by type
   */
  _extractDeviceValue: function (devices, valueType) {
    try {
      if (!devices || devices.length === 0) return null;

      for (const device of devices) {
        if (valueType === 'temperature' && device.temperature !== undefined) {
          return `${device.temperature}`;
        }
        if (valueType === 'humidity' && device.humidity !== undefined) {
          return `${device.humidity}`;
        }
      }
      return null;
    } catch (error) {
      Logger.log(`❌ Error extracting device value: ${error.toString()}`);
      return null;
    }
  },

  /**
   * Get lighting status summary
   */
  _getDevicesLightingStatus: function (devices) {
    try {
      // Count active lights
      let activeLights = 0;
      let totalLights = 0;

      if (devices && devices.length > 0) {
        for (const device of devices) {
          if (device.name && device.name.toLowerCase().includes('light')) {
            totalLights++;
            if (device.powerState === ON_STATE || device.powerState === 'On') {
              activeLights++;
            }
          }
        }
      }

      if (totalLights === 0) return 'No lights configured';
      return `${activeLights}/${totalLights} active`;
    } catch (error) {
      Logger.log(`❌ Error getting lighting status: ${error.toString()}`);
      return 'Unknown';
    }
  },

  /**
   * Get aeration status summary
   */
  _getDevicesAerationStatus: function (devices) {
    try {
      if (devices && devices.length > 0) {
        for (const device of devices) {
          if (device.name && device.name.toLowerCase().includes('aerat')) {
            return device.powerState === ON_STATE || device.powerState === 'On'
              ? 'Active'
              : 'Inactive';
          }
        }
      }
      return 'No aerator found';
    } catch (error) {
      Logger.log(`❌ Error getting aeration status: ${error.toString()}`);
      return 'Unknown';
    }
  },

  /**
   * Get images analyzed today count
   */
  _getImagesAnalyzedToday: function (currentDate) {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_IMAGE_ANALYSIS);
      if (!sheet) return 0;

      const data = sheet.getDataRange().getValues();
      const today = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');

      let count = 0;
      for (let i = 1; i < data.length; i++) {
        const rowTimestamp = data[i][0];
        if (rowTimestamp) {
          const rowDate = Utilities.formatDate(
            new Date(rowTimestamp),
            Session.getScriptTimeZone(),
            'yyyy-MM-dd'
          );
          if (rowDate === today) {
            count++;
          }
        }
      }

      return count;
    } catch (error) {
      Logger.log(`❌ Error getting images analyzed today: ${error.toString()}`);
      return 0;
    }
  },

  /**
   * Get cycles completed today count
   */
  _getCyclesCompletedToday: function (currentDate) {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DEVICES_AND_SENSORS);
      if (!sheet) return 0;

      const data = sheet.getDataRange().getValues();
      const today = Utilities.formatDate(currentDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');

      let count = 0;
      for (let i = 1; i < data.length; i++) {
        const rowTimestamp = data[i][0];
        if (rowTimestamp) {
          const rowDate = Utilities.formatDate(
            new Date(rowTimestamp),
            Session.getScriptTimeZone(),
            'yyyy-MM-dd'
          );
          if (rowDate === today) {
            count++;
          }
        }
      }

      return count;
    } catch (error) {
      Logger.log(`❌ Error getting cycles completed today: ${error.toString()}`);
      return 0;
    }
  },

  /**
   * Get total memory entries count
   */
  _getMemoryEntriesCount: function () {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Contextual_Memory');
      if (!sheet) return 0;

      const data = sheet.getDataRange().getValues();
      return Math.max(0, data.length - 1); // Subtract header row
    } catch (error) {
      Logger.log(`❌ Error getting memory entries count: ${error.toString()}`);
      return 0;
    }
  },

  /**
   * Get last image processed date
   */
  _getLastImageProcessedDate: function () {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_IMAGE_ANALYSIS);
      if (!sheet) return 'Unknown';

      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) return 'No images processed yet';

      // Get the last row timestamp
      const lastRowTimestamp = data[data.length - 1][0];
      if (lastRowTimestamp) {
        return Utilities.formatDate(
          new Date(lastRowTimestamp),
          Session.getScriptTimeZone(),
          'yyyy-MM-dd'
        );
      }

      return 'Unknown';
    } catch (error) {
      Logger.log(`❌ Error getting last image processed date: ${error.toString()}`);
      return 'Unknown';
    }
  },

  /**
   * Get total images processed count
   */
  _getTotalImagesProcessed: function () {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_IMAGE_ANALYSIS);
      if (!sheet) return 0;

      const data = sheet.getDataRange().getValues();
      return Math.max(0, data.length - 1); // Subtract header row
    } catch (error) {
      Logger.log(`❌ Error getting total images processed: ${error.toString()}`);
      return 0;
    }
  },

  /**
   * Determine plant status based on conditions
   */
  _determinePlantStatus: function (temperature, humidity, lightingStatus, aerationStatus) {
    try {
      if (temperature === 'N/A' || humidity === 'N/A') {
        return 'monitoring (limited sensor data)';
      }

      const temp = parseFloat(temperature);
      const hum = parseFloat(humidity);

      // Optimal ranges for Philodendron
      const tempOk = temp >= 18 && temp <= 24;
      const humOk = hum >= 40 && hum <= 70;
      const lightingOk = lightingStatus.includes('active') || lightingStatus.includes('Active');

      if (tempOk && humOk && lightingOk) {
        return 'thriving in optimal conditions';
      } else if (tempOk && humOk) {
        return 'doing well with current environment';
      } else if (tempOk || humOk) {
        return 'adapting to current conditions';
      } else {
        return 'needs attention - environmental conditions';
      }
    } catch (error) {
      Logger.log(`❌ Error determining plant status: ${error.toString()}`);
      return 'status unknown';
    }
  },

  /**
   * Check for environmental alerts
   */
  _checkEnvironmentalAlerts: function (devices) {
    try {
      const temperature = this._extractDeviceValue(devices, 'temperature');
      const humidity = this._extractDeviceValue(devices, 'humidity');

      if (temperature && temperature !== 'N/A') {
        const temp = parseFloat(temperature);
        if (temp < 16) {
          TelegramService.sendEnvironmentalAlert({
            type: 'temperature',
            condition: 'Temperature too low',
            currentValue: `${temp}°C`,
            optimalRange: '18-24°C',
            plantImpact: 'May slow growth and stress the plant',
            recommendation: 'Consider moving to warmer location or adjusting room temperature',
          });
        } else if (temp > 26) {
          TelegramService.sendEnvironmentalAlert({
            type: 'temperature',
            condition: 'Temperature too high',
            currentValue: `${temp}°C`,
            optimalRange: '18-24°C',
            plantImpact: 'May cause leaf burn and excessive water loss',
            recommendation: 'Increase ventilation or move to cooler location',
          });
        }
      }

      if (humidity && humidity !== 'N/A') {
        const hum = parseFloat(humidity);
        if (hum < 30) {
          TelegramService.sendEnvironmentalAlert({
            type: 'humidity',
            condition: 'Humidity too low',
            currentValue: `${hum}%`,
            optimalRange: '40-70%',
            plantImpact: 'May cause leaf edges to brown and growth to slow',
            recommendation: 'Use humidifier or place water tray nearby',
          });
        } else if (hum > 80) {
          TelegramService.sendEnvironmentalAlert({
            type: 'humidity',
            condition: 'Humidity too high',
            currentValue: `${hum}%`,
            optimalRange: '40-70%',
            plantImpact: 'May promote fungal growth and root rot',
            recommendation: 'Increase ventilation and reduce watering frequency',
          });
        }
      }
    } catch (error) {
      Logger.log(`❌ Error checking environmental alerts: ${error.toString()}`);
    }
  },

  /**
   * Check for device alerts
   */
  _checkDeviceAlerts: function (devices, currentDate) {
    try {
      const hour = currentDate.getHours();

      // Check if lights should be on during lighting hours
      if (hour >= INIT_LIGHTING_HOUR && hour < END_LIGHTING_HOUR) {
        const lightingStatus = this._getDevicesLightingStatus(devices);
        if (lightingStatus === 'No lights configured' || lightingStatus.includes('0/')) {
          TelegramService.sendDeviceAlert({
            deviceName: 'Lighting System',
            message: 'Lights should be active during daylight hours but appear to be off',
            timestamp: Utilities.formatDate(currentDate, Session.getScriptTimeZone(), 'HH:mm'),
            severity: 'medium',
            actionTaken: 'System will attempt to reactivate lights in next cycle',
          });
        }
      }
    } catch (error) {
      Logger.log(`❌ Error checking device alerts: ${error.toString()}`);
    }
  },
};
