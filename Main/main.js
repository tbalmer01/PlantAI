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

  Logger.log(`🟢 Searching for new image to analyze`);
  const imageFile = Interactor.searchForNewImage();

  if (imageFile) {
    const imageName = imageFile.getName();
    Logger.log(`🟢 Image found: ${imageName}`);

    Logger.log(`🟢 Analyzing image with Vision API: ${imageName}`);
    const parsedVisionData = Interactor.analyzeImageFlowWithVision(imageFile); 

    if (parsedVisionData && parsedVisionData.forSheetLogging && parsedVisionData.forGeminiPrompt) {
      Logger.log(`🟢 Logging Vision API analysis for ${imageName} to Sheets`);
      
      const visionLogSheetRow = SpreadsheetService._prepareVisionLogSheetRow(parsedVisionData.forSheetLogging);
      if (visionLogSheetRow.length > 0) {
          SpreadsheetService.logVisionResponseImageAnalysis(visionLogSheetRow);
      }

      Logger.log("🟢 Sending data to Gemini API for analysis");
      const geminiAnalysisResult = GeminiService.generatePlantAnalysis(
        parsedVisionData.forGeminiPrompt,
        devices,
        prdReference,
        imageName
      );
      
      if (geminiAnalysisResult && typeof geminiAnalysisResult === 'object') {
        Logger.log(`🟢 Gemini analysis successful for ${imageName}.`);

        if (geminiAnalysisResult.summary_for_sheet) {
            Logger.log("🟢 Logging Gemini analysis summary to Sheets");
            SpreadsheetService.logGeminiAnalysisSummary(geminiAnalysisResult.summary_for_sheet); 
        }

        if (geminiAnalysisResult.telegram_message) {
            Logger.log("🟢 Sending Gemini analysis to Telegram");
            TelegramService.sendMessage(geminiAnalysisResult.telegram_message);
        } else {
            Logger.log("⚠️ Gemini response did not contain a 'telegram_message'.");
            TelegramService.sendMessage(`PlantAI: Analysis for ${imageName} complete. (No specific Telegram message from AI)`);
        }
      } else {
        Logger.log(`🔴 Gemini analysis failed or returned unexpected format for ${imageName}. Response: ${geminiAnalysisResult}`);
        TelegramService.sendMessage(`⚠️ PlantAI: Analysis for ${imageName} encountered an AI processing issue.`);
      }
    } else {
      Logger.log(`🔴 Failed to parse Vision API data for image: ${imageName}`);
    }
  } else {
    Logger.log("🟢 No new image found to analyze.");
  }

  Logger.log("🟢 Controlling devices based on schedule");
  Interactor.controlDevicesBasedOnSchedule(hour);
    
  Logger.log(`🏁 Plant analysis cycle completed.`);
}
