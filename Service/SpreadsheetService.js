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
   * Logs devices data to the devices sheet
   */
  logDevicesDataSummary: function (timestamp, devices) {  
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
  },

  /**
   * Logs devices data to the devices sheet
   */
  logImageAnalysisSummary: function(summary) {
    if (!summary) {
      Logger.log("❌ Cannot log Gemini analysis: summary is null or undefined");
      return false;
    }
    
    // Format timestamp if it exists
    let timestamp = summary.analysis_timestamp || new Date().toISOString();
    if (typeof timestamp === 'string') {
      try {
        timestamp = new Date(timestamp);
      } catch (e) {
        Logger.log(`⚠️ Could not parse timestamp: ${timestamp}. Using as string.`);
      }
    }
    
    const rowData = [
      timestamp,                               
      summary.image_name || "",                
      summary.model_used || "",                
      summary.gemini_visual_description || "", 
      summary.gemini_health_diagnosis || "",   
      summary.estimated_growth_notes || "",
      summary.leaf_status_observed || "",      
      summary.stem_condition_observed || "",   
      summary.pest_disease_signs || "",        
      summary.plant_persona_feeling || "",     
      summary.plant_persona_needs || "",       
      summary.plant_persona_concerns || "",    
      summary.recommended_action_by_ai || "",  
      summary.reasoning_for_action || "",      
      summary.confidence_level_diagnosis || "", 
      summary.confidence_level_recommendation || ""
    ];
    
    Logger.log(`📊 Logging Gemini analysis for image: ${summary.image_name}`);
    return this._logDataToSheet(SHEET_IMAGE_ANALYSIS, rowData);
  },

  // =================================================================================
  // Code deprecated: Not used anymore. Delete when sure.
  // =================================================================================

  logVisionResponseImageAnalysis: function(sheetDataForVisionLog) {
    const visionLogSheetRowArray = this._prepareVisionLogSheetRow(sheetDataForVisionLog);
    if (visionLogSheetRowArray.length === 0) {
        Logger.log("🟡 SpreadsheetService: No data provided for Vision Log.");
        return;
    }
  
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_IMAGE_ANALYSIS);
    if (!sheet) {
      Logger.log(`🔴 SpreadsheetService: Sheet "${SHEET_IMAGE_ANALYSIS}" not found for Vision Log.`);
      return;
    }
    sheet.appendRow(visionLogSheetRowArray);
    Logger.log(`📄 SpreadsheetService: Vision API analysis logged to ${SHEET_IMAGE_ANALYSIS}.`);
  },

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

  logVisionResponseImageAnalysis: function(sheetDataForVisionLog) {
      const visionLogSheetRowArray = this._prepareVisionLogSheetRow(sheetDataForVisionLog);
      if (visionLogSheetRowArray.length === 0) {
          Logger.log("🟡 SpreadsheetService: No data provided for Vision Log.");
          return;
      }
    
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_IMAGE_ANALYSIS);
      if (!sheet) {
        Logger.log(`🔴 SpreadsheetService: Sheet "${SHEET_IMAGE_ANALYSIS}" not found for Vision Log.`);
        return;
      }
      sheet.appendRow(visionLogSheetRowArray);
      Logger.log(`📄 SpreadsheetService: Vision API analysis logged to ${SHEET_IMAGE_ANALYSIS}.`);
  }
};

