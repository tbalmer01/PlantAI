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
// MAIN EXECUTION
// =================================================================================

function main() {
  Logger.log(`🟢 SyAIPlan: Running main flow`);

  try {
    // 📅 Get current date and hour ===============================================
    const currentDate = new Date();
    const hour = currentDate.getHours();
    Logger.log(`🟢 Current date: ${currentDate}`);

    // 📱 IOT DEVICES - Control based on schedule ===============================
    Logger.log('🟢 Controlling devices based on schedule');
    Interactor.controlDevicesBasedOnSchedule(hour);

    // 📱 IOT DEVICES - read data ===============================================
    Logger.log('🟢 Getting IOT devices information from SinricPro API');
    const devices = SinricProService.getSinricDevices() || [];
    Logger.log(`🟢 Response from SinricPro API - devices: ${devices}`);

    // 📄 DEVICES - Logging devices information to Sheets =======================
    Logger.log('🟢 Logging devices information to Sheets');
    SpreadsheetService.logDevicesDataSummary(currentDate, devices);

    // 📄 PRD - read data ========================================================
    Logger.log('🟢 Obtaining the Product requirement data');
    const prdReference = DriveService.getProductRequirementDocument();

    // 📷 IMAGE DETECTION FLOW ===================================================
    Logger.log(`🟢 Searching for new image to analyze`);
    const imageFile = Interactor.searchForNewImage();
    if (imageFile) {
      Logger.log(`🟢 Image found: ${imageFile.imageName}`);

      // 🧠 MEMORY INTEGRATION: Retrieve historical context for AI analysis using Mem0
      Logger.log('🧠 Retrieving historical memory for context-aware analysis from Mem0');
      let historicalMemory = null;
      let memorySource = 'none';
      
      try {
        if (typeof Mem0Service !== 'undefined') {
          // Use Mem0 for intelligent memory retrieval
          const currentConditions = {
            temperature: devices.find(d => d.deviceName?.toLowerCase().includes('temp'))?.value || 'N/A',
            humidity: devices.find(d => d.deviceName?.toLowerCase().includes('humid'))?.value || 'N/A',
            season: GeminiService.getCurrentSeason()
          };
          
          Logger.log(`🧠 Current conditions: Temp ${currentConditions.temperature}°C, Humidity ${currentConditions.humidity}%, Season ${currentConditions.season}`);
          
          const searchQuery = Mem0Service.generateSearchQuery(currentConditions);
          Logger.log(`🔍 Mem0 search query: ${searchQuery}`);
          
          const memoryResult = Mem0Service.searchMemory(searchQuery, 5);
          
          if (memoryResult.success && memoryResult.memories.length > 0) {
            historicalMemory = {
              summary: Mem0Service.createContextSummary(memoryResult.memories),
              entries: memoryResult.memories
            };
            memorySource = 'mem0';
            Logger.log(`🧠 ✅ Retrieved ${memoryResult.memories.length} relevant memories from Mem0`);
          } else {
            Logger.log(`🧠 ⚠️ Mem0 search returned no results: ${memoryResult.error || 'No memories found'}`);
            // Fallback to old MemoryService
            throw new Error('Mem0 returned no results, falling back to MemoryService');
          }
        } else {
          Logger.log('🧠 ⚠️ Mem0Service not available, using fallback');
          throw new Error('Mem0Service not available');
        }
      } catch (memoryError) {
        Logger.log(`🧠 ⚠️ Mem0 error: ${memoryError.message}, falling back to MemoryService`);
        
        try {
          // Fallback to old MemoryService
          historicalMemory = MemoryService.retrieveRelevantMemory({
            currentDate: currentDate,
            imageName: imageFile.imageName,
            devices: devices,
          });
          memorySource = 'memoryservice';
          Logger.log('🧠 ✅ Fallback to MemoryService successful');
        } catch (fallbackError) {
          Logger.log(`🧠 ❌ Both Mem0 and MemoryService failed: ${fallbackError.message}`);
          historicalMemory = {
            summary: 'No historical context available due to memory system errors.',
            entries: []
          };
          memorySource = 'none';
        }
      }
      
      Logger.log(
        `🧠 Memory retrieved: ${historicalMemory?.entries?.length || 0} historical entries found (source: ${memorySource})`
      );

      Logger.log('🟢 Sending data to Gemini API for analysis with historical context');
      const { message_by_image_analysis, summary_for_sheet_by_image_analysis } =
        GeminiService.plantAnalysisByImage(
          currentDate,
          imageFile,
          devices,
          prdReference,
          historicalMemory
        );

      if (message_by_image_analysis) {
        Logger.log('🟢 Sending the image analysis to Telegram');
        TelegramService.sendMessage(message_by_image_analysis);
      }

      if (summary_for_sheet_by_image_analysis) {
        Logger.log('🟢 Logging Gemini analysis summary to Sheets');
        SpreadsheetService.logImageAnalysisSummary(summary_for_sheet_by_image_analysis);
        
        // 🧠 MEMORY STORAGE: Store new analysis result in Mem0 for future context
        try {
          if (typeof Mem0Service !== 'undefined') {
            Logger.log('🧠 Storing analysis result in Mem0 for future learning');
            const environmentData = {
              temperature: devices.find(d => d.deviceName?.toLowerCase().includes('temp'))?.value || 'N/A',
              humidity: devices.find(d => d.deviceName?.toLowerCase().includes('humid'))?.value || 'N/A'
            };
            
            const memoryContent = Mem0Service.formatPlantMemory(
              { summary_for_sheet: summary_for_sheet_by_image_analysis },
              environmentData
            );
            
            Logger.log(`🧠 Formatted memory content (${memoryContent.length} chars): ${memoryContent.substring(0, 200)}...`);
            
            const memoryResult = Mem0Service.addMemory(memoryContent, 'assistant');
            if (memoryResult.success) {
              Logger.log(`🧠 ✅ Successfully stored analysis in Mem0: ${memoryResult.id}`);
            } else {
              Logger.log(`🧠 ❌ Failed to store analysis in Mem0: ${memoryResult.error}`);
              // Continue workflow even if memory storage fails
            }
          } else {
            Logger.log('🧠 ⚠️ Mem0Service not available, skipping memory storage');
          }
        } catch (storageError) {
          Logger.log(`🧠 ❌ Error storing memory: ${storageError.message}`);
          // Continue workflow even if memory storage fails
        }
      }
    } else {
      Logger.log('🟢 No new image found to analyze.');
    }

    Logger.log(`🏁 Plant analysis cycle completed.`);
  } catch (mainError) {
    Logger.log(`❌ Critical error in main flow: ${mainError.toString()}`);
    NotificationService.mainFlowFailed(JSON.stringify(mainError));
    Logger.log(`🔄 Main flow will retry in next scheduled execution`);
    return false;
  }
}
