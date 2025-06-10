// =================================================================================
// DRIVE SERVICE
// =================================================================================

/**
 * Service for Google Drive operations - Data Access Layer Only
 */
const DriveService = {
  /**
   * Get a specific image by name (called by Interactor)
   */
  getSpecificImageToAnalyze: function(imageName) {
    Logger.log(`📤 Getting specific image: ${imageName}`);

    if (!imageName) {
      Logger.log(`❌ No image name provided`);
      NotificationService.imageNoName();
      return null;
    }

    const MAX_SIZE_MB = 10;

    try {
      const imageFile = this.findImageByName(imageName);
      if (!imageFile) {
        Logger.log(`❌ Image not found: ${imageName}`);
        NotificationService.imageNotFound(imageName);
        return null;
      }

      Logger.log(`📤 Found image: ${imageName}, processing...`);
      
      let fileBlob = imageFile.getBlob();
      let mimeType = imageFile.getMimeType();
      
      const maxSizeBytes = MAX_SIZE_MB * 1024 * 1024;
      if (fileBlob.getBytes().length > maxSizeBytes) {
        Logger.log(`⚠️ Image is too large (${Math.round(fileBlob.getBytes().length / 1024 / 1024 * 100) / 100}MB), converting to JPEG`);
        fileBlob = fileBlob.getAs("image/jpeg");
        mimeType = "image/jpeg";
        Logger.log(`📤 Image converted to JPEG`);
      }

      if (fileBlob.getBytes().length === 0) {
        Logger.log(`❌ The image is empty or corrupted: ${imageName}`);
        NotificationService.imageEmpty(imageName);
        return null;
      }

      const imageBase64 = Utilities.base64Encode(fileBlob.getBytes());
      if (!imageBase64 || imageBase64.length === 0) {
        Logger.log(`❌ Failed to convert image to Base64: ${imageName}`);
        NotificationService.imageConversionFailed(imageName);
        return null;
      }

      Logger.log(`✅ Image processed successfully: ${imageName}`);
      return {
        imageName: imageFile.getName(),
        imageBase64,
        mimeType
      };

    } catch (error) {
      Logger.log(`❌ Error processing image ${imageName}: ${error.toString()}`);
      NotificationService.imageProcessingError(imageName, error.message || error.toString());
      return null;
    }
  },

  /**
   * Find a specific image file by name in the storage folder
   */
  findImageByName: function(imageName) {
    try {
      const storageFolder = DriveApp.getFolderById(DRIVE_FOLDER_IMAGES_ID);
      const files = storageFolder.getFiles();

      while (files.hasNext()) {
        const file = files.next();
        const mimeType = file.getMimeType();
        
        if (mimeType.startsWith("image/") && file.getName() === imageName) {
          return file;
        }
      }

      return null;
    } catch (error) {
      Logger.log(`❌ Error finding image ${imageName}: ${error.toString()}`);
      NotificationService.imageFindingError(imageName);
      return null;
    }
  },

  /**
   * Get PRD content from Drive
   */
  getProductRequirementDocument: function() {
    try {
      const folder = DriveApp.getFolderById(DRIVE_FOLDER_MAIN_ID);
      Logger.log(`📁 Searching for PRD in folder: ${folder.getName()}`);

      const filesIterator = folder.getFiles();
      let documentFile = null;

      while (filesIterator.hasNext()) {
        const file = filesIterator.next();
        if (file.getName() === PRD_NAME) {
          documentFile = file;
          break;
        }
      }

      /* if (!documentFile) {
        Logger.log(`⚠️ PRD document not found: ${PRD_NAME}`);
        NotificationService.prdNotFound(PRD_NAME);
        return null;
      } */

      Logger.log(`✅ PRD document found: ${documentFile.getName()}`);

      const doc = DocumentApp.openById(documentFile.getId());
      const text = doc.getBody().getText();

      Logger.log(`📁 PRD content length: ${text.length} characters`);
      return text;
    } catch (error) {
      Logger.log(`❌ Error getting PRD document: ${error.toString()}`);
      NotificationService.prdErrorGetting(error.toString());
      return null;
    }
  }
};