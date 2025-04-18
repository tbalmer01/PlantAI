// =================================================================================
// DRIVE SERVICE
// =================================================================================

/**
 * Service for Google Drive operations
 */
const DriveService = {
  /**
   * Gets the latest image from the configured Drive folder that hasn't been processed yet
   */
  getImageToAnalyze: function() {
    Logger.log(`📤 Triggering DriveService.getImageToAnalyze()`);

    const MAX_SIZE_MB = 10;

    Logger.log(`📤 Getting the Google Drive folder`);
    const storageFolder = DriveApp.getFolderById(DRIVE_FOLDER_IMAGES_ID);
      
    Logger.log(`📤 Searching for the latest uploaded image`);
    const latestFile = this.getLatestFileInFolder(storageFolder);
    if (!latestFile) {
      Logger.log(`⚠️ No images found in the storage folder`);
      return null;
    }

    Logger.log(`📤 Validating that the file is an image`);
    const mimeType = latestFile.getMimeType();
    if (!mimeType.startsWith("image/")) {
      Logger.log(`❌ The file found is not an image, it's type: ${mimeType}`);
      return null;
    }

    Logger.log(`📤 Getting the sheet and checking if this image has already been processed`);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_DEVICES_AND_SENSORS);
    if (!sheet) {
      Logger.log(`❌ Sheet Memory not found: ${SHEET_DEVICES_AND_SENSORS}`);
      return null;
    }
    
    Logger.log(`📤 Getting the last processed image name`);
    const lastProcessedFileName = SpreadsheetService.getLastProcessedImageName(sheet);
    if (latestFile.getName() === lastProcessedFileName) {
      Logger.log(`⚠️ No new images to process.`);
      return null;
    }
      
    Logger.log(`📤 Getting the image ${latestFile.getName()} and optimizing its size if needed`);
    let fileBlob = latestFile.getBlob();
      
    Logger.log(`📤 Checking if the image is too large`);
    const maxSizeBytes = MAX_SIZE_MB * 1024 * 1024;
    if (fileBlob.getBytes().length > maxSizeBytes) {
      Logger.log(`⚠️ Image is too large, converting to JPEG to reduce size.`);
      fileBlob = fileBlob.getAs("image/jpeg");
    }

    Logger.log(`📤 Validating that the file is not empty`);
    if (fileBlob.getBytes().length === 0) {
      Logger.log(`❌ The image is empty or corrupted.`);
      return null;
    }

    Logger.log(`📤 Converting the image to Base64`);
    const imageToAnalyze = Utilities.base64Encode(fileBlob.getBytes());
    if (!imageToAnalyze || imageToAnalyze.length === 0) {
      Logger.log(`❌ The Base64 image is empty or was not generated correctly.`);
      return null;
    }

    Logger.log(`📤 Image processed successfully`);
    return { imageName: latestFile.getName(), imageToAnalyze };
  },

  /**
   * Gets the latest file from a folder based on last updated date
   */
  getLatestFileInFolder: function(folder) {
    try {
      const files = folder.getFiles();
      if (!files.hasNext()) {
        Logger.log(`⚠️ No files found in the folder.`);
        return null;
      }

      let latestFile = null;
      let latestDate = new Date(0);

      while (files.hasNext()) {
        const file = files.next();
        const fileDate = file.getLastUpdated();

        if (fileDate > latestDate) {
          latestDate = fileDate;
          latestFile = file;
        }
      }

      return latestFile;
    } catch (error) {
      Logger.log(`❌ Error getting latest file: ${error.toString()}`);
      return null;
    }
  },

  /**
   * Obtiene el contenido del Product Requirement Document (.gdoc) desde Drive.
   * Busca por nombre dentro de la carpeta principal.
   */
  getProductRequirementDocument: function() {
    const folder = DriveApp.getFolderById(DRIVE_FOLDER_MAIN_ID);
    Logger.log(`📁 Buscando PRD en carpeta: ${folder.getName()}`);

    const filesIterator = folder.getFiles();
    let documentFile = null;

    while (filesIterator.hasNext()) {
      const file = filesIterator.next();
      Logger.log(`📄 Archivo encontrado: ${file.getName()}`);
      if (file.getName() === PRD_NAME) {
        documentFile = file;
        break;
      }
    }

    if (!documentFile) {
      Logger.log(`⚠️ No se encontró el documento con nombre: ${PRD_NAME}`);
      return null;
    }

    Logger.log(`✅ Documento PRD encontrado: ${documentFile.getName()}`);

    const doc = DocumentApp.openById(documentFile.getId());
    const text = doc.getBody().getText();

    Logger.log(`📜 Primeros caracteres del contenido: ${text.substring(0, 200)}...`);

    return text;
  }
};
