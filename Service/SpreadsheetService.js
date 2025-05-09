// =================================================================================
// SHEET SERVICE
// =================================================================================

/**
 * Service for Google Sheets operations
 */
const SpreadsheetService = {
  getLastProcessedImageName: function(sheet) {
    try {
      const lastRow = sheet.getLastRow();
      return lastRow < 2 ? null : sheet.getRange(lastRow, 2).getValue();
    } catch (error) {
      Logger.log(`❌ Error getting last processed image name: ${error.toString()}`);
      return null;
    }
  },

  /**
   * Logs data to a specific sheet
   */
  _logDataToSheet: function(sheetName, rowData) {
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
      if (!sheet) {
        Logger.log(`⚠️ Sheet not found: ${sheetName}`);
        return false;
      }
      
      sheet.appendRow(rowData);
      Logger.log(`✅ Data logged to ${sheetName} successfully`);
      return true;
    } catch (error) {
      Logger.log(`❌ Error logging data to ${sheetName}: ${error.toString()}`);
      return false;
    }
  },

  /**
   * Logs image analysis data to the analysis sheet
   */
  _prepareVisionLogSheetRow: function(sheetDataForVisionLog) {
    if (!sheetDataForVisionLog) {
      Logger.log("🔴 SpreadsheetService: Cannot prepare vision log sheet row, input data is null.");
      return [];
    }
    return [
      sheetDataForVisionLog.timestamp || "", 
      sheetDataForVisionLog.imageName || "",
      sheetDataForVisionLog.identifiedPlant || "Unknown",
      sheetDataForVisionLog.labelSummary || "No labels",
      sheetDataForVisionLog.dominantColorString || "rgb(0,0,0)",
      sheetDataForVisionLog.dominantColorPixelFraction || "0.000",
      sheetDataForVisionLog.cropConfidence || "-"
    ];
  },

  logVisionResponseImageAnalysis: function(visionLogSheetRowArray) { // Your existing function might take the array directly
    if (!visionLogSheetRowArray || visionLogSheetRowArray.length === 0) {
        Logger.log("🟡 SpreadsheetService: No data provided for Vision Log.");
        return;
    }
    try {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(VISION_LOG_SHEET_NAME);
      if (!sheet) {
        Logger.log(`🔴 SpreadsheetService: Sheet "${VISION_LOG_SHEET_NAME}" not found for Vision Log.`);
        return;
      }
      sheet.appendRow(visionLogSheetRowArray);
      Logger.log(`📄 SpreadsheetService: Vision API analysis logged to ${VISION_LOG_SHEET_NAME}.`);
    } catch (e) {
      Logger.log(`🔴 SpreadsheetService: Error logging Vision API analysis: ${e.toString()}`);
    }
  },

  /**
   * Logs devices data to the devices sheet
   */
  logDevicesData: function (timestamp, devices) {  
    const hour = timestamp.getHours();
    const isWithinSchedule = hour >= 8 && hour <= 18;

    const getDeviceById = (id) =>
      devices.find((device) => device.ID === id) ?? {};

    const parseStatus = (value) =>
      String(value).toLowerCase() === "on" ? "On" : "Off";

    const getStatus = (id) => parseStatus(getDeviceById(id).IsOn);

    const light1Status = getStatus(LIGHT_DEVICE_1);
    const light2Status = getStatus(LIGHT_DEVICE_2);
    const aerationStatus = getStatus(AERATION_DEVICE);
    const genericStatus = getStatus(GENERIC_DEVICE);

    const lighting1IsOn = light1Status === "On";
    const lighting2IsOn = light2Status === "On";

    // Encuentra el sensor de temperatura/humedad
    const sensor = getDeviceById(TEMP_HUM_SENSOR_DEVICE);
    
    // Obtenemos los datos de temperatura y humedad con manejo de nulos
    const temperatureValue = sensor.temperatureC !== undefined && sensor.temperatureC !== null 
      ? sensor.temperatureC 
      : (sensor.Temperature !== undefined && sensor.Temperature !== null ? sensor.Temperature : "-");
      
    const humidityValue = sensor.humidityPercentage !== undefined && sensor.humidityPercentage !== null 
      ? sensor.humidityPercentage 
      : (sensor.Humidity !== undefined && sensor.Humidity !== null ? sensor.Humidity : "-");

    const isLightingStateCorrect = isWithinSchedule
    ? lighting1IsOn && lighting2IsOn
    : !lighting1IsOn && !lighting2IsOn;

    const comments = [];

    if (isLightingStateCorrect) {
      comments.push("OK");
    } else {
      if (isWithinSchedule) {
        if (!lighting1IsOn) comments.push("💡 Light1 should be ON");
        if (!lighting2IsOn) comments.push("💡 Light2 should be ON");
      } else {
        if (lighting1IsOn) comments.push("💡 Light1 should be OFF");
        if (lighting2IsOn) comments.push("💡 Light2 should be OFF");
      }
    }

    const rowData = [
      timestamp,
      temperatureValue,
      humidityValue,
      light1Status,
      light2Status,
      aerationStatus,
      genericStatus,
      comments.join("; "),
    ];
    
    return this._logDataToSheet(SHEET_DEVICES_AND_SENSORS, rowData);
  }
};