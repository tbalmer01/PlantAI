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

  Logger.log("🟢 Getting IOT devices information from SinricPro API");
  const devices = SinricProService.getSinricDevices() || [];
  Logger.log(`🟢 Response from SinricPro API - devices: ${devices}`);

  Logger.log("🟢 Logging devices information to Sheets");
  SpreadsheetService.logDevicesData(currentDate, devices);
   
  Logger.log("🟢 Obtaining the Product requirement data");
  const prdReference = DriveService.getProductRequirementDocument();

  // Starting image detection flow ====================
  Logger.log(`🟢 Searching for new image to analyze`);
  const imageFile = Interactor.searchForNewImage();
  if (imageFile) {
    Logger.log(`🟢 Image found: ${imageFile.imageName}`);

    Logger.log("🟢 Sending data to Gemini API for analysis");
    const geminiAnalysisResult = GeminiService.generatePlantAnalysis(
      currentDate,
      imageFile,
      devices,
      prdReference
      );
      
    if (geminiAnalysisResult.summary_for_sheet) {
      Logger.log("🟢 Logging Gemini analysis summary to Sheets");
      SpreadsheetService.logGeminiAnalysisSummary(geminiAnalysisResult.summary_for_sheet); 
    }

    if (geminiAnalysisResult.telegram_message) {
      Logger.log("🟢 Sending Gemini analysis to Telegram");
      TelegramService.sendMessage(geminiAnalysisResult.telegram_message);
    }  
  } else {
    Logger.log("🟢 No new image found to analyze.");
  }

  Logger.log("🟢 Controlling devices based on schedule");
  Interactor.controlDevicesBasedOnSchedule(hour);
    
  Logger.log(`🏁 Plant analysis cycle completed.`);
}
