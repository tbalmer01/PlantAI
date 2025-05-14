/**
 * SyAIPlan - Plant Analysis System using AI
 * 
 * This script analyzes plant images from Google Drive using Google Vision API and Gemini AI,
 * then sends the results to Telegram and logs them in Google Sheets.
 * 
 * @author Tomas Balmer
 * @version 1.2
 */

// =================================================================================
// MAIN EXECUTION
// =================================================================================

function main() {
  Logger.log(`🟢 SyAIPlan: Running main flow`);

  const currentDate = new Date();
  const hour = currentDate.getHours();
  Logger.log(`🟢 Current date: ${currentDate}`);

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

    Logger.log("🟢 Sending data to Gemini API for analysis");
    const { message_by_image_analysis, summary_for_sheet_by_image_analysis } = GeminiService.plantAnalysisByImage(
      currentDate,
      imageFile,
      devices,
      prdReference
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

  // IOT devices - Control based on schedule ===============================
  Logger.log("🟢 Controlling devices based on schedule");
  Interactor.controlDevicesBasedOnSchedule(hour);
    
  Logger.log(`🏁 Plant analysis cycle completed.`);
}
