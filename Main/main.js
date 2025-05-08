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
  Logger.log(`🟢 Running main flow`);

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

  Logger.log(`🟢 Getting for new image to analyze`);
  const image = Interactor.searchForNewImage();
  Logger.log(`🟢 Image found: ${image}`);
  if (image) {
    Logger.log(`🟢 Getting the image and its Vision API analysis`);
    const visionResponse = Interactor.analyzeImageFlowWithVision(image);
    Logger.log(`🟢 Logging the image and its Vision API analysis`);
    SpreadsheetService.logVisionResponseImageAnalysis(visionResponse.sheetRow);

    Logger.log("🟢 Sending data to Gemini API");
    const geminiResponse = GeminiService.generatePlantAnalysis(visionResponse.forGemini, devices, 
      prdReference);
    Logger.log(`🟢 Gemini response: ${geminiResponse}`);

    // TODO: Revisar this!!!
    // Logger.log("🟢 Logging image analysis to Sheets"); 
    // SpreadsheetService.logImageAnalysis(currentDate, visionResponse, geminiResponse);

    Logger.log("🟢 Sending Gemini response to Telegram");
    TelegramService.sendMessage(geminiResponse);
  } else {
    Logger.log("🟢 No new image analyzed");
  }

  Logger.log("🟢 Controlling devices based on schedule");
  Interactor.controlDevicesBasedOnSchedule(hour);
    
  Logger.log(`🟢 Enhanced symbiotic analysis completed successfully`);
}
