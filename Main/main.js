/**
 * SyAIPlan - Plant Analysis System using AI
 * 
 * This script analyzes plant images from Google Drive using Google Vision API and Gemini AI,
 * then sends the results to Telegram and logs them in Google Sheets.
 * 
 * @author Tomas Balmer
 * @version 1.3
 */

// =================================================================================
// CONFIGURATION VALIDATION
// =================================================================================

/**
 * Validates critical system configuration before main execution
 */
function validateConfiguration() {
  try {
    // Check critical constants
    const requiredConstants = [
      'INIT_LIGHTING_HOUR', 'END_LIGHTING_HOUR', 'ON_STATE', 'OFF_STATE',
      'SHEET_DEVICES_AND_SENSORS', 'SHEET_IMAGE_ANALYSIS',
      'DRIVE_FOLDER_IMAGES_ID', 'GEMINI_MODEL_NAME'
    ];
    
    for (const constant of requiredConstants) {
      if (typeof window[constant] === 'undefined' && typeof global[constant] === 'undefined') {
        Logger.log(`❌ Missing required constant: ${constant}`);
        return false;
      }
    }
    
    // Validate lighting schedule
    if (INIT_LIGHTING_HOUR >= END_LIGHTING_HOUR) {
      Logger.log(`❌ Invalid lighting schedule: INIT_LIGHTING_HOUR (${INIT_LIGHTING_HOUR}) must be less than END_LIGHTING_HOUR (${END_LIGHTING_HOUR})`);
      return false;
    }
    
    // Check if it's a valid hour range
    if (INIT_LIGHTING_HOUR < 0 || INIT_LIGHTING_HOUR > 23 || END_LIGHTING_HOUR < 0 || END_LIGHTING_HOUR > 23) {
      Logger.log(`❌ Invalid hour values: INIT_LIGHTING_HOUR=${INIT_LIGHTING_HOUR}, END_LIGHTING_HOUR=${END_LIGHTING_HOUR}`);
      return false;
    }
    
    Logger.log(`✅ Configuration validation passed`);
    Logger.log(`✅ Lighting schedule: ${INIT_LIGHTING_HOUR}:00 - ${END_LIGHTING_HOUR}:00`);
    return true;
    
  } catch (error) {
    Logger.log(`❌ Error during configuration validation: ${error.toString()}`);
    return false;
  }
}

// =================================================================================
// MAIN EXECUTION
// =================================================================================

function main() {
  Logger.log(`🟢 SyAIPlan: Running main flow`);

  try {
    // Configuration validation ===============================================
    Logger.log(`🔍 Validating system configuration`);
    if (!validateConfiguration()) {
      Logger.log(`❌ Configuration validation failed - aborting main flow`);
      return false;
    }
    
    // Get current date and hour ===============================================
    const currentDate = new Date();
    const hour = currentDate.getHours();
    Logger.log(`🟢 Current date: ${currentDate}`);

    // IOT devices - Control based on schedule ===============================
    Logger.log("🟢 Controlling devices based on schedule");
    Interactor.controlDevicesBasedOnSchedule(hour);

    // IOT devices - read data ===============================================
    Logger.log("🟢 Getting IOT devices information from SinricPro API");
    const devices = SinricProService.getSinricDevices() || [];
    Logger.log(`🟢 Response from SinricPro API - devices: ${devices}`);

    Logger.log("🟢 Logging devices information to Sheets");
    SpreadsheetService.logDevicesDataSummary(currentDate, devices);
    
    // PRD - read data ========================================================
    Logger.log("🟢 Obtaining the Product requirement data");
    const prdReference = DriveService.getProductRequirementDocument();

    // Image detection flow ====================================================
    Logger.log(`🟢 Searching for new image to analyze`);
    const imageFile = Interactor.searchForNewImage();

    if (imageFile) {
      Logger.log(`🟢 Image found: ${imageFile.imageName}`);

      // 🧠 MEMORY INTEGRATION: Retrieve historical context for AI analysis
      Logger.log("🧠 Retrieving historical memory for context-aware analysis");
      const historicalMemory = MemoryService.retrieveRelevantMemory({
        currentDate: currentDate,
        imageName: imageFile.imageName,
        devices: devices
      });
      Logger.log(`🧠 Memory retrieved: ${historicalMemory.entries.length} historical entries found`);

      Logger.log("🟢 Sending data to Gemini API for analysis with historical context");
      const { message_by_image_analysis, summary_for_sheet_by_image_analysis } = GeminiService.plantAnalysisByImage(
        currentDate,
        imageFile,
        devices,
        prdReference,
        historicalMemory // Pass historical context to Gemini
      );

      if (message_by_image_analysis) {
        Logger.log("🟢 Sending the image analysis to Telegram");
        TelegramService.sendMessage(message_by_image_analysis);
      }
        
      if (summary_for_sheet_by_image_analysis) {
        Logger.log("🟢 Logging Gemini analysis summary to Sheets");
        SpreadsheetService.logImageAnalysisSummary(summary_for_sheet_by_image_analysis);
      }

    } else {
      Logger.log("🟢 No new image found to analyze.");
    }
      
    Logger.log(`🏁 Plant analysis cycle completed.`);

  } catch (mainError) {
    Logger.log(`❌ Critical error in main flow: ${mainError.toString()}`);
    Logger.log(`❌ Error stack: ${mainError.stack}`);
    
    // Enhanced error notification with context
    const errorContext = {
      timestamp: new Date().toISOString(),
      errorMessage: mainError.toString(),
      errorStack: mainError.stack,
      currentHour: new Date().getHours(),
      phase: 'main_flow'
    };
    
    NotificationService.mainFlowFailed(JSON.stringify(errorContext));
    
    // Don't throw the error - let the system continue in next cycle
    Logger.log(`🔄 Main flow will retry in next scheduled execution`);
    return false; // Indicate failure but don't crash
  }
}
