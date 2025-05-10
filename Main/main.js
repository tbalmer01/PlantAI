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
    const imageName = imageFile.imageName;
    Logger.log(`🟢 Image found: ${imageName}`);

    Logger.log(`🟢 Analyzing image with Vision Service and parsing the response`);
    const parsedVisionData = Interactor.analyzeImageFlowWithVision(imageFile); 

    if (parsedVisionData) {
      Logger.log(`🟢 Logging Vision API analysis for ${imageName} to Sheets`);
      SpreadsheetService.logVisionResponseImageAnalysis(parsedVisionData.forSheetLogging);
      
      Logger.log("🟢 Sending data to Gemini API for analysis");
      const geminiAnalysisResult = GeminiService.generatePlantAnalysis(
        currentDate,
        parsedVisionData.forGeminiPrompt,
        devices,
        prdReference,
        imageName
      );
      
      if (geminiAnalysisResult.summary_for_sheet) {
          Logger.log("🟢 Logging Gemini analysis summary to Sheets");
          SpreadsheetService.logGeminiAnalysisSummary(geminiAnalysisResult.summary_for_sheet); 
      }

      if (geminiAnalysisResult.telegram_message) {
          Logger.log("🟢 Sending Gemini analysis to Telegram");
          TelegramService.sendMessage(geminiAnalysisResult.telegram_message);
      } 
    } 
  } else {
    Logger.log("🟢 No new image found to analyze.");
  }

  Logger.log("🟢 Controlling devices based on schedule");
  Interactor.controlDevicesBasedOnSchedule(hour);
    
  Logger.log(`🏁 Plant analysis cycle completed.`);
}
