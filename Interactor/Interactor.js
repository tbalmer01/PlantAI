// =================================================================================
// INTERACTOR FUNCTIONS
// =================================================================================

const Interactor = {

  /**
   * 
   */
  searchForNewImage: function() {
    Logger.log(`📤 Triggering DriveService.getImageToAnalyze`);
    const image = DriveService.getImageToAnalyze();
    if (!image) {
      Logger.log(`⚠️ No valid image data found to analyze`);
      return null;
    }
    return image;
  },

  /**
    * Execut the complete image analysis flow el flujo de análisis de imagen completo
  */
  analyzeImageFlowWithVision: function(imageData) {
    const { imageName = "No image name", imageToAnalyze } = imageData;
        
    Logger.log(`📤 Triggering VisionService.analyzeImageAndParseResponse`);
    const visionResponse = VisionService.analyzeImageAndParseResponse(imageName, imageToAnalyze);
    if (!visionResponse) return null;
        
    Logger.log(`📤 Image analysis flow completed successfully`);
    return visionResponse;
  },

    /**
     * Controls the devices based on the scheduled time
    */
      controlDevicesBasedOnSchedule: function(hour) {
        if ([8].includes(hour)) {
          Logger.log("🟢 At 8:00 AM Activating lights");
          SinricProService.turnOnLight1();
          SinricProService.turnOnLight2();
        }
      
        if ([8, 12, 16, 20].includes(hour)) {
          Logger.log("🟢 At 8:00 AM, 12:00 PM, 4:00 PM and 8:00 PM Activating aerator");
          SinricProService.turnOnAeration();
        }
        
        if ([9, 13, 17, 21].includes(hour)) {
          Logger.log("🟢 At 9:00 AM, 1:00 PM, 5:00 PM and 9:00 PM Deactivating aerator");
          SinricProService.turnOffAeration();
        }
      
        if ([18].includes(hour)) {
           Logger.log("🟢 At 6:00 PM Turning off lights");
          SinricProService.turnOffLight1();
          SinricProService.turnOffLight2();
        }
      }
  };