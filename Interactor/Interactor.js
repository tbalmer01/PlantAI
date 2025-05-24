// =================================================================================
// INTERACTOR FUNCTIONS
// =================================================================================

const Interactor = {
  /**
   * Search for a new image to analyze to be processed next
   */
  searchForNewImage: function() {
    Logger.log(`📤 Starting search for new image to analyze`);
    
    try {
      Logger.log(`📤 Getting spreadsheet to check processed images`);
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_IMAGE_ANALYSIS);
      if (!sheet) {
        Logger.log(`❌ Sheet not found: ${SHEET_IMAGE_ANALYSIS}`);
        return null;
      }

      Logger.log(`📊 Reading processed images from spreadsheet`);
      const processedImageNames = this.getProcessedImageNamesFromSheet(sheet);
      Logger.log(`📊 Found ${processedImageNames.length} already processed images`);

      Logger.log(`📁 Getting available images from Drive folder`);
      const availableImages = this.getAvailableImagesMetadata();
      if (!availableImages || availableImages.length === 0) {
        Logger.log(`⚠️ No images found in Drive folder`);
        return null;
      }
      Logger.log(`📁 Found ${availableImages.length} total images in Drive`);

      Logger.log(`🎯 Determining next image to process`);
      const nextImageName = this.determineNextImageToProcess(availableImages, processedImageNames);
      if (!nextImageName) {
        Logger.log(`✅ All images have been processed - nothing to do`);
        return null;
      }
      Logger.log(`🎯 Next image to process: ${nextImageName}`);

      Logger.log(`📤 Requesting image data from DriveService`);
      const imageData = DriveService.getSpecificImageToAnalyze(nextImageName);
      if (!imageData) {
        Logger.log(`❌ Failed to get image data for: ${nextImageName}`);
        return null;
      }

      Logger.log(`✅ Successfully found and prepared image: ${nextImageName}`);
      return imageData;

    } catch (error) {
      Logger.log(`❌ Error in searchForNewImage: ${error.toString()}`);
      return null;
    }
  },

  /**
   * Get processed image names from spreadsheet
   */
  getProcessedImageNamesFromSheet: function(sheet) {
    try {
      const data = sheet.getDataRange().getValues();
      const processedNames = [];
      
      const IMAGE_NAME_COLUMN = 1;
      
      for (let i = 1; i < data.length; i++) {
        const imageName = data[i][IMAGE_NAME_COLUMN];
        if (imageName && imageName.toString().trim() !== '') {
          const cleanName = imageName.toString().trim();
          processedNames.push(cleanName);
        }
      }

      const uniqueNames = [...new Set(processedNames)];
      if (uniqueNames.length !== processedNames.length) {
        Logger.log(`📊 Removed ${processedNames.length - uniqueNames.length} duplicate entries`);
      }
      
      return uniqueNames;
    } catch (error) {
      Logger.log(`❌ Error reading processed images from sheet: ${error.toString()}`);
      return [];
    }
  },

  /**
   * Get available images metadata (names and dates) from Drive
   */
  getAvailableImagesMetadata: function() {
    try {
      const storageFolder = DriveApp.getFolderById(DRIVE_FOLDER_IMAGES_ID);
      const files = storageFolder.getFiles();
      const imageMetadata = [];

      while (files.hasNext()) {
        const file = files.next();
        const mimeType = file.getMimeType();
        
        if (mimeType.startsWith("image/")) {
          imageMetadata.push({
            name: file.getName(),
            dateCreated: file.getDateCreated(),
            id: file.getId()
          });
        }
      }

      imageMetadata.sort((a, b) => a.name.localeCompare(b.name));

      return imageMetadata;
    } catch (error) {
      Logger.log(`❌ Error getting available images metadata: ${error.toString()}`);
      return [];
    }
  },

  /**
   * NEW METHOD: Business logic to determine next image to process
   * This is where you can implement different processing strategies
   */
  determineNextImageToProcess: function(availableImages, processedImageNames) {
    try {
      for (const imageMetadata of availableImages) {
        const imageName = imageMetadata.name;
        
        if (!this.isImageAlreadyProcessed(imageName, processedImageNames)) {
          Logger.log(`🎯 Selected next image: ${imageName} (created: ${imageMetadata.dateCreated})`);
          return imageName;
        }
      }
      
      return null;
    } catch (error) {
      Logger.log(`❌ Error determining next image: ${error.toString()}`);
      return null;
    }
  },

  /**
   * Check if an image has already been processed
   */
  isImageAlreadyProcessed: function(imageName, processedImageNames) {
    if (!imageName || !processedImageNames || processedImageNames.length === 0) {
      return false;
    }
    
    const normalizedImageName = imageName.trim().toLowerCase();
    
    for (const processedName of processedImageNames) {
      if (processedName.toLowerCase() === normalizedImageName) {
        return true;
      }
    }
    
    return false;
  },

  /**
   * Get processing status and statistics
   */
  getProcessingStatus: function() {
    try {
      Logger.log(`📊 Getting processing status...`);
      
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_IMAGE_ANALYSIS);
      if (!sheet) {
        Logger.log(`❌ Cannot get status - sheet not found: ${SHEET_IMAGE_ANALYSIS}`);
        return null;
      }

      const processedImageNames = this.getProcessedImageNamesFromSheet(sheet);
      const availableImages = this.getAvailableImagesMetadata();
      const nextImageName = this.determineNextImageToProcess(availableImages, processedImageNames);
      
      const status = {
        totalImages: availableImages.length,
        processedImages: processedImageNames.length,
        remainingImages: availableImages.length - processedImageNames.length,
        nextImageToProcess: nextImageName,
        completionPercentage: availableImages.length > 0 ? 
          Math.round((processedImageNames.length / availableImages.length) * 100) : 0
      };
      
      Logger.log(`📊 Processing Status:`);
      Logger.log(`📊 Total images: ${status.totalImages}`);
      Logger.log(`📊 Processed: ${status.processedImages}`);
      Logger.log(`📊 Remaining: ${status.remainingImages}`);
      Logger.log(`📊 Progress: ${status.completionPercentage}%`);
      Logger.log(`📊 Next to process: ${status.nextImageToProcess || 'All done!'}`);
      
      return status;
    } catch (error) {
      Logger.log(`❌ Error getting processing status: ${error.toString()}`);
      return null;
    }
  },

  /**
   * Process a specific image by name (useful for manual processing)
   */
  processSpecificImage: function(imageName) {
    Logger.log(`🎯 Processing specific image: ${imageName}`);
    
    const imageData = DriveService.getSpecificImageToAnalyze(imageName);
    if (!imageData) {
      Logger.log(`❌ Failed to get specific image: ${imageName}`);
      return null;
    }
    
    return imageData;
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
      
    if ([17].includes(hour)) {
      Logger.log("🟢 At 5:00 PM Turning off lights");
      SinricProService.turnOffLight1();
      SinricProService.turnOffLight2();
    }
  }
};